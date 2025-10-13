// client/src/components/profile/ProfileHeader.jsx
import React, { useState, useEffect } from 'react';
import { Camera, MoreHorizontal, Edit, MapPin, Link as LinkIcon, Calendar, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FollowButton from './FollowButton';
import FollowersModal from './FollowersModal';

const ProfileHeader = ({ user, isOwnProfile, onEditClick, posts = [], onFollowChange }) => {
  const { updateProfile, isUpdatingProfile } = useAuthStore();
  const navigate = useNavigate();
  const [selectedImg, setSelectedImg] = useState(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  // Update counts whenever user prop changes
  useEffect(() => {
    if (user) {
      const newFollowersCount = Array.isArray(user.followers) ? user.followers.length : 0;
      const newFollowingCount = Array.isArray(user.following) ? user.following.length : 0;
      
      // Only update if counts actually changed
      if (followersCount !== newFollowersCount) {
        setFollowersCount(newFollowersCount);
      }
      if (followingCount !== newFollowingCount) {
        setFollowingCount(newFollowingCount);
      }
      if (isFollowing !== user.isFollowing) {
        setIsFollowing(user.isFollowing || false);
      }
    }
  }, [user?.username]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
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
    navigate(`/messages?user=${user._id}`);
  };

  const handleFollowersModalClose = () => {
    setShowFollowersModal(false);
    // Optionally refresh counts after modal close
    if (user) {
      setFollowersCount(user.followers?.length || 0);
    }
  };

  const handleFollowingModalClose = () => {
    setShowFollowingModal(false);
    // Optionally refresh counts after modal close
    if (user) {
      setFollowingCount(user.following?.length || 0);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-36 h-36 rounded-full overflow-hidden bg-gray-100 ring-4 ring-gray-200">
              {(selectedImg || user?.avatar) ? (
                <img
                  src={selectedImg || user.avatar}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-5xl">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {isOwnProfile && (
              <div className="absolute bottom-1 right-1">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="avatar-upload"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className={`w-10 h-10 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center shadow-lg transition-all border-2 border-gray-200 ${
                    isUpdatingProfile ? 'animate-pulse' : ''
                  }`}>
                    <Camera className="h-5 w-5 text-gray-700" />
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            {/* Name and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {user?.username || 'User'}
                </h1>
                <p className="text-gray-600 text-base">@{user?.email?.split('@')[0] || 'user'}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={onEditClick}
                      className="px-5 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Edit Profile
                    </button>
                    <button className="p-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
                      <MoreHorizontal size={20} className="text-gray-700" />
                    </button>
                  </>
                ) : (
                  <>
                    <FollowButton
                      userId={user?._id}
                      initialIsFollowing={isFollowing}
                      onFollowChange={handleFollowChange}
                    />
                    <button 
                      onClick={handleMessage}
                      className="px-5 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm flex items-center gap-2"
                    >
                      <MessageCircle size={16} />
                      Message
                    </button>
                    <button className="p-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
                      <MoreHorizontal size={20} className="text-gray-700" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mb-5">
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-900 text-base">
                  {user?.postCount || posts?.length || 0}
                </span>
                <span className="text-gray-600 text-base">Posts</span>
              </div>
              <button
                className="flex items-center gap-1 hover:text-gray-900 transition-colors group"
                onClick={() => setShowFollowersModal(true)}
              >
                <span className="font-bold text-gray-900 text-base group-hover:underline">
                  {followersCount}
                </span>
                <span className="text-gray-600 text-base group-hover:underline">Followers</span>
              </button>
              <button
                className="flex items-center gap-1 hover:text-gray-900 transition-colors group"
                onClick={() => setShowFollowingModal(true)}
              >
                <span className="font-bold text-gray-900 text-base group-hover:underline">
                  {followingCount}
                </span>
                <span className="text-gray-600 text-base group-hover:underline">Following</span>
              </button>
            </div>

            {/* Bio */}
            {user?.bio && (
              <p className="text-gray-900 mb-3 leading-relaxed text-base max-w-2xl">
                {user.bio}
              </p>
            )}

            {/* Additional Info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mb-3">
              {user?.work && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="font-medium">{user.work}</span>
                </div>
              )}

              {user?.location && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <MapPin size={16} className="text-gray-500" />
                  <span>{user.location}</span>
                </div>
              )}

              {user?.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  <LinkIcon size={16} />
                  <span>{user.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}

              {user?.createdAt && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Calendar size={16} className="text-gray-500" />
                  <span>
                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
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
        />
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <FollowersModal
          userId={user._id}
          type="following"
          userName={user.username}
          onClose={handleFollowingModalClose}
        />
      )}
    </div>
  );
};

export default ProfileHeader;