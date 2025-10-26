import React, { useState, useEffect } from 'react';
import { 
  Bell, Lock, User, Palette, Globe, Shield, HelpCircle, LogOut, 
  UserX, Trash2, Camera, Eye, EyeOff, AlertTriangle, Check, X, 
  Mail, Phone, Key, Settings 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

const SettingPage = () => {
  const { authUser, logout, updateProfile } = useAuthStore();
  
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

  // Help/Info Dialog State
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : {
      email: true,
      push: true,
      messages: true,
      likes: false,
      comments: true,
      follows: true,
    };
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
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      language: 'en',
    };
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('privacySettings', JSON.stringify(privacy));
  }, [privacy]);

  useEffect(() => {
    localStorage.setItem('appPreferences', JSON.stringify(preferences));
  }, [preferences]);

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
      // In a real app, this would verify the code with backend
      // For now, we'll just enable it locally
      setTwoFactorEnabled(true);
      localStorage.setItem('twoFactorEnabled', 'true');
      toast.success('Two-factor authentication enabled!');
      setTwoFactorOpen(false);
      setVerificationCode('');
    } catch (error) {
      toast.error('Failed to enable 2FA');
    }
  };

  const handleDisable2FA = async () => {
    try {
      setTwoFactorEnabled(false);
      localStorage.removeItem('twoFactorEnabled');
      toast.success('Two-factor authentication disabled!');
      setTwoFactorOpen(false);
    } catch (error) {
      toast.error('Failed to disable 2FA');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      // In a real app, this would call the backend
      setBlockedUsers(prev => prev.filter(user => user._id !== userId));
      toast.success('User unblocked successfully!');
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm!');
      return;
    }
    
    try {
      // In a real app, this would delete the account from backend
      // For now, we'll just logout
      toast.success('Account deletion initiated. Logging out...');
      setTimeout(() => {
        logout();
      }, 1000);
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setDeleteAccountOpen(false);
      setDeleteConfirmText('');
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

  const handleThemeChange = (value) => {
    setPreferences(prev => ({ ...prev, theme: value }));
    toast.success(`Theme changed to ${value}`);
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
      toast.error('Failed to update email visibility');
      console.error('Error updating showEmail:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences.</p>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Account</h2>
            </div>
            <p className="text-sm text-gray-600">Manage your account information and security</p>
          </div>
          
          {/* Google Account Notice */}
          {authUser?.isGoogleUser && (
            <div className="mx-6 mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Google Account</p>
                  <p className="text-xs text-blue-700 mt-1">
                    You're signed in with Google. Password management is handled by your Google account.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-6 space-y-3">
            <button
              onClick={() => setEditProfileOpen(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-gray-900">Edit Profile</span>
            </button>

            {/* Only show Change Password for non-Google users */}
            {!authUser?.isGoogleUser && (
              <button
                onClick={() => setChangePasswordOpen(true)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Lock className="h-4 w-4 text-gray-600" />
                <span className="text-gray-900">Change Password</span>
              </button>
            )}

            <button
              onClick={() => setTwoFactorOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-600" />
                <span className="text-gray-900">Two-Factor Authentication</span>
              </div>
              {twoFactorEnabled && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                  Enabled
                </span>
              )}
            </button>

            <div className="border-t border-gray-200 my-4"></div>

            <button
              onClick={() => setBlockedUsersOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-gray-600" />
                <span className="text-gray-900">Blocked Users</span>
              </div>
              {blockedUsers.length > 0 && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                  {blockedUsers.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            </div>
            <p className="text-sm text-gray-600">Choose how you want to be notified</p>
          </div>
          <div className="p-6 space-y-4">
            {Object.entries({
              email: { label: 'Email Notifications', desc: 'Receive notifications via email' },
              push: { label: 'Push Notifications', desc: 'Receive push notifications' },
              messages: { label: 'New Messages', desc: null },
              likes: { label: 'Likes', desc: null },
              comments: { label: 'Comments', desc: null },
              follows: { label: 'New Followers', desc: null },
            }).map(([key, { label, desc }], index) => (
              <React.Fragment key={key}>
                {index === 2 && <div className="border-t border-gray-200 my-4"></div>}
                <div className="flex items-center justify-between">
                  {desc ? (
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium text-gray-900">{label}</label>
                      <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                  ) : (
                    <label className="text-sm font-medium text-gray-900">{label}</label>
                  )}
                  <button
                    onClick={() => {
                      setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
                      toast.success(`${label} ${!notifications[key] ? 'enabled' : 'disabled'}`);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications[key] ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications[key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Privacy & Security</h2>
            </div>
            <p className="text-sm text-gray-600">Control who can see your content</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Profile Visibility</label>
              <select
                value={privacy.profileVisibility}
                onChange={(e) => {
                  setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value }));
                  toast.success(`Profile visibility set to ${e.target.value}`);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="public">Public - Anyone can see your profile</option>
                <option value="friends">Friends Only - Only followers</option>
                <option value="private">Private - Approved followers only</option>
              </select>
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            {['messageRequests', 'showActivity', 'showEmail'].map(key => {
              const labels = {
                messageRequests: { label: 'Allow Message Requests', desc: 'Receive messages from non-followers' },
                showActivity: { label: 'Show Activity Status', desc: 'Let others see when you\'re online' },
                showEmail: { label: 'Show Email on Profile', desc: 'Display your email publicly' },
              };
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium text-gray-900">{labels[key].label}</label>
                    <p className="text-sm text-gray-600">{labels[key].desc}</p>
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
                      privacy[key] ? 'bg-blue-600' : 'bg-gray-200'
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
            </div>
            <p className="text-sm text-gray-600">Customize your app experience</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">☀️ Light</option>
                <option value="dark">🌙 Dark</option>
                <option value="system">💻 System</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => {
                  setPreferences(prev => ({ ...prev, language: e.target.value }));
                  toast.success('Language updated');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Support & Information</h2>
            </div>
            <p className="text-sm text-gray-600">Get help and policies</p>
          </div>
          <div className="p-6 space-y-3">
            {[
              { icon: HelpCircle, label: 'Help Center', onClick: () => setHelpDialogOpen(true) },
              { icon: Globe, label: 'Terms of Service', onClick: () => setTermsDialogOpen(true) },
              { icon: Shield, label: 'Privacy Policy', onClick: () => setPrivacyDialogOpen(true) },
            ].map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="w-full flex items-center gap-2 px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Icon className="h-4 w-4 text-gray-600" />
                <span className="text-gray-900">{label}</span>
              </button>
            ))}

            <div className="border-t border-gray-200 my-4"></div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">App Version</span>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow-sm border border-red-200">
          <div className="p-6 border-b border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
            </div>
            <p className="text-sm text-gray-600">Irreversible actions</p>
          </div>
          <div className="p-6 space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-3 text-left border border-red-300 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>

            <button
              onClick={() => setDeleteAccountOpen(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-left bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Edit Profile</h3>
              <p className="text-sm text-gray-600 mt-1">Update your information</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src={profileAvatar || '/avatar-placeholder.png'}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700">
                    <Camera className="h-4 w-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button onClick={() => setEditProfileOpen(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveProfile} disabled={isUpdatingProfile} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {isUpdatingProfile ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changePasswordOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Change Password</h3>
                <button onClick={() => setChangePasswordOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Update your account password</p>
            </div>
            <div className="p-6 space-y-4">
              {['current', 'new', 'confirm'].map((type) => (
                <div key={type}>
                  <label className="block text-sm font-medium mb-1">
                    {type === 'current' ? 'Current' : type === 'new' ? 'New' : 'Confirm'} Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords[type] ? 'text' : 'password'}
                      value={passwordData[`${type}Password`]}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, [`${type}Password`]: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPasswords(prev => ({ ...prev, [type]: !prev[type] }))}
                    >
                      {showPasswords[type] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  • Password must be at least 10 characters<br />
                  • Use a mix of letters, numbers, and symbols
                </p>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button 
                onClick={() => setChangePasswordOpen(false)} 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleChangePassword} 
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Two-Factor Authentication</h3>
                <button onClick={() => setTwoFactorOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {twoFactorEnabled ? 'Disable 2FA' : 'Secure your account with 2FA'}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {!twoFactorEnabled ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Enhanced Security</p>
                        <p className="text-xs text-blue-700 mt-1">
                          2FA adds an extra layer of security by requiring a verification code in addition to your password.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Enter 6-digit verification code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-3 py-2 border rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Scan the QR code with your authenticator app
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      <p className="text-xs text-gray-500 text-center px-4">QR Code<br />Placeholder</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Disable 2FA</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Disabling 2FA will reduce your account security. Are you sure?
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex gap-3">
              <button 
                onClick={() => setTwoFactorOpen(false)} 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              {!twoFactorEnabled ? (
                <button 
                  onClick={handleEnable2FA} 
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Enable 2FA
                </button>
              ) : (
                <button 
                  onClick={handleDisable2FA} 
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Blocked Users</h3>
                <button onClick={() => setBlockedUsersOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {blockedUsers.length} user{blockedUsers.length !== 1 ? 's' : ''} blocked
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {blockedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UserX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No blocked users</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Users you block will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map(user => (
                    <div key={user._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.avatar || '/avatar-placeholder.png'} 
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblockUser(user._id)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t">
              <button 
                onClick={() => setBlockedUsersOpen(false)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Help Center</h3>
                <button onClick={() => setHelpDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Getting Started</h4>
                <p className="text-sm text-gray-600">
                  Welcome to NETSPHERE! Create posts, connect with friends, and share your moments.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Account Security</h4>
                <p className="text-sm text-gray-600">
                  Enable two-factor authentication and use a strong password to keep your account secure.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Contact Support</h4>
                <p className="text-sm text-gray-600">
                  Email: support@netsphere.com<br />
                  Response time: 24-48 hours
                </p>
              </div>
            </div>
            <div className="p-6 border-t">
              <button 
                onClick={() => setHelpDialogOpen(false)} 
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Terms of Service</h3>
                <button onClick={() => setTermsDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h4>
                <p className="text-sm text-gray-600">
                  By accessing and using NETSPHERE, you accept and agree to be bound by these Terms of Service.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">2. User Conduct</h4>
                <p className="text-sm text-gray-600">
                  You agree not to post content that is illegal, harmful, threatening, abusive, or violates the rights of others.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">3. Content Rights</h4>
                <p className="text-sm text-gray-600">
                  You retain all rights to content you post. By posting, you grant us a license to use, display, and distribute your content.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">4. Account Termination</h4>
                <p className="text-sm text-gray-600">
                  We reserve the right to terminate accounts that violate these terms or engage in harmful behavior.
                </p>
              </div>
            </div>
            <div className="p-6 border-t">
              <button 
                onClick={() => setTermsDialogOpen(false)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Privacy Policy</h3>
                <button onClick={() => setPrivacyDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Information We Collect</h4>
                <p className="text-sm text-gray-600">
                  We collect information you provide directly, such as your name, email, profile information, and content you post.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">How We Use Your Information</h4>
                <p className="text-sm text-gray-600">
                  We use your information to provide, maintain, and improve our services, and to communicate with you.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Data Security</h4>
                <p className="text-sm text-gray-600">
                  We implement security measures to protect your personal information from unauthorized access and misuse.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Your Rights</h4>
                <p className="text-sm text-gray-600">
                  You have the right to access, update, or delete your personal information at any time.
                </p>
              </div>
            </div>
            <div className="p-6 border-t">
              <button 
                onClick={() => setPrivacyDialogOpen(false)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Account
                </h3>
                <button onClick={() => setDeleteAccountOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-900 mb-1">Warning: This action is permanent</p>
                    <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                      <li>All your posts will be deleted</li>
                      <li>Your messages will be removed</li>
                      <li>Your profile will be permanently deleted</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Type <span className="font-mono bg-red-100 text-red-600 px-2 py-0.5 rounded">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button 
                onClick={() => {
                  setDeleteAccountOpen(false);
                  setDeleteConfirmText('');
                }} 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount} 
                disabled={deleteConfirmText !== 'DELETE'} 
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingPage;
