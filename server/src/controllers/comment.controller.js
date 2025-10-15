// server/src/controllers/comment.controller.js
import Post from '../models/post.model.js';
import mongoose from 'mongoose';

// Utility functions for cursor pagination
const encodeCursor = (doc) => {
  if (!doc) return null;
  return Buffer.from(JSON.stringify({
    createdAt: doc.createdAt.toISOString(),
    _id: doc._id.toString()
  })).toString('base64');
};

const parseCursor = (cursor) => {
  if (!cursor) return null;
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    return {
      createdAt: new Date(decoded.createdAt),
      _id: new mongoose.Types.ObjectId(decoded._id)
    };
  } catch {
    return null;
  }
};

// Calculate relevance score
const scoreRelevant = (comment) => {
  const reactionsTotal = ['like', 'love', 'haha', 'wow', 'sad', 'angry']
    .reduce((sum, type) => sum + (comment.reactions?.[type]?.length || 0), 0);
  const likesCount = comment.likes?.length || comment.reactions?.like?.length || 0;
  const repliesCount = comment.repliesCount || 0;
  
  const hoursSinceCreated = (Date.now() - new Date(comment.createdAt).getTime()) / 3600000;
  const recencyBoost = Math.max(0, 36 - hoursSinceCreated);
  
  return (reactionsTotal * 4) + (likesCount * 3) + (repliesCount * 2) + recencyBoost;
};

// Format comment DTO
const formatCommentDTO = (comment, userId, includeRepliesPreview = false) => {
  const reactions = {
    like: comment.reactions?.like?.length || 0,
    love: comment.reactions?.love?.length || 0,
    haha: comment.reactions?.haha?.length || 0,
    wow: comment.reactions?.wow?.length || 0,
    sad: comment.reactions?.sad?.length || 0,
    angry: comment.reactions?.angry?.length || 0
  };

  // Find user's reaction
  let userReaction = null;
  if (userId) {
    const userIdStr = userId.toString();
    for (const [type, users] of Object.entries(comment.reactions || {})) {
      if (users.some(id => id.toString() === userIdStr)) {
        userReaction = type;
        break;
      }
    }
  }

  const isLiked = comment.reactions?.like?.some(id => id.toString() === userId?.toString()) ||
                  comment.likes?.some(id => id.toString() === userId?.toString()) || false;

  const dto = {
    _id: comment._id,
    content: comment.content,
    author: comment.author ? {
      _id: comment.author._id,
      username: comment.author.username,
      avatar: comment.author.avatar
    } : null,
    createdAt: comment.createdAt,
    edited: comment.edited || false,
    editedAt: comment.editedAt,
    likes: comment.likes || [],
    isLiked,
    reactions,
    userReaction,
    parentId: comment.parentId || null
  };

  if (comment.parentId === null || comment.parentId === undefined) {
    dto.repliesCount = comment.repliesCount || 0;
    if (includeRepliesPreview && dto.repliesCount > 0) {
      dto.repliesPreview = [];
    }
  }

  return dto;
};

