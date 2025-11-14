// server/src/routes/post.routes.js
import express from 'express';
import multer from 'multer';
import { protectRoute } from '../middleware/auth.middleware.js';
import { filterBlockedUsers } from '../middleware/block.middleware.js';
import * as postController from '../controllers/post.controller.js';
import { getUserPosts } from '../controllers/user.controller.js';

const router = express.Router();

// Configure multer for memory storage (no disk writes!)
const storage = multer.memoryStorage(); // 

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB per file limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Configure multer for video upload
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Not a video! Please upload a video file.'), false);
    }
  }
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds limit' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum 10 files allowed' });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

// Post routes
router.get('/', protectRoute, filterBlockedUsers, postController.getAllPosts);
router.get('/saved', protectRoute, filterBlockedUsers, postController.getSavedPosts);
router.post('/upload', protectRoute, upload.array('images', 10), handleMulterError, postController.uploadImages);
router.post('/upload-video', protectRoute, uploadVideo.single('video'), handleMulterError, postController.uploadVideo);
router.get('/user/:userId', protectRoute, filterBlockedUsers, getUserPosts);

// Specific routes before generic :postId routes to avoid conflicts
router.get('/:postId/saved-status', protectRoute, postController.checkPostSavedStatus);
router.get('/:postId/likes', protectRoute, postController.getPostLikes);
router.post('/:postId/react', protectRoute, postController.reactToPost);
router.post('/:postId/save', protectRoute, postController.savePost);
router.post('/:postId/repost', protectRoute, postController.repostPost);
router.get('/reposts/:userId', protectRoute, postController.getUserReposts);
// Comment routes removed - handled by comment.routes.js for advanced features

// Generic :postId routes
router.post('/', protectRoute, postController.createPost);
router.get('/:postId', protectRoute, postController.getPostById);
router.put('/:postId', protectRoute, postController.updatePost);
router.delete('/:postId', protectRoute, postController.deletePost);

export default router;
