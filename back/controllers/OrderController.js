const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Order = require('../models/orderModel.js');
const Product = require('../models/productModel.js');
const { sendMail } = require('../utils/email');

// Without the key on this machine there is no payment, and checkout answers 501.
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

// A bag from the Custom Studio is not in the catalog, so its price is
// counted here from the chosen size and strap, never taken from the browser.
// The same prices are shown on the Custom Studio page.
const SIZE_PRICES = { mini: 120, small: 180, medium: 260, large: 360 };
const STRAP_PRICES = { golden: 30, silver: 30, mixed: 40, beaded: 45 };

// Order number like DH-20261021-4821: the date and four random digits.
const genOrderNumber = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `DH-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// A guest may order too, so the token is optional here. No token means null.
const userIdFromHeader = (req) => {
  try {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      return jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET).id;
    }
  } catch {
    return null;
  }
  return null;
};

// Builds the order lines from the cart. The price and the stock always come
// from our side: a catalog product from the database, a custom bag from the
// tables above. Whatever price the browser sent is ignored.
const buildOrderItems = async (rawItems) => {
  const items = [];
  let error = null;
  for (const it of rawItems || []) {
    const quantity = Math.max(1, parseInt(it.quantity, 10) || 1);
    let product = null;
    if (it.id && mongoose.Types.ObjectId.isValid(it.id)) {
      product = await Product.findById(it.id);
    }
    if (product) {
      if (typeof product.stock === 'number') {
        if (product.stock <= 0) {
          error = error || `"${product.model_name}" is out of stock`;
        } else if (quantity > product.stock) {
          error = error || `Only ${product.stock} of "${product.model_name}" left in stock`;
        }
      }
      items.push({
        product: product._id,
        name: product.model_name,
        category: product.category,
        image: product.file_name,
        price: product.price || 0,
        quantity,
        custom: null,
      });
    } else {
      const config = it.config || it.custom || {};
      const sizePrice = SIZE_PRICES[config.size];
      const strapPrice = STRAP_PRICES[config.strap];

      // Not a catalog product and not a known size and strap either.
      // typeof is checked because a made up size like "constructor" would
      // find a built in function in the table instead of a price.
      if (typeof sizePrice !== 'number' || typeof strapPrice !== 'number') {
        error = error || `"${it.name || 'Item'}" is no longer available`;
        continue;
      }

      items.push({
        product: null,
        name: String(it.name || 'Custom item').slice(0, 120),
        category: 'custom',
        image: String(it.image || ''),
        price: sizePrice + strapPrice,
        quantity,
        custom: {
          size: config.size,
          strap: config.strap,
          chainColor: config.chainColor || null,
          color: String(config.color || ''),
        },
      });
    }
  }
  return { items, error };
};

// Start the payment: save the order as pending and open a Stripe payment page
const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(501).send({ message: 'Payments are not configured' });
    }

    const { items: rawItems, customer, shipping, deliveryMethod, notes } = req.body;

    if (!customer?.name || !customer?.email) {
      return res.status(400).send({ message: 'Name and email are required' });
    }
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).send({ message: 'Cart is empty' });
    }

    const { items, error: stockError } = await buildOrderItems(rawItems);
    if (stockError) {
      return res.status(400).send({ message: stockError });
    }
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const total = subtotal; // free shipping for now

    if (total <= 0) {
      return res.status(400).send({ message: 'Order total is invalid' });
    }

    const order = await Order.create({
      orderNumber: genOrderNumber(),
      user: userIdFromHeader(req),
      customer: { name: customer.name, email: customer.email, phone: customer.phone || '' },
      shipping: {
        address: shipping?.address || '',
        city: shipping?.city || '',
        country: shipping?.country || '',
      },
      deliveryMethod: deliveryMethod === 'pickup' ? 'pickup' : 'delivery',
      items,
      subtotal,
      total,
      currency: 'usd',
      status: 'pending',
      notes: notes || '',
    });

    const base = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customer.email,
      line_items: items.map((it) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: `${it.name}${it.custom ? ' (Custom)' : ''}` },
          unit_amount: Math.round(it.price * 100),
        },
        quantity: it.quantity,
      })),
      metadata: { orderId: order._id.toString() },
      success_url: `${base}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/checkout`,
    });

    order.payment.sessionId = session.id;
    await order.save();

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: 'Could not start checkout' });
  }
};

// The helpers below build the HTML of the two order emails.
const money = (n) => `$${Number(n).toFixed(2)}`;

const itemsTableRows = (order) =>
  order.items
    .map((it) => {
      const spec = it.custom
        ? `<br><span style="color:#888;font-size:12px">${[it.custom.size, it.custom.strap, it.custom.chainColor, it.custom.color]
            .filter(Boolean)
            .join(' · ')}</span>`
        : '';
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${it.name}${spec}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${it.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${money(it.price * it.quantity)}</td>
      </tr>`;
    })
    .join('');

