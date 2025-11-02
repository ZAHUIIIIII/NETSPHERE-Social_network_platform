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

    // Check recipient's notification settings
    const recipient = await User.findById(data.recipient).select('notificationSettings');
    if (!recipient) return null;

    // Check if all notifications are muted
    if (recipient.notificationSettings?.allNotificationsMuted) {
      console.log('Notification skipped - all notifications muted');
      return null;
    }

    // Check if sender is muted
    if (recipient.notificationSettings?.mutedUsers?.includes(data.sender.toString())) {
      console.log('Notification skipped - sender is muted');
      return null;
    }

    // Check if post is muted (for post-related notifications)
    if (data.post && recipient.notificationSettings?.mutedPosts?.includes(data.post.toString())) {
      console.log('Notification skipped - post is muted');
      return null;
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

// Get notification settings
export const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('notificationSettings');
    
    res.json({
      settings: user.notificationSettings || {
        allNotificationsMuted: false,
        mutedPosts: [],
        mutedUsers: []
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
    
    // Ensure notificationSettings exists
    if (!user.notificationSettings) {
      user.notificationSettings = {
        allNotificationsMuted: false,
        mutedPosts: [],
        mutedUsers: []
      };
      await user.save();
    }
    
    const currentValue = user.notificationSettings.allNotificationsMuted || false;
    const newValue = !currentValue;
    
    await User.findByIdAndUpdate(userId, {
      'notificationSettings.allNotificationsMuted': newValue
    });
    
    res.json({
      message: newValue ? 'All notifications muted' : 'All notifications unmuted',
      allNotificationsMuted: newValue
    });
  } catch (error) {
    console.error('Error toggling mute all:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
};

// Mute/unmute a specific post
export const toggleMutePost = async (req, res) => {
  try {
    console.log('🔇 toggleMutePost called');
    console.log('📋 Params:', req.params);
    console.log('👤 User ID:', req.user._id);
    
    const { postId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    console.log('📦 User found:', user ? 'YES' : 'NO');
    console.log('⚙️  Current notificationSettings:', user?.notificationSettings);
    
    // Ensure notificationSettings exists
    if (!user.notificationSettings) {
      console.log('🆕 Creating new notificationSettings');
      user.notificationSettings = {
        allNotificationsMuted: false,
        mutedPosts: [],
        mutedUsers: []
      };
      await user.save();
      console.log('✅ notificationSettings created');
    }
    
    const mutedPosts = user.notificationSettings.mutedPosts || [];
    const isMuted = mutedPosts.some(id => id.toString() === postId);
    console.log('🔍 Is post currently muted?', isMuted);
    console.log('📝 Current mutedPosts:', mutedPosts);
    
    if (isMuted) {
      // Unmute
      console.log('🔊 Unmuting post...');
      await User.findByIdAndUpdate(userId, {
        $pull: { 'notificationSettings.mutedPosts': postId }
      });
      console.log('✅ Post unmuted successfully');
      res.json({ message: 'Post unmuted', isMuted: false });
    } else {
      // Mute
      console.log('🔇 Muting post...');
      await User.findByIdAndUpdate(userId, {
        $addToSet: { 'notificationSettings.mutedPosts': postId }
      });
      console.log('✅ Post muted successfully');
      res.json({ message: 'Post muted', isMuted: true });
    }
  } catch (error) {
    console.error('❌ Error toggling mute post:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};

// Mute/unmute a specific user
export const toggleMuteUser = async (req, res) => {
  try {
    console.log('🔇 toggleMuteUser called');
    console.log('📋 Params:', req.params);
    console.log('👤 User ID:', req.user._id);
    
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    // Can't mute yourself
    if (userId.toString() === targetUserId) {
      console.log('⚠️  User trying to mute themselves');
      return res.status(400).json({ message: 'Cannot mute yourself' });
    }
    
    const user = await User.findById(userId);
    console.log('📦 User found:', user ? 'YES' : 'NO');
    console.log('⚙️  Current notificationSettings:', user?.notificationSettings);
    
    // Ensure notificationSettings exists
    if (!user.notificationSettings) {
      console.log('🆕 Creating new notificationSettings');
      user.notificationSettings = {
        allNotificationsMuted: false,
        mutedPosts: [],
        mutedUsers: []
      };
      await user.save();
      console.log('✅ notificationSettings created');
    }
    
    const mutedUsers = user.notificationSettings.mutedUsers || [];
    const isMuted = mutedUsers.some(id => id.toString() === targetUserId);
    console.log('🔍 Is user currently muted?', isMuted);
    console.log('📝 Current mutedUsers:', mutedUsers);
    
    if (isMuted) {
      // Unmute
      console.log('🔊 Unmuting user...');
      await User.findByIdAndUpdate(userId, {
        $pull: { 'notificationSettings.mutedUsers': targetUserId }
      });
      console.log('✅ User unmuted successfully');
      res.json({ message: 'User unmuted', isMuted: false });
    } else {
      // Mute
      console.log('🔇 Muting user...');
      await User.findByIdAndUpdate(userId, {
        $addToSet: { 'notificationSettings.mutedUsers': targetUserId }
      });
      console.log('✅ User muted successfully');
      res.json({ message: 'User muted', isMuted: true });
    }
  } catch (error) {
    console.error('❌ Error toggling mute user:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};

// Check if post is muted
export const checkPostMuteStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('notificationSettings');
    const mutedPosts = user.notificationSettings?.mutedPosts || [];
    
    const isMuted = mutedPosts.some(id => id.toString() === postId);
    
    res.json({ isMuted });
  } catch (error) {
    console.error('Error checking mute status:', error);
    res.status(500).json({ message: 'Error checking status' });
  }
};

// Check if user is muted
export const checkUserMuteStatus = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('notificationSettings');
    const mutedUsers = user.notificationSettings?.mutedUsers || [];
    
    const isMuted = mutedUsers.some(id => id.toString() === targetUserId);
    
    res.json({ isMuted });
  } catch (error) {
    console.error('Error checking mute status:', error);
    res.status(500).json({ message: 'Error checking status' });
  }
};