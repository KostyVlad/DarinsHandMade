const express = require('express');
const { getCart, addToCart, removeFromCart } = require('../controllers/CartController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

// The cart always belongs to the logged in user, so every route is protected.
router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.delete('/:productId', protect, removeFromCart);

module.exports = router;
