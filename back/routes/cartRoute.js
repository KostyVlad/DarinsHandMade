const express = require('express');
const { getCart, addToCart, removeFromCart, updateQuantity, clearCart } = require('../controllers/CartController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// The cart always belongs to the logged in user, so every route is protected.
router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.patch('/:productId', protect, updateQuantity);
router.delete('/:productId', protect, removeFromCart);
router.delete('/', protect, clearCart);

module.exports = router;
