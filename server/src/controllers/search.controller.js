// server/src/controllers/search.controller.js
import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import Comment from '../models/comment.model.js';
import mongoose from 'mongoose';

export const search = async (req, res) => {
  try {
    const { q, type, sortBy, skip = 0, limit = 20 } = req.query;
    
    console.log('=== SEARCH REQUEST ===');
    console.log('Query:', q);
    console.log('Type:', type);
    console.log('SortBy:', sortBy);
    console.log('Skip:', skip, 'Limit:', limit);

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchQuery = q.trim();
    const results = {
      users: [],
      posts: [],
      hashtags: []
    };

    // Enhanced search patterns
    const exactMatch = new RegExp(`^${searchQuery}$`, 'i');
    const startsWithRegex = new RegExp(`^${searchQuery}`, 'i');
    const containsRegex = new RegExp(searchQuery, 'i');
    const wordsRegex = new RegExp(searchQuery.split(' ').join('|'), 'i');

    // Search Users with priority scoring
    if (!type || type === 'users' || type === 'all') {
      const userSearchQuery = {
        $or: [
          { username: exactMatch },      // Highest priority
          { username: startsWithRegex }, // High priority
          { username: containsRegex },   // Medium priority
          { email: containsRegex },
          { bio: containsRegex }
        ]
      };

      let users = await User.find(userSearchQuery)
        .select('username email bio avatar createdAt')
        .limit(Number(limit) * 2) // Get more for sorting
        .lean();

      // Score and sort users by relevance
      users = users.map(user => {
        let score = 0;
        if (exactMatch.test(user.username)) score += 100;
        else if (startsWithRegex.test(user.username)) score += 50;
        else if (containsRegex.test(user.username)) score += 25;
        if (containsRegex.test(user.bio)) score += 10;
        if (containsRegex.test(user.email)) score += 5;
        
        return { ...user, relevanceScore: score };
      });

      users.sort((a, b) => b.relevanceScore - a.relevanceScore);
      users = users.slice(Number(skip), Number(skip) + Number(limit));

      console.log(`Found ${users.length} users`);
      results.users = users.map(({ relevanceScore, ...user }) => user);
    }

    // Search Posts with advanced filtering
    if (!type || type === 'posts' || type === 'all') {
      const postSearchQuery = {
        $and: [
          {
            $or: [
              { content: containsRegex },
              { content: wordsRegex }
            ]
          },
          { privacy: 'public' },
          // Only show published and flagged posts (exclude removed posts only)
          // Flagged posts are shown to users until they reach 5 reports (then removed)
          {
            $or: [
              { status: 'published' },
              { status: 'flagged' },
              { status: { $exists: false } },
              { status: null }
            ]
          }
        ]
      };

      // Sorting options
      let sortOptions = {};
      switch (sortBy) {
        case 'Most Recent':
          sortOptions = { createdAt: -1 };
          break;
        case 'Most Popular':
          // Sort by engagement (likes + comments)
          sortOptions = { likesCount: -1, commentsCount: -1, createdAt: -1 };
          break;
        case 'Oldest First':
          sortOptions = { createdAt: 1 };
          break;
        default: // Most Relevant
          sortOptions = { createdAt: -1 };
      }

      const posts = await Post.aggregate([
        { $match: postSearchQuery },
        {
          $addFields: {
            likesCount: { $size: { $ifNull: ['$likes', []] } },
            // Calculate total reactions count
            totalReactions: {
              $add: [
                { $size: { $ifNull: ['$reactions.like', []] } },
                { $size: { $ifNull: ['$reactions.love', []] } },
                { $size: { $ifNull: ['$reactions.haha', []] } },
                { $size: { $ifNull: ['$reactions.wow', []] } },
                { $size: { $ifNull: ['$reactions.sad', []] } },
                { $size: { $ifNull: ['$reactions.angry', []] } }
              ]
            }
          }
        },
        { $sort: sortOptions },
        { $skip: Number(skip) },
        { $limit: Number(limit) },
        // Lookup author info
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author'
          }
        },
        { $unwind: '$author' },
        // Lookup comment count from Comment collection
        {
          $lookup: {
            from: 'comments',
            let: { postId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$postId', '$$postId'] },
                      { $eq: ['$isDeleted', false] }
                    ]
                  }
                }
              },
              { $count: 'total' }
            ],
            as: 'commentData'
          }
        },
        {
          $addFields: {
            commentCount: {
              $ifNull: [
                { $arrayElemAt: ['$commentData.total', 0] },
                0
              ]
            }
          }
        },
        {
          $project: {
            content: 1,
            images: 1,
            likes: 1,
            comments: 1,
            reactions: 1, // Include reactions object
            privacy: 1,
            createdAt: 1,
            likesCount: 1,
            commentCount: 1, // Actual count from Comment collection
            commentsCount: '$commentCount', // Alias for backwards compatibility
            totalReactions: 1,
            'author._id': 1,
            'author.username': 1,
            'author.avatar': 1
          }
        }
      ]);

      console.log(`Found ${posts.length} posts`);
      results.posts = posts;
    }

    // Search Hashtags
    if (searchQuery.startsWith('#')) {
      const hashtag = searchQuery.substring(1);
      const hashtagRegex = new RegExp(`#${hashtag}\\b`, 'i');
      
      const hashtagPosts = await Post.find({
        content: hashtagRegex,
        privacy: 'public',
        // Only show published posts
        $or: [
          { status: 'published' },
          { status: { $exists: false } },
          { status: null }
        ]
      })
        .populate('author', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(skip))
        .lean();

      results.hashtags = [{
        tag: hashtag,
        posts: hashtagPosts,
        count: hashtagPosts.length
      }];
    }

    const totalCounts = {
      users: results.users.length,
      posts: results.posts.length,
      hashtags: results.hashtags.length
    };

    console.log('Results:', totalCounts);

    res.json({
      query: searchQuery,
      results,
      totalCounts,
      hasMore: results.posts.length === Number(limit) || results.users.length === Number(limit)
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ 
      message: 'Error performing search', 
      error: error.message 
    });
  }
};

