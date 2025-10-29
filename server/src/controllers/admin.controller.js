import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';
import Notification from '../models/notification.model.js';
import Report from '../models/report.model.js';

// Get admin dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Total counts
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalActiveReports = 0; // TODO: Implement reports model
    
    // Active users (logged in within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyActiveUsers = await User.countDocuments({
      lastActive: { $gte: oneDayAgo }
    });

    // User growth data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Generate last 6 months
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      last6Months.push({
        month: monthNames[date.getMonth()],
        year: date.getFullYear(),
        monthNum: date.getMonth() + 1
      });
    }
    
    const userGrowthData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Map to last 6 months with zero values for months with no registrations
    const userGrowthMap = {};
    userGrowthData.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      userGrowthMap[key] = item.count;
    });

    const formattedUserGrowth = last6Months.map(m => ({
      month: m.month,
      users: userGrowthMap[`${m.year}-${m.monthNum}`] || 0
    }));

    // Activity distribution - get REAL counts from actual collections and data
    const postsCount = await Post.countDocuments();
    console.log('📊 Posts count:', postsCount);
    
    // Check if comments are in separate collection or embedded
    const commentsCount = await Comment.countDocuments({ isDeleted: false });
    console.log('📊 Comments count (separate collection, non-deleted):', commentsCount);
    
    // Also check embedded comments in posts (legacy system)
    const embeddedCommentsResult = await Post.aggregate([
      { 
        $project: {
          commentsCount: { $size: { $ifNull: ['$comments', []] } }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$commentsCount' }
        }
      }
    ]);
    const embeddedCommentsCount = embeddedCommentsResult[0]?.total || 0;
    console.log('📊 Embedded comments in posts:', embeddedCommentsCount);
    
    // Use the larger number (in case system uses one or the other)
    const finalCommentsCount = Math.max(commentsCount, embeddedCommentsCount);
    console.log('📊 Final comments count used:', finalCommentsCount);
    
    // Debug: Sample some data
    if (commentsCount > 0) {
      const sampleComments = await Comment.find().limit(2).lean();
      console.log('📊 Sample standalone comments:', JSON.stringify(sampleComments.map(c => ({
        postId: c.postId,
        content: c.content?.substring(0, 50),
        isDeleted: c.isDeleted
      })), null, 2));
    }
    
    if (embeddedCommentsCount > 0) {
      const postWithComments = await Post.findOne({ 'comments.0': { $exists: true } }).lean();
      if (postWithComments) {
        console.log('📊 Sample embedded comment:', JSON.stringify({
          postId: postWithComments._id,
          commentsCount: postWithComments.comments?.length,
          firstComment: postWithComments.comments?.[0]?.content?.substring(0, 50)
        }, null, 2));
      }
    }
    
    // Count all likes across all posts (including both legacy likes and reactions)
    console.log('📊 Aggregating post likes and reactions...');
    const likesResult = await Post.aggregate([
      {
        $project: {
          // Count legacy likes
          legacyLikes: { $size: { $ifNull: ['$likes', []] } },
          // Count reaction likes from the reactions object
          reactionLikes: { $size: { $ifNull: ['$reactions.like', []] } },
          reactionLove: { $size: { $ifNull: ['$reactions.love', []] } },
          reactionHaha: { $size: { $ifNull: ['$reactions.haha', []] } },
          reactionWow: { $size: { $ifNull: ['$reactions.wow', []] } },
          reactionSad: { $size: { $ifNull: ['$reactions.sad', []] } },
          reactionAngry: { $size: { $ifNull: ['$reactions.angry', []] } }
        }
      },
      {
        $group: {
          _id: null,
          totalLegacyLikes: { $sum: '$legacyLikes' },
          totalReactionLikes: { $sum: '$reactionLikes' },
          totalReactionLove: { $sum: '$reactionLove' },
          totalReactionHaha: { $sum: '$reactionHaha' },
          totalReactionWow: { $sum: '$reactionWow' },
          totalReactionSad: { $sum: '$reactionSad' },
          totalReactionAngry: { $sum: '$reactionAngry' }
        }
      }
    ]);

    // Sample a post to see its structure
    const samplePost = await Post.findOne().lean();
    if (samplePost) {
      console.log('📊 Sample post structure:', JSON.stringify({
        hasLikes: !!samplePost.likes,
        likesCount: samplePost.likes?.length || 0,
        hasReactions: !!samplePost.reactions,
        reactions: samplePost.reactions ? {
          like: samplePost.reactions.like?.length || 0,
          love: samplePost.reactions.love?.length || 0,
          haha: samplePost.reactions.haha?.length || 0,
          wow: samplePost.reactions.wow?.length || 0,
          sad: samplePost.reactions.sad?.length || 0,
          angry: samplePost.reactions.angry?.length || 0
        } : null
      }, null, 2));
    }

    const sharesResult = await Post.aggregate([
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$shares' }
        } 
      }
    ]);

    // Calculate total likes/reactions - ONLY from posts (not comments)
    const postLikesData = likesResult[0] || {};
    
    console.log('📊 Post likes data:', postLikesData);
    
    const totalPostReactions = 
      (postLikesData.totalLegacyLikes || 0) +
      (postLikesData.totalReactionLikes || 0) +
      (postLikesData.totalReactionLove || 0) +
      (postLikesData.totalReactionHaha || 0) +
      (postLikesData.totalReactionWow || 0) +
      (postLikesData.totalReactionSad || 0) +
      (postLikesData.totalReactionAngry || 0);

    // Use only post reactions for the "Likes" metric
    const likesCount = totalPostReactions;
    const sharesCount = sharesResult[0]?.total || 0;

    console.log('📊 Activity Distribution Final Result:', {
      posts: postsCount,
      comments: finalCommentsCount,
      likes: likesCount,
      shares: sharesCount,
      breakdown: {
        postReactions: totalPostReactions,
        embeddedComments: embeddedCommentsCount,
        standaloneComments: commentsCount
      }
    });

    res.json({
      stats: {
        totalUsers,
        totalPosts,
        totalActiveReports,
        dailyActiveUsers
      },
      userGrowth: formattedUserGrowth,
      activityDistribution: {
        posts: postsCount,
        comments: finalCommentsCount,
        likes: likesCount,
        shares: sharesCount
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
};

// Get all users with filtering
export const getAllUsers = async (req, res) => {
  try {
    const { search = '', status = '', skip = 0, limit = 50 } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    // Get post counts and format dates for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Count posts (isDeleted false OR undefined for legacy posts)
        const postCount = await Post.countDocuments({ 
          author: user._id,
          $or: [
            { isDeleted: false },
            { isDeleted: { $exists: false } }
          ]
        });
        
        // Format joinDate to numeric format (DD/MM/YYYY)
        const joinDate = user.createdAt 
          ? new Date(user.createdAt).toLocaleDateString('en-GB')
          : 'N/A';
        
        const followersCount = user.followers?.length || 0;
        
        return {
          ...user,
          postCount,
          followersCount,
          followingCount: user.following?.length || 0,
          joinDate,
          // Keep lastActive as Date object for frontend formatting
          lastActive: user.lastActive,
          // Ensure status defaults to 'active' for legacy users
          status: user.status || 'active'
        };
      })
    );

    const total = await User.countDocuments(query);

    res.json({
      users: usersWithStats,
      total,
      hasMore: skip + limit < total
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get all posts with filtering
export const getAllPosts = async (req, res) => {
  try {
    const { status = '', skip = 0, limit = 50 } = req.query;

    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('author', 'name username avatar email')
      .lean();

    // Enrich posts with engagement data
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        // Get total comment count (including all replies) from Comment collection
        const totalComments = await Comment.countDocuments({ 
          postId: post._id,
          isDeleted: false 
        });

        // Calculate total reactions (all reaction types)
        let totalReactions = 0;
        if (post.reactions) {
          totalReactions = (
            (post.reactions.like?.length || 0) +
            (post.reactions.love?.length || 0) +
            (post.reactions.haha?.length || 0) +
            (post.reactions.wow?.length || 0) +
            (post.reactions.sad?.length || 0) +
            (post.reactions.angry?.length || 0)
          );
        }
        
        // Fallback to legacy likes if no reactions
        if (totalReactions === 0 && post.likes) {
          totalReactions = post.likes.length || 0;
        }

        return {
          ...post,
          likes: totalReactions, // Total number of all reactions
          commentsCount: totalComments, // Total comments including replies
          images: post.images || [],
          reportsCount: post.reportsCount || 0 // Number of reports
        };
      })
    );

    const total = await Post.countDocuments(query);

    res.json({
      posts: enrichedPosts,
      total,
      hasMore: skip + limit < total
    });
  } catch (error) {
    console.error('Error in getAllPosts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

// Suspend user
export const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { duration } = req.body; // duration in days, e.g., 1, 3, 7, 30, or 0 for indefinite
    
    // Prevent admin from suspending themselves
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: 'You cannot suspend your own account' });
    }
    
    // Calculate suspension expiry date
    let suspendedUntil = null;
    if (duration && duration > 0) {
      suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + parseInt(duration));
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        status: 'suspended',
        suspendedUntil: suspendedUntil
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User suspended successfully', user });
  } catch (error) {
    console.error('Error in suspendUser:', error);
    res.status(500).json({ message: 'Error suspending user' });
  }
};

