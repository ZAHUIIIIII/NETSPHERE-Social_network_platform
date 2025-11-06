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
  
  // Two-level nesting: null = Level 1, non-null = Level 2 (always points to ROOT)
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },
  
  // Reply targeting (NO mentions, just metadata for UI & notifications)
  replyToUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  replyToSnapshot: {
    name: { type: String },
    avatar: { type: String }
  },
  replyToCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  
  // Reply count (only meaningful for root comments)
  replyCount: {
    type: Number,
    default: 0
  },
  
  // Reactions system (👍❤️😂😮😢😡)
  reactions: {
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    love: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    haha: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    wow: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sad: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    angry: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  
  // Edit/Delete tracking
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  editHistory: [{
    content: String,
    editedAt: Date
  }]
}, { timestamps: true });

// Indexes for efficient queries
commentSchema.index({ parentId: 1, createdAt: -1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ 'author': 1 });

const postSchema = new mongoose.Schema({
  content: { type: String, trim: true },
  images: [{ type: String }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Legacy likes (keep for compatibility)
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Post-level reactions
  reactions: {
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    love: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    haha: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    wow: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sad: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    angry: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  
  comments: [commentSchema],
  privacy: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  feeling: { type: String },
  location: { type: String },
  
  // Repost fields
  reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  repostCount: { type: Number, default: 0 },
  isRepost: { type: Boolean, default: false },
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  
  // Admin moderation fields
  status: {
    type: String,
    enum: ['published', 'flagged', 'removed'],
    default: 'published'
  },
  reportsCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 }
}, { timestamps: true });

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ privacy: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
export default Post;