// client/src/hooks/useFollow.js
import { useState, useCallback } from 'react';
import { followUser, unfollowUser } from '../services/profileApi';
import toast from 'react-hot-toast';

export const useFollow = (initialIsFollowing = false) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFollow = useCallback(async (userId) => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        const response = await unfollowUser(userId);
        setIsFollowing(false);
        toast.success('Unfollowed successfully');
        return { success: true, isFollowing: false, data: response };
      } else {
        const response = await followUser(userId);
        setIsFollowing(true);
        toast.success('Followed successfully');
        return { success: true, isFollowing: true, data: response };
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error(error.response?.data?.message || 'Failed to update follow status');
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [isFollowing]);

  return {
    isFollowing,
    isLoading,
    toggleFollow,
    setIsFollowing
  };
};