// Activate user (also works as "unban" - clears ban reason and suspension)
export const activateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        status: 'active',
        banReason: '', // Clear ban reason when activating/unbanning
        suspendedUntil: null // Clear suspension expiry
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User activated successfully', user });
  } catch (error) {
    console.error('Error in activateUser:', error);
    res.status(500).json({ message: 'Error activating user' });
  }
};

// Ban user
export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    // Prevent admin from banning themselves
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: 'You cannot ban your own account' });
    }
    
    // Validate userId
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Validate reason
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Ban reason is required' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        status: 'banned',
        banReason: reason 
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User banned successfully', user });
  } catch (error) {
    console.error('Error in banUser:', error);
    res.status(500).json({ message: 'Error banning user', error: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('Attempting to delete user:', userId);
    
    // Prevent admin from deleting themselves
    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    // Check if user exists first
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Found user to delete:', userToDelete.username);
    
    // Delete all user-related data
    try {
      // 1. Delete user's posts
      const deletedPosts = await Post.deleteMany({ author: userId });
      console.log(`Deleted ${deletedPosts.deletedCount} posts`);
      
      // 2. Delete user's comments (using authorId field)
      const deletedComments = await Comment.deleteMany({ authorId: userId });
      console.log(`Deleted ${deletedComments.deletedCount} comments`);
      
      // 3. Delete notifications related to this user (using recipient and sender fields)
      const deletedNotifications = await Notification.deleteMany({
        $or: [
          { sender: userId },
          { recipient: userId }
        ]
      });
      console.log(`Deleted ${deletedNotifications.deletedCount} notifications`);
      
      // 4. Remove user from followers/following arrays of other users
      await User.updateMany(
        { followers: userId },
        { $pull: { followers: userId } }
      );
      await User.updateMany(
        { following: userId },
        { $pull: { following: userId } }
      );
      console.log('Removed user from all followers/following lists');
      
      // 5. Finally, delete the user
      const deletedUser = await User.findByIdAndDelete(userId);
      console.log('User deleted:', deletedUser.username);
      
      res.json({ 
        message: 'User and all related data deleted successfully',
        deletedData: {
          posts: deletedPosts.deletedCount,
          comments: deletedComments.deletedCount,
          notifications: deletedNotifications.deletedCount
        }
      });
    } catch (cleanupError) {
      console.error('Error during user data cleanup:', cleanupError);
      throw cleanupError;
    }
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ 
      message: 'Error deleting user',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Remove post
export const removePost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findByIdAndUpdate(
      postId,
      { status: 'removed' },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ message: 'Post removed successfully', post });
  } catch (error) {
    console.error('Error in removePost:', error);
    res.status(500).json({ message: 'Error removing post' });
  }
};

// Restore post
export const restorePost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findByIdAndUpdate(
      postId,
      { status: 'published' },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ message: 'Post restored successfully', post });
  } catch (error) {
    console.error('Error in restorePost:', error);
    res.status(500).json({ message: 'Error restoring post' });
  }
};

// Delete post permanently
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findByIdAndDelete(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error in deletePost:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
};

// Get recent activities (admin-relevant events only)
export const getRecentActivities = async (req, res) => {
  try {
    const { limit = 15 } = req.query;
    const activities = [];

    // Get recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name username createdAt')
      .lean();

    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user._id}`,
        action: 'New user registered',
        user: user.username,
        detail: user.name,
        time: formatTimeAgo(user.createdAt),
        timestamp: user.createdAt,
        type: 'user',
        icon: '👤',
        status: 'success'
      });
    });

    // Get recently flagged/reported posts
    const flaggedPosts = await Post.find({ status: 'flagged' })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('author', 'name username')
      .select('author updatedAt content')
      .lean();

    flaggedPosts.forEach(post => {
      activities.push({
        id: `flagged-${post._id}`,
        action: 'Post reported',
        user: post.author?.username || 'Unknown',
        detail: post.content ? post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '') : 'Image post',
        time: formatTimeAgo(post.updatedAt),
        timestamp: post.updatedAt,
        type: 'report',
        icon: '⚠️',
        status: 'warning'
      });
    });

    // Get recently removed posts
    const removedPosts = await Post.find({ status: 'removed' })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('author', 'name username')
      .select('author updatedAt content')
      .lean();

    removedPosts.forEach(post => {
      activities.push({
        id: `removed-${post._id}`,
        action: 'Post removed',
        user: post.author?.username || 'Unknown',
        detail: post.content ? post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '') : 'Image post',
        time: formatTimeAgo(post.updatedAt),
        timestamp: post.updatedAt,
        type: 'moderation',
        icon: '�️',
        status: 'error'
      });
    });

    // Get recently suspended users
    const suspendedUsers = await User.find({ status: 'suspended' })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name username updatedAt')
      .lean();

    suspendedUsers.forEach(user => {
      activities.push({
        id: `suspended-${user._id}`,
        action: 'User suspended',
        user: user.username,
        detail: user.name,
        time: formatTimeAgo(user.updatedAt),
        timestamp: user.updatedAt,
        type: 'moderation',
        icon: '🚫',
        status: 'error'
      });
    });

    // Get recently activated users (unsuspended)
    const activeUsers = await User.find({ 
      status: 'active',
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
      .sort({ updatedAt: -1 })
      .limit(3)
      .select('name username updatedAt createdAt')
      .lean();

    // Filter only those who were likely unsuspended (updated after creation)
    activeUsers.forEach(user => {
      const daysSinceCreation = (new Date(user.updatedAt) - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation > 1) { // Only if updated more than a day after creation
        activities.push({
          id: `activated-${user._id}`,
          action: 'User activated',
          user: user.username,
          detail: user.name,
          time: formatTimeAgo(user.updatedAt),
          timestamp: user.updatedAt,
          type: 'moderation',
          icon: '✅',
          status: 'success'
        });
      }
    });

    // Get recently deleted comments (if tracked)
    const deletedComments = await Comment.find({ 
      isDeleted: true,
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate('authorId', 'name username')
      .select('authorId content updatedAt')
      .lean();

    deletedComments.forEach(comment => {
      if (comment.authorId) {
        activities.push({
          id: `deleted-comment-${comment._id}`,
          action: 'Comment deleted',
          user: comment.authorId.username,
          detail: comment.content ? comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : '') : '',
          time: formatTimeAgo(comment.updatedAt),
          timestamp: comment.updatedAt,
          type: 'moderation',
          icon: '🗑️',
          status: 'warning'
        });
      }
    });

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Return limited results
    const limitedActivities = activities.slice(0, Number(limit));

    console.log(`📊 Fetched ${limitedActivities.length} admin-relevant activities`);

    res.json({ 
      activities: limitedActivities,
      total: activities.length 
    });
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
    res.status(500).json({ message: 'Error fetching recent activities' });
  }
};

// Helper function to format time ago
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

// Get all reports
export const getAllReports = async (req, res) => {
  try {
    const { status = '', postId = '', skip = 0, limit = 50 } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (postId) {
      query.postId = postId;
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('postId', 'content images author status')
      .populate({
        path: 'postId',
        populate: {
          path: 'author',
          select: 'name username avatar email'
        }
      })
      .populate('reportedBy', 'name username avatar email')
      .populate('reviewedBy', 'name username')
      .lean();

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      total,
      hasMore: skip + limit < total
    });
  } catch (error) {
    console.error('Error in getAllReports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
};

// Update post status (published, flagged, removed)
export const updatePostStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const { status } = req.body;

    if (!['published', 'flagged', 'removed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const post = await Post.findByIdAndUpdate(
      postId,
      { status },
      { new: true }
    ).populate('author', 'name username avatar email');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({
      message: `Post status updated to ${status}`,
      post
    });
  } catch (error) {
    console.error('Error updating post status:', error);
    res.status(500).json({ message: 'Error updating post status' });
  }
};

// Resolve report
export const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findByIdAndUpdate(
      reportId,
      { 
        status: 'resolved',
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      { new: true }
    )
    .populate('postId', 'content images author status')
    .populate({
      path: 'postId',
      populate: {
        path: 'author',
        select: 'name username avatar email'
      }
    })
    .populate('reportedBy', 'name username avatar email')
    .populate('reviewedBy', 'name username');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({
      message: 'Report resolved successfully',
      report
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ message: 'Error resolving report' });
  }
};

// Dismiss report
export const dismissReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findByIdAndUpdate(
      reportId,
      { 
        status: 'dismissed',
        reviewedBy: req.user._id,
        reviewedAt: new Date()
      },
      { new: true }
    )
    .populate('postId', 'content images author status')
    .populate({
      path: 'postId',
      populate: {
        path: 'author',
        select: 'name username avatar email'
      }
    })
    .populate('reportedBy', 'name username avatar email')
    .populate('reviewedBy', 'name username');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({
      message: 'Report dismissed successfully',
      report
    });
  } catch (error) {
    console.error('Error dismissing report:', error);
    res.status(500).json({ message: 'Error dismissing report' });
  }
};
