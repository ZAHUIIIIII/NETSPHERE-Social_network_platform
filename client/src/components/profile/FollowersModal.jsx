// client/src/components/profile/FollowersModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Loader, Users, UserX, MessageCircle } from 'lucide-react';
import { getFollowers, getFollowing, removeFollower } from '../../services/profileApi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FollowButton from './FollowButton';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';

const FollowersModal = ({ userId, type, onClose, userName, onCountChange }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { setSelectedUser } = useChatStore();


  
  useEffect(() => {
    fetchUsers();
  }, [userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = type === 'followers' 
        ? await getFollowers(userId)
        : await getFollowing(userId);
      
      setUsers(response.followers || response.following || []);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      toast.error(`Failed to load ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (username) => {
    onClose();
    navigate(`/profile/${username}`);
  };

  const handleFollowChange = (targetUserId, data) => {
    console.log('FollowersModal - Follow change:', {
      modalType: type,
      profileUserId: userId,
      targetUserId,
      newFollowStatus: data.isFollowing,
      message: `Current user ${data.isFollowing ? 'followed' : 'unfollowed'} targetUser. ProfileUser's ${type} list is NOT modified.`
    });
    
    // Update local users list immediately for better UX
    // Only update isFollowing status - don't remove users from list
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u._id === targetUserId ? { ...u, isFollowing: data.isFollowing } : u
      )
    );

    // Notify parent component about count change
    // This updates the CURRENT USER's following count, not the profile user's
    if (onCountChange) {
      if (data.isFollowing) {
        // Current user followed someone - increase current user's following count
        onCountChange({ type: 'following', change: 1 });
      } else {
        // Current user unfollowed someone - decrease current user's following count
        onCountChange({ type: 'following', change: -1 });
      }
    }
  };

  const handleRemoveFollower = async (followerId, followerUsername) => {
    try {
      await removeFollower(followerId);
      
      // Remove from local state
      setUsers(prevUsers => prevUsers.filter(u => u._id !== followerId));
      
      // Update parent component's follower count
      if (onCountChange) {
        onCountChange({ type: 'followers', change: -1 });
      }
      
      toast.success(`Removed ${followerUsername} from followers`);
    } catch (error) {
      console.error('Error removing follower:', error);
      toast.error(error.response?.data?.message || 'Failed to remove follower');
    }
  };

  const handleMessage = (user) => {
    // Close modal
    onClose();
    // Navigate to messages page with user state
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Simple and clean */}
        <div className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                {type}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {userName ? `@${userName}` : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 text-gray-600 dark:text-gray-400"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Count badge - Simple gray */}
          <div className="mt-4 inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full">
            <Users size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300 font-semibold text-sm">
              {users.length} {users.length === 1 ? 'user' : 'users'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-180px)] bg-gray-50 dark:bg-gray-900">{loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <Loader className="w-10 h-10 animate-spin text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading {type}...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="bg-gray-100 dark:bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                No {type} yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {type === 'followers' 
                  ? 'No one is following this user yet'
                  : 'This user is not following anyone yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="p-5 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div
                      className="flex items-center gap-4 flex-1 cursor-pointer group"
                      onClick={() => handleUserClick(user.username)}
                    >
                      {/* Avatar with subtle ring effect */}
                      <div className="relative flex-shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-gray-300 dark:group-hover:ring-gray-500 transition-all duration-300 shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-gray-300 dark:group-hover:ring-gray-500 transition-all duration-300 shadow-sm">
                            <span className="text-white font-bold text-xl">
                              {user.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-base group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                          {user.username}
                        </h3>
                        {user.bio ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                            {user.bio}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">No bio yet</p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Logic:
                        Followers Tab (viewing your own profile):
                        - If you're NOT following them back: Show "Follow Back" button
                        - If you ARE following them back: Show "Message" button
                        - Show "Remove Follower" (X) button for own profile
                        
                        Following Tab or other profiles:
                        - Show regular Follow/Unfollow button
                    */}
                    {authUser?._id !== user._id && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {type === 'followers' && authUser?._id === userId ? (
                          // In followers tab viewing own profile
                          <>
                            {user.isFollowing ? (
                              // Already following back - Show Message button
                              <button
                                onClick={() => handleMessage(user)}
                                className="
                                  relative overflow-hidden px-4 py-2.5 rounded-xl font-semibold text-sm 
                                  transition-all duration-300 ease-out
                                  flex items-center justify-center gap-2 
                                  transform hover:scale-105 active:scale-95
                                  min-w-[120px] whitespace-nowrap
                                  bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 
                                  text-white shadow-md hover:shadow-lg 
                                  hover:from-green-600 hover:via-green-700 hover:to-emerald-700
                                "
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>Message</span>
                              </button>
                            ) : (
                              // Not following back - Show Follow Back button with special styling
                              <FollowButton
                                userId={user._id}
                                initialIsFollowing={false}
                                onFollowChange={(data) => handleFollowChange(user._id, data)}
                                isFollowBack={true}
                              />
                            )}
                            
                            {/* Remove Follower Button - Just X icon */}
                            <button
                              onClick={() => handleRemoveFollower(user._id, user.username)}
                              className="
                                p-2 rounded-full
                                bg-gray-100
                                hover:bg-red-50
                                transition-all duration-200
                                group
                              "
                              title="Remove follower"
                            >
                              <X 
                                size={18} 
                                className="
                                  text-gray-500 
                                  group-hover:text-red-600 
                                  transition-colors duration-200
                                " 
                              />
                            </button>
                          </>
                        ) : (
                          // In following tab or viewing other profiles - Show regular follow button
                          <FollowButton
                            userId={user._id}
                            initialIsFollowing={user.isFollowing || false}
                            onFollowChange={(data) => handleFollowChange(user._id, data)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;