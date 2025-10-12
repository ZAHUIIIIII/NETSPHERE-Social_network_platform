// client/src/components/profile/ProfilePosts.jsx
import React from 'react';
import { Heart, MessageCircle, Grid as GridIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePosts = ({ posts, isOwnProfile, onPostsUpdate }) => {
  const navigate = useNavigate();

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <GridIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {isOwnProfile ? 'No posts yet' : 'No Posts Yet'}
        </h3>
        <p className="text-gray-600">
          {isOwnProfile 
            ? 'Share your first post to get started!' 
            : 'This user hasn\'t shared anything yet.'}
        </p>
        {isOwnProfile && (
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Create Your First Post
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post) => (
        <div
          key={post._id}
          className="group cursor-pointer overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          onClick={() => navigate(`/post/${post._id}`)}
        >
          <div className="relative aspect-square">
            {post.images && post.images[0] ? (
              <img
                src={post.images[0]}
                alt="User post"
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

            {/* Multiple Images Indicator */}
            {post.images && post.images.length > 1 && (
              <div className="absolute top-2 right-2">
                <div className="bg-black/60 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
                  1/{post.images.length}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfilePosts;