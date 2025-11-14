import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';
import Notification from '../models/notification.model.js';
import Report from '../models/report.model.js';
import cloudinary from '../lib/cloudinary.js';
import mongoose from 'mongoose';

// Get admin dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Total counts
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });
    const bannedUsers = await User.countDocuments({ status: 'banned' });
    
    const totalPosts = await Post.countDocuments();
    const publishedPosts = await Post.countDocuments({ status: 'published' });
    const flaggedPosts = await Post.countDocuments({ status: 'flagged' });
    const removedPosts = await Post.countDocuments({ status: 'removed' });
    
    // Get MongoDB usage
    const db = mongoose.connection.db;
    const dbStats = await db.stats();
    const quotaLimitMB = parseFloat(process.env.MONGODB_QUOTA_LIMIT_MB || 512);
    const usedBytes = dbStats.dataSize + dbStats.indexSize;
    const usedMB = usedBytes / (1024 * 1024);
    const storageUsagePercent = ((usedMB / quotaLimitMB) * 100).toFixed(1);
    
    // Active users (logged in within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyActiveUsers = await User.countDocuments({
      lastActive: { $gte: oneDayAgo }
    });

    // Calculate percentage changes compared to last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const lastMonthUsers = await User.countDocuments({
      createdAt: { $lt: oneMonthAgo }
    });
    const lastMonthPosts = await Post.countDocuments({
      createdAt: { $lt: oneMonthAgo }
    });
    
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const lastDayActiveUsers = await User.countDocuments({
      lastActive: { $gte: twoDaysAgo, $lt: oneDayAgo }
    });
    
    // Calculate percentage changes
    const usersChange = lastMonthUsers > 0 
      ? (((totalUsers - lastMonthUsers) / lastMonthUsers) * 100).toFixed(1)
      : totalUsers > 0 ? '100.0' : '0.0';
      
    const postsChange = lastMonthPosts > 0
      ? (((totalPosts - lastMonthPosts) / lastMonthPosts) * 100).toFixed(1)
      : totalPosts > 0 ? '100.0' : '0.0';
      
    // For storage usage, show if usage increased (positive = bad for storage)
    const usageChange = storageUsagePercent > 0 ? `+${storageUsagePercent}` : storageUsagePercent;
      
    const dauChange = lastDayActiveUsers > 0
      ? (((dailyActiveUsers - lastDayActiveUsers) / lastDayActiveUsers) * 100).toFixed(1)
      : dailyActiveUsers > 0 ? '100.0' : '0.0';

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
    
    // Check if comments are in separate collection or embedded
    const commentsCount = await Comment.countDocuments({ isDeleted: false });
    
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
    
    // Use the larger number (in case system uses one or the other)
    const finalCommentsCount = Math.max(commentsCount, embeddedCommentsCount);
    
    // Count all likes across all posts (including both legacy likes and reactions)
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

    // Calculate total likes/reactions - ONLY from posts (not comments)
    const postLikesData = likesResult[0] || {};
    
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

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        bannedUsers,
        totalPosts,
        publishedPosts,
        flaggedPosts,
        removedPosts,
        storageUsed: usedMB,
        storageLimit: quotaLimitMB,
        storagePercent: parseFloat(storageUsagePercent),
        dailyActiveUsers,
        changes: {
          users: `${usersChange >= 0 ? '+' : ''}${usersChange}%`,
          posts: `${postsChange >= 0 ? '+' : ''}${postsChange}%`,
          storage: `${storageUsagePercent}%`,
          dau: `${dauChange >= 0 ? '+' : ''}${dauChange}%`
        }
      },
      userGrowth: formattedUserGrowth,
      activityDistribution: {
        posts: postsCount,
        comments: finalCommentsCount,
        likes: likesCount
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
      const Message = (await import('../models/message.model.js')).default;
      const Report = (await import('../models/report.model.js')).default;
      
      // 1. Delete user's posts and all posts where user is mentioned
      const userPosts = await Post.find({ author: userId });
      
      // Delete images from Cloudinary for user's posts
      for (const post of userPosts) {
        if (post.images && post.images.length > 0) {
          await Promise.all(post.images.map(async (imageUrl) => {
            try {
              const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
              await cloudinary.uploader.destroy(publicId);
            } catch (err) {
              console.error('Error deleting post image from cloudinary:', err);
            }
          }));
        }
      }
      
      const deletedPosts = await Post.deleteMany({ author: userId });
      console.log(`Deleted ${deletedPosts.deletedCount} posts`);
      
      // 2. Soft delete user's comments (preserve thread structure and username only)
      // Save username snapshot so others know who they replied to
      const softDeletedComments = await Comment.updateMany(
        { authorId: userId },
        { 
          $set: { 
            isDeleted: true,
            content: '(comment deleted)',
            authorSnapshot: {
              username: userToDelete.username
            }
          }
        }
      );
      console.log(`Soft deleted ${softDeletedComments.modifiedCount} comments`);
      
      // 3. Delete notifications related to this user (using recipient and sender fields)
      const deletedNotifications = await Notification.deleteMany({
        $or: [
          { sender: userId },
          { recipient: userId }
        ]
      });
      console.log(`Deleted ${deletedNotifications.deletedCount} notifications`);
      
      // 4. Delete all messages sent or received by this user
      const deletedMessages = await Message.deleteMany({
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      });
      console.log(`Deleted ${deletedMessages.deletedCount} messages`);
      
      // 5. Delete all reports made by this user
      const deletedReports = await Report.deleteMany({ reportedBy: userId });
      console.log(`Deleted ${deletedReports.deletedCount} reports`);
      
      // 6. Delete reports on posts that belong to this user (already deleted with posts)
      // Reports on deleted posts will be orphaned, let's clean them up
      await Report.deleteMany({ 
        postId: { $in: userPosts.map(p => p._id) }
      });
      
      // 7. Remove user from followers/following arrays of other users
      await User.updateMany(
        { followers: userId },
        { $pull: { followers: userId } }
      );
      await User.updateMany(
        { following: userId },
        { $pull: { following: userId } }
      );
      console.log('Removed user from all followers/following lists');
      
      // 8. Remove user from blocked users and blocked by lists
      await User.updateMany(
        { blockedUsers: userId },
        { $pull: { blockedUsers: userId } }
      );
      await User.updateMany(
        { blockedBy: userId },
        { $pull: { blockedBy: userId } }
      );
      console.log('Removed user from all blocked users lists');
      
      // 9. Remove user from saved posts, muted users, and muted conversations in other users
      await User.updateMany(
        { savedPosts: { $in: userPosts.map(p => p._id) } },
        { $pull: { savedPosts: { $in: userPosts.map(p => p._id) } } }
      );
      await User.updateMany(
        { 'notificationSettings.mutedUsers': userId },
        { $pull: { 'notificationSettings.mutedUsers': userId } }
      );
      await User.updateMany(
        { 'notificationSettings.mutedConversations': userId },
        { $pull: { 'notificationSettings.mutedConversations': userId } }
      );
      await User.updateMany(
        { 'notificationSettings.mutedPosts': { $in: userPosts.map(p => p._id) } },
        { $pull: { 'notificationSettings.mutedPosts': { $in: userPosts.map(p => p._id) } } }
      );
      console.log('Removed user from all notification settings');
      
      // 10. Remove user reactions and reposts from other users' posts
      await Post.updateMany(
        { 'reactions.like': userId },
        { $pull: { 'reactions.like': userId } }
      );
      await Post.updateMany(
        { 'reactions.love': userId },
        { $pull: { 'reactions.love': userId } }
      );
      await Post.updateMany(
        { 'reactions.haha': userId },
        { $pull: { 'reactions.haha': userId } }
      );
      await Post.updateMany(
        { 'reactions.wow': userId },
        { $pull: { 'reactions.wow': userId } }
      );
      await Post.updateMany(
        { 'reactions.sad': userId },
        { $pull: { 'reactions.sad': userId } }
      );
      await Post.updateMany(
        { 'reactions.angry': userId },
        { $pull: { 'reactions.angry': userId } }
      );
      await Post.updateMany(
        { reposts: userId },
        { $pull: { reposts: userId }, $inc: { repostCount: -1 } }
      );
      console.log('Removed user reactions and reposts from posts');
      
      // 11. Delete user's avatar from Cloudinary (if not default)
      if (userToDelete.avatar && !userToDelete.avatar.includes('default-avatar')) {
        try {
          const publicId = userToDelete.avatar.split('/').slice(-2).join('/').split('.')[0];
          await cloudinary.uploader.destroy(publicId);
          console.log('Deleted user avatar from Cloudinary');
        } catch (err) {
          console.error('Error deleting avatar from cloudinary:', err);
        }
      }
      
      // 12. Finally, delete the user
      const deletedUser = await User.findByIdAndDelete(userId);
      console.log('User deleted:', deletedUser.username);
      
      res.json({ 
        message: 'User and all related data deleted successfully',
        deletedData: {
          posts: deletedPosts.deletedCount,
          comments: softDeletedComments.modifiedCount,
          notifications: deletedNotifications.deletedCount,
          messages: deletedMessages.deletedCount,
          reports: deletedReports.deletedCount
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
    
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Delete associated images from cloudinary
    if (post.images && post.images.length > 0) {
      await Promise.all(post.images.map(async (imageUrl) => {
        try {
          const publicId = imageUrl.split('/').slice(-1)[0].split('.')[0];
          await cloudinary.uploader.destroy(`posts/${publicId}`);
        } catch (err) {
          console.error('Error deleting image from cloudinary:', err);
        }
      }));
    }

    // Delete associated videos from cloudinary
    if (post.videos && post.videos.length > 0) {
      await Promise.all(post.videos.map(async (video) => {
        try {
          await cloudinary.uploader.destroy(video.publicId, { resource_type: 'video' });
        } catch (err) {
          console.error('Error deleting video from cloudinary:', err);
        }
      }));
    }

    await Post.findByIdAndDelete(postId);

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
      .populate('postId', 'content images videos author status')
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
    .populate('postId', 'content images videos author status')
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
    .populate('postId', 'content images videos author status')
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
