import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import SettingPage from './pages/SettingPage';
import SearchPage from './pages/SearchPage';  
import PostDetailPage from './pages/PostDetailPage';

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserProvider } from './UserContext';

import {Loader} from 'lucide-react';
import {Toaster} from 'react-hot-toast';

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  console.log({ onlineUsers });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);



  // Handle Google OAuth success/error
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const loginStatus = urlParams.get('login');
    const error = urlParams.get('error');
    const user = urlParams.get('user');

    if (loginStatus === 'success') {
      const welcomeMessage = user 
        ? `Welcome ${decodeURIComponent(user)}! Successfully signed in with Google.`
        : 'Successfully signed in with Google!';
      toast.success(welcomeMessage);
      // Clear the URL parameters
      window.history.replaceState({}, document.title, location.pathname);
    } else if (error) {
      if (error === 'oauth_error') {
        toast.error('Google sign-in failed. Please try again.');
      } else if (error === 'oauth_failed') {
        toast.error('Authentication failed. Please try again.');
      } else if (error === 'oauth_not_configured') {
        toast.error('Google OAuth is not configured on this server.');
      } else {
        toast.error('An error occurred during sign-in.');
      }
      // Clear the URL parameters
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  console.log({ authUser });

  if (isCheckingAuth && location.pathname !== '/reset-password') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <UserProvider>
      <div className="flex">
        {/* Sidebar - only shows when authenticated */}
        {authUser && <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />}

        {/* Main content */}
        <div className={`flex-1 transition-all duration-300 ${authUser ? (isCollapsed ? 'ml-20' : 'ml-64') : ''}`}>
          <Routes>
            <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" />} />
            <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
            <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
            <Route path='/reset-password' element={<ResetPasswordPage />} />
            <Route path='/messages' element={authUser ? <ChatPage /> : <Navigate to="/login" />} />
            <Route path='/chat' element={authUser ? <ChatPage /> : <Navigate to="/login" />} />
            <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path='/settings' element={authUser ? <SettingPage /> : <Navigate to="/login" />} />
            <Route path='/search' element={authUser ? <SearchPage /> : <Navigate to="/login" />} />
            <Route path='/profile/:username?' element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
            <Route path='/post/:postId' element={authUser ? <PostDetailPage /> : <Navigate to="/login" />} />
          </Routes>
        </div>

        <Toaster />
      </div>
    </UserProvider>
  )
}

export default App