import express from 'express';
import {
  sendMessage,
  getChatThreads,
  getChatMessages,
} from '../controllers/chatController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth); // All chat endpoints require authentication

router.post('/', sendMessage);
router.get('/', getChatThreads);
router.get('/:productId/:otherUserId', getChatMessages);

export default router;
