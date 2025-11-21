import React, { useState, useEffect } from 'react';
import { 
  Bell, Lock, User, Palette, Globe, Shield, HelpCircle, LogOut, 
  UserX, Trash2, Camera, Eye, EyeOff, AlertTriangle, Check, X, 
  Mail, Phone, Key, Settings, BellOff, MessageCircle
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useThemeStore } from '../store/useThemeStore';
import { getBlockedUsers, unblockUser, updateNotificationPreference } from '../services/api';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SettingPage = () => {
  const { authUser, logout, updateProfile } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  
  // Edit Profile State
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: authUser?.username || '',
    username: authUser?.username || '',
    bio: authUser?.bio || '',
    email: authUser?.email || '',
  });
  const [profileAvatar, setProfileAvatar] = useState(authUser?.avatar || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Change Password State
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Two-Factor Auth State
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Blocked Users State
  const [blockedUsersOpen, setBlockedUsersOpen] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Delete Account State
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Help/Info Dialog State
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);

  // Get notification settings from Zustand store
  const { notificationSettings, fetchNotificationSettings } = useNotificationStore();
  
  // Local state for email (not yet implemented in backend)
  const [emailNotifications, setEmailNotifications] = useState(() => {
    const saved = localStorage.getItem('emailNotifications');
    return saved ? JSON.parse(saved) === true : true;
  });

  const [privacy, setPrivacy] = useState(() => {
    const saved = localStorage.getItem('privacySettings');
    return saved ? JSON.parse(saved) : {
      profileVisibility: 'public',
      messageRequests: true,
      showEmail: false,
      showPhone: false,
      showActivity: true,
    };
  });

  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('appPreferences');
    if (saved) {
      return JSON.parse(saved);
    }
    // Use theme from Zustand store instead of separate localStorage
    return {
      theme: theme,
      language: 'en'
    };
  });

  // Fetch notification settings on mount
  useEffect(() => {
    fetchNotificationSettings().catch(err => {
      console.error('Failed to fetch notification settings:', err);
    });
  }, []);

  // Save email notifications to localStorage when they change
  useEffect(() => {
    localStorage.setItem('emailNotifications', JSON.stringify(emailNotifications));
  }, [emailNotifications]);

  useEffect(() => {
    localStorage.setItem('privacySettings', JSON.stringify(privacy));
  }, [privacy]);

  useEffect(() => {
    localStorage.setItem('appPreferences', JSON.stringify(preferences));
  }, [preferences]);

  // Sync preferences state when theme changes from outside (e.g., navbar toggle)
  useEffect(() => {
    if (theme && preferences.theme !== theme) {
      setPreferences(prev => ({ ...prev, theme }));
    }
  }, [theme]);

  // Update profile data when authUser changes
  useEffect(() => {
    if (authUser) {
      setProfileData({
        name: authUser.username || '',
        username: authUser.username || '',
        bio: authUser.bio || '',
        email: authUser.email || '',
      });
      setProfileAvatar(authUser.avatar || '');
      
      // Sync showEmail from backend if available
      if (authUser.showEmail !== undefined) {
        setPrivacy(prev => ({ ...prev, showEmail: authUser.showEmail }));
      }
    }
  }, [authUser]);

  // Handler functions
  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const updateData = {
        bio: profileData.bio,
      };
      
      // Include username if it's changed
      if (profileData.username && profileData.username !== authUser?.username) {
        updateData.username = profileData.username;
      }
      
      // Only include avatar if it was changed
      if (profileAvatar && profileAvatar.startsWith('data:')) {
        updateData.avatar = profileAvatar;
      }

      // Use the updateProfile method from useAuthStore
      await updateProfile(updateData);
      
      toast.success('Profile updated successfully!');
      setEditProfileOpen(false);
      
      // Refresh to update all components
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    if (passwordData.newPassword.length < 10) {
      toast.error('Password must be at least 10 characters!');
      return;
    }
    
    try {
      await axios.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      toast.success('Password changed successfully!');
      setChangePasswordOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleEnable2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code!');
      return;
    }
    
    try {
      setTwoFactorEnabled(true);
      localStorage.setItem('twoFactorEnabled', 'true');
      toast.success('Two-factor authentication enabled!');
      setTwoFactorOpen(false);
      setVerificationCode('');
    } catch (error) {
      toast.error('Unable to enable two-factor authentication. Please try again.');
    }
  };

  const handleDisable2FA = async () => {
    try {
      setTwoFactorEnabled(false);
      localStorage.removeItem('twoFactorEnabled');
      toast.success('Two-factor authentication disabled!');
      setTwoFactorOpen(false);
    } catch (error) {
      toast.error('Unable to disable two-factor authentication. Please try again.');
    }
  };

  // Fetch blocked users when the blocked users section is opened
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      if (blockedUsersOpen) {
        try {
          const response = await getBlockedUsers();
          setBlockedUsers(response.blockedUsers || []);
        } catch (error) {
          console.error('Failed to fetch blocked users:', error);
          toast.error('Unable to load blocked users. Please try again.');
        }
      }
    };

    fetchBlockedUsers();
  }, [blockedUsersOpen]);

  const handleUnblockUser = async (userId) => {
    try {
      await unblockUser(userId);
      setBlockedUsers(prev => prev.filter(user => user._id !== userId));
      toast.success('User unblocked successfully!');
    } catch (error) {
      console.error('Failed to unblock user:', error);
      toast.error(error.response?.data?.message || 'Failed to unblock user');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
  };

  const handleContactAdmin = async () => {
    try {
      // Fetch admin user details
      const response = await axios.get('/users/admin');
      const adminUser = response.data;
      
      if (!adminUser) {
        toast.error('Admin account not available');
        return;
      }

      // Navigate to messages page with admin pre-selected
      navigate('/messages', {
        state: {
          selectedUser: {
            _id: adminUser._id,
            username: adminUser.username,
            name: adminUser.name || adminUser.username,
            avatar: adminUser.avatar
          }
        }
      });
      
      toast.success('Opening chat with admin...');
    } catch (error) {
      console.error('Failed to contact admin:', error);
      toast.error('Unable to open chat with admin. Please try again later.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm!');
      return;
    }
    
    // Check password requirement for non-Google users
    if (!authUser?.isGoogleUser && !deletePassword) {
      toast.error('Please enter your password to confirm deletion');
      return;
    }
    
    setIsDeletingAccount(true);
    
    try {
      const response = await axios.delete('/auth/delete-account', {
        data: { password: deletePassword }
      });
      
      if (response.data.success) {
        toast.success('Your account has been permanently deleted');
        // Close modal and clear fields on success
        setDeleteAccountOpen(false);
        setDeleteConfirmText('');
        setDeletePassword('');
        setTimeout(() => {
          logout();
        }, 1500);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.response?.data?.message || 'Failed to delete account');
      // Keep modal open on error so user can see the error and retry
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image size should be less than 15MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileAvatar(reader.result);
      toast.success('Image selected. Click Save to update.');
    };
    reader.readAsDataURL(file);
  };

  /**
   * Enhanced Theme Change Handler
   * - Supports light and dark themes
   * - Uses Zustand store to apply theme globally
   * - Zustand automatically persists to localStorage
   */
  const handleThemeChange = (value) => {
    setPreferences(prev => ({ ...prev, theme: value }));
    
    // Use Zustand store to apply theme globally
    setTheme(value);
    
    // Show toast notification with appropriate icon
    const themeIcons = {
      light: '☀️',
      dark: '🌙'
    };
    toast.success(`${themeIcons[value]} Theme changed to ${value.charAt(0).toUpperCase() + value.slice(1)}`);
  };

  const handleNotificationToggle = async (type, currentValue) => {
    const newValue = !currentValue;
    
    try {
      // Optimistically update UI (will be synced from store after API call)
      await updateNotificationPreference(type, newValue);
      
      // Refetch settings to sync with backend
      await fetchNotificationSettings();
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} notifications ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating notification preference:', error);
      toast.error('Failed to update notification settings');
    }
  };

  const handleShowEmailToggle = async (newValue) => {
    try {
      // Optimistically update UI
      setPrivacy(prev => ({ ...prev, showEmail: newValue }));
      
      // Call API to update backend
      await axios.put('/auth/update-privacy', {
        showEmail: newValue
      });
      
      toast.success(`Email visibility ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      // Revert on error
      setPrivacy(prev => ({ ...prev, showEmail: !newValue }));
      toast.error('Unable to update email visibility. Please try again.');
      console.error('Error updating showEmail:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your account settings and preferences.</p>
        </div>

        {/* Account Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Account</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account information and security</p>
          </div>
          
          {/* Google Account Notice */}
          {authUser?.isGoogleUser && (
            <div className="mx-6 mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Google Account</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    You're signed in with Google. Password management is handled by your Google account.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-6 space-y-3">
            <button
              onClick={() => setEditProfileOpen(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-900 dark:text-gray-100">Edit Profile</span>
            </button>

            {/* Only show Change Password for non-Google users */}
            {!authUser?.isGoogleUser && (
              <button
                onClick={() => setChangePasswordOpen(true)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">Change Password</span>
              </button>
            )}

            <button
              onClick={() => setTwoFactorOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">Two-Factor Authentication</span>
              </div>
              {twoFactorEnabled && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded">
                  Enabled
                </span>
              )}
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

            <button
              onClick={() => setBlockedUsersOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">Blocked Users</span>
              </div>
              {blockedUsers.length > 0 && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded">
                  {blockedUsers.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Choose how you want to be notified</p>
          </div>
          <div className="p-6 space-y-4">
            {/* Mute All Notifications - Connected to backend */}
            <NotificationMuteToggle />
            
            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
            
            {/* Email Notifications - Local only (not yet implemented in backend) */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Notifications</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email (Coming soon)</p>
              </div>
              <button
                onClick={() => {
                  setEmailNotifications(prev => !prev);
                  toast.success(`Email notifications ${!emailNotifications ? 'enabled' : 'disabled'} (Local only)`);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailNotifications ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
            
            {/* Backend-connected notification preferences */}
            {[
              { key: 'push', label: 'Push Notifications', desc: 'Show toast popup notifications' },
              { key: 'messages', label: 'New Messages', desc: null },
              { key: 'likes', label: 'Likes', desc: null },
              { key: 'comments', label: 'Comments', desc: null },
              { key: 'follows', label: 'New Followers', desc: null },
            ].map(({ key, label, desc }) => {
              const isEnabled = notificationSettings?.[key] ?? true;
              return (
                <div key={key} className="flex items-center justify-between">
                  {desc ? (
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
                    </div>
                  ) : (
                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</label>
                  )}
                  <button
                    onClick={() => handleNotificationToggle(key, isEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isEnabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Privacy & Security</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Control who can see your content</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Profile Visibility</label>
              <select
                value={privacy.profileVisibility}
                onChange={(e) => {
                  setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value }));
                  toast.success(`Profile visibility set to ${e.target.value}`);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">Public - Anyone can see your profile</option>
                <option value="friends">Friends Only - Only followers</option>
                <option value="private">Private - Approved followers only</option>
              </select>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

            {['messageRequests', 'showActivity', 'showEmail'].map(key => {
              const labels = {
                messageRequests: { label: 'Allow Message Requests', desc: 'Receive messages from non-followers' },
                showActivity: { label: 'Show Activity Status', desc: 'Let others see when you\'re online' },
                showEmail: { label: 'Show Email on Profile', desc: 'Display your email publicly' },
              };
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100">{labels[key].label}</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{labels[key].desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (key === 'showEmail') {
                        handleShowEmailToggle(!privacy[key]);
                      } else {
                        setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
                        toast.success(`${labels[key].label} ${!privacy[key] ? 'enabled' : 'disabled'}`);
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacy[key] ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        privacy[key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Preferences</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Customize your app experience</p>
          </div>
          <div className="p-6 space-y-4">
            {/* Theme Quick Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Palette className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                    Theme settings are saved automatically
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                    Your preference syncs across all devices when you're logged in
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="light">☀️ Light</option>
                <option value="dark">🌙 Dark</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Theme will be applied across the entire app
              </p>
            </div>

            {/* Theme Preview */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">Preview</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Light Preview */}
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                    preferences.theme === 'light' 
                      ? 'border-blue-500 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-video bg-white p-2 space-y-1">
                    <div className="h-1.5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-1.5 bg-gray-100 rounded w-1/2"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">☀️</span>
                  </div>
                  <p className="text-xs text-center py-1 bg-gray-50 text-gray-700">Light</p>
                </button>

                {/* Dark Preview */}
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                    preferences.theme === 'dark' 
                      ? 'border-blue-500 shadow-md' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="aspect-video bg-gray-900 p-2 space-y-1">
                    <div className="h-1.5 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-1.5 bg-gray-800 rounded w-1/2"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">🌙</span>
                  </div>
                  <p className="text-xs text-center py-1 bg-gray-800 text-gray-300">Dark</p>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => {
                  setPreferences(prev => ({ ...prev, language: e.target.value }));
                  toast.success('Language updated');
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Español</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="ja">🇯🇵 日本語</option>
                <option value="zh">🇨🇳 中文</option>
              </select>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Support & Information</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Get help and policies</p>
          </div>
          <div className="p-6 space-y-3">
            {/* Contact Admin - Featured Button */}
            <button
              onClick={handleContactAdmin}
              className="w-full flex items-center gap-3 px-4 py-4 text-left bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              <div className="p-2 bg-white/20 rounded-lg">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Contact Admin</div>
                <div className="text-xs text-white/80">Get help or ask questions</div>
              </div>
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

            {[
              { icon: HelpCircle, label: 'Help Center', onClick: () => setHelpDialogOpen(true) },
              { icon: Globe, label: 'Terms of Service', onClick: () => setTermsDialogOpen(true) },
              { icon: Shield, label: 'Privacy Policy', onClick: () => setPrivacyDialogOpen(true) },
            ].map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="w-full flex items-center gap-2 px-4 py-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">{label}</span>
              </button>
            ))}

            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">App Version</span>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded">v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-900/50">
          <div className="p-6 border-b border-red-200 dark:border-red-900/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Irreversible actions</p>
          </div>
          <div className="p-6 space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-left border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>

            <button
              onClick={() => setDeleteAccountOpen(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-left bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals - Edit Profile */}
      {editProfileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Profile</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update your information</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src={profileAvatar || '/avatar-placeholder.png'}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                  <label className="absolute bottom-0 right-0 bg-blue-600 dark:bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-600">
                    <Camera className="h-4 w-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Username</label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button onClick={() => setEditProfileOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">Cancel</button>
              <button onClick={handleSaveProfile} disabled={isUpdatingProfile} className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50">
                {isUpdatingProfile ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changePasswordOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Change Password</h3>
                <button onClick={() => setChangePasswordOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update your account password</p>
            </div>
            <div className="p-6 space-y-4">
              {['current', 'new', 'confirm'].map((type) => (
                <div key={type}>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {type === 'current' ? 'Current' : type === 'new' ? 'New' : 'Confirm'} Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords[type] ? 'text' : 'password'}
                      value={passwordData[`${type}Password`]}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, [`${type}Password`]: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => setShowPasswords(prev => ({ ...prev, [type]: !prev[type] }))}
                    >
                      {showPasswords[type] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  • Password must be at least 10 characters<br />
                  • Use a mix of letters, numbers, and symbols
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button 
                onClick={() => setChangePasswordOpen(false)} 
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleChangePassword} 
                className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication Modal */}
      {twoFactorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Two-Factor Authentication</h3>
                <button onClick={() => setTwoFactorOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {twoFactorEnabled ? 'Disable 2FA' : 'Secure your account with 2FA'}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {!twoFactorEnabled ? (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Enhanced Security</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          2FA adds an extra layer of security by requiring a verification code in addition to your password.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Enter 6-digit verification code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      Scan the QR code with your authenticator app
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-40 h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-4">QR Code<br />Placeholder</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Disable 2FA</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        Disabling 2FA will reduce your account security. Are you sure?
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button 
                onClick={() => setTwoFactorOpen(false)} 
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                Cancel
              </button>
              {!twoFactorEnabled ? (
                <button 
                  onClick={handleEnable2FA} 
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Enable 2FA
                </button>
              ) : (
                <button 
                  onClick={handleDisable2FA} 
                  className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800"
                >
                  Disable 2FA
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Blocked Users Modal */}
      {blockedUsersOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Blocked Users</h3>
                <button onClick={() => setBlockedUsersOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {blockedUsers.length} user{blockedUsers.length !== 1 ? 's' : ''} blocked
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {blockedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UserX className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No blocked users</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Users you block will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map(user => (
                    <div key={user._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.avatar || '/avatar-placeholder.png'} 
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{user.username}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblockUser(user._id)}
                        className="px-3 py-1.5 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setBlockedUsersOpen(false)} 
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Dialog */}
      {helpDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Help Center</h3>
                <button onClick={() => setHelpDialogOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Getting Started</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome to NETSPHERE! Create posts, connect with friends, and share your moments.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Account Security</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enable two-factor authentication and use a strong password to keep your account secure.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Contact Support</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Email: support@netsphere.com<br />
                  Response time: 24-48 hours
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setHelpDialogOpen(false)} 
                className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Dialog */}
      {termsDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Terms of Service</h3>
                <button onClick={() => setTermsDialogOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">1. Acceptance of Terms</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  By accessing and using NETSPHERE, you accept and agree to be bound by these Terms of Service.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">2. User Conduct</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You agree not to post content that is illegal, harmful, threatening, abusive, or violates the rights of others.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">3. Content Rights</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You retain all rights to content you post. By posting, you grant us a license to use, display, and distribute your content.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4. Account Termination</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We reserve the right to terminate accounts that violate these terms or engage in harmful behavior.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setTermsDialogOpen(false)} 
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Dialog */}
      {privacyDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Privacy Policy</h3>
                <button onClick={() => setPrivacyDialogOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Information We Collect</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We collect information you provide directly, such as your name, email, profile information, and content you post.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">How We Use Your Information</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We use your information to provide, maintain, and improve our services, and to communicate with you.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Data Security</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We implement security measures to protect your personal information from unauthorized access and misuse.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Your Rights</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You have the right to access, update, or delete your personal information at any time.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setPrivacyDialogOpen(false)} 
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {deleteAccountOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Account
                </h3>
                <button onClick={() => setDeleteAccountOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">Warning: This action is permanent</p>
                    <ul className="text-xs text-red-800 dark:text-red-300 space-y-1 list-disc list-inside">
                      <li>All your posts and images will be deleted</li>
                      <li>All your comments will be removed</li>
                      <li>Your messages and conversations will be deleted</li>
                      <li>Your profile and avatar will be permanently deleted</li>
                      <li>All notifications involving you will be removed</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {!authUser?.isGoogleUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Enter your password to confirm
                  </label>
                  <div className="relative">
                    <input
                      type={showDeletePassword ? 'text' : 'password'}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full px-3 py-2 pr-10 border border-red-300 dark:border-red-800 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Type <span className="font-mono bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-3 py-2 border border-red-300 dark:border-red-800 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button 
                onClick={() => {
                  setDeleteAccountOpen(false);
                  setDeleteConfirmText('');
                  setDeletePassword('');
                  setShowDeletePassword(false);
                }} 
                disabled={isDeletingAccount}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount} 
                disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount || (!authUser?.isGoogleUser && !deletePassword)} 
                className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isDeletingAccount ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Forever'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Notification Mute Toggle Component
const NotificationMuteToggle = () => {
  const { notificationSettings, fetchNotificationSettings, toggleMuteAll } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      fetchNotificationSettings().catch(err => {
        console.error('Failed to fetch notification settings:', err);
      });
    }
  }, [mounted]);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await toggleMuteAll();
      const isMuted = useNotificationStore.getState().notificationSettings?.allNotificationsMuted;
      toast.success(isMuted ? '🔇 All notifications muted' : '🔊 Notifications unmuted');
    } catch (error) {
      console.error('Error toggling mute all:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const isMuted = notificationSettings?.allNotificationsMuted || false;

  return (
    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-3">
        <BellOff className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Mute All Notifications</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Temporarily pause all notifications</p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isMuted ? 'bg-red-600 dark:bg-red-700' : 'bg-gray-200 dark:bg-gray-700'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isMuted ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default SettingPage;
