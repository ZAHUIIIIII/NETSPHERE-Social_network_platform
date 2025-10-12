import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import { protectRoute } from '../middleware/auth.middleware.js';
import * as postController from '../controllers/post.controller.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = join(__dirname, '../../uploads/posts');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
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
router.post('/', protectRoute, postController.createPost);
router.post('/upload', protectRoute, upload.array('images', 10), postController.uploadImages);
router.put('/:postId', protectRoute, postController.updatePost);
router.delete('/:postId', protectRoute, postController.deletePost);
router.post('/:postId/like', protectRoute, postController.likePost);
router.post('/:postId/comment', protectRoute, postController.addComment);
router.delete('/:postId/comment/:commentId', protectRoute, postController.deleteComment);

router.post('/:postId/save', protectRoute, postController.savePost);


export default router;