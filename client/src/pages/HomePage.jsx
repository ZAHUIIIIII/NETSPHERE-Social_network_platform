import React, { useEffect, useState, useRef, useCallback } from "react";
import { 
  Heart, MessageCircle, Send, Image as ImageIcon, X, 
  MoreHorizontal, TrendingUp, Bookmark, Smile, MapPin, 
  Eye, EyeOff, Globe, Lock, Users, Play, Pause, Volume2, VolumeX,
  ChevronLeft, ChevronRight, Repeat, ThumbsUp, Laugh, AlertCircle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  getPosts, 
  createPost, 
  uploadPostImages,
  savePost as savePostAPI,
  checkPostSaved,
  reactToPost as reactToPostAPI,
  repostPost as repostPostAPI
} from "../services/api";

import axiosInstance from "../lib/axios";
import { formatTime } from "../lib/utils";
import SuggestedUsers from '../components/common/SuggestedUsers';
import CommentsSection from '../components/comment/CommentsSection';
import EditPostModal from '../components/EditPostModal';
import ReportPostModal from '../components/ReportPostModal';
import { countTotalComments, listRootComments } from "../services/commentApi";
import PortalDropdown from '../components/common/PortalDropdown';
// import { 
//   likePost as likePostAPI
// } from "../services/api";


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
      const isUnderLimit = file.size <= 20 * 1024 * 1024; // 20MB
      if (!isValid) toast.error(`${file.name} is not an image`);
      if (!isUnderLimit) toast.error(`${file.name} exceeds 20MB limit`);
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
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900"
              disabled={isPosting}
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Create Post</h2>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isPosting || (!content.trim() && images.length === 0)}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
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
            className="w-full min-h-32 max-h-64 text-lg text-gray-900 border-0 resize-none focus:outline-none placeholder:text-gray-400"
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
const PostCard = ({ post, currentUser, onPostUpdate, onPostDelete, onReactionUpdate }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [userReaction, setUserReaction] = useState(null);
  const [reactions, setReactions] = useState({ like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 });
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [loadingCommentCount, setLoadingCommentCount] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [isReposting, setIsReposting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likesData, setLikesData] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    // Initialize reactions from post data
    if (post.reactions) {
      const reactionCounts = {
        like: Array.isArray(post.reactions.like) ? post.reactions.like.length : (post.reactions.like || 0),
        love: Array.isArray(post.reactions.love) ? post.reactions.love.length : (post.reactions.love || 0),
        haha: Array.isArray(post.reactions.haha) ? post.reactions.haha.length : (post.reactions.haha || 0),
        wow: Array.isArray(post.reactions.wow) ? post.reactions.wow.length : (post.reactions.wow || 0),
        sad: Array.isArray(post.reactions.sad) ? post.reactions.sad.length : (post.reactions.sad || 0),
        angry: Array.isArray(post.reactions.angry) ? post.reactions.angry.length : (post.reactions.angry || 0)
      };
      setReactions(reactionCounts);
      
      // Find user's reaction (only if reactions are arrays from backend)
      const reactionTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
      for (const type of reactionTypes) {
        if (Array.isArray(post.reactions[type]) && post.reactions[type].includes(currentUser?._id)) {
          setUserReaction(type);
          break;
        }
      }
    } else {
      // Fallback to legacy likes
      setLiked(post.likes?.includes(currentUser?._id));
      setLikeCount(post.likes?.length || 0);
    }
    
    // Initialize repost state
    setReposted(post.reposts?.includes(currentUser?._id) || false);
    setRepostCount(post.repostCount || 0);
    
    // Fetch accurate comment count on mount
    fetchInitialCommentCount();
    
    // Check if post is saved
    checkIfSaved();
  }, [post.likes, post.reactions, post.comments, post.reposts, currentUser, post._id]);

  const fetchInitialCommentCount = async () => {
    try {
      // Fetch first page of root comments to get initial count estimate
      // The accurate count will be updated when CommentsSection loads
      const data = await listRootComments(post._id, {
        limit: 20,
        after: ''
      });
      const totalCount = countTotalComments(data.items);
      setCommentCount(totalCount);
    } catch (error) {
      console.error('Error fetching comment count:', error);
      // Silently fail, count will be updated when comments are opened
      setCommentCount(0);
    }
  };

  const checkIfSaved = async () => {
    try {
      const result = await checkPostSaved(post._id);
      setBookmarked(result.isSaved || false);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleSaveToggle = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const result = await savePostAPI(post._id);
      setBookmarked(result.isSaved);
      toast.success(result.isSaved ? 'Post saved!' : 'Post removed from saved', {
        icon: result.isSaved ? '🔖' : '📌',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReact = async (reactionType) => {
    const oldReaction = userReaction;
    const oldReactions = { ...reactions };
    
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
        
        // Optimistic UI update - backend will provide topReactions in response
        if (onReactionUpdate) {
          onReactionUpdate(post._id, {
            reactions: newReactions
          });
        }
        
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
        
        // Optimistic UI update
        if (onReactionUpdate) {
          onReactionUpdate(post._id, {
            reactions: newReactions
          });
        }
      }
      
      // Get updated data from backend (includes topReactions)
      const res = await reactToPostAPI(post._id, reactionType);
      
      // Update with server response
      setUserReaction(res.userReaction);
      setReactions(res.reactions);
      setLiked(res.isLiked);
      setLikeCount(res.likes);
      
      // Update parent with backend's calculated topReactions
      if (onReactionUpdate) {
        onReactionUpdate(post._id, {
          reactions: res.reactions,
          topReactions: res.topReactions, // Use backend-calculated top reactions
          likes: res.likes
        });
      }
    } catch (error) {
      console.error('Error reacting to post:', error);
      // Rollback on error
      setUserReaction(oldReaction);
      setReactions(oldReactions);
      if (onReactionUpdate) {
        onReactionUpdate(post._id, {
          reactions: oldReactions
        });
      }
      toast.error('Failed to react to post');
    }
  };

  const handleRepost = async () => {
    if (isReposting) return;
    
    try {
      setIsReposting(true);
      const response = await repostPostAPI(post._id);
      
      if (response.reposted) {
        setReposted(true);
        setRepostCount(prev => prev + 1);
        toast.success('Post reposted!');
      } else {
        setReposted(false);
        setRepostCount(prev => Math.max(0, prev - 1));
        toast.success('Repost removed');
      }
    } catch (error) {
      console.error('Error reposting:', error);
      toast.error(error.response?.data?.message || 'Failed to repost');
    } finally {
      setIsReposting(false);
    }
  };


  // Image Lightbox Handlers
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
      const response = await axiosInstance.get(`/posts/${post._id}/likes`);
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

  const author = post.author || post.user;
  const avatarUrl = author?.avatar;
  const userName = author?.username || author?.name || 'Anonymous';
  
  const contentPreview = post.content?.length > 300 && !isExpanded 
    ? post.content.slice(0, 300) + '...' 
    : post.content;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 animate-slideUp">
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
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
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

        <PortalDropdown
          isOpen={showOptions}
          onClose={() => setShowOptions(false)}
          width="w-48"
          trigger={
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal size={20} className="text-gray-500" />
            </button>
          }
          className="py-2"
        >
          {post.author?._id === currentUser?._id && (
            <>
              <button 
                onClick={() => {
                  setShowOptions(false);
                  setShowEditModal(true);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
              >
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
              handleSaveToggle();
              setShowOptions(false);
            }}
            disabled={isSaving}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
          >
            {bookmarked ? 'Unsave post' : 'Save post'}
          </button>
          <button 
            onClick={async () => {
              try {
                const postUrl = `${window.location.origin}/post/${post._id}`;
                await navigator.clipboard.writeText(postUrl);
                toast.success('Link copied to clipboard!');
                setShowOptions(false);
              } catch (error) {
                console.error('Error copying link:', error);
                toast.error('Failed to copy link');
              }
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
          >
            Copy link
          </button>
          {post.author?._id !== currentUser?._id && (
            <button 
              onClick={() => {
                setShowReportModal(true);
                setShowOptions(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm text-red-600"
            >
              Report post
            </button>
          )}
        </PortalDropdown>
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

      {/* Post Images - Carousel with Horizontal Crop */}
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
            
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <Eye size={16} />
                Click to view full size
              </div>
            </div>

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

            {post.images.length > 1 && (
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                {currentImageIndex + 1} / {post.images.length}
              </div>
            )}

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
                    aria-label={`Go to image ${index + 1}`}
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
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center animate-fadeIn"
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
                    post.author?._id === currentUser?._id 
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
          <button 
            onClick={() => setShowComments(!showComments)}
            className="hover:underline"
          >
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </button>
          <span>{post.repostCount || 0} {post.repostCount === 1 ? 'repost' : 'reposts'}</span>
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

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            <MessageCircle size={18} />
            <span className="font-medium">Comment</span>
          </button>

          <button
            onClick={handleRepost}
            disabled={isReposting}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm transition-all disabled:opacity-50 ${
              reposted
                ? 'text-green-600 bg-green-50 hover:bg-green-100'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="font-medium">Repost</span>
          </button>

          <button
            onClick={handleSaveToggle}
            disabled={isSaving}
            aria-label={bookmarked ? 'Unsave post' : 'Save post'}
            className={`p-1.5 rounded-lg transition-all disabled:opacity-50 ${
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
        <CommentsSection 
          post={post}
          onCommentCountChange={(count) => setCommentCount(count)}
        />
      )}

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

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        post={post}
        onPostUpdated={(updatedPost) => {
          onPostUpdate?.(updatedPost);
          setShowEditModal(false);
        }}
      />

      {/* Report Post Modal */}
      {showReportModal && (
        <ReportPostModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          postId={post._id}
          postAuthor={post.author?.name || post.author?.username}
        />
      )}
    </div>
  );
};

// Main HomePage Component
export default function HomePage() {
  const { authUser: user, isCheckingAuth: loading, socket } = useAuthStore();
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

  const handleReactionUpdate = (postId, updates) => {
    setPosts(prev => prev.map(post => 
      post._id === postId ? { ...post, ...updates } : post
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

  // Listen for post created event from Navbar
  useEffect(() => {
    const handlePostCreated = (event) => {
      console.log('📝 New post created event received:', event.detail);
      
      // If we have the post data in the event, add it to the top of the feed
      if (event.detail && event.detail.post) {
        const newPost = event.detail.post;
        console.log('Adding new post to feed:', newPost);
        setPosts(prev => [newPost, ...prev]);
      } else {
        // Fallback: refresh the entire feed if no post data provided
        console.log('No post data in event, refreshing feed...');
        fetchPosts(0, 10);
      }
    };

    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, []);

  // Listen for post updates (reactions, comments) from PostDetailPage
  useEffect(() => {
    const handlePostUpdate = (event) => {
      const { postId, updates } = event.detail;
      handleReactionUpdate(postId, updates);
    };

    window.addEventListener('postUpdated', handlePostUpdate);
    return () => window.removeEventListener('postUpdated', handlePostUpdate);
  }, []);

  // Listen for real-time repost count updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleRepostUpdate = (data) => {
      const { postId, repostCount, reposted, userId } = data;
      
      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
          // Update the repost count and reposts array
          let updatedReposts = [...(post.reposts || [])];
          
          if (reposted && !updatedReposts.includes(userId)) {
            updatedReposts.push(userId);
          } else if (!reposted && updatedReposts.includes(userId)) {
            updatedReposts = updatedReposts.filter(id => id !== userId);
          }
          
          return {
            ...post,
            repostCount,
            reposts: updatedReposts
          };
        }
        return post;
      }));
    };

    socket.on('post:repost', handleRepostUpdate);

    return () => {
      socket.off('post:repost', handleRepostUpdate);
    };
  }, [socket]);

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
                  onReactionUpdate={handleReactionUpdate}
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

        {/* Right Sidebar - Suggested Users + Trending */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-4 space-y-4">
            {/* Suggested Users - FIRST */}
            <SuggestedUsers limit={5} />

            {/* Trending Now - SECOND */}
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

            {/* Premium Features - THIRD */}
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