// client/src/components/profile/FollowersModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Loader, Users } from 'lucide-react';
import { getFollowers, getFollowing } from '../../services/profileApi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FollowButton from './FollowButton';
import { useAuthStore } from '../../store/useAuthStore';

const FollowersModal = ({ userId, type, onClose, userName }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { authUser } = useAuthStore();


  
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

  const handleFollowChange = (userId, data) => {
    // Optionally refresh the list or update the count
    fetchUsers();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 capitalize">
            {userName ? `${userName}'s ${type}` : type}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No {type} yet
              </h3>
              <p className="text-gray-600">
                {type === 'followers' 
                  ? 'No one is following this user yet'
                  : 'This user is not following anyone yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => handleUserClick(user.username)}
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
                      </div>
                    </div>

                    {/* Follow Button - Don't show for own profile */}
                    {authUser?._id !== user._id && (
                      <div className="ml-3">
                        <FollowButton
                          userId={user._id}
                          initialIsFollowing={user.isFollowing || false}
                          onFollowChange={(data) => handleFollowChange(user._id, data)}
                        />
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