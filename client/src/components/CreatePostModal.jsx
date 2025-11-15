import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, MapPin, Smile, Globe, Lock, Users, Video as VideoIcon, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { createPost, uploadPostImages, uploadPostVideo } from '../services/api';

const CreatePostModal = ({ isOpen, onClose, user, onPostCreated }) => {
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
  const videoRef = useRef(null);
  
  const maxImages = 10;
  const maxCharacters = 5000;
  const maxVideoSize = 100 * 1024 * 1024; // 100MB

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Prevent default drag behavior on window
  useEffect(() => {
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    if (isOpen) {
      window.addEventListener('dragover', preventDefaults);
      window.addEventListener('drop', preventDefaults);
    }

    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, [isOpen]);

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

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    if (file.size > maxVideoSize) {
      toast.error(`Video size must be less than ${maxVideoSize / (1024 * 1024)}MB`);
      return;
    }

    const url = URL.createObjectURL(file);
    setVideo({ id: Math.random().toString(36).slice(2), url, file });
    toast.success('Video added successfully!');
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
        const isUnderLimit = file.size <= 20 * 1024 * 1024;
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
      const videoFile = files.find(file => file.type.startsWith('video/'));
      if (!videoFile) {
        toast.error('Please drop a video file');
        return;
      }

      if (videoFile.size > maxVideoSize) {
        toast.error(`Video size must be less than ${maxVideoSize / (1024 * 1024)}MB`);
        return;
      }

      if (video) {
        toast.error('Only one video allowed per post');
        return;
      }

      const url = URL.createObjectURL(videoFile);
      setVideo({ id: Math.random().toString(36).slice(2), url, file: videoFile });
      toast.success('Video added successfully!');
    }
  };

  const removeImage = (id) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.url) URL.revokeObjectURL(img.url);
      return prev.filter(img => img.id !== id);
    });
  };

  const handleSubmit = async () => {
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
        content: content.trim(),
        ...(imageUrls.length > 0 && { images: imageUrls }),
        ...(videoUrls.length > 0 && { videos: videoUrls }),
        privacy,
        ...(location && { location }),
        ...(feeling && { feeling })
      };

      const response = await createPost(postData);
      const newPost = response.post || response;
      toast.success('Post created successfully! 🎉');
      
      // Emit custom event to notify HomePage
      window.dispatchEvent(new CustomEvent('postCreated', {
        detail: { post: newPost }
      }));
      
      // Reset form
      setContent('');
      setImages([]);
      setVideo(null);
      setLocation('');
      setFeeling('');
      setUploadProgress(0);
      setMediaType('images');
      
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const privacyOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see this post' },
    { value: 'friends', label: 'Friends', icon: Users, description: 'Only your friends' },
    { value: 'private', label: 'Only me', icon: Lock, description: 'Only you can see this' }
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPosting) {
          onClose();
        }
      }}
    >
      <div 
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col transition-all duration-200 ${
          isDragging ? 'ring-4 ring-blue-500 ring-opacity-50 scale-[1.02]' : ''
        }`}
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
                </>
              ) : (
                <>
                  <VideoIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400 text-center">
                    Drop video here
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
            onClick={onClose}
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
                {privacyOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
            className="w-full min-h-[100px] sm:min-h-[120px] max-h-[200px] sm:max-h-[300px] text-base sm:text-lg text-gray-900 dark:text-white resize-none focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 dark:bg-gray-800"
            maxLength={maxCharacters}
            disabled={isPosting}
          />

          {/* Character count */}
          <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
            {content.length}/{maxCharacters}
          </div>

          {/* Feeling/Location tags */}
          {(feeling || location) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {feeling && (
                <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
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
                <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm">
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

          {/* Media Type Toggle */}
          <div className="flex gap-2 mt-4 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <button
              onClick={() => {
                setMediaType('images');
                setVideo(null);
              }}
              disabled={isPosting}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                mediaType === 'images'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              <span className="font-medium">Images</span>
            </button>
            <button
              onClick={() => {
                setMediaType('video');
                setImages([]);
              }}
              disabled={isPosting}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                mediaType === 'video'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <VideoIcon className="w-5 h-5" />
              <span className="font-medium">Video</span>
            </button>
          </div>

          {/* Image Preview */}
          {mediaType === 'images' && images.length > 0 && (
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
          {mediaType === 'video' && video && (
            <div className="mt-4 relative group">
              <video
                ref={videoRef}
                src={video.url}
                controls
                className="w-full rounded-lg max-h-96"
              />
              <button
                onClick={removeVideo}
                disabled={isPosting}
                className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 text-white p-2 rounded-full hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
              >
                <X className="w-5 h-5" />
              </button>
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
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Add to your post</span>
              <div className="flex items-center gap-2">
                {/* Image Upload */}
                {mediaType === 'images' && (
                  <label className={`cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors ${
                    isPosting || images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''
                  }`}>
                    <ImageIcon className="w-5 h-5 text-green-600" />
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
                  <label className={`cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors ${
                    isPosting || video ? 'opacity-50 cursor-not-allowed' : ''
                  }`}>
                    <VideoIcon className="w-5 h-5 text-purple-600" />
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                      disabled={isPosting || video !== null}
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
                    <Smile className="w-5 h-5 text-yellow-600" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute right-0 bottom-full mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 z-50 w-64">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">How are you feeling?</p>
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
                            <span className="text-xs text-gray-600 dark:text-gray-300">{f.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Location */}
                <button
                  onClick={() => {
                    const loc = prompt('Enter location:', location);
                    if (loc !== null) setLocation(loc.trim());
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  disabled={isPosting}
                >
                  <MapPin className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
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

export default CreatePostModal;
