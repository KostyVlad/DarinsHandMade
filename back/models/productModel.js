const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    file_name: { type: String, required: true },
    model_name: { type: String, required: true },
    color_palette: { type: [String], default: [] },
    details: { type: [String], default: [] },
    style: { type: [String], default: [] },
    category: { type: String, required: true, enum: ['bags', 'bracelets'] },
    price: Number,
    stock: { type: Number, default: null, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);