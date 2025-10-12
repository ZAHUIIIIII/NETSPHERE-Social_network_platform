import React, { useState, useEffect } from 'react';
import { getSavedPosts } from '../../services/profileApi';
import { Loader, Bookmark } from 'lucide-react';
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
      <div className="text-center py-16 bg-white rounded-2xl shadow-sm mt-4">
        <Bookmark className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No saved posts</h3>
        <p className="text-gray-600">Posts you save will appear here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 mt-4">
      {savedPosts.map((post) => (
        <div
          key={post._id}
          className="relative aspect-square bg-gray-100 cursor-pointer group overflow-hidden"
          onClick={() => navigate(`/post/${post._id}`)}
        >
          {post.images && post.images[0] ? (
            <img
              src={post.images[0]}
              alt=""
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
              <p className="text-gray-600 text-sm line-clamp-6 text-center">
                {post.content}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProfileSaved;