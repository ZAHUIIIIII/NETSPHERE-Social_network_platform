// client/src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useChatStore } from '../store/useChatStore';
import CreatePostModal from './CreatePostModal';

const Navbar = ({ isCollapsed, setIsCollapsed }) => {
  const { authUser, logout } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const { users } = useChatStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Calculate unread message count from users with unread messages
  const unreadMessageCount = users.filter(user => user.unreadCount > 0).length;

  // Fetch initial unread count when component mounts
  useEffect(() => {
    if (authUser) {
      fetchNotifications(false);
    }
  }, [authUser, fetchNotifications]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Only render if user is authenticated
  if (!authUser) {
    return null;
  }

  return (
    <nav className={`fixed left-0 top-0 h-full ${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 shadow-lg z-50 transition-all duration-300`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {isCollapsed ? (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center justify-center w-full p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            ) : (
              <>
                <Link to="/" className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">N</span>
                  </div>
                  <span className="font-bold text-lg text-blue-600">NETSPHERE</span>
                </Link>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Create Post Button */}
        <div className="p-3">
          <button 
            onClick={() => setShowCreatePost(true)}
            className={`w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
          >
            <span className="text-lg">+</span>
            {!isCollapsed && <span className="font-medium">Create Post</span>}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3">
          <div className="space-y-1">
            <Link 
              to="/" 
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : 'space-x-3'} ${
                location.pathname === '/' 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {!isCollapsed && <span className="font-medium">Home</span>}
            </Link>
            
            <Link 
              to="/search" 
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : 'space-x-3'} ${
                location.pathname === '/search' 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {!isCollapsed && <span className="font-medium">Search</span>}
            </Link>
            
            <Link 
              to="/messages" 
              className={`flex items-center px-3 py-2 rounded-lg transition-colors relative ${isCollapsed ? 'justify-center' : 'space-x-3'} ${
                location.pathname === '/messages' 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {isCollapsed && unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </div>
              {!isCollapsed && <span className="font-medium">Messages</span>}
              {!isCollapsed && unreadMessageCount > 0 && (
                <span className="absolute right-3 top-2 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
            </Link>
            
            {/* ✅ REAL-TIME NOTIFICATIONS */}
            <Link 
              to="/notifications" 
              className={`flex items-center px-3 py-2 rounded-lg transition-colors relative ${isCollapsed ? 'justify-center' : 'space-x-3'} ${
                location.pathname === '/notifications' 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z"/>
                </svg>
                {isCollapsed && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {!isCollapsed && <span className="font-medium">Notifications</span>}
              {!isCollapsed && unreadCount > 0 && (
                <span className="absolute right-3 top-2 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            
            <Link 
              to="/profile" 
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : 'space-x-3'} ${
                location.pathname === '/profile' 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {!isCollapsed && <span className="font-medium">Profile</span>}
            </Link>
            
            <Link 
              to="/admin" 
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : 'space-x-3'} ${
                location.pathname === '/admin' 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2l8 4v6c0 5-3.58 9.74-8 11-4.42-1.26-8-6-8-11V6l8-4z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {!isCollapsed && <span className="font-medium">Admin</span>}
            </Link>

            <Link 
              to="/settings" 
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : 'space-x-3'} ${
                location.pathname === '/settings' 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {!isCollapsed && <span className="font-medium">Settings</span>}
            </Link>
          </div>
        </div>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                {authUser.avatar ? (
                  <img 
                    src={authUser.avatar} 
                    alt={authUser.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center ${authUser.avatar ? 'hidden' : 'flex'}`}>
                  <span className="text-white font-bold text-sm">{authUser.username.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{authUser.username}</p>
                <p className="text-xs text-gray-500 truncate">{authUser.email}</p>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                {authUser.avatar ? (
                  <img 
                    src={authUser.avatar} 
                    alt={authUser.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center ${authUser.avatar ? 'hidden' : 'flex'}`}>
                  <span className="text-white font-bold text-sm">{authUser.username.charAt(0).toUpperCase()}</span>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`w-full bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'justify-center space-x-2'}`}
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isCollapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        user={authUser}
        onPostCreated={() => {
          // Optionally refresh posts or show success message
          // If on home page, could trigger a refresh
        }}
      />
    </nav>
  );
};

export default Navbar;