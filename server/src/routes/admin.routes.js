import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  getDashboardStats,
  getAllUsers,
  getAllPosts,
  suspendUser,
  activateUser,
  banUser,
  deleteUser,
  removePost,
  restorePost,
  deletePost,
  getRecentActivities,
  getAllReports,
  updatePostStatus,
  resolveReport,
  dismissReport
} from '../controllers/admin.controller.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Dashboard stats
router.get('/stats', protectRoute, isAdmin, getDashboardStats);

// Recent activities
router.get('/activities', protectRoute, isAdmin, getRecentActivities);

// User management
router.get('/users', protectRoute, isAdmin, getAllUsers);
router.put('/users/:userId/suspend', protectRoute, isAdmin, suspendUser);
router.put('/users/:userId/activate', protectRoute, isAdmin, activateUser);
router.put('/users/:userId/ban', protectRoute, isAdmin, banUser);
router.delete('/users/:userId', protectRoute, isAdmin, deleteUser);

// Post management
router.get('/posts', protectRoute, isAdmin, getAllPosts);
router.put('/posts/:postId/remove', protectRoute, isAdmin, removePost);
router.put('/posts/:postId/restore', protectRoute, isAdmin, restorePost);
router.put('/posts/:postId/status', protectRoute, isAdmin, updatePostStatus);
router.delete('/posts/:postId', protectRoute, isAdmin, deletePost);

// Reports management
router.get('/reports', protectRoute, isAdmin, getAllReports);
router.put('/reports/:reportId/resolve', protectRoute, isAdmin, resolveReport);
router.put('/reports/:reportId/dismiss', protectRoute, isAdmin, dismissReport);

export default router;
