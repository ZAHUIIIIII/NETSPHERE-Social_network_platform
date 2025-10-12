// client/src/components/common/UserCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import FollowButton from '../profile/FollowButton';

const UserCard = ({ user, showFollowButton = true, onFollowChange }) => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const isOwnProfile = authUser?._id === user._id;

  const handleUserClick = () => {
    navigate(`/profile/${user.username}`);
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-lg">
      <div
        className="flex items-center gap-3 flex-1 cursor-pointer"
        onClick={handleUserClick}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center ring-2 ring-gray-200">
              <span className="text-white font-bold text-lg">
                {user.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {user.username}
          </h3>
          {user.bio && (
            <p className="text-sm text-gray-600 truncate">
              {user.bio}
            </p>
          )}
          {user.followersCount !== undefined && (
            <p className="text-xs text-gray-500">
              {user.followersCount} {user.followersCount === 1 ? 'follower' : 'followers'}
            </p>
          )}
        </div>
      </div>

      {/* Follow Button */}
      {showFollowButton && !isOwnProfile && (
        <div className="ml-3">
          <FollowButton
            userId={user._id}
            initialIsFollowing={user.isFollowing || false}
            onFollowChange={onFollowChange}
          />
        </div>
      )}
    </div>
  );
};

export default UserCard;