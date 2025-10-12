// client/src/components/profile/ProfilePosts.jsx
import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePosts = ({ posts, isOwnProfile, onPostsUpdate }) => {
  const navigate = useNavigate();

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="max-w-sm mx-auto px-4">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-5xl">📝</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {isOwnProfile ? 'Share Your First Post' : 'No Posts Yet'}
          </h3>
          <p className="text-gray-600 mb-6 text-base">
            {isOwnProfile 
              ? 'Start sharing your thoughts, photos, and moments with the community!' 
              : 'This user hasn\'t shared anything yet. Check back later!'}
          </p>
          {isOwnProfile && (
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold shadow-sm hover:shadow-md"
            >
              Create Your First Post
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
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
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
              <p className="text-gray-600 text-sm line-clamp-6 text-center">
                {post.content}
              </p>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
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
              <div className="bg-black/60 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
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