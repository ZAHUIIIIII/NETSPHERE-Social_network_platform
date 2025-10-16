import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import cloudinary from '../lib/cloudinary.js';
import { createNotification } from './notification.controller.js';

// Helper function to calculate top 3 reactions for a post
const getTopReactions = (post) => {
  if (!post.reactions) return [];
  
  const reactionCounts = [
    { type: 'like', count: post.reactions.like?.length || 0, emoji: '👍' },
    { type: 'love', count: post.reactions.love?.length || 0, emoji: '❤️' },
    { type: 'haha', count: post.reactions.haha?.length || 0, emoji: '😂' },
    { type: 'wow', count: post.reactions.wow?.length || 0, emoji: '😮' },
    { type: 'sad', count: post.reactions.sad?.length || 0, emoji: '😢' },
    { type: 'angry', count: post.reactions.angry?.length || 0, emoji: '😠' }
  ];
  
  // Sort by count descending and take top 3 with count > 0
  return reactionCounts
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(r => ({ type: r.type, emoji: r.emoji }));
};

// Get posts with pagination
export const getAllPosts = async (req, res) => {
  try {
    const { skip = 0, limit = 20 } = req.query;
    
    const posts = await Post.find()
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

    // Add top reactions to each post
    const postsWithTopReactions = posts.map(post => {
      const postObj = post.toObject();
      postObj.topReactions = getTopReactions(post);
      return postObj;
    });

    res.json({ posts: postsWithTopReactions });
  } catch (error) {
    console.error('Error in getPosts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { content, images = [], privacy = 'public' } = req.body;

    const post = new Post({
      content,
      images,
      privacy,
      author: req.user._id
    });

    await post.save();
    await post.populate('author', 'username name avatar');

    res.status(201).json({ post });
  } catch (error) {
    console.error('Error in createPost:', error);
    res.status(500).json({ message: 'Error creating post' });
  }
};

// Upload post images
export const uploadImages = async (req, res) => {
  try {
    console.log('📤 Upload request received');
    console.log('Files:', req.files?.length || 0);
    
    if (!req.files || req.files.length === 0) {
      console.log('❌ No images uploaded');
      return res.status(400).json({ message: 'No images uploaded' });
    }

    console.log('📁 Files to upload:', req.files.map(f => ({ 
      name: f.originalname, 
      size: f.size,
      type: f.mimetype 
    })));

    const uploadPromises = req.files.map(async (file) => {
      try {
        console.log(`⬆️  Uploading ${file.originalname} to Cloudinary...`);
        
        // Upload from memory buffer (no disk write!)
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'posts',
              transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
              ]
            },
            (error, result) => {
              if (error) {
                console.error(`❌ Error uploading ${file.originalname}:`, error);
                reject(error);
              } else {
                console.log(`✅ Uploaded ${file.originalname} successfully`);
                resolve(result.secure_url);
              }
            }
          );
          
          // Send buffer to Cloudinary
          uploadStream.end(file.buffer);
        });
      } catch (error) {
        console.error(`❌ Error uploading ${file.originalname}:`, error);
        throw error;
      }
    });

    const imageUrls = await Promise.all(uploadPromises);
    console.log('✅ All images uploaded successfully:', imageUrls.length);
    res.json({ images: imageUrls });

  } catch (error) {
    console.error('❌ Error in uploadImages:', error);
    console.error('Error stack:', error.stack);

    res.status(500).json({ 
      message: 'Error uploading images',
      error: error.message 
    });
  }
};

// Update a post
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, privacy } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is authorized to update
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    post.content = content;
    if (privacy) post.privacy = privacy;

    await post.save();
    await post.populate('author', 'username name avatar');

    res.json({ post });
  } catch (error) {
    console.error('Error in updatePost:', error);
    res.status(500).json({ message: 'Error updating post' });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is authorized to delete
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
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

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error in deletePost:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
};

// Get users who reacted to a post (with reaction types)
export const getPostLikes = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findById(postId)
      .populate('reactions.like', 'username name avatar')
      .populate('reactions.love', 'username name avatar')
      .populate('reactions.haha', 'username name avatar')
      .populate('reactions.wow', 'username name avatar')
      .populate('reactions.sad', 'username name avatar')
      .populate('reactions.angry', 'username name avatar');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Build array of users with their reaction types
    const reactionsList = [];
    const reactionTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
    
    reactionTypes.forEach(type => {
      if (post.reactions && post.reactions[type]) {
        post.reactions[type].forEach(user => {
          if (user && user._id) {
            reactionsList.push({
              user: {
                _id: user._id,
                username: user.username,
                name: user.name,
                avatar: user.avatar
              },
              reactionType: type
            });
          }
        });
      }
    });

    // Calculate reaction counts
    const reactionCounts = {
      like: post.reactions?.like?.length || 0,
      love: post.reactions?.love?.length || 0,
      haha: post.reactions?.haha?.length || 0,
      wow: post.reactions?.wow?.length || 0,
      sad: post.reactions?.sad?.length || 0,
      angry: post.reactions?.angry?.length || 0
    };

    const totalCount = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

    res.json({ 
      reactions: reactionsList,
      reactionCounts,
      totalCount,
      // Legacy compatibility
      likes: post.likes || [],
      count: totalCount
    });
  } catch (error) {
    console.error('Error in getPostLikes:', error);
    res.status(500).json({ message: 'Error fetching reactions' });
  }
};

