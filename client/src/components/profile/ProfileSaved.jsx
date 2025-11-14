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
      <div className="flex justify-center py-12 sm:py-16">
        <div className="text-center">
          <Loader className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-2 sm:mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">Loading saved posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm px-4">
        <BookmarkX className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-red-400 dark:text-red-500 mb-3 sm:mb-4" />
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">Error Loading Saved Posts</h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">{error}</p>
        <button
          onClick={fetchSavedPosts}
          className="px-5 sm:px-6 py-2 sm:py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (savedPosts.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm px-4">
        <div className="relative inline-block mb-4 sm:mb-6">
          <Bookmark className="h-16 w-16 sm:h-20 sm:w-20 text-gray-300 dark:text-gray-600" />
          <div className="absolute -bottom-1 -right-1 bg-blue-500 dark:bg-blue-600 rounded-full p-1.5 sm:p-2">
            <span className="text-white text-lg sm:text-2xl">✨</span>
          </div>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">No saved posts yet</h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
          When you save posts, they'll appear here for easy access later
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-600 dark:hover:bg-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
        >
          Explore Posts
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
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
            className="group cursor-pointer overflow-hidden bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative"
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
              ) : post.videos && post.videos[0] ? (
                <div className="relative w-full h-full">
                  <video
                    src={post.videos[0].url}
                    poster={post.videos[0].thumbnail}
                    className="w-full h-full object-cover"
                  />
                  {/* Video play indicator */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="bg-black/60 rounded-full p-3 sm:p-4 backdrop-blur-sm">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  {/* Video duration badge */}
                  {post.videos[0].duration && (
                    <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
                      <div className="bg-black/80 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold backdrop-blur-sm">
                        {Math.floor(post.videos[0].duration / 60)}:{String(Math.floor(post.videos[0].duration % 60)).padStart(2, '0')}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3 sm:p-4 lg:p-6">
                  <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm line-clamp-4 sm:line-clamp-6 text-center font-medium">
                    {post.content}
                  </p>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 sm:p-3 lg:p-4">
                <div className="flex items-center justify-center space-x-3 sm:space-x-4 lg:space-x-6 text-white mb-1 sm:mb-2">
                  <div className="flex items-center space-x-1 sm:space-x-2 bg-white/20 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full">
                    <Heart className="h-3.5 w-3.5 sm:h-5 sm:w-5" fill="currentColor" />
                    <span className="font-semibold text-xs sm:text-base">{totalReactions}</span>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 bg-white/20 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-full">
                    <MessageCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5" fill="currentColor" />
                    <span className="font-semibold text-xs sm:text-base">{commentCount}</span>
                  </div>
                </div>
              </div>

              {/* Multiple Images Indicator */}
              {post.images && post.images.length > 1 && (
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                  <div className="bg-black/70 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold backdrop-blur-sm">
                    📷 {post.images.length}
                  </div>
                </div>
              )}
            </div>

            {/* Unsave Button */}
            <button
              onClick={(e) => handleUnsave(post._id, e)}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 lg:p-2.5 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
              title="Remove from saved"
            >
              <Trash2 size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileSaved;