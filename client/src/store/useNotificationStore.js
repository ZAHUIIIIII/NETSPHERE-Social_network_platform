import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

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
  }
}));