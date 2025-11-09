// client/src/components/profile/FollowButton.jsx
import React, { useState } from 'react';
import { UserPlus, UserMinus, Loader, UserCheck } from 'lucide-react';
import { followUser, unfollowUser } from '../../services/profileApi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

const FollowButton = ({ userId, initialIsFollowing, onFollowChange, isFollowBack = false }) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { authUser } = useAuthStore();

  // Update local state when prop changes (important for when navigating between profiles)
  React.useEffect(() => {
    console.log('FollowButton - Prop changed:', {
      userId,
      initialIsFollowing,
      currentIsFollowing: isFollowing
    });
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing, userId]);

  const handleFollowToggle = async (e) => {
    e.stopPropagation();
    setIsLoading(true);

    try {
      if (isFollowing) {
        const response = await unfollowUser(userId);
        setIsFollowing(false);
        
        // Update authUser following list in global state
        const updatedFollowing = authUser.following.filter(id => {
          const idStr = typeof id === 'object' ? id._id || id.toString() : id.toString();
          return idStr !== userId.toString();
        });
        useAuthStore.setState({ 
          authUser: { ...authUser, following: updatedFollowing } 
        });
        
        toast.success(response.message || 'Unfollowed successfully');
        onFollowChange?.({
          isFollowing: false,
          followersCount: response.followersCount
        });
      } else {
        const response = await followUser(userId);
        setIsFollowing(true);
        
        // Update authUser following list in global state
        const updatedFollowing = [...(authUser.following || []), userId];
        useAuthStore.setState({ 
          authUser: { ...authUser, following: updatedFollowing } 
        });
        
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading}
      className={`
        relative overflow-hidden px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm 
        transition-all duration-200
        flex items-center justify-center gap-1.5 sm:gap-2 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isFollowBack ? 'min-w-[90px] sm:min-w-[110px]' : 'min-w-[80px] sm:min-w-[100px]'}
        ${isFollowing
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
          : 'bg-blue-500 text-white hover:bg-blue-600'
        }
      `}
    >
      {/* Button content */}
      <div className="relative flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
        {isLoading ? (
          <>
            <Loader className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            <span>{isFollowing ? 'Unfollowing' : 'Following'}...</span>
          </>
        ) : isFollowing ? (
          <>
            {isHovered ? (
              <span>Unfollow</span>
            ) : (
              <span>Following</span>
            )}
          </>
        ) : (
          <span>{isFollowBack ? 'Follow Back' : 'Follow'}</span>
        )}
      </div>
    </button>
  );
};

export default FollowButton;