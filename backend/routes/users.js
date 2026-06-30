import express from 'express';
import {
  getProfile,
  updateProfile,
  toggleWishlist,
  getUserDashboard,
  getAllUsers,
  deleteUser,
} from '../controllers/userController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Profile, dashboard, and wishlist routes
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.get('/dashboard', requireAuth, getUserDashboard);
router.post('/wishlist/:productId', requireAuth, toggleWishlist);

// Admin-only user management routes
router.get('/', requireAuth, requireAdmin, getAllUsers);
router.delete('/:id', requireAuth, requireAdmin, deleteUser);

export default router;
