// client/src/components/profile/ProfileTabs.jsx
import React from 'react';
import { Grid, Bookmark } from 'lucide-react';

const ProfileTabs = ({ activeTab, onTabChange, isOwnProfile }) => {
  const tabs = [
    { key: 'posts', label: 'Posts', icon: Grid },
  ];

  // Only show saved tab for own profile
  if (isOwnProfile) {
    tabs.push({ key: 'saved', label: 'Saved', icon: Bookmark });
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto">
        <div className={`grid ${isOwnProfile ? 'grid-cols-2' : 'grid-cols-1'} w-full`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all relative border-b-2 ${
                  activeTab === tab.key
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileTabs;