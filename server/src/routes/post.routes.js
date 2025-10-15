// server/src/routes/post.route.js
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
router.get('/user/:userId', protectRoute, getUserPosts);
router.get('/:postId/saved-status', protectRoute, postController.checkPostSavedStatus); // ADD THIS
router.post('/', protectRoute, postController.createPost);
router.post('/upload', protectRoute, upload.array('images', 10), postController.uploadImages);
router.put('/:postId', protectRoute, postController.updatePost);
router.delete('/:postId', protectRoute, postController.deletePost);
router.post('/:postId/like', protectRoute, postController.likePost);
router.post('/:postId/save', protectRoute, postController.savePost);
router.post('/:postId/comment', protectRoute, postController.addComment);
router.delete('/:postId/comment/:commentId', protectRoute, postController.deleteComment);

export default router;