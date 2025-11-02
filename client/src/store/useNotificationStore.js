import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { 
  getNotificationSettings, 
  toggleMuteAllNotifications, 
  toggleMutePost, 
  toggleMuteUser,
  checkPostMuteStatus,
  checkUserMuteStatus
} from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  notificationSettings: {
    allNotificationsMuted: false,
    mutedPosts: [],
    mutedUsers: []
  },

  // Fetch notifications from backend
  fetchNotifications: async (unreadOnly = false) => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get('/notifications', {
        params: { unreadOnly }
      });
      set({ 
        notifications: res.data.notifications,
        unreadCount: res.data.unreadCount,
        isLoading: false 
      });
      return res.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Add new notification (real-time)
  addNotification: (notification) => {
    set((state) => {
      // Check if notification already exists
      const exists = state.notifications.some(n => n._id === notification._id);
      if (exists) return state;

      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    });
  },

  // Update unread count (real-time)
  setUnreadCount: (count) => {
    set({ unreadCount: count });
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const res = await axiosInstance.patch(`/notifications/${notificationId}/read`);
      set((state) => ({
        notifications: state.notifications.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: res.data.unreadCount
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  // Mark notification as unread
  markAsUnread: async (notificationId) => {
    try {
      const res = await axiosInstance.patch(`/notifications/${notificationId}/unread`);
      set((state) => ({
        notifications: state.notifications.map(n =>
          n._id === notificationId ? { ...n, read: false } : n
        ),
        unreadCount: res.data.unreadCount
      }));
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      await axiosInstance.patch('/notifications/mark-all-read');
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      const res = await axiosInstance.delete(`/notifications/${notificationId}`);
      set((state) => ({
        notifications: state.notifications.filter(n => n._id !== notificationId),
        unreadCount: res.data.unreadCount
      }));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },

  // Clear all notifications
  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  // ==================== MUTING FUNCTIONS ====================
  
  // Fetch notification settings
  fetchNotificationSettings: async () => {
    try {
      const data = await getNotificationSettings();
      set({ notificationSettings: data.settings });
      return data.settings;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  },

  // Toggle mute all notifications
  toggleMuteAll: async () => {
    try {
      const data = await toggleMuteAllNotifications();
      // Refetch settings to get updated state
      await get().fetchNotificationSettings();
      return data;
    } catch (error) {
      console.error('Error toggling mute all:', error);
      throw error;
    }
  },

  // Toggle mute post
  togglePostMute: async (postId) => {
    try {
      const data = await toggleMutePost(postId);
      // Refetch settings to get updated state
      await get().fetchNotificationSettings();
      return data;
    } catch (error) {
      console.error('Error toggling post mute:', error);
      throw error;
    }
  },

  // Toggle mute user
  toggleUserMute: async (userId) => {
    try {
      const data = await toggleMuteUser(userId);
      // Refetch settings to get updated state
      await get().fetchNotificationSettings();
      return data;
    } catch (error) {
      console.error('Error toggling user mute:', error);
      throw error;
    }
  },

  // Check if post is muted
  checkPostMuted: async (postId) => {
    try {
      const data = await checkPostMuteStatus(postId);
      return data.isMuted;
    } catch (error) {
      console.error('Error checking post mute status:', error);
      return false;
    }
  },

  // Check if user is muted
  checkUserMuted: async (userId) => {
    try {
      const data = await checkUserMuteStatus(userId);
      return data.isMuted;
    } catch (error) {
      console.error('Error checking user mute status:', error);
      return false;
    }
  }
}));