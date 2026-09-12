const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    file_name: {
      type: String,
      required: true
    },
    model_name: {
      type: String,
      required: true
    },
    color_palette: {
      type: [String],
      default: []
    },
    details: {
      type: [String],
      default: []
    },
    style: {
      type: [String],
      default: []
    },
    category: {
      type: String,
      required: true,
      enum: ['bags', 'bracelets']
    },
    price: {
      type: Number
    },
    // How many are left. null means the stock is not being tracked
    // for this product, so it is always available.
    stock: {
      type: Number,
      default: null,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
