import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import cloudinary from '../lib/cloudinary.js';

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

    res.json({ posts });
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

// Like/Unlike a post
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(userId);
    
    if (likeIndex === -1) {
      // Like the post
      post.likes.push(userId);
    } else {
      // Unlike the post
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.json({ likes: post.likes.length, isLiked: likeIndex === -1 });
  } catch (error) {
    console.error('Error in likePost:', error);
    res.status(500).json({ message: 'Error processing like' });
  }
};

// Get users who liked a post
export const getPostLikes = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findById(postId)
      .populate('likes', 'username name avatar');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ 
      likes: post.likes,
      count: post.likes.length 
    });
  } catch (error) {
    console.error('Error in getPostLikes:', error);
    res.status(500).json({ message: 'Error fetching likes' });
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

export const checkPostSaved = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const isSaved = user.savedPosts.includes(postId);

    res.json({ isSaved });
  } catch (error) {
    console.error('Error checking saved status:', error);
    res.status(500).json({ message: 'Error checking saved status' });
  }
};

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

    res.json(post);
  } catch (error) {
    console.error('Error in getPostById:', error);
    res.status(500).json({ message: 'Error fetching post' });
  }
};