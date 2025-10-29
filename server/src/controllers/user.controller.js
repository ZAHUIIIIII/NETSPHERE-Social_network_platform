import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';
import cloudinary from '../lib/cloudinary.js';
import { createNotification } from './notification.controller.js';

// Get user profile by username
export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username })
      .select('-password')
      .populate('followers', 'username avatar bio')
      .populate('following', 'username avatar bio');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get post count
    const postCount = await Post.countDocuments({ author: user._id });

    // Ensure followers and following are arrays
    const followers = user.followers || [];
    const following = user.following || [];

    // Check if current user is following this profile
    // Current user follows this profile if the profile user's ID is in current user's following list
    let isFollowing = false;
    if (req.user) {
      const currentUser = await User.findById(req.user._id).select('following');
      isFollowing = currentUser.following.some(
        id => id.toString() === user._id.toString()
      );
      
      console.log('Backend - Follow check:', {
        currentUserId: req.user._id.toString(),
        profileUserId: user._id.toString(),
        currentUserFollowing: currentUser.following.map(id => id.toString()),
        isFollowing
      });
    }

    // Convert to object and ensure followers/following are arrays
    const userObject = user.toObject();
    
    // Ensure we're sending arrays even if they're empty
    userObject.followers = userObject.followers || [];
    userObject.following = userObject.following || [];

    const responseData = {
      ...userObject,
      postCount,
      isFollowing,
      followersCount: userObject.followers.length,
      followingCount: userObject.following.length
    };

    console.log('Backend - Sending profile response:', {
      username: responseData.username,
      isFollowing: responseData.isFollowing,
      followersCount: responseData.followersCount,
      followingCount: responseData.followingCount
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};

// Get user posts
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { skip = 0, limit = 20 } = req.query;

    // Only fetch published posts (exclude removed and flagged posts)
    const posts = await Post.find({ 
      author: userId,
      status: { $in: ['published', null, undefined] }
    })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('author', 'username name avatar')
      .lean();

    // For each post, fetch only root comments with totalDescendants
    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const rootComments = await Comment.find({
          postId: post._id,
          logicalDepth: 0,
          isDeleted: false
        })
        .select('_id totalDescendants')
        .lean();

        return {
          ...post,
          comments: rootComments,
          // Include reactions if available
          reactions: post.reactions || {}
        };
      })
    );

    res.json({ posts: postsWithComments });
  } catch (error) {
    console.error('Error in getUserPosts:', error);
    res.status(500).json({ message: 'Error fetching user posts' });
  }
};

// Follow user WITH NOTIFICATION
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    console.log('Backend - followUser:', {
      currentUser: currentUserId.toString(),
      userToFollow: userId,
      action: 'Current user is following target user'
    });

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const userToFollow = await User.findById(userId).select('-password');
    const currentUser = await User.findById(currentUserId).select('-password');

    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Add to following and followers
    // currentUser's following array gets updated (the logged-in user)
    // userToFollow's followers array gets updated (the target user)
    currentUser.following.push(userId);
    userToFollow.followers.push(currentUserId);

    await currentUser.save();
    await userToFollow.save();

    console.log('Backend - followUser result:', {
      currentUserFollowingCount: currentUser.following.length,
      targetUserFollowersCount: userToFollow.followers.length,
      summary: `${currentUser.username} now follows ${userToFollow.username}`
    });

    // Create notification (wrapped in try-catch to not fail the request)
    try {
      await createNotification({
        recipient: userId,
        sender: currentUserId,
        type: 'follow'
      });
    } catch (notifError) {
      console.error('Error creating follow notification:', notifError);
    }

    res.json({ 
      message: 'User followed successfully',
      isFollowing: true,
      followersCount: userToFollow.followers.length,
      followingCount: currentUser.following.length,
      user: {
        _id: userToFollow._id,
        username: userToFollow.username,
        avatar: userToFollow.avatar
      }
    });
  } catch (error) {
    console.error('Error in followUser:', error);
    res.status(500).json({ message: 'Error following user' });
  }
};

// Unfollow user
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    console.log('Backend - unfollowUser:', {
      currentUser: currentUserId.toString(),
      userToUnfollow: userId,
      action: 'Current user is unfollowing target user'
    });

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "You can't unfollow yourself" });
    }

    const userToUnfollow = await User.findById(userId).select('-password');
    const currentUser = await User.findById(currentUserId).select('-password');

    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from following and followers
    // currentUser's following array gets updated (the logged-in user)
    // userToUnfollow's followers array gets updated (the target user)
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userId
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await userToUnfollow.save();

    console.log('Backend - unfollowUser result:', {
      currentUserFollowingCount: currentUser.following.length,
      targetUserFollowersCount: userToUnfollow.followers.length,
      summary: `${currentUser.username} no longer follows ${userToUnfollow.username}`
    });

    res.json({ 
      message: 'User unfollowed successfully',
      isFollowing: false,
      followersCount: userToUnfollow.followers.length,
      followingCount: currentUser.following.length,
      user: {
        _id: userToUnfollow._id,
        username: userToUnfollow.username,
        avatar: userToUnfollow.avatar
      }
    });
  } catch (error) {
    console.error('Error in unfollowUser:', error);
    res.status(500).json({ message: 'Error unfollowing user' });
  }
};

