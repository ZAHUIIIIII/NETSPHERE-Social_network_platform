// client/src/components/common/UserCard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import FollowButton from '../profile/FollowButton';
import AdminBadge from './AdminBadge';

const UserCard = ({ user, showFollowButton = true, onFollowChange }) => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const isOwnProfile = authUser?._id === user._id;
  const [countChanged, setCountChanged] = useState(false);
  const [previousCount, setPreviousCount] = useState(user.followersCount);

  // Detect count changes and trigger animation
  useEffect(() => {
    if (user.followersCount !== previousCount && previousCount !== undefined) {
      setCountChanged(true);
      const timer = setTimeout(() => setCountChanged(false), 500);
      setPreviousCount(user.followersCount);
      return () => clearTimeout(timer);
    }
  }, [user.followersCount, previousCount]);

  const handleUserClick = () => {
    navigate(`/profile/${user.username}`);
  };

  const handleFollowChangeInternal = (data) => {
    // Call parent callback
    if (onFollowChange) {
      onFollowChange(data);
    }
  };

  return (
    <div className="group px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300">
      <div className="flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
          onClick={handleUserClick}
        >
          {/* Avatar with hover effect */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="relative w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-300 dark:group-hover:ring-blue-500 transition-all duration-300"
              />
            ) : (
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-blue-300 dark:group-hover:ring-blue-500 transition-all duration-300">
                <span className="text-white font-bold text-lg">
                  {user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                {user.username}
              </h3>
              {user.email === 'leeminhuy47@gmail.com' && (
                <AdminBadge size="xs" />
              )}
            </div>
            {user.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate leading-tight">
                {user.bio}
              </p>
            )}
            {user.followersCount !== undefined && (
              <p className={`text-xs mt-0.5 transition-all duration-300 ${
                countChanged 
                  ? 'text-blue-600 dark:text-blue-400 font-semibold animate-pulse-once' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {user.followersCount === 0 ? 'No followers yet' : 
                 user.followersCount === 1 ? '1 follower' : 
                 `${user.followersCount} followers`}
              </p>
            )}
          </div>
        </div>

        {/* Follow Button */}
        {showFollowButton && !isOwnProfile && (
          <div className="flex-shrink-0">
            <FollowButton
              userId={user._id}
              initialIsFollowing={user.isFollowing || false}
              onFollowChange={handleFollowChangeInternal}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard;