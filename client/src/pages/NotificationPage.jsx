import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { axiosInstance } from '../lib/axios';
import { 
  Heart, 
  MessageCircle, 
  UserPlus, 
  User,
  Bell,
  BellOff,
  Trash2,
  CheckCheck,
  Smile,
  Loader,
  Settings,
  Filter,
  MoreHorizontal,
  Check,
  Eye,
  Image as ImageIcon,
  Reply,
  UserCheck,
  Repeat,
  FileText,
  UserX,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { formatTime } from '../lib/utils';
import toast from 'react-hot-toast';
import { useFollow } from '../hooks/useFollow';
import PortalDropdown from '../components/common/PortalDropdown';

const NotificationPage = () => {
  const { authUser } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification: deleteNotificationFromStore,
    togglePostMute,
    notificationSettings,
    fetchNotificationSettings
  } = useNotificationStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'comments', 'likes', 'follows'
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'unread'
  const [showSettings, setShowSettings] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null); // Track which notification menu is open
  const [followStates, setFollowStates] = useState({}); // Track follow state for each user
  const [followLoading, setFollowLoading] = useState({}); // Track loading state for follow buttons
  const initializedRef = useRef(false); // Track if we've done initial setup
  const recentlyMarkedAsRead = useRef(new Set()); // Track recently marked notifications

  useEffect(() => {
    if (authUser && !initializedRef.current) {
      fetchNotifications(false);
      fetchNotificationSettings();
      initializedRef.current = true;
    }
  }, []); // Only run once on mount

  // Clear unread count badge when entering the page (but don't mark notifications as read)
  useEffect(() => {
    if (authUser) {
      // Set unread count to 0 in the store (for navbar badge)
      // But don't actually mark notifications as read in the backend
      const { setUnreadCount } = useNotificationStore.getState();
      setUnreadCount(0);
    }

    // When leaving the page, restore the actual unread count
    return () => {
      // Only refetch on unmount, not on every authUser change
      const currentAuthUser = useAuthStore.getState().authUser;
      if (currentAuthUser) {
        fetchNotifications(false);
      }
    };
  }, []); // Only run on mount/unmount

  // Listen for real-time notification updates
  const lastRefetchTime = useRef(0);
  
  useEffect(() => {
    const handleNewNotification = (event) => {
      // Only refresh if it's actually a new notification (not from our own follow action)
      const notification = event.detail;
      
      console.log('📥 New notification event received:', {
        type: notification?.type,
        senderId: notification?.sender?._id,
        currentUserId: authUser?._id,
        isSelf: notification?.sender?._id === authUser?._id
      });
      
      // Don't refetch if we're the sender (our own follow action)
      if (notification?.sender?._id === authUser?._id) {
        console.log('⏭️ Ignoring own notification');
        return;
      }
      
      // Prevent rapid refetches (debounce 500ms)
      const now = Date.now();
      if (now - lastRefetchTime.current < 500) {
        console.log('⏸️ Skipping refetch - too soon after last refetch');
        return;
      }
      
      // Don't refetch if we just marked notifications as read
      if (recentlyMarkedAsRead.current.size > 0) {
        console.log('⏸️ Skipping refetch - recently marked notifications as read:', 
          Array.from(recentlyMarkedAsRead.current));
        return;
      }
      
      lastRefetchTime.current = now;
      
      console.log('🔄 Refetching notifications from server');
      // Refresh notifications when a new one arrives from someone else
      const { fetchNotifications } = useNotificationStore.getState();
      fetchNotifications(false);
    };

    const handleUnreadCountUpdate = () => {
      // The store is already updated by App.jsx, no need to refetch
      // This just ensures any UI updates happen
    };

    window.addEventListener('newNotification', handleNewNotification);
    window.addEventListener('unreadCountUpdate', handleUnreadCountUpdate);

    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
      window.removeEventListener('unreadCountUpdate', handleUnreadCountUpdate);
    };
  }, [authUser?._id]); // Add authUser._id to deps to have access to it

  // Initialize follow states from notifications - ONLY ONCE
  const followStatesInitialized = useRef(false);
  
  useEffect(() => {
    if (!authUser || notifications.length === 0) return;
    
    const states = {};
    
    // First, try to get from authUser.following
    notifications.forEach(notification => {
      if (notification.type === 'follow' && notification.sender?._id) {
        const senderId = notification.sender._id.toString();
        
        // Check if authUser is following this sender
        const isFollowing = authUser?.following?.some(followingId => {
          // Handle both object IDs and string IDs
          const followingIdStr = typeof followingId === 'object' 
            ? (followingId._id || followingId.toString())
            : followingId.toString();
          
          return followingIdStr === senderId;
        }) || false;
        
        states[senderId] = isFollowing;
      }
    });
    
    setFollowStates(states);
    
    if (!followStatesInitialized.current) {
      followStatesInitialized.current = true;
    }
  }, [authUser?.following, notifications]); // Re-sync when authUser.following changes

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenuId && !e.target.closest('[data-dropdown-menu]') && !e.target.closest('[data-dropdown-trigger]')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuId]);

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      setOpenMenuId(null);
      await markAsRead(notificationId);
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAsUnread = async (notificationId, e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      setOpenMenuId(null);
      await markAsUnread(notificationId);
    } catch (error) {
      toast.error('Failed to mark as unread');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      setOpenMenuId(null);
      await deleteNotificationFromStore(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleMutePost = async (postId, e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      console.log('🔇 handleMutePost called with postId:', postId);
      setOpenMenuId(null);
      const result = await togglePostMute(postId);
      console.log('✅ togglePostMute result:', result);
      
      // After toggling, check the updated settings from the store
      const { notificationSettings } = useNotificationStore.getState();
      console.log('📦 Updated notificationSettings:', notificationSettings);
      
      const isMuted = notificationSettings?.mutedPosts?.includes(postId);
      console.log('🔍 Is now muted?', isMuted);
      
      toast.success(isMuted ? '🔇 Post notifications muted' : '🔊 Post notifications unmuted');
    } catch (error) {
      console.error('❌ Error in handleMutePost:', error);
      toast.error('Failed to update mute settings');
    }
  };

  const handleMuteUser = async (userId, e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      console.log('🔇 handleMuteUser called with userId:', userId);
      setOpenMenuId(null);
      const result = await useNotificationStore.getState().toggleUserMute(userId);
      console.log('✅ toggleUserMute result:', result);
      
      // After toggling, check the updated settings from the store
      const { notificationSettings } = useNotificationStore.getState();
      console.log('📦 Updated notificationSettings:', notificationSettings);
      
      const isMuted = notificationSettings?.mutedUsers?.includes(userId);
      console.log('🔍 Is now muted?', isMuted);
      
      const username = notifications.find(n => n.sender?._id === userId)?.sender?.username || 'user';
      toast.success(isMuted ? `🔇 Muted @${username}` : `🔊 Unmuted @${username}`);
    } catch (error) {
      console.error('❌ Error in handleMuteUser:', error);
      toast.error('Failed to update mute settings');
    }
  };

  const handleFollowToggle = async (userId, e, notificationId = null) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Set loading state
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const isCurrentlyFollowing = followStates[userId];
      
      if (isCurrentlyFollowing) {
        // Unfollow
        await axiosInstance.post(`/users/${userId}/unfollow`);
        setFollowStates(prev => ({ ...prev, [userId]: false }));
        
        // Update authUser following list
        const updatedFollowing = authUser.following.filter(id => {
          const idStr = typeof id === 'object' ? id._id || id.toString() : id.toString();
          return idStr !== userId.toString();
        });
        
        useAuthStore.setState({ 
          authUser: { ...authUser, following: updatedFollowing } 
        });
        
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        await axiosInstance.post(`/users/${userId}/follow`);
        setFollowStates(prev => ({ ...prev, [userId]: true }));
        
        // Update authUser following list
        const updatedFollowing = [...(authUser.following || []), userId];
        
        useAuthStore.setState({ 
          authUser: { ...authUser, following: updatedFollowing } 
        });
        
        toast.success('Followed successfully');
      }
      
      // Mark notification as read if notification ID is provided
      if (notificationId) {
        try {
          console.log('🔔 Marking notification as read:', notificationId);
          
          // Add to recently marked set to prevent refetch from overwriting
          recentlyMarkedAsRead.current.add(notificationId);
          
          // Remove from set after 2 seconds
          setTimeout(() => {
            recentlyMarkedAsRead.current.delete(notificationId);
          }, 2000);
          
          await markAsRead(notificationId);
          console.log('✅ Notification marked as read successfully');
        } catch (markReadError) {
          console.error('❌ Failed to mark notification as read:', markReadError);
          // Remove from set if marking failed
          recentlyMarkedAsRead.current.delete(notificationId);
          // Don't throw error, just log it - the follow action was successful
        }
      }
    } catch (error) {
      // If already following error, update state to reflect that
      if (error.response?.data?.message === 'Already following this user') {
        setFollowStates(prev => ({ ...prev, [userId]: true }));
        toast.error('Already following this user');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update follow status');
      }
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleToggleMenu = (notificationId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === notificationId ? null : notificationId);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) setOpenMenuId(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const handleNotificationClick = async (notification, e) => {
    // Don't do anything if clicking on a button
    if (e.target.closest('button')) {
      return;
    }

    // Only mark as read when tapping the card
    if (!notification.read) {
      await markAsRead(notification._id);
    }
  };

  const getNotificationIcon = (type) => {
    const iconClasses = "w-5 h-5";
    switch (type) {
      case 'like':
        return <Heart className={`${iconClasses} text-red-500`} fill="currentColor" />;
      case 'comment':
        return <MessageCircle className={`${iconClasses} text-blue-500`} />;
      case 'reply':
        return <Reply className={`${iconClasses} text-green-500`} />;
      case 'follow':
        return <UserPlus className={`${iconClasses} text-purple-500`} />;
      case 'reaction':
        return <Smile className={`${iconClasses} text-yellow-500`} />;
      case 'repost':
        return <Repeat className={`${iconClasses} text-indigo-500`} />;
      case 'story':
        return <Eye className={`${iconClasses} text-pink-500`} />;
      case 'post':
        return <ImageIcon className={`${iconClasses} text-blue-600`} />;
      default:
        return <Bell className={`${iconClasses} text-gray-500`} />;
    }
  };

  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case 'like':
        return `liked your post`;
      case 'comment':
        return `commented on your post`;
      case 'reply':
        return `replied to your comment`;
      case 'follow':
        return `started following you`;
      case 'reaction':
        const emoji = {
          like: '👍',
          love: '❤️',
          haha: '😂',
          wow: '😮',
          sad: '😢',
          angry: '😠'
        }[notification.reactionType] || '👍';
        return `reacted ${emoji} to your ${notification.comment ? 'comment' : 'post'}`;
      case 'repost':
        return `reposted your post`;
      case 'story':
        return `viewed your story`;
      case 'post':
        return `liked your post about the new design system`;
      default:
        return 'sent you a notification';
    }
  };

  // Get badge emoji for notification type
  const getNotificationBadge = (notification) => {
    switch (notification.type) {
      case 'like':
        return '❤️';
      case 'reaction':
        const reactionEmojis = {
          like: '👍',
          love: '❤️',
          haha: '😂',
          wow: '😮',
          sad: '😢',
          angry: '😠'
        };
        return reactionEmojis[notification.reactionType] || '👍';
      case 'comment':
        return '💬';
      case 'reply':
        return '↩️';
      case 'follow':
        return '👤';
      case 'repost':
        return '🔄';
      default:
        return '🔔';
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (activeTab === 'unread') return !notification.read;
      if (activeTab === 'comments') return notification.type === 'comment' || notification.type === 'reply';
      if (activeTab === 'likes') return notification.type === 'like' || notification.type === 'reaction';
      if (activeTab === 'follows') return notification.type === 'follow';
      return true;
    });
  }, [notifications, activeTab]);

  // Sort notifications
  const sortedNotifications = useMemo(() => {
    return [...filteredNotifications].sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'unread') {
        if (a.read === b.read) return new Date(b.createdAt) - new Date(a.createdAt);
        return a.read ? 1 : -1;
      }
      return 0;
    });
  }, [filteredNotifications, sortBy]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    sortedNotifications.forEach(notification => {
      const notifDate = new Date(notification.createdAt);
      if (notifDate >= today) {
        groups.today.push(notification);
      } else if (notifDate >= yesterday) {
        groups.yesterday.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });

    return groups;
  }, [sortedNotifications]);

  const getTabCount = (tab) => {
    switch (tab) {
      case 'unread': return notifications.filter(n => !n.read).length;
      case 'comments': return notifications.filter(n => (n.type === 'comment' || n.type === 'reply') && !n.read).length;
      case 'likes': return notifications.filter(n => (n.type === 'like' || n.type === 'reaction') && !n.read).length;
      case 'follows': return notifications.filter(n => n.type === 'follow' && !n.read).length;
      default: return notifications.length;
    }
  };

  const renderNotificationGroup = (title, groupNotifications) => {
    if (groupNotifications.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            {title}
          </h3>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent" />
        </div>
        <div className="space-y-3">
          {groupNotifications.map((notification) => (
            <div
              key={notification._id}
              onClick={(e) => handleNotificationClick(notification, e)}
              className={`group relative p-4 bg-white rounded-xl shadow-sm border transition-all duration-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer ${
                !notification.read 
                  ? 'border-blue-200 bg-gradient-to-r from-blue-50/50 to-white ring-2 ring-blue-100' 
                  : 'border-gray-100 hover:border-gray-200'
              } ${openMenuId === notification._id ? 'z-50' : 'z-0'}`}
            >
              {/* Unread indicator */}
              {!notification.read && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full shadow-lg" />
              )}

              <div className="flex items-start gap-3">
                {/* Avatar with emoji badge overlay */}
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      notification.sender?.avatar ||
                      `https://ui-avatars.com/api/?name=${notification.sender?.username || 'User'}`
                    }
                    alt=""
                    className={`w-11 h-11 rounded-full object-cover ring-2 transition-all duration-300 ${
                      !notification.read ? 'ring-blue-200' : 'ring-gray-200'
                    } group-hover:ring-blue-300 group-hover:scale-105`}
                  />
                  {/* Notification type emoji badge */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-gray-100 group-hover:scale-110 transition-transform">
                    <span className="text-sm">
                      {getNotificationBadge(notification)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">
                        <span className="font-bold text-gray-900 hover:underline cursor-pointer">
                          {notification.sender?.username || 'Someone'}
                        </span>
                        <span className="text-gray-600 ml-1.5">
                          {getNotificationMessage(notification)}
                        </span>
                      </p>

                      {/* Timestamp */}
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        {formatTime(new Date(notification.createdAt))}
                      </p>

                      {/* Follow Status for follow notifications */}
                      {notification.type === 'follow' && notification.sender?._id && (
                        <div className="mt-3 flex items-center gap-2 follow-button-area" onClick={(e) => e.stopPropagation()}>
                          {followStates[notification.sender._id] ? (
                            // Static "Following" badge (non-interactive)
                            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200 shadow-sm">
                              <UserCheck className="w-4 h-4" />
                              <span>Following</span>
                            </div>
                          ) : (
                            // Interactive "Follow Back" button
                            <button
                              type="button"
                              onClick={(e) => handleFollowToggle(notification.sender._id, e, notification._id)}
                              disabled={followLoading[notification.sender._id]}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                              {followLoading[notification.sender._id] ? (
                                <>
                                  <Loader className="w-4 h-4 animate-spin" />
                                  <span>Loading...</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-4 h-4" />
                                  <span>Follow Back</span>
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* View Profile Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${notification.sender.username}`);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg transition-all hover:shadow-md hover:scale-105 whitespace-nowrap shadow-sm"
                          >
                            <User className="w-4 h-4" />
                            <span>View Profile</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions menu - Always visible */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <PortalDropdown
                        isOpen={openMenuId === notification._id}
                        onClose={() => setOpenMenuId(null)}
                        width="min-w-[260px]"
                        trigger={
                          <button
                            onClick={(e) => handleToggleMenu(notification._id, e)}
                            className={`p-2 rounded-lg transition-all ${
                              openMenuId === notification._id 
                                ? 'bg-blue-100 text-blue-700 shadow-sm' 
                                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100'
                            }`}
                            title="More options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        }
                        className="py-2 backdrop-blur-sm"
                      >
                          {/* Mark as Read/Unread */}
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              notification.read ? handleMarkAsUnread(notification._id, e) : handleMarkAsRead(notification._id, e);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-all hover:pl-5"
                          >
                            {notification.read ? (
                              <>
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <Eye className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-semibold">Mark as unread</span>
                              </>
                            ) : (
                              <>
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                  <Check className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="font-semibold">Mark as read</span>
                              </>
                            )}
                          </button>

                          {/* Mute Post - Only show if notification has a post */}
                          {notification.post && (
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMutePost(notification.post._id || notification.post, e);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-amber-50 flex items-center gap-3 transition-all hover:pl-5"
                            >
                              {notificationSettings?.mutedPosts?.includes(notification.post._id || notification.post) ? (
                                <>
                                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-green-600" />
                                  </div>
                                  <span className="font-semibold">Unmute post</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-amber-600" />
                                  </div>
                                  <span className="font-semibold">Mute post</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Separator Line */}
                          <div className="border-t border-gray-200 my-1"></div>

                          {/* Mute User - Only show if notification has a sender and it's not self */}
                          {notification.sender && notification.sender._id !== authUser._id && (
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMuteUser(notification.sender._id, e);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-3 transition-all hover:pl-5"
                            >
                              {notificationSettings?.mutedUsers?.includes(notification.sender._id) ? (
                                <>
                                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <UserCheck className="w-4 h-4 text-green-600" />
                                  </div>
                                  <span className="font-semibold">Unmute @{notification.sender.username}</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <UserX className="w-4 h-4 text-purple-600" />
                                  </div>
                                  <span className="font-semibold">Mute @{notification.sender.username}</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Delete Notification */}
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteNotification(notification._id, e);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-red-50 flex items-center gap-3 transition-all hover:pl-5"
                          >
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </div>
                            <span className="font-semibold">Delete notification</span>
                          </button>
                      </PortalDropdown>
                    </div>
                  </div>

                  {/* Comment/Reply Content Preview */}
                  {(notification.type === 'comment' || notification.type === 'reply') && notification.metadata?.commentContent && (
                    <div className="mt-2.5 flex items-center gap-2.5 p-2.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center">
                          <MessageCircle className="w-3 h-3 text-blue-600" />
                        </div>
                        <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wide whitespace-nowrap">
                          {notification.type === 'comment' ? 'Comment' : 'Reply'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-700 leading-snug line-clamp-1 flex-1 font-medium">
                        "{notification.metadata.commentContent}"
                      </p>
                    </div>
                  )}

                  {/* Post Preview */}
                  {notification.metadata?.postContent && (
                    <div className="mt-2.5 flex items-center gap-2.5 p-2.5 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200 shadow-sm">
                      <div className="w-5 h-5 rounded-md bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-3 h-3 text-gray-500" />
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-1 leading-snug flex-1 font-medium">
                        {notification.metadata.postContent}
                      </p>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="mt-3 flex flex-row items-center gap-2">
                    {/* View Post Button - Only show for post-related notifications */}
                    {(notification.type === 'like' || 
                      notification.type === 'comment' || 
                      notification.type === 'reply' || 
                      notification.type === 'reaction' ||
                      notification.type === 'share') && 
                      (notification.post?._id || notification.post) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/post/${notification.post._id || notification.post}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all hover:shadow-md hover:scale-105 whitespace-nowrap shadow-sm"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>View Post</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell className="w-6 h-6 text-blue-600" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                <p className="text-xs text-gray-500">
                  {unreadCount > 0 
                    ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : 'You\'re all caught up!'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-md border border-gray-200/50 px-5 py-3 overflow-x-auto">
            <div className="flex gap-2 items-center justify-center flex-wrap">
              <button
                onClick={() => setActiveTab('all')}
                className={`relative px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                All
                {getTabCount('all') > 0 && activeTab !== 'all' && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700">
                    {getTabCount('all')}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`relative px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                  activeTab === 'unread'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                Unread
                {getTabCount('unread') > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'unread' ? 'bg-blue-800' : 'bg-red-100 text-red-700'
                  }`}>
                    {getTabCount('unread')}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('likes')}
                className={`relative px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'likes'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Likes</span>
                {getTabCount('likes') > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'likes' ? 'bg-blue-800' : 'bg-pink-100 text-pink-700'
                  }`}>
                    {getTabCount('likes')}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`relative px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'comments'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Comments</span>
                {getTabCount('comments') > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'comments' ? 'bg-blue-800' : 'bg-green-100 text-green-700'
                  }`}>
                    {getTabCount('comments')}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('follows')}
                className={`relative px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'follows'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Follows</span>
                {getTabCount('follows') > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'follows' ? 'bg-blue-800' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {getTabCount('follows')}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="flex justify-end mt-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 text-sm border-none rounded-lg focus:outline-none bg-white hover:bg-gray-50 text-gray-700 font-semibold cursor-pointer appearance-none pr-8 shadow-sm transition-all"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.25rem'
              }}
            >
              <option value="recent">Most Recent</option>
              <option value="unread">Unread First</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="mt-6">
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center py-20">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Loading notifications...</p>
              </div>
            </div>
          ) : sortedNotifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-20 px-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {activeTab === 'unread' ? "All caught up!" : "No notifications yet"}
              </h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                {activeTab === 'unread' 
                  ? "You've read all your notifications. Check back later for new updates!"
                  : activeTab === 'all'
                  ? "When you get likes, comments, or new followers, they'll show up here."
                  : `No ${activeTab} notifications to display.`
                }
              </p>
            </div>
          ) : (
            <div>
              {renderNotificationGroup('Today', groupedNotifications.today)}
              {renderNotificationGroup('Yesterday', groupedNotifications.yesterday)}
              {renderNotificationGroup('Earlier', groupedNotifications.earlier)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
