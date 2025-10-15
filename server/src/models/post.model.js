import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Nested comments support
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },
  repliesCount: {
    type: Number,
    default: 0
  },
  
  // Legacy likes array (kept for compatibility)
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Enhanced reactions system
  reactions: {
    like: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    love: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    haha: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    wow: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    sad: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    angry: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Edit tracking
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, { timestamps: true });

// Compound indexes for efficient querying
commentSchema.index({ parentId: 1, createdAt: -1 });
commentSchema.index({ createdAt: -1 });

// Static method to calculate reaction counts
commentSchema.statics.calculateReactionCounts = function(comment) {
  const reactions = comment.reactions || {};
  return {
    like: (reactions.like || []).length,
    love: (reactions.love || []).length,
    haha: (reactions.haha || []).length,
    wow: (reactions.wow || []).length,
    sad: (reactions.sad || []).length,
    angry: (reactions.angry || []).length
  };
};

// Instance method to get total reactions
commentSchema.methods.getReactionsTotal = function() {
  const counts = this.constructor.calculateReactionCounts(this);
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
};

// Instance method to get likes count (legacy compatibility)
commentSchema.methods.getLikesCount = function() {
  // Prioritize reactions.like, fallback to likes array
  return (this.reactions?.like || this.likes || []).length;
};

// Instance method to sync likes with reactions.like
commentSchema.methods.syncLikesWithReactions = function() {
  if (this.reactions && this.reactions.like) {
    this.likes = [...this.reactions.like];
  }
  return this;
};

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    trim: true,
  },
  images: [{
    type: String,
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [commentSchema],
  privacy: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  feeling: {
    type: String
  },
  location: {
    type: String
  },
  shares: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Indexes for post queries
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ privacy: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

// Helper to calculate relevance score for sorting
postSchema.statics.calculateCommentRelevance = function(comment) {
  const reactionsTotal = comment.getReactionsTotal ? comment.getReactionsTotal() : 0;
  const likesCount = comment.getLikesCount ? comment.getLikesCount() : 0;
  const repliesCount = comment.repliesCount || 0;
  
  const hoursSinceCreated = (Date.now() - new Date(comment.createdAt).getTime()) / 3600000;
  const recencyBoost = Math.max(0, 36 - hoursSinceCreated);
  
  return (reactionsTotal * 4) + (likesCount * 3) + (repliesCount * 2) + recencyBoost;
};

const Post = mongoose.model('Post', postSchema);

export default Post;