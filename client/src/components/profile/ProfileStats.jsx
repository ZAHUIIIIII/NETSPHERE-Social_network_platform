import React from 'react';

const ProfileStats = ({ posts, followers, following }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm mt-4 mx-4 p-6">
      <div className="flex items-center justify-around">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{posts}</p>
          <p className="text-sm text-gray-600 mt-1">Posts</p>
        </div>
        <div className="h-12 w-px bg-gray-200"></div>
        <div className="text-center cursor-pointer hover:bg-gray-50 px-6 py-2 rounded-lg transition-colors">
          <p className="text-2xl font-bold text-gray-900">{followers}</p>
          <p className="text-sm text-gray-600 mt-1">Followers</p>
        </div>
        <div className="h-12 w-px bg-gray-200"></div>
        <div className="text-center cursor-pointer hover:bg-gray-50 px-6 py-2 rounded-lg transition-colors">
          <p className="text-2xl font-bold text-gray-900">{following}</p>
          <p className="text-sm text-gray-600 mt-1">Following</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileStats;