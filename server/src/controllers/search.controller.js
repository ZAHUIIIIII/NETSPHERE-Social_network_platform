// Controllers for search functionality
import Post from '../models/post.model.js';
import User from '../models/user.model.js';

// server/src/controllers/search.controller.js
export const search = async (req, res) => {
  try {
    const { q, type, sortBy, skip = 0, limit = 20 } = req.query;
    
    console.log('=== SEARCH DEBUG ===');
    console.log('Query:', q);
    console.log('Type:', type);
    console.log('SortBy:', sortBy);
    console.log('User:', req.user?._id);

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchQuery = q.trim();
    const results = {
      users: [],
      posts: [],
      hashtags: []
    };

    // Create search patterns
    const searchRegex = new RegExp(searchQuery, 'i');
    const startsWithRegex = new RegExp(`^${searchQuery}`, 'i');

    // Search Users
    if (!type || type === 'users') {
      const users = await User.find({
        $or: [
          { username: startsWithRegex }, // First priority: starts with
          { username: searchRegex },      // Second priority: contains
          { email: searchRegex },
          { bio: searchRegex }
        ]
      })
        .select('username email bio avatar')
        .limit(Number(limit))
        .skip(Number(skip));

      console.log('Found users:', users.length);
      results.users = users.map(user => ({
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar
      }));
    }

    // Search Posts
    if (!type || type === 'posts') {
      let postQuery = {
        $or: [
          { content: searchRegex }
        ],
        privacy: 'public'
      };

      let sortOptions = { createdAt: -1 };
      switch (sortBy) {
        case 'Most Recent':
          sortOptions = { createdAt: -1 };
          break;
        case 'Most Popular':
          sortOptions = { likes: -1 };
          break;
        case 'Oldest First':
          sortOptions = { createdAt: 1 };
          break;
        default:
          sortOptions = { createdAt: -1 };
      }

      const posts = await Post.find(postQuery)
        .populate('author', 'username name avatar')
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            select: 'username name avatar'
          }
        })
        .sort(sortOptions)
        .limit(Number(limit))
        .skip(Number(skip));

      console.log('Found posts:', posts.length);
      results.posts = posts;
    }

    const totalCounts = {
      users: results.users.length,
      posts: results.posts.length,
      hashtags: results.hashtags.length
    };

    console.log('Total counts:', totalCounts);

    res.json({
      query: searchQuery,
      results,
      totalCounts,
      hasMore: results.posts.length === Number(limit) || results.users.length === Number(limit)
    });

  } catch (error) {
    console.error('Error in search:', error);
    res.status(500).json({ message: 'Error performing search', error: error.message });
  }
};

// Get trending topics
export const getTrending = async (req, res) => {
  try {
    // Get posts from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const posts = await Post.find({
      createdAt: { $gte: sevenDaysAgo },
      privacy: 'public'
    }).select('content');

    // Extract hashtags
    const hashtagCounts = {};
    posts.forEach(post => {
      const hashtags = post.content.match(/#\w+/g) || [];
      hashtags.forEach(tag => {
        const cleanTag = tag.substring(1).toLowerCase();
        hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
      });
    });

    // Convert to array and sort
    const trending = Object.entries(hashtagCounts)
      .map(([tag, count]) => ({
        hashtag: tag,
        posts: count,
        trending: count > 10 // Mark as trending if more than 10 posts
      }))
      .sort((a, b) => b.posts - a.posts)
      .slice(0, 10);

    res.json({ trending });
  } catch (error) {
    console.error('Error getting trending:', error);
    res.status(500).json({ message: 'Error fetching trending topics' });
  }
};

// Search suggestions (autocomplete)
export const searchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({ suggestions: [] });
    }

    const query = q.trim();
    const searchRegex = new RegExp(query, 'i');
    const startsWithRegex = new RegExp(`^${query}`, 'i');

    // Get user suggestions
    const users = await User.find({
      $or: [
        { username: startsWithRegex }, // First priority: starts with
        { username: searchRegex }      // Second priority: contains
      ]
    })
      .select('username avatar')
      .limit(5);

    // Get hashtag suggestions from recent posts
    const posts = await Post.find({
      content: new RegExp(`#${q.trim()}`, 'i'),
      privacy: 'public'
    })
      .select('content')
      .limit(20);

    const hashtags = new Set();
    posts.forEach(post => {
      const tags = post.content.match(/#\w+/g) || [];
      tags.forEach(tag => {
        if (tag.toLowerCase().startsWith(`#${q.toLowerCase()}`)) {
          hashtags.add(tag.substring(1));
        }
      });
    });

    const suggestions = {
      users: users.map(u => ({
        type: 'user',
        value: u.username,
        avatar: u.avatar
      })),
      hashtags: Array.from(hashtags).slice(0, 5).map(tag => ({
        type: 'hashtag',
        value: tag
      }))
    };

    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ message: 'Error fetching suggestions' });
  }
};


// Track search history
  export const trackSearch = async (req, res) => {
  try {
    const { query, resultCount } = req.body;
    
    // Save to SearchHistory collection
    await SearchHistory.create({
      user: req.user._id,
      query,
      resultCount,
      timestamp: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking search:', error);
    res.status(500).json({ message: 'Error tracking search' });
  }
};

// Advanced search with multiple filters
export const advancedSearch = async (req, res) => {
  try {
    const { 
      q, 
      type, 
      dateFrom, 
      dateTo, 
      hasImages, 
      minLikes,
      location 
    } = req.query;

    let postQuery = { content: new RegExp(q, 'i'), privacy: 'public' };

    if (dateFrom) postQuery.createdAt = { $gte: new Date(dateFrom) };
    if (dateTo) postQuery.createdAt = { ...postQuery.createdAt, $lte: new Date(dateTo) };
    if (hasImages) postQuery['images.0'] = { $exists: true };
    if (minLikes) postQuery.likes = { $size: { $gte: Number(minLikes) } };
    if (location) postQuery.location = new RegExp(location, 'i');

    const posts = await Post.find(postQuery)
      .populate('author', 'username name avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ posts });
  } catch (error) {
    console.error('Error in advanced search:', error);
    res.status(500).json({ message: 'Error performing advanced search' });
  }
};