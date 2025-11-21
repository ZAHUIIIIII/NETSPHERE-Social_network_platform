// client/src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useChatStore } from '../store/useChatStore';
import CreatePostModal from './CreatePostModal';
import ThemeToggle from './common/ThemeToggle';
import { X } from 'lucide-react';

const Navbar = ({ isCollapsed, setIsCollapsed, hideBottomNav = false, hideTopBar = false }) => {
  const { authUser, logout } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const { users, getUsers, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Calculate unread message count from users with unread messages
  const unreadMessageCount = users.filter(user => user.unreadCount > 0).length;

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  // Fetch initial data and subscribe to messages when component mounts
  useEffect(() => {
    if (authUser) {
      fetchNotifications(false);
      getUsers(); // Fetch users list for message count
      subscribeToMessages(); // Subscribe to real-time message updates
      
      return () => {
        unsubscribeFromMessages(); // Cleanup on unmount
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]); // Only run when authUser changes, not when functions change

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

  // Mobile Bottom Navigation
  if (isMobile) {
    return (
      <>
        {/* Mobile Top Bar - Hidden when hideTopBar is true */}
        {!hideTopBar && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-50 flex items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-lg text-blue-600 dark:text-blue-400">NETSPHERE</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        )}

        {/* Mobile Bottom Navigation - Hidden when hideBottomNav is true */}
        {!hideBottomNav && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
          <div className="flex items-center justify-around h-full px-2">
            <Link 
              to="/" 
              className={`flex flex-col items-center justify-center flex-1 py-2 ${
                location.pathname === '/' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs mt-1">Home</span>
            </Link>
            
            <Link 
              to="/search" 
              className={`flex flex-col items-center justify-center flex-1 py-2 ${
                location.pathname === '/search' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs mt-1">Search</span>
            </Link>
            
            <button
              onClick={() => setShowCreatePost(true)}
              className="flex flex-col items-center justify-center flex-1 py-2 text-blue-600 dark:text-blue-400"
            >
              <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center -mt-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-xs mt-1">Post</span>
            </button>
            
            <Link 
              to="/messages" 
              className={`flex flex-col items-center justify-center flex-1 py-2 relative ${
                location.pathname === '/messages' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <div className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">Messages</span>
            </Link>
            
            <Link 
              to="/notifications" 
              className={`flex flex-col items-center justify-center flex-1 py-2 relative ${
                location.pathname === '/notifications' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <div className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">Alerts</span>
            </Link>
          </div>
        </div>
        )}

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMobileMenu(false)}>
            <div 
              className="fixed right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="font-bold text-lg text-blue-600 dark:text-blue-400">Menu</span>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>

                {/* User Profile */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden relative">
                      {authUser.avatar ? (
                        <img 
                          src={authUser.avatar} 
                          alt={authUser.username}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement.querySelector('.avatar-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`avatar-fallback w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center absolute inset-0`} style={{ display: authUser.avatar ? 'none' : 'flex' }}>
                        <span className="text-white font-bold text-lg">{authUser.username.charAt(0).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{authUser.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{authUser.email}</p>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 px-3 py-4 space-y-1">
                  <Link 
                    to="/profile" 
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === '/profile' 
                        ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Profile</span>
                  </Link>
                  
                  <Link 
                    to="/settings" 
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === '/settings' 
                        ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">Settings</span>
                  </Link>

                  {authUser?.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        location.pathname === '/admin' 
                          ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2l8 4v6c0 5-3.58 9.74-8 11-4.42-1.26-8-6-8-11V6l8-4z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="font-medium">Admin</span>
                    </Link>
                  )}
                </div>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 dark:bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          user={authUser}
          onPostCreated={() => {}}
        />
      </>
    );
  }

  // Desktop Sidebar Navigation
  return (
    <nav className={`fixed left-0 top-0 h-full ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg z-50 transition-all duration-300`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {isCollapsed ? (
              <div className="flex flex-col items-center space-y-2 w-full">
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="flex items-center justify-center w-full p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <ThemeToggle />
              </div>
            ) : (
              <>
                <Link to="/" className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">N</span>
                  </div>
                  <span className="font-bold text-lg text-blue-600 dark:text-blue-400">NETSPHERE</span>
                </Link>
                <div className="flex items-center space-x-2">
                  <ThemeToggle />
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Create Post Button */}
        <div className="p-3">
          <button 
            onClick={() => setShowCreatePost(true)}
            className={`w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-3 rounded-lg transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
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
                  ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
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
                  ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
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
                  ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
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
                  ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
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
                  ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {!isCollapsed && <span className="font-medium">Profile</span>}
            </Link>
            
            <Link 
              to="/settings" 
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : 'space-x-3'} ${
                location.pathname === '/settings' 
                  ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {!isCollapsed && <span className="font-medium">Settings</span>}
            </Link>

            {/* Only show Admin link for admin users */}
            {authUser?.role === 'admin' && (
              <Link 
                to="/admin" 
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : 'space-x-3'} ${
                  location.pathname === '/admin' 
                    ? 'bg-blue-600 dark:bg-blue-500 text-white' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2l8 4v6c0 5-3.58 9.74-8 11-4.42-1.26-8-6-8-11V6l8-4z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {!isCollapsed && <span className="font-medium">Admin</span>}
              </Link>
            )}
          </div>
        </div>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-full overflow-hidden relative">
                {authUser.avatar ? (
                  <img 
                    src={authUser.avatar} 
                    alt={authUser.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.parentElement.querySelector('.avatar-fallback');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`avatar-fallback w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center absolute inset-0`} style={{ display: authUser.avatar ? 'none' : 'flex' }}>
                  <span className="text-white font-bold text-sm">{authUser.username.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{authUser.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{authUser.email}</p>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 rounded-full overflow-hidden relative">
                {authUser.avatar ? (
                  <img 
                    src={authUser.avatar} 
                    alt={authUser.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.parentElement.querySelector('.avatar-fallback');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`avatar-fallback w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center absolute inset-0`} style={{ display: authUser.avatar ? 'none' : 'flex' }}>
                  <span className="text-white font-bold text-sm">{authUser.username.charAt(0).toUpperCase()}</span>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`w-full bg-red-600 dark:bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors flex items-center ${isCollapsed ? 'justify-center' : 'justify-center space-x-2'}`}
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