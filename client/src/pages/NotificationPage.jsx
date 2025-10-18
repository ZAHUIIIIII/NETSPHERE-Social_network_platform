import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
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
  Reply
} from 'lucide-react';
import { formatTime } from '../lib/utils';
import toast from 'react-hot-toast';

const NotificationPage = () => {
  const { authUser } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotificationFromStore
  } = useNotificationStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'mentions', 'likes', 'follows'
  const [sortBy, setSortBy] = useState('recent'); // 'recent' or 'unread'
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (authUser) {
      fetchNotifications(false);
    }
  }, [authUser]);

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await markAsRead(notificationId);
    } catch (error) {
      toast.error('Failed to mark as read');
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
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

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
      case 'mentions': return notifications.filter(n => n.type === 'mention').length;
      case 'likes': return notifications.filter(n => n.type === 'like' || n.type === 'reaction').length;
      case 'follows': return notifications.filter(n => n.type === 'follow').length;
      default: return notifications.length;
    }
  };

  const renderNotificationGroup = (title, groupNotifications) => {
    if (groupNotifications.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
          {title}
        </h3>
        <div className="space-y-0">
          {groupNotifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${
                !notification.read ? 'bg-blue-50/50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Notification Type Icon */}
                <div className={`w-10 h-10 rounded-full bg-white border-2 ${!notification.read ? 'border-blue-200' : 'border-gray-200'} flex items-center justify-center flex-shrink-0`}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Sender Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      notification.sender?.avatar ||
                      `https://ui-avatars.com/api/?name=${notification.sender?.username || 'User'}`
                    }
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold hover:underline cursor-pointer">
                          {notification.sender?.username || 'Someone'}
                        </span>
                        {' '}
                        <span className="text-gray-600">
                          {getNotificationMessage(notification)}
                        </span>
                      </p>

                      {/* Post Preview */}
                      {notification.metadata?.postContent && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1 bg-gray-100 rounded px-2 py-1 inline-block max-w-md">
                          "{notification.metadata.postContent}"
                        </p>
                      )}

                      {/* Timestamp and Status */}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-400">
                          {formatTime(new Date(notification.createdAt))}
                        </p>
                        {!notification.read && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-blue-600 font-medium">New</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                      <button
                        onClick={(e) => handleDeleteNotification(notification._id, e)}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {notification.type === 'follow' && (
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Follow Back
                      </button>
                      <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors font-medium">
                        View Profile
                      </button>
                    </div>
                  )}

                  {notification.type === 'comment' && (
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-1">
                        <Reply className="w-3 h-3" />
                        Reply
                      </button>
                      <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors font-medium">
                        View Post
                      </button>
                    </div>
                  )}

                  {(notification.type === 'like' || notification.type === 'mention' || notification.type === 'reaction') && (
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors font-medium">
                        View Post
                      </button>
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
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-8 h-8 text-blue-600" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-500 mt-0.5">
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
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'all' ? 'bg-blue-700' : 'bg-gray-200'
                }`}>
                  {getTabCount('all')}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'unread' ? 'bg-blue-700' : 'bg-gray-200'
                }`}>
                  {getTabCount('unread')}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('mentions')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'mentions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <AtSign className="w-4 h-4" />
                <span className="hidden sm:inline">{getTabCount('mentions')}</span>
              </button>
              <button
                onClick={() => setActiveTab('likes')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'likes'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">{getTabCount('likes')}</span>
              </button>
              <button
                onClick={() => setActiveTab('follows')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'follows'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{getTabCount('follows')}</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="recent">Most Recent</option>
                <option value="unread">Unread First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : sortedNotifications.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <BellOff className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500 text-sm">
                {activeTab === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : activeTab === 'all'
                  ? "No notifications yet. Start following people to see updates!"
                  : `No ${activeTab} notifications found.`
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
    </div>
  );
};

export default NotificationPage;
