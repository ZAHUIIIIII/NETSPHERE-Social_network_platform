import Post from '../models/post.model.js';
import mongoose from 'mongoose';

// ==================== UTILITIES ====================

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

const formatCommentDTO = (comment, userId) => {
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

  return {
    _id: comment._id,
    postId: comment.parent()._id, // Parent post ID
    parentId: comment.parentId,
    user: comment.author ? {
      _id: comment.author._id,
      name: comment.author.username,
      avatar: comment.author.avatar
    } : null,
    content: comment.isDeleted ? "This comment was deleted." : comment.content,
    reactions,
    userReaction,
    replyCount: comment.parentId ? 0 : (comment.replyCount || 0),
    replyToUserId: comment.replyToUserId,
    replyToSnapshot: comment.replyToSnapshot,
    replyToCommentId: comment.replyToCommentId,
    isEdited: comment.isEdited || false,
    isDeleted: comment.isDeleted || false,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString()
  };
};

// ==================== GET COMMENTS (ROOT) ====================

export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 20, cursor = '', sort = 'newest' } = req.query;
    const userId = req.user._id;

    const post = await Post.findById(postId).populate('comments.author', '_id username avatar');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get root comments only (parentId === null)
    let comments = post.comments.filter(c => !c.parentId && !c.isDeleted);

    // Apply cursor
    const cursorData = parseCursor(cursor);
    if (cursorData) {
      comments = comments.filter(c => {
        if (c.createdAt < cursorData.createdAt) return true;
        if (c.createdAt.getTime() === cursorData.createdAt.getTime() && 
            c._id.toString() < cursorData._id.toString()) return true;
        return false;
      });
    }

    // Sort
    if (sort === 'newest') {
      comments.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sort === 'oldest') {
      comments.sort((a, b) => a.createdAt - b.createdAt);
    }

    // Paginate
    const limitNum = parseInt(limit);
    const hasMore = comments.length > limitNum;
    const paginatedComments = comments.slice(0, limitNum);

    const nextCursor = hasMore ? encodeCursor(paginatedComments[paginatedComments.length - 1]) : null;

    const items = paginatedComments.map(c => formatCommentDTO(c, userId));

    res.json({ items, nextCursor });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== GET REPLIES ====================

export const getReplies = async (req, res) => {
  try {
    const { rootCommentId } = req.params;
    const { limit = 10, cursor = '', sort = 'oldest' } = req.query;
    const userId = req.user._id;

    const post = await Post.findOne({ 'comments._id': rootCommentId })
      .populate('comments.author', '_id username avatar');
    
    if (!post) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Get all replies pointing to this root comment
    let replies = post.comments.filter(c => 
      c.parentId && c.parentId.toString() === rootCommentId && !c.isDeleted
    );

    // Apply cursor
    const cursorData = parseCursor(cursor);
    if (cursorData) {
      replies = replies.filter(c => {
        if (c.createdAt > cursorData.createdAt) return true;
        if (c.createdAt.getTime() === cursorData.createdAt.getTime() && 
            c._id.toString() > cursorData._id.toString()) return true;
        return false;
      });
    }

    // Sort (oldest first for replies)
    replies.sort((a, b) => {
      if (sort === 'oldest') return a.createdAt - b.createdAt;
      return b.createdAt - a.createdAt;
    });

    // Paginate
    const limitNum = parseInt(limit);
    const hasMore = replies.length > limitNum;
    const paginatedReplies = replies.slice(0, limitNum);

    const nextCursor = hasMore ? encodeCursor(paginatedReplies[paginatedReplies.length - 1]) : null;

    const items = paginatedReplies.map(r => formatCommentDTO(r, userId));

    res.json({ items, nextCursor });
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== CREATE COMMENT/REPLY ====================

export const createComment = async (req, res) => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const { postId } = req.params;
      const { content, parentId = null, replyToUserId = null, replyToCommentId = null } = req.body;
      const userId = req.user._id;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Content is required' });
      }

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Validate two-level hierarchy
      if (parentId) {
        const parentComment = post.comments.id(parentId);
        if (!parentComment) {
          return res.status(404).json({ message: 'Parent comment not found' });
        }

        // CRITICAL: If parent is already a reply (has parentId), reject
        if (parentComment.parentId) {
          return res.status(400).json({ 
            message: 'Cannot reply to a reply. Replies must point to root comments only.' 
          });
        }
      }

      // Build reply snapshot if replying to specific user
      let replyToSnapshot = null;
      if (replyToUserId) {
        const targetComment = replyToCommentId ? 
          post.comments.id(replyToCommentId) : 
          post.comments.id(parentId);
        
        if (targetComment && targetComment.author) {
          await post.populate('comments.author', '_id username avatar');
          replyToSnapshot = {
            name: targetComment.author.username,
            avatar: targetComment.author.avatar
          };
        }
      }

      // Create new comment
      const newComment = {
        content: content.trim(),
        author: userId,
        parentId: parentId || null,
        replyToUserId: replyToUserId || null,
        replyToSnapshot: replyToSnapshot,
        replyToCommentId: replyToCommentId || null,
        reactions: { like: [], love: [], haha: [], wow: [], sad: [], angry: [] },
        replyCount: 0,
        isEdited: false,
        isDeleted: false
      };

      post.comments.push(newComment);

      // Update replyCount on root comment
      if (parentId) {
        const rootComment = post.comments.id(parentId);
        if (rootComment) {
          rootComment.replyCount = (rootComment.replyCount || 0) + 1;
        }
      }

      await post.save();

      // Get created comment with populated author
      const createdComment = post.comments[post.comments.length - 1];
      await post.populate('comments.author', '_id username avatar');

      const commentDTO = formatCommentDTO(createdComment, userId);

      // TODO: Send notification if replyToUserId exists
      // createNotification({ type: 'comment-reply', toUserId: replyToUserId, ... });

      return res.status(201).json(commentDTO);

    } catch (error) {
      if (error.name === 'VersionError' || error.message.includes('No matching document')) {
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
          continue;
        }
        return res.status(500).json({ message: 'Too many concurrent requests, please try again' });
      }
      console.error('Error creating comment:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
};

// ==================== EDIT COMMENT ====================

export const editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const post = await Post.findOne({ 'comments._id': commentId });
    if (!post) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = post.comments.id(commentId);
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Store edit history (optional)
    if (!comment.editHistory) comment.editHistory = [];
    comment.editHistory.push({
      content: comment.content,
      editedAt: new Date()
    });

    comment.content = content.trim();
    comment.isEdited = true;

    await post.save();
    await post.populate('comments.author', '_id username avatar');

    res.json(formatCommentDTO(comment, userId));
  } catch (error) {
    console.error('Error editing comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== SOFT DELETE COMMENT ====================

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const post = await Post.findOne({ 'comments._id': commentId });
    if (!post) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = post.comments.id(commentId);
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Soft delete
    comment.isDeleted = true;
    comment.content = "This comment was deleted.";

    // If this is a reply, decrement parent's replyCount
    if (comment.parentId) {
      const parent = post.comments.id(comment.parentId);
      if (parent) {
        parent.replyCount = Math.max(0, (parent.replyCount || 0) - 1);
      }
    }

    await post.save();

    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== TOGGLE REACTION ====================

export const reactToComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { type = 'like' } = req.body;
    const userId = req.user._id;

    const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const post = await Post.findOne({ 'comments._id': commentId });
    if (!post) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = post.comments.id(commentId);
    if (!comment.reactions) {
      comment.reactions = { like: [], love: [], haha: [], wow: [], sad: [], angry: [] };
    }

    // Remove user from all reactions
    let oldReaction = null;
    validTypes.forEach(t => {
      if (!comment.reactions[t]) comment.reactions[t] = [];
      const idx = comment.reactions[t].findIndex(id => id.toString() === userId.toString());
      if (idx !== -1) {
        comment.reactions[t].splice(idx, 1);
        oldReaction = t;
      }
    });

    // Toggle: if clicking same reaction, remove it; otherwise add new one
    let userReaction = null;
    if (oldReaction !== type && type) {
      comment.reactions[type].push(userId);
      userReaction = type;
    }

    await post.save();

    const reactions = {
      like: comment.reactions.like.length,
      love: comment.reactions.love.length,
      haha: comment.reactions.haha.length,
      wow: comment.reactions.wow.length,
      sad: comment.reactions.sad.length,
      angry: comment.reactions.angry.length
    };

    res.json({ userReaction, reactions });
  } catch (error) {
    console.error('Error reacting to comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};