// client/src/components/profile/FollowButton.jsx
import React, { useState } from 'react';
import { UserPlus, UserMinus, Loader } from 'lucide-react';
import { followUser, unfollowUser } from '../../services/profileApi';
import toast from 'react-hot-toast';

const FollowButton = ({ userId, initialIsFollowing, onFollowChange }) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowToggle = async (e) => {
    e.stopPropagation();
    setIsLoading(true);

    try {
      if (isFollowing) {
        const response = await unfollowUser(userId);
        setIsFollowing(false);
        toast.success(response.message || 'Unfollowed successfully');
        onFollowChange?.({
          isFollowing: false,
          followersCount: response.followersCount
        });
      } else {
        const response = await followUser(userId);
        setIsFollowing(true);
        toast.success(response.message || 'Followed successfully');
        onFollowChange?.({
          isFollowing: true,
          followersCount: response.followersCount
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error(error.response?.data?.message || 'Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={`
        px-5 py-2 rounded-lg font-medium text-sm transition-all
        flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
        ${isFollowing
          ? 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-red-300 hover:text-red-600'
          : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
        }
      `}
    >
      {isLoading ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          <span className="hidden sm:inline">Following</span>
          <span className="sm:hidden">Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Follow</span>
        </>
      )}
    </button>
  );
};

export default FollowButton;