// Get followers
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(userId)
      .populate('followers', 'username avatar bio');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get current user's following list to check relationships
    const currentUser = await User.findById(currentUserId).select('following');

    // Add isFollowing flag for each follower
    const followersWithStatus = user.followers.map(follower => ({
      _id: follower._id,
      username: follower.username,
      avatar: follower.avatar,
      bio: follower.bio,
      isFollowing: currentUser.following.some(
        id => id.toString() === follower._id.toString()
      )
    }));

    res.json({ followers: followersWithStatus });
  } catch (error) {
    console.error('Error in getFollowers:', error);
    res.status(500).json({ message: 'Error fetching followers' });
  }
};

// Get following
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const user = await User.findById(userId)
      .populate('following', 'username avatar bio');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get current user's following list to check relationships
    const currentUser = await User.findById(currentUserId).select('following');

    // Add isFollowing flag for each followed user
    const followingWithStatus = user.following.map(followedUser => ({
      _id: followedUser._id,
      username: followedUser.username,
      avatar: followedUser.avatar,
      bio: followedUser.bio,
      isFollowing: currentUser.following.some(
        id => id.toString() === followedUser._id.toString()
      )
    }));

    res.json({ following: followingWithStatus });
  } catch (error) {
    console.error('Error in getFollowing:', error);
    res.status(500).json({ message: 'Error fetching following' });
  }
};

// Remove follower - Remove a user from your followers list
export const removeFollower = async (req, res) => {
  try {
    const { followerId } = req.params;
    const currentUserId = req.user._id;

    console.log('Backend - removeFollower:', {
      currentUser: currentUserId.toString(),
      followerToRemove: followerId,
      action: 'Current user is removing a follower'
    });

    if (followerId === currentUserId.toString()) {
      return res.status(400).json({ message: "You can't remove yourself" });
    }

    const followerUser = await User.findById(followerId).select('-password');
    const currentUser = await User.findById(currentUserId).select('-password');

    if (!followerUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if this user is actually following you
    if (!currentUser.followers.includes(followerId)) {
      return res.status(400).json({ message: 'This user is not following you' });
    }

    // Remove follower from current user's followers list
    currentUser.followers = currentUser.followers.filter(
      id => id.toString() !== followerId
    );
    
    // Remove current user from follower's following list
    followerUser.following = followerUser.following.filter(
      id => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await followerUser.save();

    console.log('Backend - removeFollower result:', {
      currentUserFollowersCount: currentUser.followers.length,
      followerUserFollowingCount: followerUser.following.length,
      summary: `${followerUser.username} removed from ${currentUser.username}'s followers`
    });

    res.json({ 
      message: 'Follower removed successfully',
      followersCount: currentUser.followers.length,
      user: {
        _id: followerUser._id,
        username: followerUser.username,
        avatar: followerUser.avatar
      }
    });
  } catch (error) {
    console.error('Error in removeFollower:', error);
    res.status(500).json({ message: 'Error removing follower' });
  }
};

// Upload avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars',
      width: 400,
      height: 400,
      crop: 'fill'
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: result.secure_url },
      { new: true }
    ).select('-password');

    res.json({ 
      message: 'Avatar uploaded successfully',
      avatar: result.secure_url,
      user
    });
  } catch (error) {
    console.error('Error in uploadAvatar:', error);
    res.status(500).json({ message: 'Error uploading avatar' });
  }
};

// Get saved posts
export const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: 'savedPosts',
      populate: [
        {
          path: 'author',
          select: 'username avatar'
        },
        {
          path: 'likes',
          select: '_id'
        },
        {
          path: 'comments',
          populate: {
            path: 'author',
            select: 'username name avatar'
          }
        }
      ]
    });

    res.json({ posts: user.savedPosts || [] });
  } catch (error) {
    console.error('Error in getSavedPosts:', error);
    res.status(500).json({ message: 'Error fetching saved posts' });
  }
};

// Get suggested users (users not followed by current user)
export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const limit = parseInt(req.query.limit) || 5;

    const currentUser = await User.findById(currentUserId).select('following');
    
    // Find users that current user is not following and exclude self
    const suggestedUsers = await User.find({
      _id: { 
        $nin: [...currentUser.following, currentUserId] 
      }
    })
    .select('username avatar bio')
    .limit(limit)
    .sort({ createdAt: -1 }); // Or use followers count for popularity

    // Add follower count to each user
    const usersWithFollowerCount = await Promise.all(
      suggestedUsers.map(async (user) => {
        const followerCount = await User.countDocuments({
          following: user._id
        });
        return {
          ...user.toObject(),
          followersCount: followerCount,
          isFollowing: false
        };
      })
    );

    res.json({ users: usersWithFollowerCount });
  } catch (error) {
    console.error('Error in getSuggestedUsers:', error);
    res.status(500).json({ message: 'Error fetching suggested users' });
  }
};