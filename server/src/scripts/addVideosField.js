import mongoose from 'mongoose';
import Post from '../models/post.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const addVideosFieldToPosts = async () => {
  try {
    console.log('🚀 Starting migration: Adding videos field to existing posts...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all posts that don't have the videos field
    const postsWithoutVideos = await Post.find({ 
      videos: { $exists: false } 
    });

    console.log(`📊 Found ${postsWithoutVideos.length} posts without videos field\n`);

    if (postsWithoutVideos.length === 0) {
      console.log('✨ All posts already have the videos field. No migration needed.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Update posts to add empty videos array
    const result = await Post.updateMany(
      { videos: { $exists: false } },
      { $set: { videos: [] } }
    );

    console.log(`✅ Migration completed successfully!`);
    console.log(`   - Posts updated: ${result.modifiedCount}`);
    console.log(`   - Posts matched: ${result.matchedCount}\n`);

    // Verify the migration
    const remainingPosts = await Post.countDocuments({ 
      videos: { $exists: false } 
    });

    if (remainingPosts === 0) {
      console.log('✨ Verification passed: All posts now have the videos field\n');
    } else {
      console.log(`⚠️  Warning: ${remainingPosts} posts still missing videos field\n`);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the migration
addVideosFieldToPosts();
