// client/src/components/profile/ProfileSaved.jsx
import React, { useState, useEffect } from 'react';
import { getSavedPosts } from '../../services/profileApi';
import { savePost } from '../../services/api'; // ADD THIS
import { Loader, Bookmark, Heart, MessageCircle, BookmarkX, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { countTotalComments } from '../../services/commentApi';

const ProfileSaved = ({ userId }) => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedPosts();
  }, [userId]);

  const fetchSavedPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const posts = await getSavedPosts(userId);
      setSavedPosts(posts);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      setError(error.response?.data?.message || 'Failed to load saved posts');
      toast.error('Failed to load saved posts');
    } finally {
      setLoading(false);
    }
  };

  // ADD THIS FUNCTION
  const handleUnsave = async (postId, e) => {
    e.stopPropagation();
    try {
      await savePost(postId);
      setSavedPosts(prev => prev.filter(post => post._id !== postId));
      toast.success('Removed from saved');
    } catch (error) {
      console.error('Error unsaving post:', error);
      toast.error('Failed to remove post');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Loading saved posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
        <BookmarkX className="h-16 w-16 mx-auto text-red-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Saved Posts</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={fetchSavedPosts}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (savedPosts.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
        <div className="relative inline-block mb-6">
          <Bookmark className="h-20 w-20 text-gray-300" />
          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-2">
            <span className="text-white text-2xl">✨</span>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">No saved posts yet</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          When you save posts, they'll appear here for easy access later
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold shadow-lg hover:shadow-xl"
        >
          Explore Posts
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {savedPosts.map((post) => {
        // Calculate total reactions count (all reaction types)
        let totalReactions = 0;
        if (post.reactions) {
          totalReactions = Object.values(post.reactions).reduce((sum, reactionArray) => {
            return sum + (Array.isArray(reactionArray) ? reactionArray.length : 0);
          }, 0);
        } else {
          // Fallback to legacy likes
          totalReactions = post.likes?.length || 0;
        }

        // Calculate total comment count (root comments + all descendants)
        let commentCount = 0;
        if (post.comments && Array.isArray(post.comments)) {
          commentCount = countTotalComments(post.comments);
        }
        
        return (
          <div
            key={post._id}
            className="group cursor-pointer overflow-hidden bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative"
          >
            <div 
              className="relative aspect-square"
              onClick={() => navigate(`/post/${post._id}`)}
            >
              {post.images && post.images[0] ? (
                <img
                  src={post.images[0]}
                  alt="Saved post"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-6">
                  <p className="text-gray-700 text-sm line-clamp-6 text-center font-medium">
                    {post.content}
                  </p>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <div className="flex items-center justify-center space-x-6 text-white mb-2">
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Heart className="h-5 w-5" fill="currentColor" />
                    <span className="font-semibold">{totalReactions}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <MessageCircle className="h-5 w-5" fill="currentColor" />
                    <span className="font-semibold">{commentCount}</span>
                  </div>
                </div>
              </div>

              {/* Multiple Images Indicator */}
              {post.images && post.images.length > 1 && (
                <div className="absolute top-3 left-3">
                  <div className="bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
                    📷 {post.images.length}
                  </div>
                </div>
              )}
            </div>

            {/* Unsave Button */}
            <button
              onClick={(e) => handleUnsave(post._id, e)}
              className="absolute top-3 right-3 p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
              title="Remove from saved"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileSaved;