import mongoose from 'mongoose';
import Comment from '../models/comment.model.js';
import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import { io } from '../lib/socket.js';
import { createNotification } from './notification.controller.js';

// ==================== CURSOR UTILITIES ====================

function toCursor(doc) { 
  return `${new Date(doc.createdAt).getTime()}|${doc._id}`; 
}

function parseCursor(cursor) {
  if (!cursor) return null;
  const [ts, id] = String(cursor).split('|');
  return { 
    createdAt: new Date(Number(ts)), 
    _id: new mongoose.Types.ObjectId(id) 
  };
}

// ==================== HELPER FUNCTIONS ====================

async function resolveUsername(userId) {
  try {
    const user = await User.findById(userId).select('username').lean();
    return user?.username || 'Unknown User';
  } catch (error) {
    console.error('Error resolving username:', error);
    return 'Unknown User';
  }
}

async function populateAuthor(comment) {
  if (!comment.authorId) return comment;
  
  const user = await User.findById(comment.authorId)
    .select('_id username avatar')
    .lean();
  
  return {
    ...comment,
    author: user || { _id: comment.authorId, username: 'Unknown', avatar: null }
  };
}

function formatCommentDTO(comment, currentUserId) {
  // Calculate reactions
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
  if (currentUserId) {
    const userIdStr = currentUserId.toString();
    for (const [type, users] of Object.entries(comment.reactions || {})) {
      if (users.some(id => id.toString() === userIdStr)) {
        userReaction = type;
        break;
      }
    }
  }

  return {
    _id: comment._id,
    postId: comment.postId,
    content: comment.content,
    author: comment.author || {
      _id: comment.authorId,
      username: 'Unknown',
      avatar: null
    },
    rootId: comment.rootId,
    immediateParent: comment.immediateParent,
    logicalDepth: comment.logicalDepth,
    directReplies: comment.directReplies,
    totalDescendants: comment.totalDescendants,
    replyToSnapshot: comment.replyToSnapshot,
    reactions,
    userReaction,
    isDeleted: comment.isDeleted,
    isEdited: comment.isEdited,
    editedAt: comment.editedAt,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt
  };
}

// ==================== CREATE COMMENT ====================

export const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, immediateParent, mentions } = req.body || {};
    const authorId = req.user?._id;

    if (!authorId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!content || !String(content).trim()) {
      return res.status(400).json({ message: 'Content required' });
    }

    let rootId = null;
    let ancestors = [];
    let logicalDepth = 0;
    let replyToSnapshot = null;

    // If replying to another comment
    if (immediateParent) {
      const parent = await Comment.findById(immediateParent).lean();
      
      if (!parent) {
        return res.status(400).json({ message: 'Parent comment not found' });
      }
      
      if (String(parent.postId) !== String(postId)) {
        return res.status(400).json({ message: 'Parent comment belongs to different post' });
      }

      // Build hierarchy
      rootId = parent.rootId || parent._id;
      ancestors = [...(parent.ancestors || []), parent._id];
      logicalDepth = ancestors.length;

      // Build reply snapshot
      replyToSnapshot = {
        userId: parent.authorId,
        username: await resolveUsername(parent.authorId),
        commentId: parent._id
      };
    }

    // Create comment
    const doc = await Comment.create({
      postId,
      authorId,
      content: content.trim(),
      rootId,
      immediateParent: immediateParent || null,
      ancestors,
      logicalDepth,
      mentions: mentions || [],
      replyToSnapshot,
      reactions: { like: [], love: [], haha: [], wow: [], sad: [], angry: [] }
    });

    // Update counters (eventual consistency)
    if (immediateParent) {
      // Increment direct replies on immediate parent
      await Comment.updateOne(
        { _id: immediateParent },
        { $inc: { directReplies: 1 } }
      );

      // Increment total descendants on all ancestors
      if (ancestors.length > 0) {
        await Comment.updateMany(
          { _id: { $in: ancestors } },
          { $inc: { totalDescendants: 1 } }
        );
      }
    }

    // Populate author for response
    const populated = await populateAuthor(doc.toObject());
    const formatted = formatCommentDTO(populated, authorId);

    // Real-time events
    io.to(`post:${postId}`).emit('comment:new', formatted);

    // Notifications
    try {
      if (!immediateParent) {
        // Top-level comment: notify post author
        const post = await Post.findById(postId).select('author').lean();
        if (post && post.author && post.author.toString() !== authorId.toString()) {
          await createNotification({
            recipient: post.author,
            sender: authorId,
            type: 'comment',
            post: postId,
            comment: doc._id,
            metadata: {
              commentContent: content.substring(0, 100)
            }
          });
        }
      } else if (replyToSnapshot?.userId) {
        // Reply: notify parent comment author
        if (replyToSnapshot.userId.toString() !== authorId.toString()) {
          await createNotification({
            recipient: replyToSnapshot.userId,
            sender: authorId,
            type: 'reply',
            post: postId,
            comment: doc._id,
            metadata: {
              commentContent: content.substring(0, 100)
            }
          });
        }
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }

    res.status(201).json(formatted);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==================== LIST ROOT COMMENTS ====================

export const listRootComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const after = parseCursor(req.query.after);
    const currentUserId = req.user?._id;

    const query = { postId, rootId: null, isDeleted: false };
    
    if (after) {
      query.$or = [
        { createdAt: { $gt: after.createdAt } },
        { createdAt: after.createdAt, _id: { $gt: after._id } }
      ];
    }

    const items = await Comment.find(query)
      .sort({ createdAt: -1, _id: -1 }) 
      .limit(limit + 1)
      .lean();

    let nextCursor = null;
    if (items.length > limit) {
      const last = items.pop();
      nextCursor = toCursor(last);
    }

    // Populate authors
    const populated = await Promise.all(
      items.map(item => populateAuthor(item))
    );

    // Format DTOs
    const formatted = populated.map(item => formatCommentDTO(item, currentUserId));

    res.json({ items: formatted, nextCursor });
  } catch (error) {
    console.error('Error listing root comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== LIST THREAD REPLIES ====================

export const listThreadReplies = async (req, res) => {
  try {
    const { postId, rootId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const after = parseCursor(req.query.after);
    const currentUserId = req.user?._id;

    // Verify root exists
    const root = await Comment.findOne({ 
      _id: rootId, 
      postId, 
      rootId: null 
    }).lean();
    
    if (!root) {
      return res.status(404).json({ message: 'Root comment not found' });
    }

    // Query all replies in this thread
    const query = { postId, rootId, isDeleted: false };
    
    if (after) {
      query.$or = [
        { createdAt: { $gt: after.createdAt } },
        { createdAt: after.createdAt, _id: { $gt: after._id } }
      ];
    }

    const replies = await Comment.find(query)
      .sort({ createdAt: 1, _id: 1 }) // Oldest first for replies
      .limit(limit + 1)
      .lean();

    let nextCursor = null;
    if (replies.length > limit) {
      const last = replies.pop();
      nextCursor = toCursor(last);
    }

    // Populate authors
    const populatedRoot = await populateAuthor(root);
    const populatedReplies = await Promise.all(
      replies.map(item => populateAuthor(item))
    );

    // Format DTOs
    const formattedRoot = formatCommentDTO(populatedRoot, currentUserId);
    const formattedReplies = populatedReplies.map(item => 
      formatCommentDTO(item, currentUserId)
    );

    res.json({ 
      root: formattedRoot, 
      replies: formattedReplies, 
      nextCursor 
    });
  } catch (error) {
    console.error('Error listing thread replies:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== EDIT COMMENT ====================

export const editComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content required' });
    }

    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.authorId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Save to edit history
    if (!comment.editHistory) {
      comment.editHistory = [];
    }
    comment.editHistory.push({
      content: comment.content,
      editedAt: new Date()
    });

    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    const populated = await populateAuthor(comment.toObject());
    const formatted = formatCommentDTO(populated, userId);

    // Real-time update
    io.to(`post:${comment.postId}`).emit('comment:updated', formatted);

    res.json(formatted);
  } catch (error) {
    console.error('Error editing comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== SOFT DELETE COMMENT ====================

export const softDeleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.authorId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    comment.isDeleted = true;
    comment.content = '(comment deleted)';
    await comment.save();

    // Real-time update
    io.to(`post:${comment.postId}`).emit('comment:deleted', { 
      commentId: id,
      postId: comment.postId 
    });

    res.json({ ok: true, id });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== REACT TO COMMENT ====================

export const reactToComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'like' } = req.body;
    const userId = req.user?._id;

    const validTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const comment = await Comment.findById(id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Initialize reactions if not exists
    if (!comment.reactions) {
      comment.reactions = { like: [], love: [], haha: [], wow: [], sad: [], angry: [] };
    }

    // Remove user from all reaction types
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
    if (oldReaction !== type) {
      comment.reactions[type].push(userId);
      userReaction = type;

      // Notify comment author
      if (comment.authorId.toString() !== userId.toString()) {
        try {
          await createNotification({
            recipient: comment.authorId,
            sender: userId,
            type: 'reaction',
            post: comment.postId,
            comment: comment._id,
            reactionType: type
          });
        } catch (notifError) {
          console.error('Error creating reaction notification:', notifError);
        }
      }
    }

    await comment.save();

    const reactions = {
      like: comment.reactions.like.length,
      love: comment.reactions.love.length,
      haha: comment.reactions.haha.length,
      wow: comment.reactions.wow.length,
      sad: comment.reactions.sad.length,
      angry: comment.reactions.angry.length
    };

    // Real-time update
    io.to(`post:${comment.postId}`).emit('comment:reacted', {
      commentId: id,
      reactions,
      userReaction
    });

    res.json({ userReaction, reactions });
  } catch (error) {
    console.error('Error reacting to comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