const deliveryLine = (order) =>
  order.deliveryMethod === 'pickup'
    ? 'Self pickup'
    : `Delivery to ${[order.shipping.address, order.shipping.city, order.shipping.country].filter(Boolean).join(', ')}`;

const itemsTable = (order) => `
  <table style="width:100%;border-collapse:collapse;margin:18px 0">
    <thead><tr>
      <th style="text-align:left;border-bottom:2px solid #111;padding-bottom:6px">Item</th>
      <th style="text-align:center;border-bottom:2px solid #111;padding-bottom:6px">Qty</th>
      <th style="text-align:right;border-bottom:2px solid #111;padding-bottom:6px">Price</th>
    </tr></thead>
    <tbody>${itemsTableRows(order)}</tbody>
  </table>
  <p style="text-align:right;font-size:18px"><strong>Total: ${money(order.total)}</strong></p>`;

const sendCustomerReceipt = async (order) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="letter-spacing:2px">DARIN'S HANDMADE</h2>
      <p>Hi ${order.customer.name}, thank you for your order!</p>
      <p>Order <strong>${order.orderNumber}</strong> is confirmed and paid.</p>
      ${itemsTable(order)}
      <p style="color:#555">${deliveryLine(order)}</p>
      <p style="color:#999;font-size:13px">Handmade to order — we'll be in touch about production & delivery.</p>
    </div>`;
  await sendMail({ to: order.customer.email, subject: `Your DARIN'S HANDMADE order ${order.orderNumber}`, html });
};

const sendManagerReport = async (order) => {
  const to = process.env.MANAGER_EMAIL;
  if (!to) return;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
      <h2>New order — ${order.orderNumber}</h2>
      <p><strong>Customer:</strong> ${order.customer.name} · ${order.customer.email} · ${order.customer.phone || '—'}</p>
      <p><strong>Fulfilment:</strong> ${deliveryLine(order)}</p>
      ${itemsTable(order)}
      ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
    </div>`;
  await sendMail({ to, subject: `New order ${order.orderNumber} — ${money(order.total)}`, html });
};

// Stripe calls this after the customer paid. Only here does the order
// become paid, the stock go down and the emails go out.
const stripeWebhook = async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(501).send('Stripe webhook not configured');
  }

  // The signature proves the request really came from Stripe.
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const order = await Order.findById(session.metadata?.orderId);
      // Stripe may send the same event twice, so only a pending order is handled.
      if (order && order.status === 'pending') {
        order.status = 'paid';
        order.payment.paymentIntentId = session.payment_intent;
        order.payment.paidAt = new Date();
        await order.save();

        // The stock check is part of the query, so it never goes below zero.
        for (const it of order.items) {
          if (it.product) {
            await Product.updateOne(
              { _id: it.product, stock: { $gte: it.quantity } },
              { $inc: { stock: -it.quantity } }
            );
          }
        }

        try {
          await sendCustomerReceipt(order);
          await sendManagerReport(order);
        } catch (mailErr) {
          console.error('Order email error:', mailErr);
        }
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  res.json({ received: true });
};

const ALLOWED_STATUS = ['pending', 'paid', 'in_production', 'shipped', 'completed', 'cancelled'];
const PAID_STATUSES = ['paid', 'in_production', 'shipped', 'completed'];

// Sales numbers for the manager: revenue, number of orders, top products
const getStats = async (req, res) => {
  try {
    const days = Number(req.query.days);
    const match = { status: { $in: PAID_STATUSES } };
    if (days > 0) {
      match.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }

    const [totals] = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, revenue: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);

    const byStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const topProducts = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          qty: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ]);

    const revenue = totals?.revenue || 0;
    const orders = totals?.count || 0;

    res.status(200).json({
      data: {
        revenue,
        orders,
        avgOrder: orders ? revenue / orders : 0,
        byStatus,
        topProducts,
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

// All orders for the manager, with a status filter and a search box
const getAllOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      const rx = new RegExp(String(search).trim(), 'i');
      query.$or = [{ orderNumber: rx }, { 'customer.name': rx }, { 'customer.email': rx }];
    }
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(200);
    res.status(200).json({ data: orders });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

// Get one order
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send({ message: 'Order not found' });
    res.status(200).json({ data: order });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

// Move an order to another status, for example paid -> shipped
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).send({ message: 'Invalid status' });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).send({ message: 'Order not found' });
    res.status(200).json({ data: order });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

// For the Thank You page: a short summary of the order, found by the Stripe session
const getOrderBySession = async (req, res) => {
  try {
    const order = await Order.findOne({ 'payment.sessionId': req.params.sessionId });
    if (!order) return res.status(404).send({ message: 'Order not found' });
    res.status(200).json({
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        email: order.customer.email,
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  createCheckoutSession,
  stripeWebhook,
  getOrderBySession,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getStats,
};
