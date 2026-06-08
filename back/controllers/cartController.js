const Cart = require('../models/cartModel');

const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
            cart = await Cart.findById(cart._id).populate('items.product');
        }

        cart.items = cart.items.filter(item => item.product);
        res.status(200).json({ success: true, data: cart });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }

        const itemIndex = cart.items.findIndex(
            item => item.product && item.product.toString() === productId
        );

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += 1;
        } else {
            cart.items.push({ product: productId, quantity: 1 });
        }

        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate('items.product');
        updatedCart.items = updatedCart.items.filter(item => item.product);

        res.status(200).json({ success: true, data: updatedCart });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({ success: false, msg: 'Cart not found' });
        }

        cart.items = cart.items.filter(
            item => item.product && item.product.toString() !== productId
        );

        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate('items.product');
        updatedCart.items = updatedCart.items.filter(item => item.product);

        res.status(200).json({ success: true, data: updatedCart });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

module.exports = { getCart, addToCart, removeFromCart };