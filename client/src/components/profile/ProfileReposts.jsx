// client/src/components/profile/ProfileReposts.jsx
import React, { useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { repostPost } from '../../services/api';
import toast from 'react-hot-toast';

const ProfileReposts = ({ reposts, loading, onRepostRemoved }) => {
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  const [removingRepost, setRemovingRepost] = useState(null);
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (!reposts || reposts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No reposts yet</p>
      </div>
    );
  }

  const getCurrentImageIndex = (repostId) => {
    return currentImageIndexes[repostId] || 0;
  };

  const nextImage = (repostId, totalImages) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [repostId]: Math.min((prev[repostId] || 0) + 1, totalImages - 1)
    }));
  };

  const prevImage = (repostId) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [repostId]: Math.max((prev[repostId] || 0) - 1, 0)
    }));
  };

  const setImageIndex = (repostId, index) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [repostId]: index
    }));
  };

  const handleUnrepost = async (originalPostId, repostId) => {
    if (removingRepost) return;
    
    try {
      setRemovingRepost(repostId);
      await repostPost(originalPostId);
      toast.success('Repost removed');
      
      // Notify parent to refresh the list
      if (onRepostRemoved) {
        onRepostRemoved(repostId);
      }
    } catch (error) {
      console.error('Error removing repost:', error);
      toast.error('Failed to remove repost');
    } finally {
      setRemovingRepost(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="space-y-4">
        {reposts.map((repost) => {
          const currentIndex = getCurrentImageIndex(repost._id);
          
          return (
            <div key={repost._id} className="bg-white rounded-lg border border-gray-200">
              {/* Repost Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">You reposted</span>
                  <span>•</span>
                  <span>{new Date(repost.createdAt).toLocaleDateString()}</span>
                </div>
                
                {/* Unrepost Button */}
                <button
                  onClick={() => handleUnrepost(repost.originalPost._id, repost._id)}
                  disabled={removingRepost === repost._id}
                  className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove repost"
                >
                  Unrepost
                </button>
              </div>

              {/* Original Post Content */}
              {repost.originalPost && !repost.originalPost.isDeleted ? (
                <div className="p-4">
                  {/* Original Author */}
                  <div className="flex items-center gap-2 mb-3">
                    <img
                      src={repost.originalPost.author?.avatar || '/default-avatar.png'}
                      alt={repost.originalPost.author?.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">@{repost.originalPost.author?.username}</p>
                      <p className="text-xs text-gray-500">Original post</p>
                    </div>
                  </div>

                  {/* Original Post Text */}
                  {repost.originalPost.content && (
                    <p className="text-gray-800 mb-3 whitespace-pre-wrap">{repost.originalPost.content}</p>
                  )}

                  {/* Original Post Images - Carousel Style */}
                  {repost.originalPost.images && repost.originalPost.images.length > 0 && (
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                      <div 
                        className="relative w-full"
                        style={{ aspectRatio: '16/9' }}
                      >
                        <img 
                          src={repost.originalPost.images[currentIndex]} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />

                        {/* Navigation Arrows */}
                        {repost.originalPost.images.length > 1 && currentIndex > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              prevImage(repost._id);
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 z-10"
                          >
                            <ChevronLeft size={24} className="text-gray-800" />
                          </button>
                        )}
                        
                        {repost.originalPost.images.length > 1 && currentIndex < repost.originalPost.images.length - 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              nextImage(repost._id, repost.originalPost.images.length);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 z-10"
                          >
                            <ChevronRight size={24} className="text-gray-800" />
                          </button>
                        )}

                        {/* Image Counter */}
                        {repost.originalPost.images.length > 1 && (
                          <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                            {currentIndex + 1} / {repost.originalPost.images.length}
                          </div>
                        )}

                        {/* Pagination Dots */}
                        {repost.originalPost.images.length > 1 && (
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {repost.originalPost.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImageIndex(repost._id, index);
                                }}
                                className={`transition-all ${
                                  index === currentIndex 
                                    ? 'w-8 h-2 bg-white' 
                                    : 'w-2 h-2 bg-white/60 hover:bg-white/80'
                                } rounded-full`}
                                aria-label={`Go to image ${index + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  <div className="py-6 text-center text-gray-500 text-sm">
                    This post has been deleted
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileReposts;
