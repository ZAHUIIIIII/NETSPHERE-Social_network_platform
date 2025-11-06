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

    // Get recipient's notification settings (fresh from DB)
    const recipient = await User.findById(data.recipient).select('notificationSettings').lean();
    
    if (!recipient) {
      return null;
    }
    
    // Ensure notificationSettings exists with defaults
    const settings = recipient.notificationSettings || {};
    const allMuted = settings.allNotificationsMuted === true;
    
    // Check if recipient has muted ALL notifications
    if (allMuted) {
      return null;
    }

    // Check notification type preferences
    if (data.type) {
      // Map notification types to user settings keys
      const typeMapping = {
        'like': 'likes',
        'comment': 'comments',
        'reply': 'comments',
        'follow': 'follows',
        'reaction': 'likes',
        'repost': 'comments'
      };
      
      const settingKey = typeMapping[data.type];
      if (settingKey) {
        const typePreference = settings[settingKey];
        
        // Only block if explicitly set to false (not undefined/null)
        if (typePreference === false) {
          return null;
        }
      }
    }

    // Check if recipient has muted this post
    if (data.post && settings.mutedPosts?.includes(data.post.toString())) {
      return null;
    }
    
    // Check if recipient has muted the sender
    if (settings.mutedUsers?.some(id => id.toString() === data.sender.toString())) {
      return null;
    }

    // Create notification using model's static method
    const notification = await Notification.createNotification(data);
    
    if (notification) {
      // Check if user wants toast notifications (push notifications setting)
      const showToast = settings.push !== false;
      
      // Emit real-time notification via socket
      const receiverSocketId = getReceiverSocketId(data.recipient.toString());
      if (receiverSocketId) {
        // Add showToast flag to notification
        const notificationWithToast = {
          ...notification.toObject(),
          showToast
        };
        io.to(receiverSocketId).emit('newNotification', notificationWithToast);
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

// ==================== NOTIFICATION SETTINGS ====================

// Get notification settings
export const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('notificationSettings');
    
    res.json({ 
      settings: user.notificationSettings || {
        allNotificationsMuted: false,
        mutedPosts: [],
        mutedUsers: [],
        mutedConversations: []
      }
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({ message: 'Error getting settings' });
  }
};

// Toggle mute all notifications
export const toggleMuteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    user.notificationSettings.allNotificationsMuted = !user.notificationSettings.allNotificationsMuted;
    await user.save();
    
    res.json({ 
      message: user.notificationSettings.allNotificationsMuted 
        ? 'All notifications muted' 
        : 'All notifications unmuted',
      settings: user.notificationSettings
    });
  } catch (error) {
    console.error('Error toggling mute all:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
};

// Toggle mute post
export const toggleMutePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    const user = await User.findById(userId);
    
    const index = user.notificationSettings.mutedPosts.indexOf(postId);
    if (index > -1) {
      user.notificationSettings.mutedPosts.splice(index, 1);
    } else {
      user.notificationSettings.mutedPosts.push(postId);
    }
    
    await user.save();
    
    res.json({ 
      message: index > -1 ? 'Post unmuted' : 'Post muted',
      isMuted: index === -1,
      settings: user.notificationSettings
    });
  } catch (error) {
    console.error('Error toggling mute post:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
};

// Toggle mute user
export const toggleMuteUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userId: targetUserId } = req.params;
    const user = await User.findById(userId);
    
    const index = user.notificationSettings.mutedUsers.findIndex(
      id => id.toString() === targetUserId
    );
    
    if (index > -1) {
      user.notificationSettings.mutedUsers.splice(index, 1);
    } else {
      user.notificationSettings.mutedUsers.push(targetUserId);
    }
    
    await user.save();
    
    res.json({ 
      message: index > -1 ? 'User unmuted' : 'User muted',
      isMuted: index === -1,
      settings: user.notificationSettings
    });
  } catch (error) {
    console.error('Error toggling mute user:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
};

// Check post mute status
export const checkPostMuteStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    const user = await User.findById(userId).select('notificationSettings');
    
    const isMuted = user.notificationSettings.mutedPosts.includes(postId);
    
    res.json({ isMuted });
  } catch (error) {
    console.error('Error checking post mute status:', error);
    res.status(500).json({ message: 'Error checking status' });
  }
};

// Check user mute status
export const checkUserMuteStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userId: targetUserId } = req.params;
    const user = await User.findById(userId).select('notificationSettings');
    
    const isMuted = user.notificationSettings.mutedUsers.some(
      id => id.toString() === targetUserId
    );
    
    res.json({ isMuted });
  } catch (error) {
    console.error('Error checking user mute status:', error);
    res.status(500).json({ message: 'Error checking status' });
  }
};

// Update notification preference (push, messages, likes, comments, follows)
export const updateNotificationPreference = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, enabled } = req.body;
    
    // Validate notification type
    const validTypes = ['push', 'messages', 'likes', 'comments', 'follows'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid notification type' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update the specific notification preference
    user.notificationSettings[type] = enabled;
    await user.save();
    
    res.json({ 
      message: `${type} notifications ${enabled ? 'enabled' : 'disabled'}`,
      settings: user.notificationSettings
    });
  } catch (error) {
    console.error('Error updating notification preference:', error);
    res.status(500).json({ message: 'Error updating preference' });
  }
};