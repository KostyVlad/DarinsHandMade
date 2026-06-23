const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const { sendMail } = require('../utils/email');

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const genOrderNumber = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `DH-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// Optional auth: link the order to a user if a valid token is present, else guest.
const userIdFromHeader = (req) => {
  try {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      return jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET).id;
    }
  } catch {
    /* invalid token -> treat as guest */
  }
  return null;
};

// Rebuild line items server-side. Catalog products use the DB price (never the
// client's), custom-studio items keep their submitted price.
const buildOrderItems = async (rawItems) => {
  const items = [];
  for (const it of rawItems || []) {
    const quantity = Math.max(1, parseInt(it.quantity, 10) || 1);
    let product = null;
    if (it.id && mongoose.Types.ObjectId.isValid(it.id)) {
      product = await Product.findById(it.id);
    }
    if (product) {
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
      items.push({
        product: null,
        name: String(it.name || 'Custom item').slice(0, 120),
        category: it.category || 'custom',
        image: it.image || '',
        price: Math.max(0, Number(it.price) || 0),
        quantity,
        custom: it.config || it.custom || null,
      });
    }
  }
  return items;
};

const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(501).json({ success: false, msg: 'Payments are not configured' });
    }

    const { items: rawItems, customer, shipping, deliveryMethod, notes } = req.body;

    if (!customer?.name || !customer?.email) {
      return res.status(400).json({ success: false, msg: 'Name and email are required' });
    }
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ success: false, msg: 'Cart is empty' });
    }

    const items = await buildOrderItems(rawItems);
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const total = subtotal; // free shipping for now

    if (total <= 0) {
      return res.status(400).json({ success: false, msg: 'Order total is invalid' });
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

    res.status(200).json({ success: true, url: session.url });
  } catch (err) {
    console.error('createCheckoutSession error:', err);
    res.status(500).json({ success: false, msg: 'Could not start checkout' });
  }
};

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

async function sendCustomerReceipt(order) {
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
}

async function sendManagerReport(order) {
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
}

// Stripe calls this with a raw body (see express.raw mount in server.js).
const stripeWebhook = async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(501).send('Stripe webhook not configured');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const order = await Order.findById(session.metadata?.orderId);
      // Idempotent: only act on a still-pending order.
      if (order && order.status === 'pending') {
        order.status = 'paid';
        order.payment.paymentIntentId = session.payment_intent;
        order.payment.paidAt = new Date();
        await order.save();

        // Emails must not break the webhook — Stripe needs a 200 back.
        try {
          await sendCustomerReceipt(order);
          await sendManagerReport(order);
        } catch (mailErr) {
          console.error('Order email error:', mailErr);
        }
      }
    } catch (err) {
      console.error('Webhook order update error:', err);
    }
  }

  res.json({ received: true });
};

const ALLOWED_STATUS = ['pending', 'paid', 'in_production', 'shipped', 'completed', 'cancelled'];

// Manager: list orders with optional status / search filters.
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
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// Manager: full order detail.
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, msg: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// Manager: move an order along its lifecycle.
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ success: false, msg: 'Invalid status' });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, msg: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

// Lightweight summary for the order-success page (non-sensitive fields only).
const getOrderBySession = async (req, res) => {
  try {
    const order = await Order.findOne({ 'payment.sessionId': req.params.sessionId });
    if (!order) return res.status(404).json({ success: false, msg: 'Order not found' });
    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        email: order.customer.email,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

module.exports = {
  createCheckoutSession,
  stripeWebhook,
  getOrderBySession,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};
