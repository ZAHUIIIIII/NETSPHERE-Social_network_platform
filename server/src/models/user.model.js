import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
  },
  birthday: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other'],
  },
  password: {
    type: String,
    required: true,
    minlength: 10,
  },
  avatar: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
    default: "",
    maxlength: 160,
  },
  website: {
    type: String,
    default: "",
  },
  phone: {
    type: String,
    default: "",
  },
  location: {
    type: String,
    default: "",
  },
  work: {
    type: String,
    default: "",
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  isGoogleUser: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
}, 
  { timestamps: true }
);

// Only add indexes for fields that aren't already indexed by unique: true
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
// username and email already have indexes due to unique: true

// Cascade delete: Remove all related data when user is deleted
userSchema.pre('remove', async function(next) {
  try {
    // Import Post model (avoid circular dependency)
    const Post = mongoose.model('Post');
    const Message = mongoose.model('Message');
    
    // Delete all posts by this user
    await Post.deleteMany({ author: this._id });
    
    // Remove user from likes and comments in all posts
    await Post.updateMany(
      { 'likes': this._id },
      { $pull: { likes: this._id } }
    );
    
    await Post.updateMany(
      { 'comments.author': this._id },
      { $pull: { comments: { author: this._id } } }
    );
    
    // Delete all messages sent or received by this user
    await Message.deleteMany({
      $or: [
        { senderId: this._id },
        { receiverId: this._id }
      ]
    });
    
    // Remove user from followers/following lists of other users
    await mongoose.model('User').updateMany(
      { followers: this._id },
      { $pull: { followers: this._id } }
    );
    
    await mongoose.model('User').updateMany(
      { following: this._id },
      { $pull: { following: this._id } }
    );
    
    // Remove from savedPosts
    await mongoose.model('User').updateMany(
      { savedPosts: { $in: await Post.find({ author: this._id }).distinct('_id') } },
      { $pull: { savedPosts: { $in: await Post.find({ author: this._id }).distinct('_id') } } }
    );
    
    next();
  } catch (error) {
    next(error);
  }
});

// Also handle findOneAndDelete, findByIdAndDelete, etc.
userSchema.pre('findOneAndDelete', async function(next) {
  try {
    const user = await this.model.findOne(this.getQuery());
    if (user) {
      await user.remove();
    }
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("User", userSchema);

export default User;