const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  getOrderBySession,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getStats,
} = require('../controllers/OrderController');
const protect = require('../middleware/authMiddleware');
const restrictTo = require('../middleware/roleMiddleware');

// Reports and status changes are for the manager only.
const manager = [protect, restrictTo('manager', 'admin')];

// A guest may order too, so starting the payment is open to everyone.
router.post('/checkout-session', createCheckoutSession);
router.get('/by-session/:sessionId', getOrderBySession);

router.get('/', manager, getAllOrders);
router.get('/stats', manager, getStats);
router.patch('/:id/status', manager, updateOrderStatus);
router.get('/:id', manager, getOrderById);

module.exports = router;
