// client/src/components/common/SuggestedUsers.jsx
import React, { useState, useEffect } from 'react';
import { Users, Loader } from 'lucide-react';
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
    // Update the user in the list
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user._id === userId
          ? { ...user, isFollowing: data.isFollowing }
          : user
      )
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-center">
          <Loader className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-bold text-gray-900">Suggested for you</h2>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <UserCard
            key={user._id}
            user={user}
            showFollowButton={true}
            onFollowChange={(data) => handleFollowChange(user._id, data)}
          />
        ))}
      </div>
    </div>
  );
};

export default SuggestedUsers;