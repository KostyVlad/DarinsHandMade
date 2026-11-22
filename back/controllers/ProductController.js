const path = require('path');
const fs = require('fs');
const Product = require('../models/productModel.js');

// The form sends color_palette / details / style as one string
// ("Pink, White"), so we turn it back into an array before saving.
const toArray = (value) => {
  // Already an array: nothing to do.
  if (Array.isArray(value)) {
    return value;
  }

  // Not text either (for example undefined): an empty list.
  if (typeof value !== 'string') {
    return [];
  }

  // "Pink, White ," -> ["Pink", " White ", ""]
  const parts = value.split(',');
  // -> ["Pink", "White", ""]
  const trimmed = parts.map((item) => item.trim());
  // -> ["Pink", "White"]  (empty strings are dropped)
  return trimmed.filter(Boolean);
};

// The stock field arrives from the form as text. null means the manager
// left it empty, so this product is not stock tracked.
const parseStock = (value) => {
  // Empty field: stock is not tracked for this product
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const number = Math.floor(Number(value));

  // Not a number (e.g. "abc"): also not tracked
  if (!Number.isFinite(number)) {
    return null;
  }

  // Stock can't be negative
  if (number < 0) {
    return 0;
  }

  return number;
};

// Where the uploaded picture sits, for example "uploads/pink-123.jpg".
const buildFilePath = (file) => {
  // On Windows path.join gives "uploads\pink-123.jpg" (backslash).
  const filePath = path.join('uploads', file.filename);
  // A web address needs "/", so every "\" is replaced with "/".
  return filePath.replace(/\\/g, '/');
};

// Deletes an old picture from the disk after the product was replaced or removed.
const removeImageFile = (fileName) => {
  if (!fileName) {
    return;
  }

  const fullPath = path.join(__dirname, '..', fileName);

  // If the file is already gone, there is nothing to do, so the error is ignored.
  fs.promises.unlink(fullPath).catch(() => {});
};

// Create product
const createProduct = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'Product image is required' });
    }
    if (!req.body.model_name || !req.body.category) {
      return res.status(400).send({ message: 'Send required fields: model_name, category' });
    }

    const product = await Product.create({
      file_name: buildFilePath(req.file),
      model_name: req.body.model_name,
      category: req.body.category,
      price: req.body.price,
      color_palette: toArray(req.body.color_palette),
      details: toArray(req.body.details),
      style: toArray(req.body.style),
      stock: parseStock(req.body.stock)
    });

    res.status(201).json({ data: product });
  } catch (error) {
    // The product was not saved, so the uploaded picture is not needed.
    if (req.file) removeImageFile(buildFilePath(req.file));
    console.log(error.message);
    res.status(400).send({ message: error.message });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({ count: products.length, data: products });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send({ message: 'Product not found' });
    }
    res.status(200).json({ data: product });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send({ message: 'Product not found' });
    }

    // Only the fields the manager actually filled in are changed.
    const update = {};
    if (req.body.model_name !== undefined) update.model_name = req.body.model_name;
    if (req.body.category !== undefined) update.category = req.body.category;
    if (req.body.price !== undefined) update.price = req.body.price;
    if (req.body.color_palette !== undefined) update.color_palette = toArray(req.body.color_palette);
    if (req.body.details !== undefined) update.details = toArray(req.body.details);
    if (req.body.style !== undefined) update.style = toArray(req.body.style);
    if (req.body.stock !== undefined) update.stock = parseStock(req.body.stock);

    // A new picture was sent, so remember the old one and delete it afterwards.
    let oldImage = null;
    if (req.file) {
      update.file_name = buildFilePath(req.file);
      oldImage = product.file_name;
    }

    const result = await Product.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });

    if (oldImage) removeImageFile(oldImage);
    res.status(200).json({ data: result });
  } catch (error) {
    if (req.file) removeImageFile(buildFilePath(req.file));
    console.log(error.message);
    res.status(400).send({ message: error.message });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const result = await Product.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).send({ message: 'Product not found' });
    }

    removeImageFile(result.file_name);
    res.status(200).send({ message: 'Product deleted successfully' });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
