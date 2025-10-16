import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  createComment,
  editComment,
  deleteComment,
  reactToComment,
  getComments,
  getReplies
} from '../controllers/comment.controller.js';

const router = express.Router();

router.use(protectRoute);

// Create comment or reply
router.post('/:postId/comment', createComment);

// Edit comment
router.patch('/:postId/comment/:commentId', editComment);

// Delete comment (soft delete)
router.delete('/:postId/comment/:commentId', deleteComment);

// Toggle reaction
router.post('/:postId/comment/:commentId/react', reactToComment);

// Get root comments with pagination
router.get('/:postId/comments', getComments);

// Get replies for a root comment
router.get('/:postId/comments/:rootCommentId/replies', getReplies);

export default router;