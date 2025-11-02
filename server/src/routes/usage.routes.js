import express from 'express';
import { getDBUsage, getCDNUsage } from '../controllers/usage.controller.js';
import cacheMiddleware from '../middleware/cache.middleware.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

/**
 * @route   GET /api/admin/db-usage
 * @desc    Get MongoDB database usage statistics
 * @access  Private (Admin only)
 */
router.get('/db-usage', protectRoute, requireAdmin, cacheMiddleware(), getDBUsage);

/**
 * @route   GET /api/admin/cdn-usage
 * @desc    Get Cloudinary CDN usage statistics
 * @access  Private (Admin only)
 */
router.get('/cdn-usage', protectRoute, requireAdmin, cacheMiddleware(), getCDNUsage);

export default router;

