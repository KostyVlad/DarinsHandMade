const express = require('express');
const router = express.Router();
const { createProduct, getAllProducts, getProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const protect = require('../middleware/authMiddleware');
const restrictTo = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

const manager = [protect, restrictTo('manager', 'admin')];

router
  .route('/')
  .get(getAllProducts)
  .post(manager, upload.single('image'), createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(manager, upload.single('image'), updateProduct)
  .delete(manager, deleteProduct);

module.exports = router;
