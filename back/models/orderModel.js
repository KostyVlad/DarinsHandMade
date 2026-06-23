const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  name: { type: String, required: true },
  category: { type: String, default: '' },
  image: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  // Custom Studio spec (null for catalog products).
  custom: {
    size: String,
    strap: String,
    chainColor: String,
    color: String,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
  },
  shipping: {
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  deliveryMethod: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
  items: { type: [orderItemSchema], required: true },
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  status: {
    type: String,
    enum: ['pending', 'paid', 'in_production', 'shipped', 'completed', 'cancelled'],
    default: 'pending',
  },
  payment: {
    provider: { type: String, default: 'stripe' },
    sessionId: { type: String, default: null },
    paymentIntentId: { type: String, default: null },
    paidAt: { type: Date, default: null },
  },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
