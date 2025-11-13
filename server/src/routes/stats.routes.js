import express from 'express';
import { getPlatformNews } from '../controllers/stats.controller.js';

const router = express.Router();

// Get platform news/announcements
router.get('/platform-news', getPlatformNews);

export default router;
