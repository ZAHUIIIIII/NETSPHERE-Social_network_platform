import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';

/**
 * Get user personal stats
 * Posts this week, comments this week, new followers, account age
 */
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Calculate date ranges
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get user for account creation date
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Posts this week
    const postsThisWeek = await Post.countDocuments({
      author: userId,
      createdAt: { $gte: oneWeekAgo }
    });
    
    // Comments this week
    const commentsThisWeek = await Comment.countDocuments({
      author: userId,
      createdAt: { $gte: oneWeekAgo }
    });
    
    // New followers this week
    const currentFollowersCount = user.followers.length;
    
    // Get followers added in the last week by checking user update history
    // Since we don't track follower history, we'll estimate by checking recent follow activities
    const newFollowersThisWeek = await User.countDocuments({
      _id: { $in: user.followers },
      updatedAt: { $gte: oneWeekAgo }
    });
    
    // Calculate account age
    const accountCreatedAt = user.createdAt;
    const accountAge = calculateAccountAge(accountCreatedAt);
    
    res.status(200).json({
      postsThisWeek,
      commentsThisWeek,
      newFollowersThisWeek,
      totalFollowers: currentFollowersCount,
      accountAge: accountAge.text,
      accountCreatedAt,
      weeklyStats: {
        posts: postsThisWeek,
        comments: commentsThisWeek,
        newFollowers: newFollowersThisWeek
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

/**
 * Calculate account age in human-readable format
 */
function calculateAccountAge(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffYears > 0) {
    return {
      text: `${diffYears} year${diffYears > 1 ? 's' : ''} ago`,
      years: diffYears
    };
  } else if (diffMonths > 0) {
    return {
      text: `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`,
      months: diffMonths
    };
  } else if (diffDays > 0) {
    return {
      text: `${diffDays} day${diffDays > 1 ? 's' : ''} ago`,
      days: diffDays
    };
  } else {
    return {
      text: 'Today',
      days: 0
    };
  }
}

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
        icon: '🔔',
        title: 'Improved notifications',
        description: 'Real-time updates and better filtering',
        type: 'improvement',
        date: new Date('2024-11-05'),
        priority: 'low'
      },
      {
        id: 5,
        icon: '🚀',
        title: 'Performance boost',
        description: 'Faster load times and smoother experience',
        type: 'improvement',
        date: new Date('2024-11-01'),
        priority: 'low'
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
    
    // Return top 5 news items
    res.status(200).json({
      news: sortedNews.slice(0, 5),
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
