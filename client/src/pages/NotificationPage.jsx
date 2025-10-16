
import { useEffect, useState } from 'react';
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
  Loader
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
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

  useEffect(() => {
    if (authUser) {
      fetchNotifications(filter === 'unread');
    }
  }, [authUser, filter]);

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
        return <MessageCircle className={`${iconClasses} text-green-500`} />;
      case 'follow':
        return <UserPlus className={`${iconClasses} text-purple-500`} />;
      case 'mention':
        return <AtSign className={`${iconClasses} text-orange-500`} />;
      case 'reaction':
        return <Smile className={`${iconClasses} text-yellow-500`} />;
      case 'share':
        return <Share2 className={`${iconClasses} text-indigo-500`} />;
      default:
        return <Bell className={`${iconClasses} text-gray-500`} />;
    }
  };

  const getNotificationMessage = (notification) => {
    const senderName = notification.sender?.username || 'Someone';
    
    switch (notification.type) {
      case 'like':
        return `${senderName} liked your post`;
      case 'comment':
        return `${senderName} commented on your post`;
      case 'reply':
        return `${senderName} replied to your comment`;
      case 'follow':
        return `${senderName} started following you`;
      case 'mention':
        return `${senderName} mentioned you in a post`;
      case 'reaction':
        const emoji = {
          like: '👍',
          love: '❤️',
          haha: '😂',
          wow: '😮',
          sad: '😢',
          angry: '😠'
        }[notification.reactionType] || '👍';
        return `${senderName} reacted ${emoji} to your ${notification.post ? 'post' : 'comment'}`;
      case 'share':
        return `${senderName} shared your post`;
      default:
        return 'New notification';
    }
  };

  // Filter notifications based on selected filter
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="max-w-2xl mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </h1>
            
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Sender Avatar */}
                  <img
                    src={
                      notification.sender?.avatar ||
                      `https://ui-avatars.com/api/?name=${notification.sender?.username || 'User'}`
                    }
                    alt=""
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-900">
                        {getNotificationMessage(notification)}
                      </p>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Post Preview */}
                    {notification.metadata?.postContent && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        "{notification.metadata.postContent}"
                      </p>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(new Date(notification.createdAt))}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification._id, e)}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(notification._id, e)}
                      className="p-1 hover:bg-red-100 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
