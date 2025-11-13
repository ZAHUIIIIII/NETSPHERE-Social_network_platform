import User from '../models/user.model.js';
import Post from '../models/post.model.js';

/**
 * Get platform announcements/news
 * These are hard-coded for now, but can be moved to a database collection
 */
export const getPlatformNews = async (req, res) => {
  try {
    // Get total platform stats for dynamic news
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    
    // Platform news items (can be moved to database later)
    const news = [
      {
        id: 1,
        icon: '🎉',
        title: 'New feature: Dark mode is here!',
        description: 'Toggle between light and dark themes in settings',
        type: 'feature',
        date: new Date('2024-11-10'),
        priority: 'high',
        link: '/settings'
      },
      {
        id: 2,
        icon: '📊',
        title: `Netsphere hits ${formatNumber(totalUsers)} users!`,
        description: 'Thank you for being part of our growing community',
        type: 'milestone',
        date: new Date('2024-11-12'),
        priority: 'medium'
      },
      {
        id: 3,
        icon: '💬',
        title: 'Enhanced commenting system',
        description: 'Now with threaded replies and reactions',
        type: 'feature',
        date: new Date('2024-11-08'),
        priority: 'medium'
      },
      {
        id: 4,
        icon: '�',
        title: 'New Messages features!',
        description: 'Mute conversations, delete chats, and better chat organization',
        type: 'feature',
        date: new Date('2024-11-13'),
        priority: 'high',
        link: '/messages'
      },
      {
        id: 5,
        icon: '✉️',
        title: 'Real-time messaging',
        description: 'Instant message delivery with typing indicators and online status',
        type: 'feature',
        date: new Date('2024-11-11'),
        priority: 'medium',
        link: '/messages'
      },
      {
        id: 6,
        icon: '🔕',
        title: 'Mute conversations',
        description: 'Silence notifications for specific chats without leaving them',
        type: 'feature',
        date: new Date('2024-11-09'),
        priority: 'low',
        link: '/messages'
      },
      {
        id: 7,
        icon: '🗑️',
        title: 'Delete chat history',
        description: 'Remove conversation history while keeping the connection',
        type: 'feature',
        date: new Date('2024-11-07'),
        priority: 'low',
        link: '/messages'
      },
      {
        id: 8,
        icon: '�🔔',
        title: 'Improved notifications',
        description: 'Real-time updates and better filtering options',
        type: 'improvement',
        date: new Date('2024-11-05'),
        priority: 'low',
        link: '/notifications'
      },
      {
        id: 9,
        icon: '🚀',
        title: 'Performance boost',
        description: 'Faster load times and smoother experience across the platform',
        type: 'improvement',
        date: new Date('2024-11-01'),
        priority: 'low'
      },
      {
        id: 10,
        icon: '🔒',
        title: 'Enhanced privacy controls',
        description: 'Block users, manage followers, and control who can message you',
        type: 'feature',
        date: new Date('2024-11-03'),
        priority: 'medium',
        link: '/settings'
      }
    ];
    
    // Sort by date (newest first) and priority
    const sortedNews = news.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.date - a.date;
    });
    
    // Return all news items (no limit for announcements page)
    res.status(200).json({
      news: sortedNews,
      platformStats: {
        totalUsers,
        totalPosts
      }
    });
  } catch (error) {
    console.error('Error fetching platform news:', error);
    res.status(500).json({ message: 'Server error fetching news' });
  }
};

/**
 * Format large numbers with K/M suffix
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