export const getTrending = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Use aggregation for better performance
    const hashtagStats = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          privacy: 'public'
        }
      },
      {
        $project: {
          hashtags: {
            $regexFindAll: {
              input: '$content',
              regex: /#(\w+)/
            }
          }
        }
      },
      { $unwind: '$hashtags' },
      {
        $group: {
          _id: { $toLower: { $arrayElemAt: ['$hashtags.captures', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const trending = hashtagStats.map(item => ({
      hashtag: item._id,
      posts: item.count,
      trending: item.count > 5
    }));

    res.json({ trending });
  } catch (error) {
    console.error('❌ Trending error:', error);
    res.status(500).json({ message: 'Error fetching trending topics' });
  }
};

export const searchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: { users: [], hashtags: [] } });
    }

    const query = q.trim();
    const startsWithRegex = new RegExp(`^${query}`, 'i');

    // Parallel execution for better performance
    const [users, hashtagPosts] = await Promise.all([
      // User suggestions
      User.find({ username: startsWithRegex })
        .select('username avatar')
        .limit(5)
        .lean(),
      
      // Hashtag suggestions
      Post.aggregate([
        {
          $match: {
            content: new RegExp(`#${query}`, 'i'),
            privacy: 'public'
          }
        },
        {
          $project: {
            hashtags: {
              $regexFindAll: {
                input: '$content',
                regex: new RegExp(`#(${query}\\w*)`, 'i')
              }
            }
          }
        },
        { $unwind: '$hashtags' },
        {
          $group: {
            _id: { $toLower: { $arrayElemAt: ['$hashtags.captures', 0] } },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const suggestions = {
      users: users.map(u => ({
        type: 'user',
        value: u.username,
        avatar: u.avatar
      })),
      hashtags: hashtagPosts.map(item => ({
        type: 'hashtag',
        value: item._id,
        count: item.count
      }))
    };

    res.json({ suggestions });
  } catch (error) {
    console.error('❌ Suggestions error:', error);
    res.status(500).json({ message: 'Error fetching suggestions' });
  }
};

// New: Popular searches
export const getPopularSearches = async (req, res) => {
  try {
    // Get most searched hashtags in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const popular = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          privacy: 'public'
        }
      },
      {
        $project: {
          hashtags: {
            $regexFindAll: {
              input: '$content',
              regex: /#(\w+)/
            }
          }
        }
      },
      { $unwind: '$hashtags' },
      {
        $group: {
          _id: { $toLower: { $arrayElemAt: ['$hashtags.captures', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({ 
      popular: popular.map(item => ({
        term: item._id,
        count: item.count
      })) 
    });
  } catch (error) {
    console.error('❌ Popular searches error:', error);
    res.status(500).json({ message: 'Error fetching popular searches' });
  }
};