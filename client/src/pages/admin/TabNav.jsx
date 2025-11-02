import React from 'react';

const ICONS = {
  overview: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 13h8V3H3v10zM13 21h8v-8h-8v8zM13 3v6h8V3h-8zM3 21h8v-6H3v6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 8v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  posts: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15V5a2 2 0 00-2-2H7l-4 4v8a2 2 0 002 2h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 7h10v4H7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 3v18l7-3 7 3V3H5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  usage: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v20M17 7l-5-5-5 5M7 17l5 5 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 12H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
};

const TabNav = ({ activeTab, setActiveTab }) => {
  const tabs = ['overview', 'users', 'posts', 'reports', 'usage'];
  return (
    <div className="w-full mb-4">
      <div className="bg-gray-100 rounded-full border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-5">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex items-center justify-center gap-2 px-4 py-2 text-sm transition-all ${
                activeTab === tab 
                  ? 'bg-white text-gray-900 font-semibold shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 font-medium'
              } ${index === 0 ? 'rounded-l-full' : ''} ${index === tabs.length - 1 ? 'rounded-r-full' : ''}`}
            >
              {ICONS[tab]}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabNav;
