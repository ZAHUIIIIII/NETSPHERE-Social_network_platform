import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  createComment,
  editComment,
  deleteComment,
  reactToComment,
  likeComment,
  getComments,
  getReplies
} from '../controllers/comment.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Comment CRUD
router.post('/:postId/comment', createComment);
router.patch('/:postId/comment/:commentId', editComment);
router.delete('/:postId/comment/:commentId', deleteComment);

// Reactions
router.post('/:postId/comment/:commentId/react', reactToComment);
router.post('/:postId/comment/:commentId/like', likeComment); // Legacy compatibility

// Listing & pagination
router.get('/:postId/comments', getComments);
router.get('/:postId/comments/:commentId/replies', getReplies);

export default router;