const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  getOrderBySession,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');
const protect = require('../middleware/authMiddleware');
const restrictTo = require('../middleware/roleMiddleware');

const manager = [protect, restrictTo('manager', 'admin')];

// Public / customer
router.post('/checkout-session', createCheckoutSession);
router.get('/by-session/:sessionId', getOrderBySession);

// Manager-only (specific routes before '/:id')
router.get('/', manager, getAllOrders);
router.patch('/:id/status', manager, updateOrderStatus);
router.get('/:id', manager, getOrderById);

module.exports = router;
