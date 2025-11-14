// client/src/components/profile/ProfilePosts.jsx
import React from 'react';
import { Heart, MessageCircle, Grid as GridIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { countTotalComments } from '../../services/commentApi';

const ProfilePosts = ({ posts, isOwnProfile, onPostsUpdate }) => {
  const navigate = useNavigate();

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <GridIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2 text-gray-900 dark:text-gray-100">
          {isOwnProfile ? 'No posts yet' : 'No Posts Yet'}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {isOwnProfile 
            ? 'Share your first post to get started!' 
            : 'This user hasn\'t shared anything yet.'}
        </p>
        {isOwnProfile && (
          <button
            onClick={() => navigate('/')}
            className="mt-4 sm:mt-6 px-5 sm:px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
          >
            Create Your First Post
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
      {posts.map((post) => {
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
            className="group cursor-pointer overflow-hidden bg-white dark:bg-gray-800 rounded-md sm:rounded-lg shadow-sm hover:shadow-md transition-shadow"
            onClick={() => navigate(`/post/${post._id}`)}
          >
            <div className="relative aspect-square">
              {post.images && post.images[0] ? (
                <img
                  src={post.images[0]}
                  alt="User post"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : post.videos && post.videos[0] ? (
                <div className="relative w-full h-full">
                  <video
                    src={post.videos[0].url}
                    poster={post.videos[0].thumbnail}
                    className="w-full h-full object-cover"
                  />
                  {/* Video indicator overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="bg-black/60 rounded-full p-3 sm:p-4 backdrop-blur-sm">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  {/* Video duration badge */}
                  {post.videos[0].duration && (
                    <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2">
                      <div className="bg-black/80 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-medium backdrop-blur-sm">
                        {Math.floor(post.videos[0].duration / 60)}:{String(Math.floor(post.videos[0].duration % 60)).padStart(2, '0')}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 p-2 sm:p-4">
                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm line-clamp-4 sm:line-clamp-6 text-center">
                    {post.content}
                  </p>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 sm:space-x-4 text-white">
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" />
                  <span className="font-semibold text-sm sm:text-base">{totalReactions}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" />
                  <span className="font-semibold text-sm sm:text-base">{commentCount}</span>
                </div>
              </div>

              {/* Multiple Images Indicator */}
              {post.images && post.images.length > 1 && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
                  <div className="bg-black/60 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-medium backdrop-blur-sm">
                    1/{post.images.length}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfilePosts;