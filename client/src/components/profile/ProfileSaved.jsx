// client/src/components/profile/ProfileSaved.jsx
import React, { useState, useEffect } from 'react';
import { getSavedPosts } from '../../services/profileApi';
import { Loader, Bookmark, Heart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileSaved = ({ userId }) => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedPosts();
  }, [userId]);

  const fetchSavedPosts = async () => {
    try {
      const posts = await getSavedPosts(userId);
      setSavedPosts(posts);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (savedPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No saved posts</h3>
        <p className="text-gray-600">Posts you save will appear here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {savedPosts.map((post) => (
        <div
          key={post._id}
          className="group cursor-pointer overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          onClick={() => navigate(`/post/${post._id}`)}
        >
          <div className="relative aspect-square">
            {post.images && post.images[0] ? (
              <img
                src={post.images[0]}
                alt="Saved post"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
                <p className="text-gray-600 text-sm line-clamp-6 text-center">
                  {post.content}
                </p>
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4 text-white">
              <div className="flex items-center space-x-1">
                <Heart className="h-5 w-5" fill="currentColor" />
                <span className="font-semibold">{post.likes?.length || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-5 w-5" fill="currentColor" />
                <span className="font-semibold">{post.comments?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfileSaved;