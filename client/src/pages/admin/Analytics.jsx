import React from 'react';

const Analytics = () => {
  const engagementData = [
    { month: 'Jan', value: 4200, max: 12000 },
    { month: 'Feb', value: 5400, max: 12000 },
    { month: 'Mar', value: 6100, max: 12000 },
    { month: 'Apr', value: 7800, max: 12000 },
    { month: 'May', value: 9200, max: 12000 },
    { month: 'Jun', value: 10800, max: 12000 },
  ];

  const contentData = [
    { category: 'Technology', posts: 1245, max: 1500 },
    { category: 'Lifestyle', posts: 987, max: 1500 },
    { category: 'Photography', posts: 756, max: 1500 },
    { category: 'Business', posts: 543, max: 1500 },
  ];

  return (
    <div className="space-y-4">
      {/* Engagement Metrics & Content Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Engagement Metrics - Bar Chart */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-base text-gray-900">Engagement Metrics</h3>
            <p className="text-xs text-gray-500 mt-0.5">User activity over time</p>
          </div>
          
          <div className="relative h-64">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-500">
              <span>12000</span>
              <span>9000</span>
              <span>6000</span>
              <span>3000</span>
              <span>0</span>
            </div>
            
            {/* Chart area */}
            <div className="absolute left-12 right-0 top-0 bottom-6 flex items-end justify-between gap-3 border-b border-l border-gray-200">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-full border-t border-gray-100" />
                ))}
              </div>
              
              {/* Bars */}
              {engagementData.map((item, index) => (
                <div key={item.month} className="flex-1 flex flex-col items-center justify-end h-full relative z-10">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-700 to-blue-600 rounded-t transition-all hover:from-blue-800 hover:to-blue-700 cursor-pointer"
                    style={{ height: `${(item.value / item.max) * 100}%` }}
                    title={`${item.month}: ${item.value}`}
                  />
                </div>
              ))}
            </div>
            
            {/* X-axis labels */}
            <div className="absolute left-12 right-0 bottom-0 flex items-center justify-between text-xs text-gray-600 font-medium">
              {engagementData.map(item => (
                <span key={item.month} className="flex-1 text-center">{item.month}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Content Performance - Progress Bars */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-base text-gray-900">Content Performance</h3>
            <p className="text-xs text-gray-500 mt-0.5">Top performing content categories</p>
          </div>
          
          <div className="space-y-4">
            {contentData.map(item => (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{item.category}</span>
                  <span className="text-sm text-gray-500">{item.posts} posts</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="h-2.5 bg-blue-600 rounded-full transition-all"
                    style={{ width: `${(item.posts / item.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Health */}
      <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
        <div className="mb-4">
          <h3 className="font-semibold text-base text-gray-900">Platform Health</h3>
          <p className="text-xs text-gray-500 mt-0.5">Key performance indicators</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Uptime */}
          <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-600" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Excellent
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">98.5%</p>
            <p className="text-xs text-gray-500">Uptime</p>
          </div>

          {/* Monthly Active Users */}
          <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                +15%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">1.2M</p>
            <p className="text-xs text-gray-500">Monthly Active Users</p>
          </div>

          {/* Report Rate */}
          <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-yellow-600" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                Monitor
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">0.3%</p>
            <p className="text-xs text-gray-500">Report Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
