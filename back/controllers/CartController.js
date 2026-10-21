const Cart = require('../models/cartModel.js');

// Loads the cart with the full product details inside every item.
// A product that was deleted from the catalog is dropped from the list.
const loadCart = async (cartId) => {
  const cart = await Cart.findById(cartId).populate('items.product');
  cart.items = cart.items.filter((item) => item.product);
  return cart;
};

// Get the cart of the logged in user
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });

    // A user who never added anything yet has no cart, so create an empty one.
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.status(200).json({ data: await loadCart(cart._id) });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

// Add a product to the cart
const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).send({ message: 'Send required field: productId' });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Already in the cart, so only raise the quantity.
    const index = cart.items.findIndex(
      (item) => item.product && item.product.toString() === productId
    );

    if (index > -1) {
      cart.items[index].quantity += 1;
    } else {
      cart.items.push({ product: productId, quantity: 1 });
    }

    await cart.save();
    res.status(200).json({ data: await loadCart(cart._id) });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

// Remove a product from the cart
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).send({ message: 'Cart not found' });
    }

    // Keep every item except the one we were asked to remove.
    cart.items = cart.items.filter(
      (item) => item.product && item.product.toString() !== productId
    );

    await cart.save();
    res.status(200).json({ data: await loadCart(cart._id) });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

// Change how many of one product are in the cart
const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = parseInt(req.body.quantity, 10);
    if (!quantity || quantity < 1) {
      return res.status(400).send({ message: 'Quantity must be 1 or more' });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).send({ message: 'Cart not found' });
    }

    const item = cart.items.find(
      (item) => item.product && item.product.toString() === productId
    );
    if (!item) {
      return res.status(404).send({ message: 'Product is not in the cart' });
    }

    item.quantity = quantity;
    await cart.save();
    res.status(200).json({ data: await loadCart(cart._id) });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

// Empty the cart, for example after the order was paid
const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [] });
    res.status(200).send({ message: 'Cart cleared' });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart
};
