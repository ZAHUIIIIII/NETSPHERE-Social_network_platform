// server/src/controllers/notification.controller.js
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { getReceiverSocketId, io } from '../lib/socket.js';

// Create a notification and emit it via socket
export const createNotification = async (data) => {
  try {
    // Don't create notification if sender and recipient are the same
    if (data.sender.toString() === data.recipient.toString()) {
      return null;
    }

    // Check if recipient has muted this post
    if (data.post) {
      const recipient = await User.findById(data.recipient).select('mutedPosts');
      if (recipient && recipient.mutedPosts.includes(data.post.toString())) {
        console.log('Notification skipped - post is muted by recipient');
        return null;
      }
    }

    // Create notification using model's static method
    const notification = await Notification.createNotification(data);
    
    if (notification) {
      // Emit real-time notification via socket
      const receiverSocketId = getReceiverSocketId(data.recipient.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newNotification', notification);
      }
      
      // Emit updated unread count
      const unreadCount = await Notification.getUnreadCount(data.recipient);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('unreadCount', { count: unreadCount });
      }
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for current user
export const getNotifications = async (req, res) => {
  try {
    const { skip = 0, limit = 50, unreadOnly = false } = req.query;
    const userId = req.user._id;

    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('sender', 'username avatar')
      .populate('post', 'content images')
      .lean();

    const unreadCount = await Notification.getUnreadCount(userId);
    const hasMore = notifications.length === Number(limit);

    res.json({
      notifications,
      unreadCount,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      notification,
      unreadCount
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
};

// Mark notification as unread
export const markAsUnread = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: false },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      notification,
      unreadCount
    });
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.markAllAsRead(userId);

    res.json({
      message: 'All notifications marked as read',
      unreadCount: 0
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      message: 'Notification deleted',
      unreadCount
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification' });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.getUnreadCount(userId);
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Error getting count' });
  }
};