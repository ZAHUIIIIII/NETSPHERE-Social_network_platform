import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import cloudinary from '../lib/cloudinary.js';

// Get user profile by username
export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username })
      .select('-password')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get post count
    const postCount = await Post.countDocuments({ author: user._id });

    res.json({
      ...user.toObject(),
      postCount
    });
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

    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('author', 'username name avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username name avatar'
        }
      });

    res.json({ posts });
  } catch (error) {
    console.error('Error in getUserPosts:', error);
    res.status(500).json({ message: 'Error fetching user posts' });
  }
};

// Follow user
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const userToFollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Add to following and followers
    currentUser.following.push(userId);
    userToFollow.followers.push(currentUserId);

    await currentUser.save();
    await userToFollow.save();

    res.json({ 
      message: 'User followed successfully',
      isFollowing: true,
      followers: userToFollow.followers.length
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

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "You can't unfollow yourself" });
    }

    const userToUnfollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from following and followers
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userId
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== currentUserId.toString()
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ 
      message: 'User unfollowed successfully',
      isFollowing: false,
      followers: userToUnfollow.followers.length
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

    const user = await User.findById(userId)
      .populate('followers', 'username avatar bio');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ followers: user.followers });
  } catch (error) {
    console.error('Error in getFollowers:', error);
    res.status(500).json({ message: 'Error fetching followers' });
  }
};

// Get following
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('following', 'username avatar bio');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ following: user.following });
  } catch (error) {
    console.error('Error in getFollowing:', error);
    res.status(500).json({ message: 'Error fetching following' });
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
      populate: {
        path: 'author',
        select: 'username avatar'
      }
    });

    res.json({ posts: user.savedPosts || [] });
  } catch (error) {
    console.error('Error in getSavedPosts:', error);
    res.status(500).json({ message: 'Error fetching saved posts' });
  }
};