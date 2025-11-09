// client/src/components/profile/ProfileReposts.jsx
import React from 'react';
import { Heart, MessageCircle, Repeat, Grid as GridIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { countTotalComments } from '../../services/commentApi';

const ProfileReposts = ({ reposts, isOwnProfile }) => {
  const navigate = useNavigate();

  if (!reposts || reposts.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <Repeat className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2 text-gray-900 dark:text-gray-100">
          {isOwnProfile ? 'No reposts yet' : 'No Reposts Yet'}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {isOwnProfile 
            ? 'Repost interesting content to share with your followers!' 
            : 'This user hasn\'t reposted anything yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
      {reposts.map((repost) => {
        const post = repost.originalPost || repost;
        
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
            key={repost._id || post._id}
            className="group cursor-pointer overflow-hidden bg-white dark:bg-gray-800 rounded-md sm:rounded-lg shadow-sm hover:shadow-md transition-shadow"
            onClick={() => navigate(`/post/${post._id}`)}
          >
            <div className="relative aspect-square">
              {post.images && post.images.length > 0 ? (
                <>
                  <img
                    src={post.images[0]}
                    alt="Reposted content"
                    className="w-full h-full object-cover"
                  />
                  {/* Repost indicator */}
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-green-500 text-white p-1 sm:p-1.5 rounded-full">
                    <Repeat className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  {/* Overlay with stats */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-1 sm:gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5 fill-white" />
                      <span className="font-semibold text-sm sm:text-base">{totalReactions}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 fill-white" />
                      <span className="font-semibold text-sm sm:text-base">{commentCount}</span>
                    </div>
                  </div>
                  {/* Multiple images indicator */}
                  {post.images.length > 1 && (
                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-black/70 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium">
                      <GridIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-0.5 sm:mr-1" />
                      {post.images.length}
                    </div>
                  )}
                </>
              ) : (
                // Text-only post
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 sm:p-4 lg:p-6 flex flex-col justify-between relative">
                  {/* Repost indicator */}
                  <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-green-500 dark:bg-green-600 text-white p-1 sm:p-1.5 rounded-full">
                    <Repeat className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 line-clamp-3 sm:line-clamp-4 text-xs sm:text-sm">
                    {post.content}
                  </p>
                  {/* Stats at bottom */}
                  <div className="flex items-center gap-3 sm:gap-4 text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs mt-2 sm:mt-4">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{totalReactions}</span>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{commentCount}</span>
                    </div>
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

export default ProfileReposts;
