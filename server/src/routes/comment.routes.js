import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  createComment,
  listRootComments,
  listThreadReplies,
  editComment,
  softDeleteComment,
  reactToComment
} from '../controllers/comment.controller.js';

const router = express.Router();

// Create comment (root or reply)
router.post('/:postId/comments', protectRoute, createComment);

// List root comments for a post
router.get('/:postId/comments', protectRoute, listRootComments);

// Get all replies in a thread (under one root comment)
router.get('/:postId/comments/:rootId/thread', protectRoute, listThreadReplies);

// Edit comment
router.patch('/comments/:id', protectRoute, editComment);

// Soft delete comment
router.delete('/comments/:id', protectRoute, softDeleteComment);

// React to comment
router.post('/comments/:id/reactions', protectRoute, reactToComment);

export default router;
