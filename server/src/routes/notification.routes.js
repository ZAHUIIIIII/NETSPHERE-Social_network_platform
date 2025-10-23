// server/src/routes/notification.routes.js
import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  getNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} from '../controllers/notification.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Get notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', markAsRead);

// Mark notification as unread
router.patch('/:notificationId/unread', markAsUnread);

// Mark all as read
router.patch('/mark-all-read', markAllAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

export default router;