// client/src/components/common/SuggestedUsers.jsx
import React, { useState, useEffect } from 'react';
import { Users, Loader, Sparkles } from 'lucide-react';
import axiosInstance from '../../lib/axios';
import UserCard from './UserCard';
import toast from 'react-hot-toast';

const SuggestedUsers = ({ limit = 5 }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      // You'll need to create this endpoint
      const response = await axiosInstance.get(`/users/suggestions?limit=${limit}`);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      toast.error('Failed to load suggested users');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (userId, data) => {
    // Update the user in the list with new follow status and follower count
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user._id === userId
          ? { 
              ...user, 
              isFollowing: data.isFollowing,
              // Update follower count based on follow action
              followersCount: data.isFollowing 
                ? (user.followersCount || 0) + 1 
                : Math.max(0, (user.followersCount || 0) - 1)
            }
          : user
      )
    );
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex justify-center items-center py-8">
          <Loader className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Suggested for you
          </h2>
        </div>
      </div>

      {/* Users list */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {users.map((user, index) => (
          <div
            key={user._id}
            className="animate-fadeIn"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <UserCard
              user={user}
              showFollowButton={true}
              onFollowChange={(data) => handleFollowChange(user._id, data)}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Based on your activity and connections
        </p>
      </div>
    </div>
  );
};

export default SuggestedUsers;