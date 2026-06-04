const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    file_name: { type: String, required: true },
    model_name: { type: String, required: true },
    color_palette: { type: [String], default: [] },
    details: { type: [String], default: [] },
    style: { type: [String], default: [] },
    category: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);