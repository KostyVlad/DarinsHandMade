const Product = require('../models/productModel');

const createProduct = async (req, res) => {
  try {
    const p = await Product.create(req.body);
    res.status(201).json({ success: true, data: p });
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, msg: 'Not found' });
    res.status(200).json({ success: true, data: p });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ success: false, msg: 'Not found' });
    res.status(200).json({ success: true, data: p });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ success: false, msg: 'Not found' });
    res.status(200).json({ success: true, data: p });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

module.exports = { createProduct, getAllProducts, getProduct, updateProduct, deleteProduct };