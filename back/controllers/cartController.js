const Cart = require('../models/cartModel');

// Получить корзину пользователя
const getCart = async (req, res) => {
    try {
        // Ищем корзину и сразу подтягиваем данные о продуктах (картинки, названия)
        let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

        // Если корзины еще нет, создаем пустую
        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }
        res.status(200).json({ success: true, data: cart });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

// Добавить товар в корзину
const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }

        // Проверяем, есть ли уже этот товар в корзине
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            // Если есть, просто увеличиваем количество
            cart.items[itemIndex].quantity += 1;
        } else {
            // Если нет, добавляем новый товар
            cart.items.push({ product: productId, quantity: 1 });
        }

        await cart.save();
        // Возвращаем обновленную корзину с данными продуктов
        const updatedCart = await Cart.findById(cart._id).populate('items.product');
        res.status(200).json({ success: true, data: updatedCart });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};


const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) return res.status(404).json({ success: false, msg: 'Корзина не найдена' });

        cart.items = cart.items.filter(item => item.product.toString() !== productId);

        await cart.save();
        const updatedCart = await Cart.findById(cart._id).populate('items.product');
        res.status(200).json({ success: true, data: updatedCart });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

module.exports = { getCart, addToCart, removeFromCart };