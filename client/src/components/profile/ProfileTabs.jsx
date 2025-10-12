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
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center justify-center gap-2 py-4 px-8 text-sm font-semibold transition-all relative ${
                  activeTab === tab.key
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileTabs;