import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  markProductAsSold,
} from '../controllers/productController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes for product viewing
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected routes (require user login)
router.post('/', requireAuth, createProduct);
router.put('/:id', requireAuth, updateProduct);
router.delete('/:id', requireAuth, deleteProduct);
router.patch('/:id/sold', requireAuth, markProductAsSold);

export default router;
