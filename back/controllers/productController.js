const path = require('path');
const fs = require('fs');
const Product = require('../models/productModel');

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
};

const filePathFromUpload = (file) =>
  path.join('uploads', file.filename).replace(/\\/g, '/');

const removeImageFile = (fileName) => {
  if (!fileName) return;
  const abs = path.join(__dirname, '..', fileName);
  fs.promises.unlink(abs).catch(() => {});
};

const createProduct = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, msg: 'Product image is required' });

    const p = await Product.create({
      file_name: filePathFromUpload(req.file),
      model_name: req.body.model_name,
      category: req.body.category,
      price: req.body.price,
      color_palette: toArray(req.body.color_palette),
      details: toArray(req.body.details),
      style: toArray(req.body.style),
    });
    res.status(201).json({ success: true, data: p });
  } catch (err) {
    if (req.file) removeImageFile(filePathFromUpload(req.file));
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
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, msg: 'Not found' });

    const update = {};
    if (req.body.model_name !== undefined) update.model_name = req.body.model_name;
    if (req.body.category !== undefined) update.category = req.body.category;
    if (req.body.price !== undefined) update.price = req.body.price;
    if (req.body.color_palette !== undefined) update.color_palette = toArray(req.body.color_palette);
    if (req.body.details !== undefined) update.details = toArray(req.body.details);
    if (req.body.style !== undefined) update.style = toArray(req.body.style);

    let oldImage = null;
    if (req.file) {
      update.file_name = filePathFromUpload(req.file);
      oldImage = existing.file_name;
    }

    const p = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (oldImage) removeImageFile(oldImage);
    res.status(200).json({ success: true, data: p });
  } catch (err) {
    if (req.file) removeImageFile(filePathFromUpload(req.file));
    res.status(400).json({ success: false, msg: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ success: false, msg: 'Not found' });
    removeImageFile(p.file_name);
    res.status(200).json({ success: true, data: p });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

module.exports = { createProduct, getAllProducts, getProduct, updateProduct, deleteProduct };
