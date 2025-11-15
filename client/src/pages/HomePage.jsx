import React, { useEffect, useState, useRef, useCallback } from "react";
import { 
  Heart, MessageCircle, Send, Image as ImageIcon, X, 
  MoreHorizontal, TrendingUp, Bookmark, Smile, MapPin, 
  Eye, EyeOff, Globe, Lock, Users, Play, Pause, Volume2, VolumeX,
  ChevronLeft, ChevronRight, Repeat, ThumbsUp, Laugh, AlertCircle,
  ChevronDown, ChevronUp, Video
} from 'lucide-react';
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  getPosts, 
  createPost, 
  uploadPostImages,
  uploadPostVideo,
  savePost as savePostAPI,
  checkPostSaved,
  reactToPost as reactToPostAPI
} from "../services/api";

import axiosInstance from "../lib/axios";
import { formatTime } from "../lib/utils";
import SuggestedUsers from '../components/common/SuggestedUsers';
import CommentsSection from '../components/comment/CommentsSection';
import EditPostModal from '../components/EditPostModal';
import ReportPostModal from '../components/ReportPostModal';
import { countTotalComments, listRootComments } from "../services/commentApi";
import PortalDropdown from '../components/common/PortalDropdown';
import AdminBadge from '../components/common/AdminBadge';
import { isAdmin } from '../lib/isAdmin';
import PlatformNewsWidget from '../components/common/PlatformNewsWidget';
// import { 
//   likePost as likePostAPI
// } from "../services/api";


