// client/src/pages/HomePage.jsx - Complete Enhanced Version
import React, { useEffect, useState, useRef, useCallback } from "react";
import { 
  Heart, MessageCircle, Share2, Send, Image as ImageIcon, X, 
  MoreHorizontal, TrendingUp, Bookmark, Smile, MapPin, 
  Eye, EyeOff, Globe, Lock, Users, Play, Pause, Volume2, VolumeX,
  ChevronLeft, ChevronRight, Repeat, ThumbsUp, Laugh, AlertCircle
} from 'lucide-react';
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPosts, createPost, uploadPostImages } from "../services/api";
import axiosInstance from "../lib/axios";

// API helper functions
const likePost = async (postId) => {
  const response = await axiosInstance.post(`/posts/${postId}/like`);
  return response.data;
};

const addComment = async (postId, data) => {
  const response = await axiosInstance.post(`/posts/${postId}/comment`, data);
  return response.data;
};

const deleteComment = async (postId, commentId) => {
  const response = await axiosInstance.delete(`/posts/${postId}/comment/${commentId}`);
  return response.data;
};

// Enhanced Create Post Component
const CreatePostExpanded = ({ onPostCreated, user, onCollapse }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [privacy, setPrivacy] = useState('public');
  const [location, setLocation] = useState('');
  const [feeling, setFeeling] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const textareaRef = useRef(null);
  
  const maxImages = 10;
  const maxCharacters = 5000;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const feelings = [
    { emoji: '😊', label: 'happy' },
    { emoji: '😍', label: 'loved' },
    { emoji: '😎', label: 'cool' },
    { emoji: '😴', label: 'tired' },
    { emoji: '🎉', label: 'celebrating' },
    { emoji: '💪', label: 'motivated' },
    { emoji: '🤔', label: 'thoughtful' },
    { emoji: '😋', label: 'hungry' },
  ];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      const isUnderLimit = file.size <= 5 * 1024 * 1024; // 5MB
      if (!isValid) toast.error(`${file.name} is not an image`);
      if (!isUnderLimit) toast.error(`${file.name} exceeds 5MB limit`);
      return isValid && isUnderLimit;
    });

    const newImages = validFiles.slice(0, maxImages - images.length).map(file => ({
      id: Math.random().toString(36).slice(2),
      url: URL.createObjectURL(file),
      file
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.url) URL.revokeObjectURL(img.url);
      return prev.filter(img => img.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      toast.error('Please add some content or images');
      return;
    }

    setIsPosting(true);
    try {
      let imageUrls = [];

      if (images.length > 0) {
        const imageFiles = images.map(img => img.file).filter(Boolean);
        
        if (imageFiles.length > 0) {
          const uploadResponse = await uploadPostImages(imageFiles, (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          });
          
          if (Array.isArray(uploadResponse)) {
            imageUrls = uploadResponse;
          } else if (uploadResponse?.images) {
            imageUrls = uploadResponse.images;
          }
        }
      }

      const postData = {
        content: content.trim(),
        images: imageUrls,
        privacy,
        ...(location && { location }),
        ...(feeling && { feeling })
      };

      await createPost(postData);
      toast.success('Post created successfully! 🎉');
      
      setContent('');
      setImages([]);
      setLocation('');
      setFeeling('');
      setUploadProgress(0);
      
      if (onPostCreated) onPostCreated();
      if (onCollapse) onCollapse();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const privacyOptions = [
    { value: 'public', icon: Globe, label: 'Public', desc: 'Anyone can see' },
    { value: 'friends', icon: Users, label: 'Friends', desc: 'Only friends' },
    { value: 'private', icon: Lock, label: 'Only Me', desc: 'Just you' }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onCollapse}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onCollapse}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isPosting}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold">Create Post</h2>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isPosting || (!content.trim() && images.length === 0)}
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          >
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* Upload Progress */}
        {isPosting && uploadProgress > 0 && (
          <div className="px-6 py-2 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-blue-700 font-medium">Uploading images...</span>
              <span className="text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* User Info & Privacy */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px]">
                <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-700 font-bold">{user?.username?.charAt(0) || 'U'}</span>
                  )}
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.username || 'User'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full border-none outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    {privacyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {feeling && (
                    <span className="text-sm text-gray-600">
                      — feeling {feeling}
                    </span>
                  )}
                  {location && (
                    <span className="text-sm text-gray-600">
                      at {location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Input */}
          <textarea
            ref={textareaRef}
            placeholder={`What's on your mind, ${user?.username?.split(' ')[0] || 'there'}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={maxCharacters}
            className="w-full min-h-32 max-h-64 text-lg border-0 resize-none focus:outline-none placeholder:text-gray-400"
            disabled={isPosting}
          />

          {/* Character Counter */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex gap-2">
              {feeling && (
                <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full flex items-center gap-1">
                  {feelings.find(f => f.label === feeling)?.emoji}
                  <span>{feeling}</span>
                  <button onClick={() => setFeeling('')} className="hover:text-yellow-900">
                    <X size={14} />
                  </button>
                </span>
              )}
              {location && (
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{location}</span>
                  <button onClick={() => setLocation('')} className="hover:text-green-900">
                    <X size={14} />
                  </button>
                </span>
              )}
            </div>
            <span className={`${
              content.length > maxCharacters * 0.9 ? 'text-red-500 font-semibold' : 'text-gray-500'
            }`}>
              {content.length} / {maxCharacters}
            </span>
          </div>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className={`grid gap-2 ${
              images.length === 1 ? 'grid-cols-1' : 
              images.length === 2 ? 'grid-cols-2' : 
              'grid-cols-3'
            }`}>
              {images.map((img, index) => (
                <div 
                  key={img.id} 
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                    disabled={isPosting}
                  >
                    <X size={16} />
                  </button>
                  {index === 0 && images.length > 1 && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-xs font-medium">
                      Cover
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Feeling Picker */}
          {showEmojiPicker && (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700 mb-3">How are you feeling?</p>
              <div className="grid grid-cols-4 gap-2">
                {feelings.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => {
                      setFeeling(f.label);
                      setShowEmojiPicker(false);
                    }}
                    className="flex flex-col items-center gap-1 p-3 hover:bg-white rounded-lg transition-colors"
                  >
                    <span className="text-2xl">{f.emoji}</span>
                    <span className="text-xs text-gray-600 capitalize">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Add to your post</p>
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 px-4 py-2.5 text-green-600 hover:bg-green-50 rounded-lg cursor-pointer transition-colors flex-1 justify-center">
                <ImageIcon size={20} />
                <span className="text-sm font-medium">Photo/Video</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isPosting || images.length >= maxImages}
                />
              </label>
              
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex items-center gap-2 px-4 py-2.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors flex-1 justify-center"
                disabled={isPosting}
              >
                <Smile size={20} />
                <span className="text-sm font-medium">Feeling</span>
              </button>
              
              <button
                onClick={() => {
                  const loc = prompt('Where are you?');
                  if (loc) setLocation(loc);
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-1 justify-center"
                disabled={isPosting}
              >
                <MapPin size={20} />
                <span className="text-sm font-medium">Location</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Create Post Component
const CreatePostQuick = ({ onExpand, user }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 animate-fadeIn hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] flex-shrink-0">
          <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-700 font-medium">{user?.username?.charAt(0) || 'U'}</span>
            )}
          </div>
        </div>
        <button
          className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-full px-5 py-3 text-left cursor-pointer transition-all"
          onClick={onExpand}
        >
          <p className="text-gray-600">What's on your mind, {user?.username?.split(' ')[0] || 'there'}?</p>
        </button>
      </div>
      
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
        <button 
          onClick={onExpand}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-all font-medium"
        >
          <ImageIcon className="h-5 w-5" />
          <span className="text-sm">Photo/Video</span>
        </button>
        <button 
          onClick={onExpand}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all font-medium"
        >
          <Smile className="h-5 w-5" />
          <span className="text-sm">Feeling</span>
        </button>
        <button 
          onClick={onExpand}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
        >
          <MapPin className="h-5 w-5" />
          <span className="text-sm">Check in</span>
        </button>
      </div>
    </div>
  );
};

// Enhanced Post Card Component  
const PostCard = ({ post, currentUser, onPostUpdate, onPostDelete }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setLiked(post.likes?.includes(currentUser?._id));
    setLikeCount(post.likes?.length || 0);
    setComments(post.comments || []);
  }, [post.likes, post.comments, currentUser]);

  const handleLike = async () => {
    try {
      const res = await likePost(post._id);
      setLiked(res.isLiked);
      setLikeCount(res.likes);
      
      if (res.isLiked) {
        toast.success('', {
          icon: '❤️',
          duration: 1000,
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      const res = await addComment(post._id, { 
        content: commentText.trim(),
        parentId: replyingTo 
      });
      setComments([...comments, res.comment]);
      setCommentText('');
      setReplyingTo(null);
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await deleteComment(post._id, commentId);
      setComments(comments.filter(c => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleShare = async () => {
    try {
      const postUrl = `${window.location.origin}/post/${post._id}`;
      await navigator.clipboard.writeText(postUrl);
      toast.success('Link copied to clipboard!');
      setShowShareModal(false);
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share post');
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const author = post.author || post.user;
  const avatarUrl = author?.avatar;
  const userName = author?.username || author?.name || 'Anonymous';
  
  const contentPreview = post.content?.length > 300 && !isExpanded 
    ? post.content.slice(0, 300) + '...' 
    : post.content;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 animate-slideUp">
      {/* Post Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div 
            className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] cursor-pointer flex-shrink-0"
            onClick={() => navigate(`/profile`)}
          >
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-700 font-bold">{userName.charAt(0)}</span>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 
                className="font-semibold text-gray-900 hover:underline cursor-pointer"
                onClick={() => navigate(`/profile`)}
              >
                {userName}
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
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10 animate-scaleIn">
              {post.author?._id === currentUser?._id && (
                <>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm">
                    Edit post
                  </button>
                  <button 
                    onClick={() => {
                      setShowOptions(false);
                      onPostDelete?.(post._id);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm text-red-600"
                  >
                    Delete post
                  </button>
                  <div className="border-t border-gray-100 my-2"></div>
                </>
              )}
              <button 
                onClick={() => {
                  setBookmarked(!bookmarked);
                  setShowOptions(false);
                  toast.success(bookmarked ? 'Post removed from saved' : 'Post saved!');
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
              >
                {bookmarked ? 'Unsave post' : 'Save post'}
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
              <button className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm text-red-600">
                Report post
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

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className="relative">
          {post.images.length === 1 && (
            <div className="relative">
              <img 
                src={post.images[0]} 
                alt="" 
                className="w-full max-h-[600px] object-cover"
              />
            </div>
          )}

          {post.images.length > 1 && (
            <div className="relative bg-black">
              <img 
                src={post.images[currentImageIndex]} 
                alt="" 
                className="w-full max-h-[600px] object-contain mx-auto"
              />
              
              {/* Image Navigation */}
              {currentImageIndex > 0 && (
                <button
                  onClick={() => setCurrentImageIndex(prev => prev - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              
              {currentImageIndex < post.images.length - 1 && (
                <button
                  onClick={() => setCurrentImageIndex(prev => prev + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              )}

              {/* Image Counter */}
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 text-white rounded-full text-sm font-medium">
                {currentImageIndex + 1} / {post.images.length}
              </div>

              {/* Dots Indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {post.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? 'bg-white w-8' 
                        : 'bg-white/60 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reactions Summary */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {likeCount > 0 && (
            <button className="flex items-center gap-1.5 hover:underline">
              <div className="flex items-center gap-1">
                <span className="text-small">❤️</span>
                <span className="text-small">👍</span>
                <span className="text-small">😊</span>
              </div>
              <span className="text-sm text-gray-700 font-medium">{likeCount} reactions</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 text-gray-700 font-medium">
          <button 
            onClick={() => setShowComments(!showComments)}
            className="hover:underline"
          >
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </button>
          <span>{post.shares || 0} shares</span>
        </div>
      </div>

     {/* Action Buttons (compact) */}
<div className="px-3 pb-2 pt-1 border-t border-gray-100">
  <div className="flex items-center gap-1">
    <button
      onClick={handleLike}
      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all text-sm ${
        liked
          ? 'text-red-500 bg-red-50 hover:bg-red-100'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Heart className={liked ? 'fill-current' : ''} size={12} />
      <span>Like</span>
    </button>

    <button
      onClick={() => setShowComments(!showComments)}
      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all"
    >
      <MessageCircle size={12} />
      <span>Comment</span>
    </button>

    <button
      onClick={() => setShowShareModal(true)}
      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all"
    >
      <Share2 size={12} />
      <span>Share</span>
    </button>

    <button
      onClick={() => {
        setBookmarked(!bookmarked);
        toast.success(bookmarked ? 'Removed from saved' : 'Post saved!');
      }}
      aria-label={bookmarked ? 'Unsave post' : 'Save post'}
      className={`p-1.5 rounded-lg transition-all ${
        bookmarked
          ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Bookmark className={bookmarked ? 'fill-current' : ''} size={16} />
    </button>
  </div>
</div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 bg-gray-50 animate-slideDown">
          {/* Comments List */}
          {comments.length > 0 && (
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-3 group">
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {comment.author?.avatar ? (
                      <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-gray-600">
                        {comment.author?.username?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="bg-white rounded-2xl px-4 py-2.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-gray-900">
                          {comment.author?.username || 'User'}
                        </p>
                        {comment.author?._id === currentUser?._id && (
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
                      <button 
                        onClick={() => setReplyingTo(comment._id)}
                        className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                      >
                        Reply
                      </button>
                      <span className="text-xs text-gray-500">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            {replyingTo && (
              <div className="mb-2 flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">
                  Replying to {comments.find(c => c._id === replyingTo)?.author?.username}
                </span>
                <button onClick={() => setReplyingTo(null)}>
                  <X size={16} className="text-blue-600" />
                </button>
              </div>
            )}
            
            <div className="flex gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] flex-shrink-0">
                <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-medium text-gray-700">
                      {currentUser?.username?.charAt(0) || 'U'}
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
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
                  className="flex-1 px-4 py-2.5 bg-gray-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  onClick={handleComment}
                  className="p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  disabled={!commentText.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Share Post</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors text-left"
              >
                <div className="p-3 bg-blue-50 rounded-full">
                  <Share2 size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Copy link</p>
                  <p className="text-sm text-gray-500">Share via link</p>
                </div>
              </button>
              
              <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors text-left">
                <div className="p-3 bg-green-50 rounded-full">
                  <MessageCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Send in message</p>
                  <p className="text-sm text-gray-500">Share with friends</p>
                </div>
              </button>
              
              <button className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors text-left">
                <div className="p-3 bg-purple-50 rounded-full">
                  <Repeat size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Share to Feed</p>
                  <p className="text-sm text-gray-500">Post to your timeline</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main HomePage Component
export default function HomePage() {
  const { authUser: user, isCheckingAuth: loading } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState(false);
  const [showExpandedCreate, setShowExpandedCreate] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = async (skip = 0, limit = 10) => {
    try {
      if (skip === 0) {
        setLoadingPosts(true);
      } else {
        setLoadingMore(true);
      }

      const res = await getPosts(skip, limit);
      
      let postsData = [];
      if (Array.isArray(res)) {
        postsData = res;
      } else if (res?.posts) {
        postsData = res.posts;
      } else if (res?.data) {
        postsData = res.data;
      }

      if (skip === 0) {
        setPosts(postsData);
      } else {
        setPosts(prev => [...prev, ...postsData]);
      }

      setHasMore(postsData.length === limit);
      setError(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (skip === 0) {
        toast.error('Failed to load posts');
        setPosts([]);
        setError(true);
      }
    } finally {
      setLoadingPosts(false);
      setLoadingMore(false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const handlePostDelete = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await axiosInstance.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(post => post._id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore && !loadingPosts) {
      fetchPosts(posts.length, 10);
    }
  }, [loadingMore, hasMore, posts.length, loadingPosts]);

  useEffect(() => {
    if (!loading) {
      fetchPosts();
    }
  }, [loading]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop 
        >= document.documentElement.offsetHeight - 500
      ) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMorePosts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to load posts</h3>
          <p className="text-gray-600 mb-6">We couldn't load your feed. Please try again.</p>
          <button 
            onClick={() => fetchPosts()}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold shadow-sm hover:shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 1000px; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="max-w-7xl mx-auto flex gap-6 p-4">
        {/* Left Sidebar - User Info
        <div className="hidden xl:block w-72 flex-shrink-0">
          <div className="sticky top-4 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-fadeIn">
              <div className="flex flex-col items-center text-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[3px] mb-4">
                  <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-gray-700">{user?.username?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{user?.username}</h3>
                <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                
                <div className="flex items-center gap-4 mt-6 w-full">
                  <div className="flex-1 text-center">
                    <p className="font-bold text-gray-900">{posts.filter(p => p.author?._id === user?._id).length}</p>
                    <p className="text-xs text-gray-500">Posts</p>
                  </div>
                  <div className="flex-1 text-center border-x border-gray-200">
                    <p className="font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-500">Friends</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-500">Saved</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-fadeIn">
              <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                {[
                  { icon: '👥', label: 'Friends', count: 0 },
                  { icon: '💾', label: 'Saved', count: 0 },
                  { icon: '📷', label: 'Photos', count: 0 },
                  { icon: '🎥', label: 'Videos', count: 0 },
                ].map((item, i) => (
                  <button key={i} className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="font-medium text-gray-700">{item.label}</span>
                    </div>
                    <span className="text-sm text-gray-500">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div> */}

        {/* Main Feed */}
        <div className="flex-1 max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center py-6 animate-fadeIn">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              NETSPHERE
            </h1>
            <p className="text-gray-600 mt-2">Share your moments</p>
          </div>

          {/* Create Post */}
          <CreatePostQuick 
            user={user} 
            onExpand={() => setShowExpandedCreate(true)}
          />

          {/* Posts Feed */}
          {loadingPosts ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading posts...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  currentUser={user}
                  onPostUpdate={handlePostUpdate}
                  onPostDelete={handlePostDelete}
                />
              ))}

              {/* Load More Indicator */}
              {loadingMore && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-500"></div>
                </div>
              )}

              {/* End of Feed */}
              {!hasMore && posts.length > 0 && (
                <div className="text-center py-8 animate-fadeIn">
                  <div className="inline-block p-4 bg-white rounded-full shadow-sm border border-gray-200 mb-3">
                    <span className="text-3xl">🎉</span>
                  </div>
                  <p className="text-gray-600 font-medium">You're all caught up!</p>
                  <p className="text-sm text-gray-500 mt-1">Check back later for more posts</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200 animate-fadeIn">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-6">Be the first to share something amazing!</p>
              <button
                onClick={() => setShowExpandedCreate(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold shadow-sm hover:shadow-md"
              >
                Create Your First Post
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar - Trending */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-4 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-fadeIn">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-bold text-gray-900">Trending Now</h2>
              </div>
              <div className="space-y-4">
                {[
                  { rank: 1, tag: 'WebDevelopment', posts: '2.4K', hot: true },
                  { rank: 2, tag: 'Photography', posts: '1.8K', hot: true },
                  { rank: 3, tag: 'AI', posts: '3.2K', hot: true },
                  { rank: 4, tag: 'Travel', posts: '1.5K', hot: false },
                  { rank: 5, tag: 'Fitness', posts: '987', hot: true }
                ].map((trend) => (
                  <div key={trend.rank} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-bold text-sm w-6">#{trend.rank}</span>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          #{trend.tag}
                        </p>
                        <p className="text-xs text-gray-500">{trend.posts} posts</p>
                      </div>
                    </div>
                    {trend.hot && (
                      <span className="px-2.5 py-1 bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs rounded-full font-bold shadow-sm">
                        🔥 Hot
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white animate-fadeIn">
              <h3 className="font-bold text-xl mb-2">Premium Features</h3>
              <p className="text-sm text-blue-100 mb-4">Unlock advanced features and grow your network faster</p>
              <button className="w-full bg-white text-blue-600 font-semibold py-2.5 rounded-xl hover:bg-blue-50 transition-all">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Create Post Modal */}
      {showExpandedCreate && (
        <CreatePostExpanded
          user={user}
          onPostCreated={() => fetchPosts(0, 10)}
          onCollapse={() => setShowExpandedCreate(false)}
        />
      )}
    </div>
  );
}