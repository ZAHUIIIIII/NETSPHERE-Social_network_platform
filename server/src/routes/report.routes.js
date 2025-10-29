import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { createReport, getMyReports } from '../controllers/report.controller.js';

const router = express.Router();

// User routes
router.post('/posts/:postId', protectRoute, createReport);
router.get('/my-reports', protectRoute, getMyReports);

export default router;
