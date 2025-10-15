// server/src/routes/post.routes.js
import express from 'express';
import multer from 'multer';
import { protectRoute } from '../middleware/auth.middleware.js';
import * as postController from '../controllers/post.controller.js';
import { getUserPosts } from '../controllers/user.controller.js';

const router = express.Router();

// Configure multer for memory storage (no disk writes!)
const storage = multer.memoryStorage(); // 

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Post routes
router.get('/', protectRoute, postController.getAllPosts);
router.get('/saved', protectRoute, postController.getSavedPosts);
router.post('/upload', protectRoute, upload.array('images', 10), postController.uploadImages);
router.get('/user/:userId', protectRoute, getUserPosts);

// Specific routes before generic :postId routes to avoid conflicts
router.get('/:postId/saved-status', protectRoute, postController.checkPostSavedStatus);
router.get('/:postId/likes', protectRoute, postController.getPostLikes);
router.post('/:postId/like', protectRoute, postController.likePost);
router.post('/:postId/save', protectRoute, postController.savePost);
// Comment routes removed - handled by comment.routes.js for advanced features

// Generic :postId routes
router.post('/', protectRoute, postController.createPost);
router.get('/:postId', protectRoute, postController.getPostById);
router.put('/:postId', protectRoute, postController.updatePost);
router.delete('/:postId', protectRoute, postController.deletePost);

export default router;