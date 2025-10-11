import React, { useState } from 'react';
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Edit, Link, Calendar, MoreHorizontal, Grid, Bookmark, User, Heart, MessageCircle } from 'lucide-react';

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState(authUser?.bio || '');
  const [website, setWebsite] = useState(authUser?.website || '');
  const [phone, setPhone] = useState(authUser?.phone || '');
  const [activeTab, setActiveTab] = useState('posts');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      let base64Image = reader.result;
      
      // Compress image if it's too large
      if (base64Image.length > 1000000) { // If base64 string is > 1MB
        base64Image = await compressImage(base64Image, 0.7); // Compress to 70% quality
      }
      
      setSelectedImg(base64Image);
      try {
        await updateProfile({ avatar: base64Image });
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Failed to upload image. Please try a smaller image.');
      }
    };
  };

  // Helper function to compress image
  const compressImage = (base64, quality = 0.7) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set canvas size to a reasonable max (e.g., 400x400 for profile pics)
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      
      img.src = base64;
    });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ bio, website, phone });
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="px-4 pb-4 space-y-4">
          {/* Profile Header Card */}
          <div className="border-0 shadow-none">
            <div className="p-0">
              {/* Profile Info Section */}
              <div className="p-6 bg-white rounded-lg shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="relative">
                      <img
                        src={selectedImg || authUser?.avatar || '/default-avatar.png'}
                        alt="Avatar"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className={`w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${selectedImg || authUser?.avatar ? 'hidden' : 'flex'}`}>
                        <span className="text-white font-bold text-2xl">{authUser?.username?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="avatar-upload"
                          onChange={handleImageUpload}
                          disabled={isUpdatingProfile}
                        />
                        <label htmlFor="avatar-upload" className="cursor-pointer">
                          <div className={`w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 hover:scale-105 ${isUpdatingProfile ? 'animate-pulse' : ''}`}>
                            <Camera className="h-4 w-4" />
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">{authUser?.username || 'No Name'}</h1>
                        <p className="text-gray-600">@{authUser?.username || 'unknown'}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditMode(!editMode)}
                          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                        >
                          <Edit className="h-4 w-4" />
                          <span>{editMode ? 'Cancel' : 'Edit Profile'}</span>
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <span className="font-semibold text-lg text-gray-900">0</span>
                        <p className="text-gray-600">Posts</p>
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-lg text-gray-900">0</span>
                        <p className="text-gray-600">Followers</p>
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-lg text-gray-900">0</span>
                        <p className="text-gray-600">Following</p>
                      </div>
                    </div>

                    {/* Bio and Details */}
                    {editMode ? (
                      <form className="space-y-4" onSubmit={handleProfileSave}>
                        <textarea
                          rows={3}
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                          placeholder="Tell us about yourself..."
                          maxLength={160}
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="url"
                            value={website}
                            onChange={e => setWebsite(e.target.value)}
                            placeholder="Website URL"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="Phone number"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={isUpdatingProfile}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditMode(false)}
                            disabled={isUpdatingProfile}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-gray-700">{authUser?.bio || 'No bio available.'}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {authUser?.website && (
                            <div className="flex items-center space-x-1">
                              <Link className="h-4 w-4" />
                              <a href={authUser.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                {authUser.website.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          )}
                          {authUser?.phone && (
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{authUser.phone}</span>
                            </div>
                          )}
                          {authUser?.birthday && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Born {new Date(authUser.birthday).toLocaleDateString()}</span>
                            </div>
                          )}
                          {authUser?.createdAt && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Joined {new Date(authUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-gray-500">{authUser?.email}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content Tabs */}
          <div className="w-full">
            <div className="grid w-full grid-cols-2 bg-transparent h-auto p-0 border-t border-gray-200">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex items-center justify-center space-x-1 py-3 text-xs font-semibold uppercase tracking-wide border-t-2 transition-colors ${
                  activeTab === 'posts'
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                } bg-transparent hover:bg-transparent rounded-none`}
              >
                <Grid className="h-3 w-3" />
                <span>Posts</span>
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex items-center justify-center space-x-1 py-3 text-xs font-semibold uppercase tracking-wide border-t-2 transition-colors ${
                  activeTab === 'saved'
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                } bg-transparent hover:bg-transparent rounded-none`}
              >
                <Bookmark className="h-3 w-3" />
                <span>Saved</span>
              </button>
            </div>

            <div className="mt-0">
              {activeTab === 'posts' ? (
                <div className="text-center py-12">
                  <Grid className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-600">Share your first post to get started!</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bookmark className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved posts</h3>
                  <p className="text-gray-600">Posts you save will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;