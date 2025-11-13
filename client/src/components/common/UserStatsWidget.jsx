import React, { useEffect, useState } from 'react';
import { TrendingUp, MessageCircle, Users, Calendar, Loader } from 'lucide-react';
import axiosInstance from '../../lib/axios';
import toast from 'react-hot-toast';

const UserStatsWidget = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await axiosInstance.get('/stats/user-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Don't show error toast, just fail silently
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-fadeIn">
        <div className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return null; // Don't show widget if stats failed to load
  }

  const statItems = [
    {
      icon: TrendingUp,
      label: 'Posts this week',
      value: stats.postsThisWeek,
      emoji: '📝',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      icon: MessageCircle,
      label: 'Comments this week',
      value: stats.commentsThisWeek,
      emoji: '💬',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      icon: Users,
      label: 'New followers',
      value: stats.newFollowersThisWeek,
      emoji: '👥',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Your Stats</h2>
      </div>

      {/* Stats Grid */}
      <div className="space-y-3">
        {statItems.map((item, index) => (
          <div
            key={index}
            className={`${item.bgColor} rounded-xl p-4 transition-all hover:scale-105 cursor-default`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Account Age */}
        <div className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Member since</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                📆 Joined {stats.accountAge}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStatsWidget;
