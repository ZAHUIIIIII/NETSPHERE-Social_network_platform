import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user.model.js';

dotenv.config();

const migrateNotificationSettings = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all users that don't have notificationSettings
    const result = await User.updateMany(
      { notificationSettings: { $exists: false } },
      {
        $set: {
          notificationSettings: {
            allNotificationsMuted: false,
            mutedPosts: [],
            mutedUsers: []
          }
        }
      }
    );

    console.log(`✅ Migration completed!`);
    console.log(`   Updated ${result.modifiedCount} users`);
    console.log(`   Matched ${result.matchedCount} users without notificationSettings`);

    // Verify the update
    const usersWithSettings = await User.countDocuments({ 
      'notificationSettings.allNotificationsMuted': { $exists: true } 
    });
    const totalUsers = await User.countDocuments();
    
    console.log(`\n📊 Database Status:`);
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with notificationSettings: ${usersWithSettings}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateNotificationSettings();
