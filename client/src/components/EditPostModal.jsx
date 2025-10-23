import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, MapPin, Smile, Globe, Lock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { updatePost, uploadPostImages } from '../services/api';

const EditPostModal = ({ isOpen, onClose, post, onPostUpdated }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [privacy, setPrivacy] = useState('public');
  const [location, setLocation] = useState('');
  const [feeling, setFeeling] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [removedImages, setRemovedImages] = useState([]);
  const textareaRef = useRef(null);
  
  const maxImages = 10;
  const maxCharacters = 5000;

  // Initialize form with post data
  useEffect(() => {
    if (post && isOpen) {
      setContent(post.content || '');
      setPrivacy(post.privacy || 'public');
      setLocation(post.location || '');
      setFeeling(post.feeling || '');
      
      // Convert existing images to the format used by the component
      const existingImages = (post.images || []).map((url, index) => ({
        id: `existing-${index}`,
        url: url,
        isExisting: true
      }));
      setImages(existingImages);
      setRemovedImages([]);
    }
  }, [post, isOpen]);

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
    const currentImageCount = images.filter(img => !removedImages.includes(img.url)).length;
    
    if (files.length + currentImageCount > maxImages) {
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

    const newImages = validFiles.slice(0, maxImages - currentImageCount).map(file => ({
      id: Math.random().toString(36).slice(2),
      url: URL.createObjectURL(file),
      file,
      isExisting: false
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (img) => {
    if (img.isExisting) {
      // Mark existing image for removal
      setRemovedImages(prev => [...prev, img.url]);
    } else {
      // Remove new image
      if (img.url) URL.revokeObjectURL(img.url);
      setImages(prev => prev.filter(i => i.id !== img.id));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.filter(img => !removedImages.includes(img.url)).length === 0) {
      toast.error('Please add some content or images');
      return;
    }

    setIsUpdating(true);
    try {
      let imageUrls = [];

      // Keep existing images that weren't removed
      const keptExistingImages = images
        .filter(img => img.isExisting && !removedImages.includes(img.url))
        .map(img => img.url);

      // Upload new images
      const newImages = images.filter(img => !img.isExisting && img.file);
      if (newImages.length > 0) {
        const imageFiles = newImages.map(img => img.file);
        
        const uploadResponse = await uploadPostImages(imageFiles, (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        });
        
        if (Array.isArray(uploadResponse)) {
          imageUrls = [...keptExistingImages, ...uploadResponse];
        } else if (uploadResponse?.images) {
          imageUrls = [...keptExistingImages, ...uploadResponse.images];
        }
      } else {
        imageUrls = keptExistingImages;
      }

      const postData = {
        content: content.trim(),
        images: imageUrls,
        privacy,
        location: location || undefined,
        feeling: feeling || undefined
      };

      console.log('Updating post with data:', postData);
      const updatedPost = await updatePost(post._id, postData);
      console.log('Post updated successfully:', updatedPost);
      
      toast.success('Post updated successfully! ✨');
      
      if (onPostUpdated) {
        // Ensure we pass the complete post object with author info
        const completePost = {
          ...post,
          ...updatedPost,
          author: updatedPost.author || post.author
        };
        onPostUpdated(completePost);
      }
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error(error.response?.data?.message || 'Failed to update post');
    } finally {
      setIsUpdating(false);
      setUploadProgress(0);
    }
  };

  const privacyOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see this post' },
    { value: 'friends', label: 'Friends', icon: Users, description: 'Only your friends' },
    { value: 'private', label: 'Only me', icon: Lock, description: 'Only you can see this' }
  ];

  if (!isOpen || !post) return null;

  const visibleImages = images.filter(img => !removedImages.includes(img.url));

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUpdating) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Edit Post
          </h2>
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-4">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={post.author?.avatar || '/avatar-placeholder.png'}
              alt={post.author?.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-gray-900">{post.author?.username}</p>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="text-xs bg-gray-100 rounded-full px-3 py-1 border-none focus:ring-2 focus:ring-blue-500"
                disabled={isUpdating}
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
            placeholder={`What's on your mind, ${post.author?.username}?`}
            className="w-full min-h-[120px] max-h-[300px] text-lg resize-none focus:outline-none placeholder-gray-400"
            maxLength={maxCharacters}
            disabled={isUpdating}
          />

          {/* Character count */}
          <div className="text-right text-xs text-gray-500 mt-1">
            {content.length}/{maxCharacters}
          </div>

          {/* Feeling/Location tags */}
          {(feeling || location) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {feeling && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                  <Smile className="w-4 h-4" />
                  feeling {feeling}
                  <button
                    onClick={() => setFeeling('')}
                    className="ml-1 hover:bg-blue-100 rounded-full p-0.5"
                    disabled={isUpdating}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                  <MapPin className="w-4 h-4" />
                  at {location}
                  <button
                    onClick={() => setLocation('')}
                    className="ml-1 hover:bg-green-100 rounded-full p-0.5"
                    disabled={isUpdating}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Image Preview */}
          {visibleImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {visibleImages.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.url}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(img)}
                    disabled={isUpdating}
                    className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 text-white p-1.5 rounded-full hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Progress */}
          {isUpdating && uploadProgress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Add to Post Options */}
          <div className="mt-4 border border-gray-300 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Add to your post</span>
              <div className="flex items-center gap-2">
                {/* Image Upload */}
                <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ImageIcon className="w-5 h-5 text-green-600" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isUpdating || visibleImages.length >= maxImages}
                  />
                </label>

                {/* Feeling */}
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={isUpdating}
                  >
                    <Smile className="w-5 h-5 text-yellow-600" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 w-64">
                      <p className="text-xs font-semibold text-gray-700 mb-2">How are you feeling?</p>
                      <div className="grid grid-cols-4 gap-2">
                        {feelings.map((f) => (
                          <button
                            key={f.label}
                            onClick={() => {
                              setFeeling(f.label);
                              setShowEmojiPicker(false);
                            }}
                            className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <span className="text-2xl">{f.emoji}</span>
                            <span className="text-xs text-gray-600">{f.label}</span>
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
                      if (loc !== null) setLocation(loc);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={isUpdating}
                  >
                    <MapPin className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleSubmit}
            disabled={isUpdating || (!content.trim() && visibleImages.length === 0)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Updating...' : 'Update Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
