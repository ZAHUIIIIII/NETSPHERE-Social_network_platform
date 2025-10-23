import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, 
  Loader, Globe, Users, Lock, MapPin, ChevronLeft, ChevronRight, X, Eye 
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import axiosInstance from '../lib/axios';
import toast from 'react-hot-toast';
import { formatTime, formatMessageTime } from '../lib/utils';
import CommentsSection from '../components/comment/CommentsSection';

const PostDetailPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userReaction, setUserReaction] = useState(null);
  const [reactions, setReactions] = useState({ like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 });
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likesData, setLikesData] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const handleCommentCountChange = (newCount) => {
    setCommentCount(newCount);
    
    // Emit event for other pages to update
    window.dispatchEvent(new CustomEvent('postUpdated', {
      detail: {
        postId: postId,
        updates: {
          commentCount: newCount
        }
      }
    }));
  };

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/posts/${postId}`);
      const postData = response.data;
      
      setPost(postData);
      
      // Initialize reactions from post data
      if (postData.reactions) {
        const reactionCounts = {
          like: Array.isArray(postData.reactions.like) ? postData.reactions.like.length : (postData.reactions.like || 0),
          love: Array.isArray(postData.reactions.love) ? postData.reactions.love.length : (postData.reactions.love || 0),
          haha: Array.isArray(postData.reactions.haha) ? postData.reactions.haha.length : (postData.reactions.haha || 0),
          wow: Array.isArray(postData.reactions.wow) ? postData.reactions.wow.length : (postData.reactions.wow || 0),
          sad: Array.isArray(postData.reactions.sad) ? postData.reactions.sad.length : (postData.reactions.sad || 0),
          angry: Array.isArray(postData.reactions.angry) ? postData.reactions.angry.length : (postData.reactions.angry || 0)
        };
        setReactions(reactionCounts);
        
        // Check user's reaction
        if (postData.userReaction) {
          setUserReaction(postData.userReaction);
        } else {
          // Fallback: check each reaction array
          for (const [type, users] of Object.entries(postData.reactions)) {
            if (Array.isArray(users) && users.includes(authUser._id)) {
              setUserReaction(type);
              break;
            }
          }
        }
      } else if (postData.likes) {
        // Fallback for old likes array
        setReactions(prev => ({ ...prev, like: postData.likes.length }));
        if (postData.likes.includes(authUser._id)) {
          setUserReaction('like');
        }
      }
      
      // Check if post is saved
      const savedResponse = await axiosInstance.get(`/posts/${postId}/saved-status`);
      setIsSaved(savedResponse.data.isSaved);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    // Use first reaction type as default (like)
    await handleReact('like');
  };

  const handleReact = async (reactionType) => {
    const oldReaction = userReaction;
    const oldReactions = { ...reactions };
    const oldPost = { ...post };
    
    try {
      // Optimistic update
      const newReactions = { ...reactions };
      
      if (oldReaction) {
        newReactions[oldReaction] = Math.max(0, newReactions[oldReaction] - 1);
      }
      
      if (oldReaction !== reactionType) {
        newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
        setReactions(newReactions);
        setUserReaction(reactionType);
        
        toast.success('', {
          icon: reactionType === 'like' ? '👍' : 
                reactionType === 'love' ? '❤️' :
                reactionType === 'haha' ? '😂' :
                reactionType === 'wow' ? '😮' :
                reactionType === 'sad' ? '😢' : '😠',
          duration: 1000,
        });
      } else {
        setReactions(newReactions);
        setUserReaction(null);
      }
      
      // Get updated data from backend
      const res = await axiosInstance.post(`/posts/${postId}/react`, { type: reactionType });
      
      // Update with server response
      setUserReaction(res.data.userReaction);
      setReactions(res.data.reactions);
      
      // Update post with new reaction data including topReactions
      setPost(prev => ({
        ...prev,
        reactions: res.data.reactions,
        topReactions: res.data.topReactions,
        likes: res.data.likes
      }));

      // Emit event for other pages (HomePage, SearchPage) to update
      window.dispatchEvent(new CustomEvent('postUpdated', {
        detail: {
          postId: postId,
          updates: {
            reactions: res.data.reactions,
            topReactions: res.data.topReactions,
            likes: res.data.likes
          }
        }
      }));
    } catch (error) {
      console.error('Error reacting to post:', error);
      // Rollback on error
      setUserReaction(oldReaction);
      setReactions(oldReactions);
      setPost(oldPost);
      toast.error('Failed to react to post');
    }
  };

  const handleSave = async () => {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/save`);
      setIsSaved(response.data.isSaved);
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save post');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await axiosInstance.post(`/posts/${postId}/comment`, {
        content: commentText.trim()
      });
      
      // Update post with new comment
      setPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), response.data.comment]
      }));
      
      setCommentText('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await axiosInstance.delete(`/posts/${postId}/comment/${commentId}`);
      setPost(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c._id !== commentId)
      }));
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleShare = async () => {
    try {
      const postUrl = `${window.location.origin}/post/${postId}`;
      await navigator.clipboard.writeText(postUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to copy link');
    }
  };

  const openLightbox = (index) => {
    setLightboxImageIndex(index);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev < post.images.length - 1 ? prev + 1 : prev
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const nextLightboxImage = () => {
    setLightboxImageIndex((prev) => 
      prev < post.images.length - 1 ? prev + 1 : prev
    );
  };

  const prevLightboxImage = () => {
    setLightboxImageIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleShowLikes = async () => {
    setShowLikesModal(true);
    setLoadingLikes(true);
    
    try {
      const response = await axiosInstance.get(`/posts/${postId}/likes`);
      // New format: response.data.reactions is array of {user, reactionType}
      setLikesData(response.data.reactions || []);
    } catch (error) {
      console.error('Error fetching reactions:', error);
      toast.error(error.response?.data?.message || 'Failed to load reactions');
      setShowLikesModal(false);
    } finally {
      setLoadingLikes(false);
    }
  };

  const contentPreview = post?.content?.length > 300 && !isExpanded 
    ? post.content.slice(0, 300) + '...' 
    : post?.content;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-gray-900 font-bold text-xl mb-2">Post not found</p>
        <p className="text-gray-600 mb-6">This post may have been deleted or doesn't exist.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 font-semibold transition-all shadow-sm hover:shadow-md"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium px-3 py-2 hover:bg-white rounded-lg"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
        </div>

        {/* Post Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
          {/* Post Header */}
          <div className="p-4 flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div
                onClick={() => navigate(`/profile/${post.author?.username}`)}
                className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] cursor-pointer flex-shrink-0"
              >
                <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {post.author?.avatar ? (
                    <img 
                      src={post.author.avatar} 
                      alt={post.author.username} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-gray-700 font-bold">
                      {post.author?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 
                    onClick={() => navigate(`/profile/${post.author?.username}`)}
                    className="font-semibold text-gray-900 hover:underline cursor-pointer"
                  >
                    {post.author?.username || 'Anonymous'}
                  </h3>
                  {post.feeling && (
                    <span className="text-sm text-gray-600">
                      is feeling {post.feeling}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span>{formatTime(post.createdAt)}</span>
                  <span>•</span>
                  {post.privacy === 'public' && <Globe size={12} />}
                  {post.privacy === 'friends' && <Users size={12} />}
                  {post.privacy === 'private' && <Lock size={12} />}
                  {post.location && (
                    <>
                      <span>•</span>
                      <MapPin size={12} />
                      <span>{post.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreHorizontal size={20} className="text-gray-500" />
              </button>
              
              {showOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10">
                  {post.author?._id === authUser?._id && (
                    <>
                      <button className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm text-red-600">
                        Delete post
                      </button>
                      <div className="border-t border-gray-100 my-2"></div>
                    </>
                  )}
                  <button 
                    onClick={() => {
                      handleSave();
                      setShowOptions(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                  >
                    {isSaved ? 'Unsave post' : 'Save post'}
                  </button>
                  <button 
                    onClick={() => {
                      handleShare();
                      setShowOptions(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                  >
                    Copy link
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Post Content */}
          {post.content && (
            <div className="px-4 pb-3">
              <p className="text-gray-800 whitespace-pre-wrap break-words">
                {contentPreview}
              </p>
              {post.content.length > 300 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-1"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {/* Post Images - Carousel */}
          {post.images && post.images.length > 0 && (
            <div className="relative bg-gray-100">
              <div 
                className="relative w-full overflow-hidden cursor-pointer group"
                style={{ aspectRatio: '16/9' }}
                onClick={() => openLightbox(currentImageIndex)}
              >
                <img 
                  src={post.images[currentImageIndex]} 
                  alt="" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* Zoom indicator overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Eye size={16} />
                    Click to view full size
                  </div>
                </div>

                {/* Previous button */}
                {post.images.length > 1 && currentImageIndex > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 z-10"
                  >
                    <ChevronLeft size={24} className="text-gray-800" />
                  </button>
                )}
                
                {/* Next button */}
                {post.images.length > 1 && currentImageIndex < post.images.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 z-10"
                  >
                    <ChevronRight size={24} className="text-gray-800" />
                  </button>
                )}

                {/* Image counter */}
                {post.images.length > 1 && (
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                    {currentImageIndex + 1} / {post.images.length}
                  </div>
                )}

                {/* Dot indicators */}
                {post.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {post.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                        className={`transition-all ${
                          index === currentImageIndex 
                            ? 'w-8 h-2 bg-white' 
                            : 'w-2 h-2 bg-white/60 hover:bg-white/80'
                        } rounded-full`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lightbox Modal */}
          {showLightbox && (
            <div 
              className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
              onClick={closeLightbox}
            >
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
              >
                <X size={24} />
              </button>

              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white rounded-full text-sm font-medium">
                {lightboxImageIndex + 1} / {post.images.length}
              </div>

              <div 
                className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={post.images[lightboxImageIndex]}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {lightboxImageIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevLightboxImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                >
                  <ChevronLeft size={32} />
                </button>
              )}

              {lightboxImageIndex < post.images.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextLightboxImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                >
                  <ChevronRight size={32} />
                </button>
              )}

              {post.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-3 bg-black/60 rounded-lg max-w-[90%] overflow-x-auto">
                  {post.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImageIndex(index);
                      }}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === lightboxImageIndex
                          ? 'border-white scale-110'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reactions Summary */}
          <div className="px-3 pt-3 pb-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {(() => {
                const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
                if (totalReactions > 0) {
                  // Get top 3 reactions from backend or calculate from current state
                  let topReactions = post.topReactions || [];
                  
                  // If topReactions not provided by backend, calculate from current reactions state
                  if (!topReactions || topReactions.length === 0) {
                    const reactionArray = [
                      { type: 'like', count: reactions.like, emoji: '👍' },
                      { type: 'love', count: reactions.love, emoji: '❤️' },
                      { type: 'haha', count: reactions.haha, emoji: '😂' },
                      { type: 'wow', count: reactions.wow, emoji: '😮' },
                      { type: 'sad', count: reactions.sad, emoji: '😢' },
                      { type: 'angry', count: reactions.angry, emoji: '😠' }
                    ];
                    
                    topReactions = reactionArray
                      .filter(r => r.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 3)
                      .map(r => ({ type: r.type, emoji: r.emoji }));
                  }
                  
                  return (
                    <button 
                      onClick={handleShowLikes}
                      className={`flex items-center gap-1.5 ${
                        post.author?._id === authUser?._id 
                          ? 'hover:underline cursor-pointer' 
                          : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-center -space-x-1">
                        {topReactions.map((reaction, index) => (
                          <span key={index} className="text-base">{reaction.emoji}</span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{totalReactions} Reaction</span>
                    </button>
                  );
                }
                return null;
              })()}
            </div>
            <div className="flex items-center gap-4 text-gray-700 font-medium">
              <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
              <span>{post.shares || 0} shares</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-10 pb-2 pt-1 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <div className="flex-1 relative">
                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all text-sm ${
                    userReaction === 'like' ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' :
                    userReaction === 'love' ? 'text-red-600 bg-red-50 hover:bg-red-100' :
                    userReaction === 'haha' ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' :
                    userReaction === 'wow' ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' :
                    userReaction === 'sad' ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' :
                    userReaction === 'angry' ? 'text-red-700 bg-red-50 hover:bg-red-100' :
                    'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {userReaction === 'like' && <span>👍</span>}
                  {userReaction === 'love' && <span>❤️</span>}
                  {userReaction === 'haha' && <span>😂</span>}
                  {userReaction === 'wow' && <span>😮</span>}
                  {userReaction === 'sad' && <span>😢</span>}
                  {userReaction === 'angry' && <span>😠</span>}
                  {!userReaction && <Heart size={18} />}
                  <span className="font-medium">
                    {userReaction === 'like' ? 'Like' :
                     userReaction === 'love' ? 'Love' :
                     userReaction === 'haha' ? 'Haha' :
                     userReaction === 'wow' ? 'Wow' :
                     userReaction === 'sad' ? 'Sad' :
                     userReaction === 'angry' ? 'Angry' : 'Like'}
                  </span>
                </button>

                {/* Reaction Picker - Click to open/close */}
                {showReactionPicker && (
                  <>
                    {/* Backdrop to close picker */}
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setShowReactionPicker(false)}
                    />
                    <div 
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-full shadow-2xl border border-gray-200 px-3 py-2 flex space-x-2 z-30"
                    >
                      <button
                        onClick={() => { handleReact('like'); setShowReactionPicker(false); }}
                        className="hover:scale-125 transition-transform text-2xl p-1 rounded-full hover:bg-gray-100"
                        title="Like"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => { handleReact('love'); setShowReactionPicker(false); }}
                        className="hover:scale-125 transition-transform text-2xl p-1 rounded-full hover:bg-gray-100"
                        title="Love"
                      >
                        ❤️
                      </button>
                      <button
                        onClick={() => { handleReact('haha'); setShowReactionPicker(false); }}
                        className="hover:scale-125 transition-transform text-2xl p-1 rounded-full hover:bg-gray-100"
                        title="Haha"
                      >
                        😂
                      </button>
                      <button
                        onClick={() => { handleReact('wow'); setShowReactionPicker(false); }}
                        className="hover:scale-125 transition-transform text-2xl p-1 rounded-full hover:bg-gray-100"
                        title="Wow"
                      >
                        😮
                      </button>
                      <button
                        onClick={() => { handleReact('sad'); setShowReactionPicker(false); }}
                        className="hover:scale-125 transition-transform text-2xl p-1 rounded-full hover:bg-gray-100"
                        title="Sad"
                      >
                        😢
                      </button>
                      <button
                        onClick={() => { handleReact('angry'); setShowReactionPicker(false); }}
                        className="hover:scale-125 transition-transform text-2xl p-1 rounded-full hover:bg-gray-100"
                        title="Angry"
                      >
                        😠
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all">
                <MessageCircle size={18} />
                <span className="font-medium">Comment</span>
              </button>

              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all"
              >
                <Share2 size={12} />
                <span>Share</span>
              </button>

              <button
                onClick={handleSave}
                className={`p-2 rounded-lg transition-all ${
                  isSaved
                    ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Bookmark className={isSaved ? 'fill-current' : ''} size={18} />
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-100">
            <div className="p-4">
              <CommentsSection 
                post={post} 
                onCommentCountChange={handleCommentCountChange}
              />
            </div>
          </div>
          
          {/* Legacy Comment Section (Hidden) - Keep for reference */}
          {false && (
            <>
              {/* Old Comments Section (Legacy) */}
              <div className="border-t border-gray-100 bg-gray-50">
            {/* Add Comment */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] flex-shrink-0">
                  <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {authUser?.avatar ? (
                      <img 
                        src={authUser.avatar} 
                        alt={authUser.username} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-xs font-medium text-gray-700">
                        {authUser?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleComment(e);
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim() || isSubmitting}
                    className="px-4 py-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md text-sm font-semibold"
                  >
                    {isSubmitting ? '...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3 group">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {comment.author?.avatar ? (
                        <img 
                          src={comment.author.avatar} 
                          alt={comment.author.username} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-xs font-medium text-gray-600">
                          {comment.author?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="bg-white rounded-2xl px-4 py-2.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-gray-900">
                            {comment.author?.username || 'User'}
                          </p>
                          {(comment.author?._id === authUser._id || post.author?._id === authUser._id) && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all"
                            >
                              <X size={14} className="text-gray-500" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 ml-4">
                        <button className="text-xs text-gray-600 hover:text-gray-900 font-medium">
                          Like
                        </button>
                        <button className="text-xs text-gray-600 hover:text-gray-900 font-medium">
                          Reply
                        </button>
                        <span className="text-xs text-gray-500">
                          {formatTime(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No comments yet</p>
                  <p className="text-sm mt-1">Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>
            </>
          )}
        </div>

        {/* Likes Modal - Only for Post Owner */}
        {showLikesModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
            onClick={() => setShowLikesModal(false)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Reactions</h3>
                <button
                  onClick={() => setShowLikesModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingLikes ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-500"></div>
                  </div>
                ) : likesData.length > 0 ? (
                  <div className="space-y-2">
                    {likesData.map((reaction) => {
                      const user = reaction.user;
                      const reactionType = reaction.reactionType;
                      
                      // Map reaction types to emojis
                      const reactionEmoji = {
                        like: '👍',
                        love: '❤️',
                        haha: '😂',
                        wow: '😮',
                        sad: '😢',
                        angry: '😠'
                      }[reactionType] || '❤️';
                      
                      const reactionColor = {
                        like: 'text-blue-600',
                        love: 'text-red-500',
                        haha: 'text-yellow-500',
                        wow: 'text-orange-500',
                        sad: 'text-blue-400',
                        angry: 'text-red-700'
                      }[reactionType] || 'text-red-500';
                      
                      return (
                        <div 
                          key={user._id} 
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                          onClick={() => {
                            navigate(`/profile/${user.username}`);
                            setShowLikesModal(false);
                          }}
                        >
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] flex-shrink-0">
                            <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                              {user.avatar ? (
                                <img 
                                  src={user.avatar} 
                                  alt={user.username} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <span className="text-gray-700 font-bold">
                                  {user.username?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {user.username || user.name || 'User'}
                            </p>
                            {user.name && user.name !== user.username && (
                              <p className="text-sm text-gray-500 truncate">{user.name}</p>
                            )}
                          </div>
                          <div className={`text-2xl ${reactionColor}`}>
                            <span>{reactionEmoji}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Heart size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No reactions yet</p>
                    <p className="text-sm mt-1">Be the first to react!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetailPage;