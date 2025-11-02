import React from 'react';
import { useUsageData } from '../../hooks/useUsageData';

const Analytics = () => {
  const { db, cdn, loading, error } = useUsageData();

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
      {/* MongoDB Usage & Cloudinary CDN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* MongoDB Usage - Bar Chart */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-base text-gray-900">MongoDB Usage</h3>
            <p className="text-xs text-gray-500 mt-0.5">Database storage usage</p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error || !db ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              <p>No data available</p>
            </div>
          ) : (
            <div className="relative h-64">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-500">
                <span>{db.limit}</span>
                <span>{(db.limit * 0.75).toFixed(0)}</span>
                <span>{(db.limit * 0.5).toFixed(0)}</span>
                <span>{(db.limit * 0.25).toFixed(0)}</span>
                <span>0</span>
              </div>
              
              {/* Chart area */}
              <div className="absolute left-12 right-0 top-0 bottom-6 flex items-end justify-center gap-3 border-b border-l border-gray-200">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="w-full border-t border-gray-100" />
                  ))}
                </div>
                
                {/* Bars */}
                <div className="flex-1 max-w-xs flex items-end justify-center gap-4 h-full relative z-10">
                  {/* Used Bar */}
                  <div className="flex-1 flex flex-col items-center justify-end h-full">
                    <div 
                      className={`w-full rounded-t transition-all cursor-pointer ${
                        db.percent >= 90 ? 'bg-gradient-to-t from-red-700 to-red-600 hover:from-red-800 hover:to-red-700' : 
                        db.percent >= 80 ? 'bg-gradient-to-t from-yellow-700 to-yellow-600 hover:from-yellow-800 hover:to-yellow-700' : 
                        'bg-gradient-to-t from-green-700 to-green-600 hover:from-green-800 hover:to-green-700'
                      }`}
                      style={{ height: `${(db.used / db.limit) * 100}%` }}
                      title={`Used: ${db.used.toFixed(2)} MB (${db.percent.toFixed(1)}%)`}
                    />
                    <span className="text-xs font-medium text-gray-600 mt-2">Used</span>
                  </div>
                  
                  {/* Free Bar */}
                  <div className="flex-1 flex flex-col items-center justify-end h-full">
                    <div 
                      className="w-full bg-gradient-to-t from-gray-400 to-gray-300 rounded-t transition-all hover:from-gray-500 hover:to-gray-400 cursor-pointer"
                      style={{ height: `${(db.free / db.limit) * 100}%` }}
                      title={`Free: ${db.free.toFixed(2)} MB`}
                    />
                    <span className="text-xs font-medium text-gray-600 mt-2">Free</span>
                  </div>
                </div>
              </div>
              
              {/* Summary */}
              <div className="absolute left-12 right-0 -bottom-8 flex items-center justify-center text-xs">
                <span className={`font-semibold ${
                  db.percent >= 90 ? 'text-red-600' : 
                  db.percent >= 80 ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {db.used.toFixed(2)} MB / {db.limit.toFixed(0)} MB ({db.percent.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
          
          {/* Breakdown */}
          {db?.breakdown && (
            <div className="mt-8 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs text-gray-500">Data Size</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {db.breakdown.dataSize.toFixed(2)} MB
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs text-gray-500">Index Size</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {db.breakdown.indexSize.toFixed(2)} MB
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs text-gray-500">Collections</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {db.breakdown.collections}
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-200">
                  <p className="text-xs text-gray-500">Objects</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {db.breakdown.objects.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cloudinary CDN - Progress Bars */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-base text-gray-900">Cloudinary CDN</h3>
            <p className="text-xs text-gray-500 mt-0.5">Media storage and delivery</p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : error || !cdn ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <p className="text-sm">No data available</p>
              <p className="text-xs mt-1">Configure Cloudinary credentials in .env</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan Info */}
              {cdn.raw?.plan && (
                <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <span className="text-sm font-medium text-purple-900">Current Plan</span>
                  <span className="text-base font-bold text-purple-700 uppercase">{cdn.raw.plan}</span>
                </div>
              )}

              {/* Credits Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Credits</span>
                  <span className={`text-sm font-semibold ${
                    cdn.percent >= 90 ? 'text-red-600' : 
                    cdn.percent >= 80 ? 'text-yellow-600' : 
                    'text-purple-600'
                  }`}>
                    {cdn.used.toLocaleString()} / {cdn.limit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all ${
                      cdn.percent >= 90 ? 'bg-gradient-to-r from-red-600 to-red-500' : 
                      cdn.percent >= 80 ? 'bg-gradient-to-r from-yellow-600 to-yellow-500' : 
                      'bg-gradient-to-r from-purple-600 to-purple-500'
                    }`}
                    style={{ width: `${Math.min(cdn.percent, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{cdn.percent.toFixed(1)}% used</span>
                  <span className="text-gray-500">{cdn.free.toLocaleString()} remaining</span>
                </div>
              </div>

              {/* Usage Breakdown */}
              {cdn.raw && (
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Usage Details</p>
                  
                  {cdn.raw.storage !== undefined && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Storage</span>
                        <span className="text-sm text-gray-600">
                          {(cdn.raw.storage / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-2 bg-purple-500 rounded-full transition-all"
                          style={{ width: '45%' }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {cdn.raw.bandwidth !== undefined && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Bandwidth</span>
                        <span className="text-sm text-gray-600">
                          {(cdn.raw.bandwidth / 1024 / 1024 / 1024).toFixed(2)} GB
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-2 bg-purple-500 rounded-full transition-all"
                          style={{ width: '60%' }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {cdn.raw.transformations !== undefined && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Transformations</span>
                        <span className="text-sm text-gray-600">
                          {cdn.raw.transformations.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-2 bg-purple-500 rounded-full transition-all"
                          style={{ width: '30%' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Warning if near quota */}
              {cdn.percent >= 80 && (
                <div className={`p-3 rounded-lg border mt-4 ${
                  cdn.percent >= 90 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <svg 
                      className={`w-5 h-5 flex-shrink-0 ${
                        cdn.percent >= 90 ? 'text-red-600' : 'text-yellow-600'
                      }`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        cdn.percent >= 90 ? 'text-red-800' : 'text-yellow-800'
                      }`}>
                        {cdn.percent >= 90 ? 'Critical: ' : 'Warning: '}
                        CDN usage at {cdn.percent.toFixed(1)}%
                      </p>
                      <p className={`text-xs mt-0.5 ${
                        cdn.percent >= 90 ? 'text-red-700' : 'text-yellow-700'
                      }`}>
                        Consider upgrading your Cloudinary plan.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Platform Health */}
      <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
        <div className="mb-4">
          <h3 className="font-semibold text-base text-gray-900">Resource Health</h3>
          <p className="text-xs text-gray-500 mt-0.5">System resource usage status</p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MongoDB Storage Health */}
            <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  !db ? 'bg-gray-100' :
                  db.percent >= 90 ? 'bg-red-100' : 
                  db.percent >= 80 ? 'bg-yellow-100' : 
                  'bg-green-100'
                }`}>
                  <svg viewBox="0 0 24 24" className={`w-5 h-5 ${
                    !db ? 'text-gray-400' :
                    db.percent >= 90 ? 'text-red-600' : 
                    db.percent >= 80 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 7c0-1.1.9-2 2-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 3v4M16 3v4M4 11h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  !db ? 'bg-gray-100 text-gray-600' :
                  db.percent >= 90 ? 'bg-red-100 text-red-700' : 
                  db.percent >= 80 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-green-100 text-green-700'
                }`}>
                  {!db ? 'Loading' :
                   db.percent >= 90 ? 'Critical' : 
                   db.percent >= 80 ? 'Warning' : 
                   'Healthy'}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-0.5">
                {db ? `${(100 - db.percent).toFixed(1)}%` : '--'}
              </p>
              <p className="text-xs text-gray-500">MongoDB Free Space</p>
              {db && (
                <p className="text-xs text-gray-400 mt-1">
                  {db.free.toFixed(0)} MB of {db.limit.toFixed(0)} MB available
                </p>
              )}
            </div>

            {/* CDN Credits Health */}
            <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  !cdn ? 'bg-gray-100' :
                  cdn.percent >= 90 ? 'bg-red-100' : 
                  cdn.percent >= 80 ? 'bg-yellow-100' : 
                  'bg-purple-100'
                }`}>
                  <svg viewBox="0 0 24 24" className={`w-5 h-5 ${
                    !cdn ? 'text-gray-400' :
                    cdn.percent >= 90 ? 'text-red-600' : 
                    cdn.percent >= 80 ? 'text-yellow-600' : 
                    'text-purple-600'
                  }`} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-10 5.5 5.5 0 00-10 0A4 4 0 003 15z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  !cdn ? 'bg-gray-100 text-gray-600' :
                  cdn.percent >= 90 ? 'bg-red-100 text-red-700' : 
                  cdn.percent >= 80 ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-purple-100 text-purple-700'
                }`}>
                  {!cdn ? 'N/A' :
                   cdn.percent >= 90 ? 'Critical' : 
                   cdn.percent >= 80 ? 'Warning' : 
                   'Active'}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-0.5">
                {cdn ? `${(100 - cdn.percent).toFixed(1)}%` : 'N/A'}
              </p>
              <p className="text-xs text-gray-500">CDN Credits Remaining</p>
              {cdn && (
                <p className="text-xs text-gray-400 mt-1">
                  {cdn.free.toLocaleString()} of {cdn.limit.toLocaleString()} credits left
                </p>
              )}
            </div>

            {/* Overall System Status */}
            <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  !db && !cdn ? 'bg-gray-100' :
                  (db?.percent >= 90 || cdn?.percent >= 90) ? 'bg-red-100' : 
                  (db?.percent >= 80 || cdn?.percent >= 80) ? 'bg-yellow-100' : 
                  'bg-green-100'
                }`}>
                  <svg viewBox="0 0 24 24" className={`w-5 h-5 ${
                    !db && !cdn ? 'text-gray-400' :
                    (db?.percent >= 90 || cdn?.percent >= 90) ? 'text-red-600' : 
                    (db?.percent >= 80 || cdn?.percent >= 80) ? 'text-yellow-600' : 
                    'text-green-600'
                  }`} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  !db && !cdn ? 'bg-gray-100 text-gray-600' :
                  (db?.percent >= 90 || cdn?.percent >= 90) ? 'bg-red-100 text-red-700' : 
                  (db?.percent >= 80 || cdn?.percent >= 80) ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-green-100 text-green-700'
                }`}>
                  {!db && !cdn ? 'Loading' :
                   (db?.percent >= 90 || cdn?.percent >= 90) ? 'Action Required' : 
                   (db?.percent >= 80 || cdn?.percent >= 80) ? 'Monitor' : 
                   'Excellent'}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-0.5">
                {!db && !cdn ? '--' :
                 (db?.percent >= 90 || cdn?.percent >= 90) ? '⚠️' : 
                 (db?.percent >= 80 || cdn?.percent >= 80) ? '⚡' : 
                 '✓'}
              </p>
              <p className="text-xs text-gray-500">System Status</p>
              <p className="text-xs text-gray-400 mt-1">
                {!db && !cdn ? 'Checking resources...' :
                 (db?.percent >= 90 || cdn?.percent >= 90) ? 'Immediate attention needed' : 
                 (db?.percent >= 80 || cdn?.percent >= 80) ? 'Review resource usage' : 
                 'All systems operational'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;

