const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/ProductController');
const protect = require('../middleware/authMiddleware');
const restrictTo = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

// Anyone may read the catalog.
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Adding, editing and deleting a product is for the manager only.
// upload.single('image') reads the picture out of the form.
router.post('/', protect, restrictTo('manager', 'admin'), upload.single('image'), createProduct);
router.put('/:id', protect, restrictTo('manager', 'admin'), upload.single('image'), updateProduct);
router.delete('/:id', protect, restrictTo('manager', 'admin'), deleteProduct);

module.exports = router;
