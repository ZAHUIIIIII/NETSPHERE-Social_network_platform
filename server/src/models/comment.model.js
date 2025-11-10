import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    index: true,
    ref: 'Post'
  },
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    index: true,
    ref: 'User'
  },

  // Thread hierarchy
  rootId: { 
    type: mongoose.Schema.Types.ObjectId, 
    default: null, 
    index: true 
  }, // null for root comments
  immediateParent: { 
    type: mongoose.Schema.Types.ObjectId, 
    default: null, 
    index: true 
  },
  ancestors: { 
    type: [mongoose.Schema.Types.ObjectId], 
    default: [] 
  }, // [rootId, ..., immediateParent]
  logicalDepth: { 
    type: Number, 
    default: 0,
    index: true
  }, // unlimited logical depth

  // Counters (eventual consistency)
  directReplies: { 
    type: Number, 
    default: 0 
  },
  totalDescendants: { 
    type: Number, 
    default: 0 
  },

  // Content
  content: { 
    type: String, 
    required: true 
  },
  
  // Author snapshot (preserved when user is deleted)
  authorSnapshot: {
    username: String,
    avatar: String
  },
  
  // Reply snapshot (for display)
  replyToSnapshot: {
    userId: mongoose.Schema.Types.ObjectId,
    username: String,
    commentId: mongoose.Schema.Types.ObjectId
  },

  // Reactions system (same as embedded comments)
  reactions: {
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    love: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    haha: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    wow: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sad: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    angry: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },

  // Edit/Delete tracking
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  isEdited: { 
    type: Boolean, 
    default: false 
  },
  editedAt: { 
    type: Date 
  },
  editHistory: [{
    content: String,
    editedAt: Date
  }]
}, { 
  timestamps: true 
});

// Compound indexes for efficient queries
CommentSchema.index({ postId: 1, rootId: 1, createdAt: 1 });
CommentSchema.index({ postId: 1, immediateParent: 1, createdAt: 1 });
CommentSchema.index({ postId: 1, logicalDepth: 1, createdAt: 1 });
CommentSchema.index({ authorId: 1, createdAt: -1 });

export default mongoose.model('Comment', CommentSchema);
