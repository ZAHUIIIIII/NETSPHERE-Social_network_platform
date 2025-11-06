// server/src/routes/user.route.js
import express from 'express';
import multer from 'multer';
import { protectRoute } from '../middleware/auth.middleware.js';
import * as userController from '../controllers/user.controller.js';

const router = express.Router();

const upload = multer({ 
  dest: 'uploads/temp/',
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Profile routes
router.get('/profile/:username', protectRoute, userController.getUserProfile);
router.get('/:userId/posts', protectRoute, userController.getUserPosts);

// Follow routes
router.post('/:userId/follow', protectRoute, userController.followUser);
router.post('/:userId/unfollow', protectRoute, userController.unfollowUser);
router.delete('/:followerId/remove-follower', protectRoute, userController.removeFollower);
router.get('/:userId/followers', protectRoute, userController.getFollowers);
router.get('/:userId/following', protectRoute, userController.getFollowing);

// Upload routes
router.post('/upload-avatar', protectRoute, upload.single('avatar'), userController.uploadAvatar);

// Saved posts
router.get('/saved-posts', protectRoute, userController.getSavedPosts);

router.get('/suggestions', protectRoute, userController.getSuggestedUsers);

// Block routes
router.post('/:userId/block', protectRoute, userController.blockUser);
router.post('/:userId/unblock', protectRoute, userController.unblockUser);
router.get('/blocked-users', protectRoute, userController.getBlockedUsers);
router.get('/:userId/block-status', protectRoute, userController.checkBlockStatus);

export default router;