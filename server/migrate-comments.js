import mongoose from 'mongoose';
import Post from './src/models/post.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const isDryRun = process.argv.includes('--dry-run');

async function migrateComments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let postsModified = 0;
    let commentsModified = 0;

    const posts = await Post.find({ 'comments.0': { $exists: true } });
    console.log(`📊 Found ${posts.length} posts with comments`);

    for (const post of posts) {
      let postChanged = false;

      for (const comment of post.comments) {
        let commentChanged = false;

        // 1. Set parentId = null if missing
        if (comment.parentId === undefined) {
          if (!isDryRun) comment.parentId = null;
          commentChanged = true;
          console.log(`  ✏️  Set parentId=null for comment ${comment._id}`);
        }

        // 2. Initialize reactions object if missing
        if (!comment.reactions) {
          if (!isDryRun) {
            comment.reactions = {
              like: [],
              love: [],
              haha: [],
              wow: [],
              sad: [],
              angry: []
            };
          }
          commentChanged = true;
          console.log(`  ✏️  Initialized reactions for comment ${comment._id}`);
        }

        // 3. Copy likes → reactions.like if reactions.like is empty
        if (comment.likes && comment.likes.length > 0) {
          if (!comment.reactions) {
            comment.reactions = { like: [], love: [], haha: [], wow: [], sad: [], angry: [] };
          }
          if (comment.reactions.like.length === 0) {
            if (!isDryRun) {
              comment.reactions.like = [...comment.likes];
            }
            commentChanged = true;
            console.log(`  ✏️  Copied ${comment.likes.length} likes to reactions.like for comment ${comment._id}`);
          }
        }

        // 4. Calculate repliesCount if missing (not needed for flat structure)
        if (comment.repliesCount === undefined) {
          if (!isDryRun) comment.repliesCount = 0;
          commentChanged = true;
        }

        // 5. Initialize edited field
        if (comment.edited === undefined) {
          if (!isDryRun) comment.edited = false;
          commentChanged = true;
        }

        if (commentChanged) {
          commentsModified++;
          postChanged = true;
        }
      }

      if (postChanged) {
        postsModified++;
        if (!isDryRun) {
          await post.save();
          console.log(`✅ Saved post ${post._id}`);
        } else {
          console.log(`🔍 [DRY RUN] Would save post ${post._id}`);
        }
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`📝 Posts modified: ${postsModified}`);
    console.log(`💬 Comments modified: ${commentsModified}`);
    console.log(`🔧 Mode: ${isDryRun ? 'DRY RUN (no changes saved)' : 'LIVE (changes saved)'}`);

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run migration
migrateComments().then(() => {
  console.log('✅ Migration completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});