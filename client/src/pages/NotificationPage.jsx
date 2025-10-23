import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { axiosInstance } from '../lib/axios';
import { 
  Heart, 
  MessageCircle, 
  UserPlus, 
  AtSign, 
  Share2,
  Bell,
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
  BellOff,
  Reply,
  UserCheck,
  UserMinus
} from 'lucide-react';
import { formatTime } from '../lib/utils';
import toast from 'react-hot-toast';
import { useFollow } from '../hooks/useFollow';

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
    deleteNotification: deleteNotificationFromStore
  } = useNotificationStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'mentions', 'likes', 'follows'
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
    if (!authUser || notifications.length === 0 || followStatesInitialized.current) return;
    
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
    followStatesInitialized.current = true;
  }, [authUser, notifications]); // Initialize when we have both authUser and notifications

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
    try {
      await markAsRead(notificationId);
      setOpenMenuId(null); // Close menu after marking
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAsUnread = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await markAsUnread(notificationId);
      setOpenMenuId(null); // Close menu after marking
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
    try {
      await deleteNotificationFromStore(notificationId);
      toast.success('Notification deleted');
      setOpenMenuId(null); // Close menu after delete
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleTurnOffPostNotifications = async (notification, e) => {
    e.stopPropagation();
    try {
      if (!notification.post?._id) {
        toast.error('Cannot mute notifications for this post');
        return;
      }
      
      await axiosInstance.post(`/posts/${notification.post._id}/mute-notifications`);
      toast.success('Post notifications turned off');
      setOpenMenuId(null);
    } catch (error) {
      toast.error('Failed to turn off notifications');
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

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.type === 'follow') {
      navigate(`/profile/${notification.sender?.username}`);
    } else if (notification.post) {
      navigate(`/post/${notification.post._id || notification.post}`);
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
      case 'mention':
        return <AtSign className={`${iconClasses} text-orange-500`} />;
      case 'reaction':
        return <Smile className={`${iconClasses} text-yellow-500`} />;
      case 'share':
        return <Share2 className={`${iconClasses} text-indigo-500`} />;
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
      case 'mention':
        return `mentioned you in a post`;
      case 'reaction':
        const emoji = {
          like: '👍',
          love: '❤️',
          haha: '😂',
          wow: '😮',
          sad: '😢',
          angry: '😠'
        }[notification.reactionType] || '👍';
        return `reacted ${emoji} to your ${notification.post ? 'post' : 'comment'}`;
      case 'share':
        return `shared your post`;
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
      case 'mention':
        return '@';
      case 'share':
        return '🔄';
      default:
        return '🔔';
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (activeTab === 'unread') return !notification.read;
      if (activeTab === 'mentions') return notification.type === 'mention';
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
      case 'mentions': return notifications.filter(n => n.type === 'mention' && !n.read).length;
      case 'likes': return notifications.filter(n => (n.type === 'like' || n.type === 'reaction') && !n.read).length;
      case 'follows': return notifications.filter(n => n.type === 'follow' && !n.read).length;
      default: return notifications.length;
    }
  };

  const renderNotificationGroup = (title, groupNotifications) => {
    if (groupNotifications.length === 0) return null;

    return (
      <div className="mb-4">
        <h3 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider px-1">
          {title}
        </h3>
        <div className="space-y-2">
          {groupNotifications.map((notification) => (
            <div
              key={notification._id}
              onClick={(e) => {
                console.log('🖱️ NOTIFICATION CARD CLICKED', {
                  notificationType: notification.type,
                  clickTarget: e.target.tagName
                });
                
                // Don't navigate if clicking on button or button area
                const clickedButton = e.target.closest('button');
                const clickedButtonArea = e.target.closest('.follow-button-area');
                
                if (clickedButton || clickedButtonArea) {
                  console.log('🛑 CLICK ON BUTTON - Preventing navigation');
                  e.stopPropagation();
                  e.preventDefault();
                  return;
                }
                
                console.log('➡️ NAVIGATING - Clicked outside button area');
                handleNotificationClick(notification);
              }}
              className={`relative p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md cursor-pointer transition-all duration-200 ${
                !notification.read ? 'border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                {/* Avatar with emoji badge overlay */}
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      notification.sender?.avatar ||
                      `https://ui-avatars.com/api/?name=${notification.sender?.username || 'User'}`
                    }
                    alt=""
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-white"
                  />
                  {/* Notification type emoji badge */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-lg border border-gray-200">
                    <span className="text-xs">
                      {getNotificationBadge(notification)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <div className="flex-1">
                      <p className="text-xs leading-snug">
                        <span className="font-semibold text-gray-900 hover:underline">
                          {notification.sender?.username || 'Someone'}
                        </span>
                        <span className="text-gray-600 ml-1">
                          {getNotificationMessage(notification)}
                        </span>
                      </p>

                      {/* Timestamp */}
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatTime(new Date(notification.createdAt))}
                      </p>

                      {/* Follow Status for follow notifications */}
                      {notification.type === 'follow' && notification.sender?._id && (
                        <div className="mt-2 follow-button-area" onClick={(e) => e.stopPropagation()}>
                          {followStates[notification.sender._id] ? (
                            // Static "Following" badge (non-interactive)
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Following</span>
                            </div>
                          ) : (
                            // Interactive "Follow Back" button
                            <button
                              type="button"
                              onClick={(e) => handleFollowToggle(notification.sender._id, e, notification._id)}
                              disabled={followLoading[notification.sender._id]}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {followLoading[notification.sender._id] ? (
                                <>
                                  <Loader className="w-3.5 h-3.5 animate-spin" />
                                  <span>Loading...</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>Follow Back</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions menu - Always visible */}
                    <div className="flex items-center gap-1 relative flex-shrink-0">
                      <button
                        data-dropdown-trigger
                        onClick={(e) => handleToggleMenu(notification._id, e)}
                        className={`p-1.5 rounded-full transition-all ${
                          openMenuId === notification._id 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                        }`}
                        title="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === notification._id && (
                        <div 
                          data-dropdown-menu
                          className="absolute right-0 top-full mt-1.5 bg-white rounded-lg shadow-2xl border border-gray-200 py-1.5 min-w-[240px] z-[100]"
                          onClick={(e) => e.stopPropagation()}
                          style={{ 
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                          }}
                        >
                          {/* Mark as Read/Unread */}
                          <button
                            onClick={(e) => notification.read ? handleMarkAsUnread(notification._id, e) : handleMarkAsRead(notification._id, e)}
                            className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-blue-50 flex items-center gap-2.5 transition-colors"
                          >
                            {notification.read ? (
                              <>
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <span className="font-medium">Mark as unread</span>
                              </>
                            ) : (
                              <>
                                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                  <Check className="w-3.5 h-3.5 text-green-600" />
                                </div>
                                <span className="font-medium">Mark as read</span>
                              </>
                            )}
                          </button>

                          {/* Delete Notification */}
                          <button
                            onClick={(e) => handleDeleteNotification(notification._id, e)}
                            className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </div>
                            <span className="font-medium">Delete notification</span>
                          </button>

                          {/* Turn off post notifications (only for post-related notifications) */}
                          {(notification.type === 'comment' || 
                            notification.type === 'reply' || 
                            notification.type === 'reaction' || 
                            notification.type === 'like') && notification.post && (
                            <button
                              onClick={(e) => handleTurnOffPostNotifications(notification, e)}
                              className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-amber-50 flex items-center gap-2.5 border-t border-gray-100 transition-colors"
                            >
                              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <BellOff className="w-3.5 h-3.5 text-amber-600" />
                              </div>
                              <span className="font-medium">Mute this post</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment/Reply Content Preview */}
                  {(notification.type === 'comment' || notification.type === 'reply') && notification.metadata?.commentContent && (
                    <div className="mt-2 p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageCircle className="w-3 h-3 text-gray-400" />
                        <p className="text-[11px] text-gray-500 font-medium">
                          {notification.type === 'comment' ? 'Comment' : 'Reply'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                        "{notification.metadata.commentContent}"
                      </p>
                    </div>
                  )}

                  {/* Post Preview */}
                  {notification.metadata?.postContent && (
                    <div className="mt-2 flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <ImageIcon className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                        {notification.metadata.postContent}
                      </p>
                    </div>
                  )}
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
          <div className="flex items-center justify-between gap-3 bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-1.5">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('all')}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  activeTab === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Unread
                {getTabCount('unread') > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeTab === 'unread' ? 'bg-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {getTabCount('unread')}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('mentions')}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'mentions'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <AtSign className="w-3 h-3" />
                <span>{getTabCount('mentions')}</span>
              </button>
              <button
                onClick={() => setActiveTab('likes')}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  activeTab === 'likes'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Heart className="w-3 h-3 inline" />
                {getTabCount('likes') > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeTab === 'likes' ? 'bg-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {getTabCount('likes')}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('follows')}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  activeTab === 'follows'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <UserPlus className="w-3 h-3 inline" />
                {getTabCount('follows') > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    activeTab === 'follows' ? 'bg-blue-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {getTabCount('follows')}
                  </span>
                )}
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 text-xs border-none rounded-md focus:outline-none bg-transparent text-gray-600 font-medium cursor-pointer appearance-none pr-6"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.25rem center',
                  backgroundSize: '1rem'
                }}
              >
                <option value="recent">Most Recent</option>
                <option value="unread">Unread First</option>
              </select>
            </div>
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
