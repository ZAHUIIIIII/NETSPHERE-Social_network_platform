import React from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePosts = ({ posts, isOwnProfile, onPostsUpdate }) => {
  const navigate = useNavigate();

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-sm mt-4">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {isOwnProfile ? 'No posts yet' : 'No posts to show'}
        </h3>
        <p className="text-gray-600 mb-6">
          {isOwnProfile 
            ? 'Share your first post to get started!' 
            : 'This user hasn\'t posted anything yet.'}
        </p>
        {isOwnProfile && (
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold"
          >
            Create Post
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 mt-4">
      {posts.map((post) => (
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

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
            <div className="flex items-center gap-2">
              <Heart size={20} fill="white" />
              <span className="font-semibold">{post.likes?.length || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle size={20} fill="white" />
              <span className="font-semibold">{post.comments?.length || 0}</span>
            </div>
          </div>

          {/* Multiple Images Indicator */}
          {post.images && post.images.length > 1 && (
            <div className="absolute top-2 right-2">
              <div className="bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                1/{post.images.length}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProfilePosts;