// client/src/components/profile/ProfileTabs.jsx
import React from 'react';
import { Grid, Bookmark, UserSquare2, Repeat } from 'lucide-react';

const ProfileTabs = ({ activeTab, onTabChange, isOwnProfile }) => {
  const tabs = [
    { key: 'posts', label: 'POSTS', icon: Grid },
  ];

  // Only show saved tab for own profile
  if (isOwnProfile) {
    tabs.push({ key: 'saved', label: 'SAVED', icon: Bookmark });
  }

  // Add reposts tab after saved (or after posts if not own profile)
  tabs.push({ key: 'reposts', label: 'REPOSTS', icon: Repeat });

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center justify-center gap-1.5 px-16 py-3 text-xs font-semibold tracking-wide transition-all relative ${
                  activeTab === tab.key
                    ? 'text-gray-900 border-t border-t-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="h-3 w-3" />
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