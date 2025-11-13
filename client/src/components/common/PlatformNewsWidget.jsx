import React, { useEffect, useState } from 'react';
import { Megaphone, Sparkles, ExternalLink, Loader, MessageCircle } from 'lucide-react';
import axiosInstance from '../../lib/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PlatformNewsWidget = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlatformNews();
  }, []);

  const fetchPlatformNews = async () => {
    try {
      const response = await axiosInstance.get('/stats/platform-news');
      setNews(response.data.news || []);
    } catch (error) {
      console.error('Error fetching platform news:', error);
      // Don't show error toast, just fail silently
    } finally {
      setLoading(false);
    }
  };

  const handleContactAdmin = async () => {
    try {
      setLoadingAdmin(true);
      const response = await axiosInstance.get('/users/admin');
      const adminUser = response.data;
      
      if (adminUser) {
        // Navigate to messages with admin user
        navigate('/messages', { state: { selectedUser: adminUser } });
        toast.success('Opening chat with admin...');
      }
    } catch (error) {
      console.error('Error fetching admin:', error);
      toast.error('Unable to contact admin. Please try again.');
    } finally {
      setLoadingAdmin(false);
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

  if (!news.length) {
    return null; // Don't show widget if no news
  }

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-pink-500 to-orange-500 rounded-lg">
          <Megaphone className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Platform Updates</h2>
        <Sparkles className="h-4 w-4 text-yellow-500 ml-auto" />
      </div>

      {/* News Items */}
      <div className="space-y-3">
        {news.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className={`${getTypeColor(item.type)} rounded-xl p-4 border transition-all hover:scale-[1.02] cursor-pointer group`}
            onClick={() => handleNewsClick(item)}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {item.title}
                  </p>
                  {getPriorityBadge(item.priority)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {item.description}
                </p>
                {item.link && (
                  <div className="flex items-center gap-1 mt-2 text-blue-600 dark:text-blue-400">
                    <span className="text-xs font-medium">Learn more</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Link */}
      {news.length > 3 && (
        <button
          onClick={() => navigate('/announcements')}
          className="w-full mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
        >
          View all updates →
        </button>
      )}

      {/* Contact Admin for Help - Pinned */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleContactAdmin}
          disabled={loadingAdmin}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingAdmin ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4" />
              <span>Contact Admin for Help</span>
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Have questions? We're here to help! 💬
        </p>
      </div>
    </div>
  );
};

export default PlatformNewsWidget;
