import React, { useState, useEffect } from 'react';

const Overview = ({ recentActivities = [], users = [], posts = [], reports = [], userGrowth = [], activityDistribution = {} }) => {
  const [timeRange, setTimeRange] = useState('6months');
  const [activityFilter, setActivityFilter] = useState('all');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Generate user growth data from real backend data
  const generateUserGrowthData = () => {
    if (userGrowth && userGrowth.length > 0) {
      return userGrowth;
    }
    
    // Fallback if no data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      users: 0
    }));
  };

  const growthData = generateUserGrowthData();
  const maxUsers = Math.max(...growthData.map(d => d.users), 100); // Minimum 100 for scale

  // Generate activity distribution data from backend
  const generateActivityData = () => {
    if (activityDistribution && Object.keys(activityDistribution).length > 0) {
      const { posts: totalPosts, comments, likes } = activityDistribution;
      const total = totalPosts + comments + likes;
      
      if (total === 0) {
        return [
          { name: 'Posts', value: 0, percentage: '0', color: 'bg-blue-600' },
          { name: 'Comments', value: 0, percentage: '0', color: 'bg-blue-500' },
          { name: 'Likes', value: 0, percentage: '0', color: 'bg-blue-400' },
        ];
      }
      
      return [
        { name: 'Posts', value: totalPosts, percentage: ((totalPosts / total) * 100).toFixed(1), color: 'bg-blue-600' },
        { name: 'Comments', value: comments, percentage: ((comments / total) * 100).toFixed(1), color: 'bg-blue-500' },
        { name: 'Likes', value: likes, percentage: ((likes / total) * 100).toFixed(1), color: 'bg-blue-400' },
      ];
    }
    
    // Default fallback
    return [
      { name: 'Posts', value: 0, percentage: '0', color: 'bg-blue-600' },
      { name: 'Comments', value: 0, percentage: '0', color: 'bg-blue-500' },
      { name: 'Likes', value: 0, percentage: '0', color: 'bg-blue-400' },
    ];
  };

  const activityData = generateActivityData();

  // Filter recent activities
  const filteredActivities = activityFilter === 'all' 
    ? recentActivities 
    : recentActivities.filter(a => a.type === activityFilter);

  return (
    <div className="space-y-4">
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-base text-gray-900">User Growth</h3>
              <p className="text-xs text-gray-500 mt-0.5">Monthly new user registrations</p>
            </div>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="6months">Last 6 months</option>
              <option value="12months">Last 12 months</option>
              <option value="year">This year</option>
            </select>
          </div>

          <div className="relative h-56">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-5 flex flex-col justify-between text-xs text-gray-400">
              <span>{maxUsers}</span>
              <span>{Math.floor(maxUsers * 0.75)}</span>
              <span>{Math.floor(maxUsers * 0.5)}</span>
              <span>{Math.floor(maxUsers * 0.25)}</span>
              <span>0</span>
            </div>

            {/* Chart area */}
            <div className="absolute left-12 right-0 top-0 bottom-5 border-l-2 border-b-2 border-gray-300">
              {/* Grid lines - horizontal */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-full border-t border-dashed border-gray-200" />
                ))}
              </div>

              {/* Grid lines - vertical */}
              <div className="absolute inset-0 flex justify-between pointer-events-none">
                {growthData.map((item, i) => (
                  <div key={i} className="h-full border-l border-dashed border-gray-200" />
                ))}
              </div>

              {/* Line chart */}
              <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                
                {growthData.length >= 1 && (
                  <>
                    {/* Connecting line segments - stop before each point */}
                    {growthData.length > 1 && growthData.map((item, index) => {
                      if (index === growthData.length - 1) return null;
                      
                      const x1 = (index / (growthData.length - 1)) * 100;
                      const y1 = 100 - (growthData[index].users / maxUsers) * 100;
                      const x2 = ((index + 1) / (growthData.length - 1)) * 100;
                      const y2 = 100 - (growthData[index + 1].users / maxUsers) * 100;
                      
                      // Calculate angle and offset to stop before circles
                      const dx = x2 - x1;
                      const dy = y2 - y1;
                      const length = Math.sqrt(dx * dx + dy * dy);
                      const offset = 2; // Stop 2 units before the point
                      
                      const x1Offset = x1 + (dx / length) * offset;
                      const y1Offset = y1 + (dy / length) * offset;
                      const x2Offset = x2 - (dx / length) * offset;
                      const y2Offset = y2 - (dy / length) * offset;
                      
                      return (
                        <line
                          key={index}
                          x1={x1Offset}
                          y1={y1Offset}
                          x2={x2Offset}
                          y2={y2Offset}
                          stroke="#1e40af"
                          strokeWidth="3"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      );
                    })}
                  </>
                )}
              </svg>

              {/* Data points as HTML elements - perfect circles */}
              {growthData.map((item, index) => {
                const x = (index / (growthData.length - 1)) * 100;
                const y = 100 - (item.users / maxUsers) * 100;
                const isHovered = hoveredPoint === index;
                
                return (
                  <div
                    key={index}
                    className="absolute"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'all'
                    }}
                    onMouseEnter={() => setHoveredPoint(index)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Normal: Small hollow circle, Hover: Larger filled circle */}
                    <div
                      className={`rounded-full transition-all duration-200 cursor-pointer ${
                        isHovered ? 'w-4 h-4' : 'w-3 h-3'
                      }`}
                      style={{
                        backgroundColor: isHovered ? '#1e40af' : 'transparent',
                        border: isHovered ? '3px solid #1e40af' : '2px solid #1e40af'
                      }}
                    />
                  </div>
                );
              })}

              {/* Hover tooltip */}
              {hoveredPoint !== null && growthData[hoveredPoint] && (
                <div 
                  className="absolute bg-white border border-gray-200 rounded-md shadow-lg pointer-events-none z-20"
                  style={{
                    left: `${(hoveredPoint / (growthData.length - 1)) * 100}%`,
                    top: `${100 - (growthData[hoveredPoint].users / maxUsers) * 100}%`,
                    transform: 'translate(-50%, calc(-100% - 12px))'
                  }}
                >
                  <div className="px-3 py-2">
                    <div className="text-xs font-medium text-gray-700">{growthData[hoveredPoint].month}</div>
                    <div className="text-sm font-bold text-blue-600 mt-0.5">
                      users : {growthData[hoveredPoint].users.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* X-axis labels */}
            <div className="absolute left-12 right-0 bottom-0 flex items-center justify-between text-xs text-gray-500">
              {growthData.map(item => (
                <span key={item.month} className="flex-1 text-center">{item.month}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Activity Chart */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-900">Platform Activity</h3>
            <p className="text-sm text-gray-500 mt-1">Distribution of user actions</p>
          </div>

          {/* Pie Chart */}
          <div className="flex items-center justify-center h-64 relative">
            <svg viewBox="0 0 400 300" className="w-full h-full">
              {(() => {
                let currentAngle = -90;
                const radius = 80;
                const centerX = 200;
                const centerY = 150;
                const total = activityData.reduce((sum, item) => sum + item.value, 0);
                const isEmpty = total === 0;
                // When there's no data (all zeros) render equal slices so the pie is visible
                const sumForAngles = isEmpty ? activityData.length : total;
                const colors = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd'];

                // Filter out items with no value (unless all are zero)
                const itemsToRender = isEmpty ? activityData : activityData.filter(item => item.value > 0);

                return itemsToRender.map((item, index) => {
                  const valueForAngle = isEmpty ? 1 : item.value;
                  const localPercentage = isEmpty ? (100 / itemsToRender.length) : ((item.value / total) * 100);
                  const angle = (valueForAngle / sumForAngles) * 360;
                  
                  // Skip rendering if angle is 0 or too small
                  if (angle < 0.1 && !isEmpty) {
                    return null;
                  }
                  
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;
                  const midAngle = startAngle + angle / 2;

                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  const midRad = (midAngle * Math.PI) / 180;

                  const x1 = centerX + radius * Math.cos(startRad);
                  const y1 = centerY + radius * Math.sin(startRad);
                  const x2 = centerX + radius * Math.cos(endRad);
                  const y2 = centerY + radius * Math.sin(endRad);

                  let pathData;
                  
                  // Special case: if this slice is 100% (or very close to 360 degrees), draw a full circle
                  if (angle >= 359.9) {
                    pathData = `M ${centerX} ${centerY} m ${-radius} 0 a ${radius} ${radius} 0 1 1 ${radius * 2} 0 a ${radius} ${radius} 0 1 1 ${-radius * 2} 0`;
                  } else {
                    const largeArc = angle > 180 ? 1 : 0;
                    pathData = [
                      `M ${centerX} ${centerY}`,
                      `L ${x1} ${y1}`,
                      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                      'Z'
                    ].join(' ');
                  }

                  // Label position - positioned outside the pie
                  const labelRadius = radius + 45;
                  const labelX = centerX + labelRadius * Math.cos(midRad);
                  const labelY = centerY + labelRadius * Math.sin(midRad);
                  
                  // Line from pie to label
                  const lineStartRadius = radius + 2;
                  const lineEndRadius = radius + 35;
                  const lineStartX = centerX + lineStartRadius * Math.cos(midRad);
                  const lineStartY = centerY + lineStartRadius * Math.sin(midRad);
                  const lineEndX = centerX + lineEndRadius * Math.cos(midRad);
                  const lineEndY = centerY + lineEndRadius * Math.sin(midRad);

                  currentAngle = endAngle;

                  // Get the correct color index from original array
                  const originalIndex = activityData.findIndex(d => d.name === item.name);

                  return (
                    <g key={item.name}>
                      <path
                        d={pathData}
                        fill={colors[originalIndex]}
                        stroke="white"
                        strokeWidth="3"
                        className="cursor-pointer hover:opacity-80 transition-all duration-200"
                      >
                        <title>{item.name}: {item.value.toLocaleString()} ({localPercentage.toFixed(1)}%)</title>
                      </path>
                      
                      {/* Label line */}
                      <line
                        x1={lineStartX}
                        y1={lineStartY}
                        x2={lineEndX}
                        y2={lineEndY}
                        stroke="#cbd5e1"
                        strokeWidth="1.5"
                      />
                      
                      {/* Label text */}
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        className="text-sm fill-gray-600 font-medium"
                        dy="0.3em"
                      >
                        {item.name}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-6 grid grid-cols-2 gap-3 px-4">
            {activityData.map((item, index) => {
              const colors = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd'];
              return (
                <div key={item.name} className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-sm flex-shrink-0" style={{ backgroundColor: colors[index] }} />
                    <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.value.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-base text-gray-900">Recent Activity</h3>
            <p className="text-xs text-gray-500 mt-0.5">Important platform events and moderation actions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActivityFilter('all')}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                activityFilter === 'all'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActivityFilter('user')}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                activityFilter === 'user'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActivityFilter('report')}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                activityFilter === 'report'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setActivityFilter('moderation')}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                activityFilter === 'moderation'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Moderation
            </button>
          </div>
        </div>

        <div className="space-y-0 divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {filteredActivities.length === 0 ? (
            <div className="text-sm text-gray-400 py-8 text-center">
              <svg viewBox="0 0 24 24" className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>No recent activity</p>
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div key={activity.id} className="flex items-start justify-between py-3 first:pt-0 hover:bg-gray-50 transition-colors px-2 -mx-2 rounded">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' :
                    activity.status === 'error' ? 'bg-red-500' :
                    'bg-gray-400'
                  }`}>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      <span className="font-semibold">{activity.user}</span>
                      {activity.detail && <span className="text-gray-500"> · {activity.detail}</span>}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{activity.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
