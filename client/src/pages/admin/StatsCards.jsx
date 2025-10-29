import React from 'react';

const IconFor = (title) => {
  switch (title) {
    case 'Total Users':
      return {
        svg: (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M15 11c1.657 0 3-1.343 3-3s-1.343-3-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M3 20c0-2.761 2.239-5 5-5h2c2.761 0 5 2.239 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M16 20c0-1.864.714-3.56 1.882-4.838" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ),
        bg: 'bg-blue-50',
        color: 'text-blue-600',
      };
    case 'Total Posts':
      return {
        svg: (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ),
        bg: 'bg-green-50',
        color: 'text-green-600',
      };
    case 'Active Reports':
      return {
        svg: (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M4 6c0-1.1.9-2 2-2h3l2 2h7c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        bg: 'bg-red-50',
        color: 'text-red-600',
      };
    case 'Daily Active Users':
      return {
        svg: (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        bg: 'bg-purple-50',
        color: 'text-purple-600',
      };
    default:
      return {
        svg: null,
        bg: 'bg-gray-50',
        color: 'text-gray-600',
      };
  }
};

const StatsCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {stats.map((s) => {
        const { svg, bg, color } = IconFor(s.title);
        return (
          <div key={s.title} className="relative p-4 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center justify-center">
                {svg && React.cloneElement(svg, { className: `${color} w-5 h-5` })}
              </div>
              <span className={`text-xs font-semibold ${s.change.startsWith('+') ? 'text-green-600' : s.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>{s.change}</span>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">{s.title}</p>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
