const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getProducts).post(protect, createProduct);
router.route('/:id').get(protect, getProduct).put(protect, updateProduct).delete(protect, deleteProduct);

module.exports = router;