// Enhanced Create Post Component
const CreatePostExpanded = ({ onPostCreated, user, onCollapse }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [mediaType, setMediaType] = useState('images'); // 'images' or 'video'
  const [isPosting, setIsPosting] = useState(false);
  const [privacy, setPrivacy] = useState('public');
  const [location, setLocation] = useState('');
  const [feeling, setFeeling] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const dropZoneRef = useRef(null);
  
  const maxImages = 10;
  const maxCharacters = 5000;
  const maxVideoSize = 100 * 1024 * 1024; // 100MB

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

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

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate video file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Validate video file size (100MB)
    if (file.size > maxVideoSize) {
      toast.error('Video size must be less than 100MB');
      return;
    }

    // Create video preview
    const videoUrl = URL.createObjectURL(file);
    setVideo({
      id: Math.random().toString(36).slice(2),
      url: videoUrl,
      file
    });
    
    toast.success('Video added!');
  };

  const removeVideo = () => {
    if (video?.url) {
      URL.revokeObjectURL(video.url);
    }
    setVideo(null);
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isPosting) {
      if ((mediaType === 'images' && images.length < maxImages) || (mediaType === 'video' && !video)) {
        setIsDragging(true);
      }
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isPosting) return;

    const files = Array.from(e.dataTransfer.files || []);
    
    if (mediaType === 'images') {
      if (images.length >= maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      const imageFiles = files.filter(file => file.type.startsWith('image/'));

      if (imageFiles.length === 0) {
        toast.error('Please drop image files only');
        return;
      }

      if (imageFiles.length + images.length > maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      const validFiles = imageFiles.filter(file => {
        const isUnderLimit = file.size <= 20 * 1024 * 1024; // 20MB
        if (!isUnderLimit) toast.error(`${file.name} exceeds 20MB limit`);
        return isUnderLimit;
      });

      const newImages = validFiles.slice(0, maxImages - images.length).map(file => ({
        id: Math.random().toString(36).slice(2),
        url: URL.createObjectURL(file),
        file
      }));

      setImages(prev => [...prev, ...newImages]);
      
      if (newImages.length > 0) {
        toast.success(`${newImages.length} image${newImages.length > 1 ? 's' : ''} added!`);
      }
    } else if (mediaType === 'video') {
      if (video) {
        toast.error('Only one video allowed per post');
        return;
      }

      const videoFiles = files.filter(file => file.type.startsWith('video/'));

      if (videoFiles.length === 0) {
        toast.error('Please drop a video file');
        return;
      }

      const file = videoFiles[0];
      
      if (file.size > maxVideoSize) {
        toast.error('Video size must be less than 100MB');
        return;
      }

      const videoUrl = URL.createObjectURL(file);
      setVideo({
        id: Math.random().toString(36).slice(2),
        url: videoUrl,
        file
      });
      
      toast.success('Video added!');
    }
  };

  // Prevent default drag behavior on window
  useEffect(() => {
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);

    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  const removeImage = (id) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.url) URL.revokeObjectURL(img.url);
      return prev.filter(img => img.id !== id);
    });
  };

  const handleSubmit = async () => {
    // Allow posts with: content only, images only, video only, or combinations
    if (!content.trim() && images.length === 0 && !video) {
      toast.error('Please add some content, images, or a video');
      return;
    }

    setIsPosting(true);
    try {
      let imageUrls = [];
      let videoUrls = [];

      // Upload images or video based on mediaType
      if (mediaType === 'images' && images.length > 0) {
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
      } else if (mediaType === 'video' && video) {
        const uploadResponse = await uploadPostVideo(video.file, (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        });
        
        if (Array.isArray(uploadResponse)) {
          videoUrls = uploadResponse;
        } else if (uploadResponse?.videos) {
          videoUrls = uploadResponse.videos;
        }
      }

      const postData = {
        ...(content.trim() && { content: content.trim() }),
        ...(imageUrls.length > 0 && { images: imageUrls }),
        ...(videoUrls.length > 0 && { videos: videoUrls }),
        privacy,
        ...(location && { location }),
        ...(feeling && { feeling })
      };

      await createPost(postData);
      toast.success('Post created successfully! 🎉');
      
      setContent('');
      setImages([]);
      setVideo(null);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn"
      onClick={onCollapse}
    >
      <div 
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn transition-all duration-200 ${
          isDragging ? 'ring-4 ring-blue-500 ring-opacity-50 scale-[1.02]' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-4 border-dashed border-blue-500">
              {mediaType === 'images' ? (
                <>
                  <ImageIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400 text-center">
                    Drop images here
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                    Up to {maxImages - images.length} more image{maxImages - images.length !== 1 ? 's' : ''}
                  </p>
                </>
              ) : (
                <>
                  <Video className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400 text-center">
                    Drop video here
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                    Max 100MB
                  </p>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Post
          </h2>
          <button
            onClick={onCollapse}
            disabled={isPosting}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          {/* User Info */}
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <img
              src={user?.avatar || '/avatar-placeholder.png'}
              alt={user?.username}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">{user?.username}</p>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-full px-2 sm:px-3 py-1 border-none focus:ring-2 focus:ring-blue-500"
                disabled={isPosting}
              >
                {privacyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${user?.username}?`}
            className="w-full min-h-[100px] sm:min-h-[120px] max-h-[200px] sm:max-h-[300px] text-base sm:text-lg text-gray-900 dark:text-white bg-transparent resize-none focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
            maxLength={maxCharacters}
            disabled={isPosting}
          />

          {/* Drag and drop hint */}
          {images.length === 0 && !video && !content && (
            <div className="text-center py-4 text-sm text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg mt-2">
              {mediaType === 'images' ? (
                <>
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Drag and drop images here or use the button below</p>
                </>
              ) : (
                <>
                  <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Drag and drop a video here or use the button below</p>
                </>
              )}
            </div>
          )}

          {/* Character count */}
          <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
            {content.length}/{maxCharacters}
          </div>

          {/* Feeling/Location tags */}
          {(feeling || location) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {feeling && (
                <span key="feeling" className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                  <Smile className="w-4 h-4" />
                  feeling {feeling}
                  <button
                    onClick={() => setFeeling('')}
                    className="ml-1 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-full p-0.5"
                    disabled={isPosting}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {location && (
                <span key="location" className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm">
                  <MapPin className="w-4 h-4" />
                  at {location}
                  <button
                    onClick={() => setLocation('')}
                    className="ml-1 hover:bg-green-100 dark:hover:bg-green-800/30 rounded-full p-0.5"
                    disabled={isPosting}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.url}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(img.id)}
                    disabled={isPosting}
                    className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 text-white p-1.5 rounded-full hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Video Preview */}
          {video && (
            <div className="mt-4">
              <div className="relative group">
                <video
                  src={video.url}
                  controls
                  className="w-full max-h-96 rounded-lg bg-black"
                />
                <button
                  onClick={removeVideo}
                  disabled={isPosting}
                  className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 text-white p-1.5 rounded-full hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isPosting && uploadProgress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Add to Post Options */}
          <div className="mt-4 border border-gray-300 dark:border-gray-600 rounded-lg p-3">
            {/* Media Type Toggle */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Media Type</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMediaType('images');
                    setVideo(null);
                  }}
                  disabled={isPosting}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    mediaType === 'images'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  Images
                </button>
                <button
                  onClick={() => {
                    setMediaType('video');
                    setImages([]);
                  }}
                  disabled={isPosting}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    mediaType === 'video'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Video
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Add to your post</span>
              <div className="flex items-center gap-2">
                {/* Image Upload */}
                {mediaType === 'images' && (
                  <label className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-500" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isPosting || images.length >= maxImages}
                    />
                  </label>
                )}

                {/* Video Upload */}
                {mediaType === 'video' && (
                  <label className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Video className="w-5 h-5 text-purple-600 dark:text-purple-500" />
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                      disabled={isPosting || !!video}
                    />
                  </label>
                )}

                {/* Feeling */}
                <div className="relative" ref={emojiPickerRef}>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    disabled={isPosting}
                  >
                    <Smile className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute right-0 bottom-full mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 z-50 w-64">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">How are you feeling?</p>
                      <div className="grid grid-cols-4 gap-2">
                        {feelings.map((f) => (
                          <button
                            key={f.label}
                            onClick={() => {
                              setFeeling(f.label);
                              setShowEmojiPicker(false);
                            }}
                            className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <span className="text-2xl">{f.emoji}</span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{f.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="relative group">
                  <button
                    onClick={() => {
                      const loc = prompt('Enter location:', location);
                      if (loc !== null) setLocation(loc.trim());
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    disabled={isPosting}
                  >
                    <MapPin className="w-5 h-5 text-red-600 dark:text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={isPosting || (!content.trim() && images.length === 0 && !video)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};



// Quick Create Post Component
const CreatePostQuick = ({ onExpand, user }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 animate-fadeIn hover:shadow-md transition-all">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] flex-shrink-0">
          <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">{user?.username?.charAt(0) || 'U'}</span>
            )}
          </div>
        </div>
        <button
          className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full px-4 sm:px-5 py-2 sm:py-3 text-left cursor-pointer transition-all"
          onClick={onExpand}
        >
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 truncate">What's on your mind, {user?.username?.split(' ')[0] || 'there'}?</p>
        </button>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          onClick={onExpand}
          className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl transition-all font-medium"
        >
          <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-sm">Photo</span>
        </button>
        <button 
          onClick={onExpand}
          className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-xl transition-all font-medium"
        >
          <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-sm hidden xs:inline">Feeling</span>
          <span className="text-xs sm:text-sm xs:hidden">😊</span>
        </button>
        <button 
          onClick={onExpand}
          className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all font-medium"
        >
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-sm hidden xs:inline">Check in</span>
          <span className="text-xs sm:text-sm xs:hidden">📍</span>
        </button>
      </div>
    </div>
  );
};




// Enhanced Post Card Component  
const PostCard = ({ post, currentUser, onPostUpdate, onPostDelete, onReactionUpdate }) => {
  const navigate = useNavigate();
  const { socket } = useAuthStore();
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
  const [hasReposted, setHasReposted] = useState(post.hasReposted || false);
  const [repostCount, setRepostCount] = useState(post.repostCount || 0);

  useEffect(() => {
    // Initialize repost status from post data
    setHasReposted(post.hasReposted || false);
    setRepostCount(post.repostCount || 0);
  }, [post.hasReposted, post.repostCount]);

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
    
    // Fetch accurate comment count on mount
    fetchInitialCommentCount();
    
    // Check if post is saved
    checkIfSaved();
  }, [post.likes, post.reactions, post.comments, currentUser, post._id]);

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

  const handleCopyLink = async () => {
    try {
      const postUrl = `${window.location.origin}/post/${post._id}`;
      await navigator.clipboard.writeText(postUrl);
      toast.success('Link copied to clipboard!');
      setShowOptions(false); // Close the dropdown menu
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleRepost = async () => {
    try {
      const response = await axiosInstance.post(`/posts/${post._id}/repost`);
      
      if (response.data.reposted) {
        toast.success('Post reposted to your profile!');
      } else {
        toast.success('Repost removed');
      }

      // Update local state immediately
      setHasReposted(response.data.reposted);
      setRepostCount(response.data.repostCount);

      // Update post with new repost data
      if (onReactionUpdate) {
        onReactionUpdate(post._id, {
          hasReposted: response.data.reposted,
          repostCount: response.data.repostCount
        });
      }

      // Emit socket event to update other users' feeds
      socket?.emit('postUpdated', { 
        postId: post._id, 
        hasReposted: response.data.reposted,
        repostCount: response.data.repostCount
      });
    } catch (error) {
      console.error('Error reposting:', error);
      toast.error(error.response?.data?.message || 'Failed to repost');
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
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 animate-slideUp">
      {/* Post Header */}
      <div className="p-3 sm:p-4 flex items-start justify-between">
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          <div 
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] cursor-pointer flex-shrink-0"
            onClick={() => navigate(`/profile/${author?.username}`)}
          >
            <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-700 dark:text-gray-300 font-bold text-sm sm:text-base">{userName.charAt(0)}</span>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <h3 
                  className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 hover:underline cursor-pointer truncate"
                  onClick={() => navigate(`/profile/${author?.username}`)}
                >
                  {userName}
                </h3>
                {isAdmin(author) && (
                  <AdminBadge size="xs" />
                )}
              </div>
              {post.feeling && (
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  is feeling {post.feeling}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex-wrap">
              <span>{formatTime(post.createdAt)}</span>
              <span>•</span>
              {post.privacy === 'public' && <Globe size={12} />}
              {post.privacy === 'friends' && <Users size={12} />}
              {post.privacy === 'private' && <Lock size={12} />}
              {post.location && (
                <>
                  <span>•</span>
                  <MapPin size={12} />
                  <span className="truncate max-w-[100px] sm:max-w-none">{post.location}</span>
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
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
            >
              <MoreHorizontal size={18} className="sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
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
                className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Edit post
              </button>
              <button 
                onClick={() => {
                  setShowOptions(false);
                  onPostDelete?.(post._id);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-red-600 dark:text-red-400"
              >
                Delete post
              </button>
              <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>
            </>
          )}
          <button 
            onClick={() => {
              handleSaveToggle();
              setShowOptions(false);
            }}
            disabled={isSaving}
            className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
          >
            {bookmarked ? 'Unsave post' : 'Save post'}
          </button>
          <button 
            onClick={handleCopyLink}
            className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            Copy link
          </button>
          {post.author?._id !== currentUser?._id && (
            <button 
              onClick={() => {
                setShowReportModal(true);
                setShowOptions(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-red-600 dark:text-red-400"
            >
              Report post
            </button>
          )}
        </PortalDropdown>
      </div>

      {/* Post Content */}
      {post.content && (
        <div className="px-3 sm:px-4 pb-2 sm:pb-3">
          <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
            {contentPreview}
          </p>
          {post.content.length > 300 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-xs sm:text-sm font-medium mt-1"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      )}

      {/* Post Images - Carousel with Horizontal Crop */}
      {post.images && post.images.length > 0 && (
        <div className="relative bg-gray-100 dark:bg-gray-700">
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
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2">
                <Eye size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Click to view full size</span>
                <span className="sm:hidden">Tap to view</span>
              </div>
            </div>

            {post.images.length > 1 && currentImageIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-lg transition-all hover:scale-110 z-10"
              >
                <ChevronLeft size={20} className="sm:w-6 sm:h-6 text-gray-800 dark:text-gray-200" />
              </button>
            )}
            
            {post.images.length > 1 && currentImageIndex < post.images.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2.5 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-lg transition-all hover:scale-110 z-10"
              >
                <ChevronRight size={20} className="sm:w-6 sm:h-6 text-gray-800 dark:text-gray-200" />
              </button>
            )}

            {post.images.length > 1 && (
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/70 text-white rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
                {currentImageIndex + 1} / {post.images.length}
              </div>
            )}

            {post.images.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
                {post.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`transition-all ${
                      index === currentImageIndex 
                        ? 'w-6 sm:w-8 h-1.5 sm:h-2 bg-white' 
                        : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/60 hover:bg-white/80'
                    } rounded-full`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Videos */}
      {post.videos && post.videos.length > 0 && (
        <div className="relative bg-black">
          <video 
            src={post.videos[0].url}
            controls
            className="w-full max-h-[600px] object-contain"
            controlsList="nodownload"
          >
            Your browser does not support the video tag.
          </video>
          {post.videos[0].duration && (
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/70 text-white rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm">
              {Math.floor(post.videos[0].duration / 60)}:{String(Math.floor(post.videos[0].duration % 60)).padStart(2, '0')}
            </div>
          )}
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
            className="absolute top-2 sm:top-4 right-2 sm:right-4 p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
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
      <div className="px-3 sm:px-4 pt-2 sm:pt-3 pb-2 flex items-center justify-between text-xs sm:text-sm min-h-[40px]">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-visible min-w-0">
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
                  className={`flex items-center gap-1.5 sm:gap-2 ${
                    post.author?._id === currentUser?._id 
                      ? 'hover:underline cursor-pointer' 
                      : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-full px-1.5 py-0.5 shadow-sm min-h-[24px]">
                    {topReactions.map((reaction, index) => (
                      <span key={index} className="leading-none flex-shrink-0" style={{ fontSize: '14px', lineHeight: '1' }}>{reaction.emoji}</span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">{totalReactions}</span>
                </button>
              );
            }
            return null;
          })()}
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-gray-700 dark:text-gray-300 font-medium flex-shrink-0">
          <button 
            onClick={() => setShowComments(!showComments)}
            className="hover:underline text-xs sm:text-sm whitespace-nowrap"
          >
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </button>
          {repostCount > 0 && (
            <span className="text-xs sm:text-sm whitespace-nowrap">
              {repostCount} {repostCount === 1 ? 'repost' : 'reposts'}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-2 sm:px-4 pb-2 pt-1 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex-1 relative">
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all text-sm font-medium ${
                userReaction === 'like' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/30' :
                userReaction === 'love' ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/30' :
                userReaction === 'haha' ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-800/30' :
                userReaction === 'wow' ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-800/30' :
                userReaction === 'sad' ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/30' :
                userReaction === 'angry' ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/30' :
                'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {userReaction === 'like' && <span className="text-base">👍</span>}
              {userReaction === 'love' && <span className="text-base">❤️</span>}
              {userReaction === 'haha' && <span className="text-base">😂</span>}
              {userReaction === 'wow' && <span className="text-base">😮</span>}
              {userReaction === 'sad' && <span className="text-base">😢</span>}
              {userReaction === 'angry' && <span className="text-base">😠</span>}
              {!userReaction && <Heart size={16} />}
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
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 px-2 py-1.5 flex items-center gap-1 z-30"
                  style={{ minHeight: '44px' }}
                >
                  <button
                    onClick={() => { handleReact('like'); setShowReactionPicker(false); }}
                    className="hover:scale-125 transition-transform p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                    title="Like"
                    style={{ fontSize: '24px', lineHeight: '1' }}
                  >
                    👍
                  </button>
                  <button
                    onClick={() => { handleReact('love'); setShowReactionPicker(false); }}
                    className="hover:scale-125 transition-transform p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                    title="Love"
                    style={{ fontSize: '24px', lineHeight: '1' }}
                  >
                    ❤️
                  </button>
                  <button
                    onClick={() => { handleReact('haha'); setShowReactionPicker(false); }}
                    className="hover:scale-125 transition-transform p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                    title="Haha"
                    style={{ fontSize: '24px', lineHeight: '1' }}
                  >
                    😂
                  </button>
                  <button
                    onClick={() => { handleReact('wow'); setShowReactionPicker(false); }}
                    className="hover:scale-125 transition-transform p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                    title="Wow"
                    style={{ fontSize: '24px', lineHeight: '1' }}
                  >
                    😮
                  </button>
                  <button
                    onClick={() => { handleReact('sad'); setShowReactionPicker(false); }}
                    className="hover:scale-125 transition-transform p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                    title="Sad"
                    style={{ fontSize: '24px', lineHeight: '1' }}
                  >
                    😢
                  </button>
                  <button
                    onClick={() => { handleReact('angry'); setShowReactionPicker(false); }}
                    className="hover:scale-125 transition-transform p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                    title="Angry"
                    style={{ fontSize: '24px', lineHeight: '1' }}
                  >
                    😠
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium"
          >
            <MessageCircle size={16} />
            <span>Comment</span>
          </button>

          <button
            onClick={handleRepost}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
              hasReposted 
                ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/30' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Repeat size={16} />
            <span>Repost</span>
          </button>

          <button
            onClick={handleSaveToggle}
            disabled={isSaving}
            aria-label={bookmarked ? 'Unsave post' : 'Save post'}
            className={`p-1.5 rounded-lg transition-all disabled:opacity-50 ${
              bookmarked
                ? 'text-yellow-500 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-800/30'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reactions</h3>
              <button
                onClick={() => setShowLikesModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-900 dark:text-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingLikes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400"></div>
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
                      like: 'text-blue-600 dark:text-blue-400',
                      love: 'text-red-500 dark:text-red-400',
                      haha: 'text-yellow-500 dark:text-yellow-400',
                      wow: 'text-orange-500 dark:text-orange-400',
                      sad: 'text-blue-400 dark:text-blue-300',
                      angry: 'text-red-700 dark:text-red-500'
                    }[reactionType] || 'text-red-500 dark:text-red-400';
                    
                    return (
                      <div 
                        key={user._id} 
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
                        onClick={() => {
                          navigate(`/profile/${user.username}`);
                          setShowLikesModal(false);
                        }}
                      >
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] flex-shrink-0">
                          <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                              <img 
                                src={user.avatar} 
                                alt={user.username} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <span className="text-gray-700 dark:text-gray-300 font-bold">
                                {user.username?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {user.username || user.name || 'User'}
                          </p>
                          {user.name && user.name !== user.username && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.name}</p>
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
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
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
      // If we have the post data in the event, add it to the top of the feed
      if (event.detail && event.detail.post) {
        const newPost = {
          ...event.detail.post,
          // Ensure createdAt exists (should come from server but fallback to now)
          createdAt: event.detail.post.createdAt || new Date().toISOString(),
          // Initialize topReactions if not present
          topReactions: event.detail.post.topReactions || [],
          // Initialize hasReposted if not present
          hasReposted: event.detail.post.hasReposted || false,
          // Initialize repostCount if not present
          repostCount: event.detail.post.repostCount || 0
        };
        setPosts(prev => [newPost, ...prev]);
      } else {
        // Fallback: refresh the entire feed if no post data provided
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Failed to load posts</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">We couldn't load your feed. Please try again.</p>
          <button 
            onClick={() => fetchPosts()}
            className="px-6 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-xl hover:bg-blue-600 dark:hover:bg-blue-700 transition-all font-semibold shadow-sm hover:shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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


      <div className="max-w-7xl mx-auto flex gap-6 p-2 sm:p-4">
        {/* Main Feed */}
        <div className="flex-1 max-w-full lg:max-w-2xl mx-auto space-y-4 sm:space-y-6 w-full">
          {/* Header */}
          <div className="text-center py-4 sm:py-6 animate-fadeIn">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              NETSPHERE
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">Share your moments</p>
          </div>

          {/* Create Post */}
          <CreatePostQuick 
            user={user} 
            onExpand={() => setShowExpandedCreate(true)}
          />

          {/* Posts Feed */}
          {loadingPosts ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading posts...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
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
                  <div className="inline-block p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 mb-3">
                    <span className="text-3xl">🎉</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">You're all caught up!</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Check back later for more posts</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 animate-fadeIn">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No posts yet</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Be the first to share something amazing!</p>
              <button
                onClick={() => setShowExpandedCreate(true)}
                className="px-6 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-xl hover:bg-blue-600 dark:hover:bg-blue-700 transition-all font-semibold shadow-sm hover:shadow-md"
              >
                Create Your First Post
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar - Suggested Users + News */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-2 scrollbar-hide">
            {/* Suggested Users - FIRST */}
            <SuggestedUsers limit={3} />

            {/* Platform News - SECOND */}
            <PlatformNewsWidget />
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