// Create comment or reply
export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentId = null } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // If parentId provided, validate it exists
    if (parentId) {
      const parentComment = post.comments.id(parentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    const newComment = {
      content: content.trim(),
      author: userId,
      parentId: parentId || null,
      reactions: { like: [], love: [], haha: [], wow: [], sad: [], angry: [] },
      likes: [],
      repliesCount: 0
    };

    post.comments.push(newComment);

    // Increment parent's repliesCount
    if (parentId) {
      const parentComment = post.comments.id(parentId);
      if (parentComment) {
        parentComment.repliesCount = (parentComment.repliesCount || 0) + 1;
      }
    }

    await post.save();

    // Get the created comment and populate
    const createdComment = post.comments[post.comments.length - 1];
    await post.populate('comments.author', '_id username avatar');

    const commentDTO = formatCommentDTO(createdComment, userId);

    res.status(201).json({ comment: commentDTO });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Edit comment
export const editComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    comment.content = content.trim();
    comment.edited = true;
    comment.editedAt = new Date();

    await post.save();
    await post.populate('comments.author', '_id username avatar');

    const commentDTO = formatCommentDTO(comment, userId);

    res.json({ comment: commentDTO });
  } catch (error) {
    console.error('Error editing comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete comment (soft delete if has replies)
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

    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const hasReplies = comment.repliesCount > 0;

    if (hasReplies) {
      // Soft delete: replace content
      comment.content = 'Comment deleted';
      comment.edited = true;
      comment.editedAt = new Date();
    } else {
      // Hard delete: remove comment and update parent repliesCount
      if (comment.parentId) {
        const parentComment = post.comments.id(comment.parentId);
        if (parentComment) {
          parentComment.repliesCount = Math.max(0, (parentComment.repliesCount || 0) - 1);
        }
      }
      post.comments.pull(commentId);
    }

    await post.save();

    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// React to comment
export const reactToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { type = 'like' } = req.body;
    const userId = req.user._id;

    const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Initialize reactions if not exists
    if (!comment.reactions) {
      comment.reactions = { like: [], love: [], haha: [], wow: [], sad: [], angry: [] };
    }

    // Remove user from all reaction types
    validTypes.forEach(t => {
      if (!comment.reactions[t]) comment.reactions[t] = [];
      comment.reactions[t] = comment.reactions[t].filter(id => id.toString() !== userId.toString());
    });

    // Check if toggling off
    let userReaction = null;
    const alreadyReacted = comment.reactions[type].some(id => id.toString() === userId.toString());

    if (!alreadyReacted) {
      // Add new reaction
      comment.reactions[type].push(userId);
      userReaction = type;
    }

    // Sync likes array with reactions.like for compatibility
    comment.likes = [...comment.reactions.like];

    await post.save();

    const reactions = {
      like: comment.reactions.like.length,
      love: comment.reactions.love.length,
      haha: comment.reactions.haha.length,
      wow: comment.reactions.wow.length,
      sad: comment.reactions.sad.length,
      angry: comment.reactions.angry.length
    };

    const isLiked = comment.reactions.like.some(id => id.toString() === userId.toString());

    res.json({
      userReaction,
      reactions,
      likes: comment.likes.length,
      isLiked
    });
  } catch (error) {
    console.error('Error reacting to comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Legacy like endpoint (maps to 'like' reaction)
export const likeComment = async (req, res) => {
  req.body.type = 'like';
  return reactToComment(req, res);
};

// Get root comments with pagination
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { sort = 'relevant', limit = 20, cursor = '' } = req.query;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate('comments.author', '_id username avatar');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    let comments = post.comments.filter(c => !c.parentId || c.parentId === null);

    // Apply cursor filtering
    const cursorData = parseCursor(cursor);
    if (cursorData) {
      comments = comments.filter(c => {
        if (c.createdAt < cursorData.createdAt) return true;
        if (c.createdAt.getTime() === cursorData.createdAt.getTime() && c._id.toString() < cursorData._id.toString()) return true;
        return false;
      });
    }

    // Sorting
    if (sort === 'newest' || sort === 'all') {
      comments.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sort === 'relevant') {
      comments.sort((a, b) => {
        const scoreA = scoreRelevant(a);
        const scoreB = scoreRelevant(b);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.createdAt - a.createdAt;
      });
    }

    // Pagination
    const limitNum = parseInt(limit);
    const hasMore = comments.length > limitNum;
    const paginatedComments = comments.slice(0, limitNum);

    const nextCursor = hasMore ? encodeCursor(paginatedComments[paginatedComments.length - 1]) : null;

    // Format DTOs with replies preview
    const items = paginatedComments.map(comment => {
      const dto = formatCommentDTO(comment, userId, true);
      
      // Add replies preview (latest 2)
      if (dto.repliesCount > 0) {
        const replies = post.comments
          .filter(c => c.parentId && c.parentId.toString() === comment._id.toString())
          .sort((a, b) => a.createdAt - b.createdAt)
          .slice(0, 2);
        
        dto.repliesPreview = replies.map(r => formatCommentDTO(r, userId));
      }
      
      return dto;
    });

    res.json({ items, nextCursor });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get replies for a comment
export const getReplies = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { limit = 10, cursor = '' } = req.query;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate('comments.author', '_id username avatar');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    let replies = post.comments.filter(c => 
      c.parentId && c.parentId.toString() === commentId
    );

    // Apply cursor
    const cursorData = parseCursor(cursor);
    if (cursorData) {
      replies = replies.filter(c => {
        if (c.createdAt > cursorData.createdAt) return true;
        if (c.createdAt.getTime() === cursorData.createdAt.getTime() && c._id.toString() > cursorData._id.toString()) return true;
        return false;
      });
    }

    // Sort by createdAt ascending (oldest first for replies)
    replies.sort((a, b) => a.createdAt - b.createdAt);

    // Pagination
    const limitNum = parseInt(limit);
    const hasMore = replies.length > limitNum;
    const paginatedReplies = replies.slice(0, limitNum);

    const nextCursor = hasMore ? encodeCursor(paginatedReplies[paginatedReplies.length - 1]) : null;

    const items = paginatedReplies.map(reply => formatCommentDTO(reply, userId));

    res.json({ items, nextCursor });
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ message: 'Server error' });
  }
};