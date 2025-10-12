import express from 'express';
import multer from 'multer';
import { protectRoute } from '../middleware/auth.middleware.js';
import * as userController from '../controllers/user.controller.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/temp/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Profile routes
router.get('/profile/:username', protectRoute, userController.getUserProfile);
router.get('/:userId/posts', protectRoute, userController.getUserPosts);

// Follow routes
router.post('/:userId/follow', protectRoute, userController.followUser);
router.post('/:userId/unfollow', protectRoute, userController.unfollowUser);
router.get('/:userId/followers', protectRoute, userController.getFollowers);
router.get('/:userId/following', protectRoute, userController.getFollowing);

// Upload routes
router.post('/upload-avatar', protectRoute, upload.single('avatar'), userController.uploadAvatar);


// Saved posts
router.get('/saved-posts', protectRoute, userController.getSavedPosts);

export default router;