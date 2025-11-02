import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'like',           // Someone liked your post
      'comment',        // Someone commented on your post
      'reply',          // Someone replied to your comment
      'follow',         // Someone followed you
      'reaction',       // Someone reacted to your post/comment
      'repost'          // Someone reposted your post
    ]
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId
  },
  // Store reaction type for reaction notifications
  reactionType: {
    type: String,
    enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry']
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  // For grouping multiple similar notifications
  groupKey: {
    type: String,
    index: true
  },
  // Metadata for the notification
  metadata: {
    postContent: String,
    commentContent: String,
    postImage: String
  }
}, { 
  timestamps: true 
});

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, groupKey: 1 });

// Auto-delete old read notifications after 30 days
notificationSchema.index(
  { createdAt: 1 }, 
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { read: true }
  }
);

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  // Don't create notification if sender and recipient are the same
  if (data.sender.toString() === data.recipient.toString()) {
    return null;
  }

  // Only group similar notifications for reactions and likes (not comments/replies)
  // Comments and replies should always create new notifications
  if (data.type === 'like' || data.type === 'reaction' || data.type === 'follow') {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existing = await this.findOne({
      recipient: data.recipient,
      sender: data.sender,
      type: data.type,
      post: data.post,
      read: false,
      createdAt: { $gte: oneHourAgo }
    });

    if (existing) {
      // Update the timestamp and metadata to make it recent
      existing.createdAt = new Date();
      existing.read = false; // Mark as unread again
      if (data.metadata) {
        existing.metadata = data.metadata;
      }
      await existing.save();
      
      // Re-populate sender and post to ensure they're included
      await existing.populate('sender', 'username avatar');
      if (existing.post) {
        await existing.populate('post', 'content images');
      }
      
      return existing;
    }
  }

  // Create new notification
  const notification = await this.create(data);
  await notification.populate('sender', 'username avatar');
  if (notification.post) {
    await notification.populate('post', 'content images');
  }

  return notification;
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { recipient: userId, read: false },
    { read: true }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    read: false
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;