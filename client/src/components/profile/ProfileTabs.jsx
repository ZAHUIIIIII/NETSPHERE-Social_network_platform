import React from 'react';
import { Grid, Bookmark, Image, Tag } from 'lucide-react';

const ProfileTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: 'posts', label: 'Posts', icon: Grid },
    { key: 'photos', label: 'Photos', icon: Image },
    { key: 'saved', label: 'Saved', icon: Bookmark },
    { key: 'tagged', label: 'Tagged', icon: Tag },
  ];

  return (
    <div className="bg-white mt-4 mx-4 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all relative ${
                activeTab === tab.key
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileTabs;