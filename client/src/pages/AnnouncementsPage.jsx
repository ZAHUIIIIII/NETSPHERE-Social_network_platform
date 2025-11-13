import React, { useEffect, useState } from 'react';
import { Megaphone, ArrowLeft, ExternalLink, Loader, Calendar, TrendingUp, MessageCircle } from 'lucide-react';
import axiosInstance from '../lib/axios';
import { useNavigate } from 'react-router-dom';

const AnnouncementsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlatformNews();
  }, []);

  const fetchPlatformNews = async () => {
    try {
      const response = await axiosInstance.get('/stats/platform-news');
      setNews(response.data.news || []);
      setPlatformStats(response.data.platformStats);
    } catch (error) {
      console.error('Error fetching platform news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewsClick = (newsItem) => {
    if (newsItem.link) {
      navigate(newsItem.link);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'feature':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'milestone':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'improvement':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-50 dark:bg-gray-700/20 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'high') {
      return (
        <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-semibold">
          New
        </span>
      );
    }
    return null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl shadow-lg">
              <Megaphone className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Platform Updates
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Stay informed about new features and improvements
              </p>
            </div>
          </div>

          {/* Platform Stats */}
          {platformStats && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {platformStats.totalUsers?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                    <Megaphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {platformStats.totalPosts?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Posts</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Admin Button */}
          <div className="mt-4">
            <button
              onClick={() => navigate('/messages?contact=admin')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Contact Admin</span>
            </button>
          </div>
        </div>

        {/* All Announcements */}
        <div className="space-y-4">
          {news.length > 0 ? (
            news.map((item) => (
              <div
                key={item.id}
                className={`${getTypeColor(item.type)} rounded-xl p-6 border transition-all hover:scale-[1.01] cursor-pointer group bg-white dark:bg-gray-800`}
                onClick={() => handleNewsClick(item)}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                        {item.title}
                      </h3>
                      {getPriorityBadge(item.priority)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(item.date)}</span>
                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full capitalize">
                          {item.type}
                        </span>
                      </div>
                      {item.link && (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <span className="text-sm font-medium">Learn more</span>
                          <ExternalLink className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <Megaphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                No announcements yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back later for platform updates
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