// Add a comment
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      content,
      author: userId
    });

    await post.save();
    await post.populate({
      path: 'comments.author',
      select: 'username name avatar'
    });

    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json({ comment: newComment });
  } catch (error) {
    console.error('Error in addComment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is authorized to delete the comment
    if (comment.author.toString() !== userId.toString() && 
        post.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    comment.deleteOne();
    await post.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error in deleteComment:', error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
};

// Save/Unsave a post
export const savePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(userId);
    const savedIndex = user.savedPosts.indexOf(postId);

    if (savedIndex === -1) {
      // Save the post
      user.savedPosts.push(postId);
      await user.save();
      res.json({ message: 'Post saved', isSaved: true });
    } else {
      // Unsave the post
      user.savedPosts.splice(savedIndex, 1);
      await user.save();
      res.json({ message: 'Post unsaved', isSaved: false });
    }
  } catch (error) {
    console.error('Error in savePost:', error);
    res.status(500).json({ message: 'Error saving post' });
  }
};

// Get saved posts for current user
export const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: 'savedPosts',
      populate: {
        path: 'author',
        select: 'username avatar'
      },
      options: {
        sort: { createdAt: -1 }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ posts: user.savedPosts || [] });
  } catch (error) {
    console.error('Error in getSavedPosts:', error);
    res.status(500).json({ message: 'Error fetching saved posts' });
  }
};

// Check if post is saved by current user
export const checkPostSavedStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const isSaved = user.savedPosts.includes(postId);

    res.json({ isSaved });
  } catch (error) {
    console.error('Error checking saved status:', error);
    res.status(500).json({ message: 'Error checking saved status', isSaved: false });
  }
};

// Get a post by ID
export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('author', 'username name avatar')
      .populate({
        path: 'comments.author',
        select: 'username name avatar'
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check privacy settings
    if (post.privacy === 'private' && post.author._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This post is private' });
    }

    // Add top reactions
    const postObj = post.toObject();
    postObj.topReactions = getTopReactions(post);

    res.json(postObj);
  } catch (error) {
    console.error('Error in getPostById:', error);
    res.status(500).json({ message: 'Error fetching post' });
  }
};

// React to post WITH NOTIFICATION
export const reactToPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { type = 'like' } = req.body;
    const userId = req.user._id;

    const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    // Populate author for notification
    const post = await Post.findById(postId).populate('author', '_id username avatar');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Initialize reactions if not exist
    if (!post.reactions) {
      post.reactions = { like: [], love: [], haha: [], wow: [], sad: [], angry: [] };
    }

    // Find and remove user from all reaction types
    let oldReactionType = null;
    validTypes.forEach(reactionType => {
      if (!post.reactions[reactionType]) {
        post.reactions[reactionType] = [];
      }
      const index = post.reactions[reactionType].indexOf(userId);
      if (index !== -1) {
        post.reactions[reactionType].splice(index, 1);
        oldReactionType = reactionType;
      }
    });

    // If clicking the same reaction, just remove it (toggle off)
    // If clicking a different reaction, add the new one
    let userReaction = null;
    if (oldReactionType !== type) {
      post.reactions[type].push(userId);
      userReaction = type;
      
      // Create notification for post author (only if not reacting to own post)
      if (post.author._id.toString() !== userId.toString()) {
        try {
          await createNotification({
            recipient: post.author._id,
            sender: userId,
            type: 'reaction',
            post: postId,
            reactionType: type,
            metadata: {
              postContent: post.content?.substring(0, 100),
              postImage: post.images?.[0]
            }
          });
        } catch (notifError) {
          console.error('Error creating reaction notification:', notifError);
        }
      }
    }

    // Sync legacy likes array with reactions.like for compatibility
    post.likes = [...post.reactions.like];

    await post.save();

    // Calculate reaction counts
    const reactions = {
      like: post.reactions.like?.length || 0,
      love: post.reactions.love?.length || 0,
      haha: post.reactions.haha?.length || 0,
      wow: post.reactions.wow?.length || 0,
      sad: post.reactions.sad?.length || 0,
      angry: post.reactions.angry?.length || 0
    };

    // Calculate top 3 reactions for frontend
    const topReactions = getTopReactions(post);

    res.json({
      userReaction,
      reactions,
      topReactions,
      likes: post.likes.length,
      isLiked: post.reactions.like.includes(userId)
    });
  } catch (error) {
    console.error('Error in reactToPost:', error);
    res.status(500).json({ message: 'Error processing reaction' });
  }
};