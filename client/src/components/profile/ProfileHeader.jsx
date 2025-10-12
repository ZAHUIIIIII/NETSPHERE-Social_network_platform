import React, { useState } from 'react';
import { Camera, MoreHorizontal, Settings, Share2, UserPlus, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

const ProfileHeader = ({ user, isOwnProfile, onEditClick }) => {
  const { updateProfile, isUpdatingProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      let base64Image = reader.result;
      
      if (base64Image.length > 1000000) {
        base64Image = await compressImage(base64Image, 0.7);
      }
      
      setSelectedImg(base64Image);
      try {
        await updateProfile({ avatar: base64Image });
        toast.success('Profile picture updated!');
      } catch (error) {
        console.error('Failed to upload image:', error);
        toast.error('Failed to upload image');
      }
    };
  };

  const compressImage = (base64, quality = 0.7) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
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

  return (
    <div className="bg-white rounded-b-2xl shadow-sm">

      {/* Profile Info */}
      <div className="px-6 pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-16 md:-mt-20">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden">
              {(selectedImg || user?.avatar) ? (
                <img
                  src={selectedImg || user.avatar}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-4xl">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {isOwnProfile && (
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
                  <div className={`w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center shadow-lg transition-all border-2 border-gray-200 ${
                    isUpdatingProfile ? 'animate-pulse' : ''
                  }`}>
                    <Camera className="h-5 w-5 text-gray-700" />
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* User Info & Actions */}
          <div className="flex-1 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {user?.username}
              </h1>
              <p className="text-gray-600 mt-1">@{user?.username}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={onEditClick}
                    className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium shadow-sm flex items-center gap-2"
                  >
                    <Settings size={18} />
                    Edit Profile
                  </button>
                  <button className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </>
              ) : (
                <>
                  <button className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium shadow-sm flex items-center gap-2">
                    <UserPlus size={18} />
                    Follow
                  </button>
                  <button className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium flex items-center gap-2">
                    <MessageCircle size={18} />
                    Message
                  </button>
                  <button className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    <Share2 size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;