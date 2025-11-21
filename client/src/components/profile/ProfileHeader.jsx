// client/src/components/profile/ProfileHeader.jsx
import React, { useState, useEffect } from 'react';
import { Camera, MoreHorizontal, Edit, MapPin, Link as LinkIcon, Calendar, MessageCircle, UserX, UserCheck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FollowButton from './FollowButton';
import FollowersModal from './FollowersModal';
import { blockUser, unblockUser, checkBlockStatus } from '../../services/api';
import PortalDropdown from '../common/PortalDropdown';
import AdminBadge from '../common/AdminBadge';
import { isAdmin } from '../../lib/isAdmin';

const ProfileHeader = ({ user, isOwnProfile, onEditClick, posts = [], onFollowChange }) => {
  const { updateProfile, isUpdatingProfile } = useAuthStore();
  const navigate = useNavigate();
  const [selectedImg, setSelectedImg] = useState(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Update counts and following status whenever user prop changes
  useEffect(() => {
    if (user) {
      const newFollowersCount = Array.isArray(user.followers) ? user.followers.length : 0;
      const newFollowingCount = Array.isArray(user.following) ? user.following.length : 0;
      const newIsFollowing = user.isFollowing || false;
      
      // Update all states
      setFollowersCount(newFollowersCount);
      setFollowingCount(newFollowingCount);
      setIsFollowing(newIsFollowing);
    }
  }, [user?.username, user?.isFollowing, user?.followers?.length, user?.following?.length]);

  // Check block status when viewing another user's profile
  useEffect(() => {
    const fetchBlockStatus = async () => {
      if (!isOwnProfile && user?._id) {
        try {
          const response = await checkBlockStatus(user._id);
          setIsBlocked(response.isBlocked);
        } catch (error) {
          console.error('Failed to check block status:', error);
        }
      }
    };

    fetchBlockStatus();
  }, [user?._id, isOwnProfile]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image size should be less than 15MB');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      let base64Image = reader.result;
      
      if (base64Image.length > 1000000) {
        base64Image = await compressImage(base64Image, 0.7);
      }
      
      setSelectedImg(base64Image);
      try {
        await updateProfile({ avatar: base64Image });
        toast.success('Profile picture updated!');
      } catch (error) {
        console.error('Failed to upload image:', error);
        toast.error('Failed to upload image');
      }
    };
  };

  const compressImage = (base64, quality = 0.7) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      
      img.src = base64;
    });
  };

      const handleFollowChange = (data) => {
    // Only update if the following status actually changed
    if (isFollowing !== data.isFollowing) {
      setIsFollowing(data.isFollowing);
      
      // Update follower count optimistically
      setFollowersCount(prev => 
        data.isFollowing ? prev + 1 : Math.max(0, prev - 1)
      );
      
      // Propagate to parent
      onFollowChange?.(data);
    }
  };

  const handleMessage = () => {
    navigate('/messages', { 
      state: { 
        selectedUser: {
          _id: user._id,
          username: user.username,
          name: user.name,
          avatar: user.avatar
        }
      } 
    });
  };

  const handleBlock = async () => {
    if (!user?._id) return;
    
    // Prevent blocking admin
    if (isAdmin(user)) {
      toast.error('You cannot block the admin account');
      setShowMoreMenu(false);
      return;
    }
    
    setBlockLoading(true);
    try {
      if (isBlocked) {
        await unblockUser(user._id);
        setIsBlocked(false);
        toast.success(`Unblocked ${user.username}`);
      } else {
        await blockUser(user._id);
        setIsBlocked(true);
        setIsFollowing(false);
        toast.success(`Blocked ${user.username}`);
      }
      setShowMoreMenu(false);
    } catch (error) {
      console.error('Failed to toggle block status:', error);
      toast.error(error.response?.data?.message || 'Failed to update block status');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleFollowersModalClose = () => {
    setShowFollowersModal(false);
  };

  const handleFollowingModalClose = () => {
    setShowFollowingModal(false);
  };

  const handleModalCountChange = ({ type, change }) => {
    // IMPORTANT: Only update counts if viewing own profile
    // When viewing another user's profile, their counts should NOT change
    // when current user follows/unfollows people in their lists
    if (!isOwnProfile) {
      return;
    }
    
    // Update the appropriate count based on the type
    if (type === 'following') {
      setFollowingCount(prev => Math.max(0, prev + change));
    } else if (type === 'followers') {
      setFollowersCount(prev => Math.max(0, prev + change));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Main Profile Info */}
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6">
          {/* Avatar */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36">
              <div className="w-full h-full rounded-full overflow-hidden ring-1 ring-gray-300 dark:ring-gray-600">
                {(selectedImg || user?.avatar) ? (
                  <img
                    src={selectedImg || user.avatar}
                    alt={user.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center"
                  style={{ display: (selectedImg || user?.avatar) ? 'none' : 'flex' }}
                >
                  <span className="text-gray-600 dark:text-gray-300 font-semibold text-2xl sm:text-4xl lg:text-5xl">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              {isOwnProfile && (
                <div className="absolute bottom-0 right-0">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="avatar-upload"
                    onChange={handleImageUpload}
                    disabled={isUpdatingProfile}
                  />
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-full flex items-center justify-center shadow-md transition-all border border-gray-300 dark:border-gray-600 ${
                      isUpdatingProfile ? 'animate-pulse' : ''
                    }`}>
                      <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-gray-700 dark:text-gray-300" />
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0 w-full">
            {/* Name and Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-2 sm:mb-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center sm:text-left">
                  {user?.name || user?.username || 'User'}
                </h1>
                {isAdmin(user) && (
                  <AdminBadge size="md" />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                {isOwnProfile ? (
                  <button
                    onClick={onEditClick}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 lg:px-6 py-1.5 sm:py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors font-semibold text-xs sm:text-sm"
                  >
                    <Edit size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Edit Profile</span>
                    <span className="xs:hidden">Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <FollowButton
                      userId={user?._id}
                      initialIsFollowing={isFollowing}
                      onFollowChange={handleFollowChange}
                    />
                    <button 
                      onClick={handleMessage}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors font-semibold text-xs sm:text-sm"
                    >
                      Message
                    </button>
                    {/* Only show more options (block) if not admin */}
                    {!isAdmin(user) && (
                      <PortalDropdown
                        isOpen={showMoreMenu}
                        onClose={() => setShowMoreMenu(false)}
                        width="w-48"
                        trigger={
                          <button 
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className="p-1.5 sm:p-2 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
                          >
                            <MoreHorizontal size={18} className="sm:w-5 sm:h-5 text-gray-900 dark:text-gray-100" />
                          </button>
                        }
                      >
                        <button
                          onClick={handleBlock}
                          disabled={blockLoading}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 text-sm disabled:opacity-50 transition-colors"
                        >
                          {isBlocked ? (
                            <>
                              <UserCheck size={18} className="text-green-600 dark:text-green-400" />
                              <span className="text-gray-700 dark:text-gray-300">Unblock {user?.username}</span>
                            </>
                          ) : (
                            <>
                              <UserX size={18} className="text-red-600 dark:text-red-400" />
                              <span className="text-gray-700 dark:text-gray-300">Block {user?.username}</span>
                            </>
                          )}
                        </button>
                      </PortalDropdown>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Email - Show if user enabled showEmail OR if viewing own profile */}
            {(user?.showEmail || isOwnProfile) && (
              <p className="text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 lg:mb-5 text-xs sm:text-sm lg:text-base text-center sm:text-left">
                {user?.email || 'user@example.com'}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 lg:gap-8 mb-3 sm:mb-4 lg:mb-5">
              <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5">
                <span className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
                  {user?.postCount || posts?.length || 0}
                </span>
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm lg:text-base">Posts</span>
              </div>
              <button
                className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 hover:opacity-70 transition-opacity"
                onClick={() => setShowFollowersModal(true)}
              >
                <span className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
                  {followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}k` : followersCount}
                </span>
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm lg:text-base">Followers</span>
              </button>
              <button
                className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 hover:opacity-70 transition-opacity"
                onClick={() => setShowFollowingModal(true)}
              >
                <span className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
                  {followingCount}
                </span>
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm lg:text-base">Following</span>
              </button>
            </div>

            {/* Bio */}
            {user?.bio && (
              <div className="mb-3 sm:mb-4">
                <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap text-sm sm:text-base text-center sm:text-left">
                  {user.bio}
                </p>
              </div>
            )}

            {/* Additional Info - All in one line */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-xs sm:text-sm lg:text-base">
              {user?.location && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <MapPin size={16} className="sm:w-[18px] sm:h-[18px] text-gray-500 dark:text-gray-400" />
                  <span>{user.location}</span>
                </div>
              )}

              {user?.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 sm:gap-1.5"
                >
                  <LinkIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="truncate max-w-[150px] sm:max-w-none">{user.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}

              {user?.createdAt && (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Calendar size={16} className="sm:w-[18px] sm:h-[18px] text-gray-500 dark:text-gray-400" />
                  <span>
                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Skills/Hashtags - Removed */}
          </div>
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <FollowersModal
          userId={user._id}
          type="followers"
          userName={user.username}
          onClose={handleFollowersModalClose}
          onCountChange={handleModalCountChange}
        />
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <FollowersModal
          userId={user._id}
          type="following"
          userName={user.username}
          onClose={handleFollowingModalClose}
          onCountChange={handleModalCountChange}
        />
      )}
    </div>
  );
};

export default ProfileHeader;