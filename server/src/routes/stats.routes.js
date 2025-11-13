import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { getUserStats, getPlatformNews } from '../controllers/stats.controller.js';

const router = express.Router();

// Get user personal stats
router.get('/user-stats', protectRoute, getUserStats);

// Get platform news/announcements
router.get('/platform-news', getPlatformNews);

export default router;
