import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';
import Message from '../models/message.model.js';

dotenv.config();

// List of forbidden words in usernames
const forbiddenWords = ['admin', 'root', 'system', 'moderator', 'support'];

// Helper to generate valid username
const generateValidUsername = () => {
  let username;
  let attempts = 0;
  
  do {
    // Generate username from first and last name without special characters
    const firstName = faker.person.firstName().toLowerCase();
    const lastName = faker.person.lastName().toLowerCase();
    username = `${firstName}${lastName}`;
    
    // Remove any non-alphanumeric characters and spaces
    username = username.replace(/[^a-z0-9 ]/g, '');
    
    // Ensure it doesn't contain forbidden words
    const containsForbidden = forbiddenWords.some(word => username.includes(word));
    
    attempts++;
    if (attempts > 10) {
      // Fallback to a random string if we can't generate a valid name
      username = `user${Math.random().toString(36).substring(2, 10)}`;
      break;
    }
  } while (username.includes('_') || username.includes('.') || username.length < 2);
  
  return username;
};

// Sample post content themes
const postThemes = {
  technology: [
    "Just discovered this amazing new AI tool! 🤖",
    "Working on my coding project today. Anyone else debugging on a Friday? 😅",
    "The future of web development is here!",
    "Just deployed my first full-stack application! 🚀",
    "Love the new features in the latest JavaScript update!",
  ],
  lifestyle: [
    "Beautiful sunset today! 🌅",
    "Coffee and good vibes ☕",
    "Weekend goals: relax and recharge 💆",
    "Trying out a new recipe today! 🍳",
    "Feeling grateful for the little things in life ✨",
  ],
  motivation: [
    "Believe in yourself and all that you are! 💪",
    "Every day is a new opportunity to grow!",
    "Success is not final, failure is not fatal 🌟",
    "Dream big, work hard, stay focused!",
    "The best time to start was yesterday. The next best time is now!",
  ],
  random: [
    "Having a great day! How about you? 😊",
    "Just sharing some thoughts...",
    "This is exactly what I needed today!",
    "Can't believe it's already the weekend!",
    "Making memories! 📸",
    "Life is good! 🙌",
    "Excited for what's coming next!",
  ],
};

// Get random post content
const getRandomPostContent = () => {
  const themes = Object.values(postThemes).flat();
  return themes[Math.floor(Math.random() * themes.length)];
};

async function seedDatabase() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({ role: { $ne: 'admin' } }); // Keep admin users
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Message.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // Create 95 users
    console.log('👥 Creating 95 users...');
    const users = [];
    const hashedPassword = await bcrypt.hash('password123', 10);

    for (let i = 0; i < 95; i++) {
      const username = generateValidUsername();
      const usernameKey = username.toLowerCase().replace(/\./g, '');
      const gender = faker.helpers.arrayElement(['male', 'female', 'other']);
      
      const user = new User({
        username: username + i, // Add index to ensure uniqueness
        usernameKey: usernameKey + i,
        email: `${username}${i}@demo.com`,
        password: hashedPassword,
        bio: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.7 }) || '',
        avatar: '', // Default avatar
        gender: gender,
        birthday: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
        followers: [],
        following: [],
        savedPosts: [],
        role: 'user',
        status: 'active'
      });

      await user.save();
      users.push(user);

      if ((i + 1) % 10 === 0) {
        console.log(`   ✓ Created ${i + 1}/95 users...`);
      }
    }
    console.log('✅ Created 95 users\n');

    // Create follow relationships (each user follows 5-15 random users)
    console.log('🔗 Creating follow relationships...');
    let totalFollows = 0;
    
    for (const user of users) {
      const numToFollow = faker.number.int({ min: 5, max: 15 });
      const potentialFollows = users.filter(u => u._id.toString() !== user._id.toString());
      const toFollow = faker.helpers.arrayElements(potentialFollows, numToFollow);

      for (const followUser of toFollow) {
        if (!user.following.includes(followUser._id)) {
          user.following.push(followUser._id);
          followUser.followers.push(user._id);
          totalFollows++;
        }
      }

      await user.save();
    }

    // Save all users with updated followers
    await Promise.all(users.map(u => u.save()));
    console.log(`✅ Created ${totalFollows} follow relationships\n`);

    // Create 2-3 posts per user (190-285 posts total)
    console.log('📝 Creating posts...');
    const posts = [];
    let postCount = 0;

    for (const user of users) {
      const numPosts = faker.number.int({ min: 2, max: 3 });

      for (let i = 0; i < numPosts; i++) {
        const post = new Post({
          author: user._id,
          content: getRandomPostContent(),
          images: [], // No images for simplicity
          reactions: {
            like: [],
            love: [],
            haha: [],
            wow: [],
            sad: [],
            angry: []
          },
          status: 'published'
        });

        await post.save();
        posts.push(post);
        postCount++;
      }

      if (postCount % 50 === 0) {
        console.log(`   ✓ Created ${postCount} posts...`);
      }
    }
    console.log(`✅ Created ${postCount} posts\n`);

    // Add reactions to posts (random users react to random posts)
    console.log('❤️  Adding reactions to posts...');
    let totalReactions = 0;
    const reactionTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

    for (const post of posts) {
      const numReactions = faker.number.int({ min: 5, max: 20 });
      const reactors = faker.helpers.arrayElements(users, numReactions);

      for (const reactor of reactors) {
        const reactionType = faker.helpers.arrayElement(reactionTypes);
        
        // Remove from other reaction types
        reactionTypes.forEach(type => {
          const index = post.reactions[type].indexOf(reactor._id);
          if (index > -1) {
            post.reactions[type].splice(index, 1);
          }
        });

        // Add to selected reaction type
        if (!post.reactions[reactionType].includes(reactor._id)) {
          post.reactions[reactionType].push(reactor._id);
          totalReactions++;
        }
      }

      await post.save();
    }
    console.log(`✅ Added ${totalReactions} reactions\n`);

    // Add comments to posts (5-15 comments per post)
    console.log('💬 Adding comments to posts...');
    let totalComments = 0;

    for (const post of posts) {
      const numComments = faker.number.int({ min: 5, max: 15 });

      for (let i = 0; i < numComments; i++) {
        const commenter = faker.helpers.arrayElement(users);
        
        const comment = new Comment({
          postId: post._id,
          authorId: commenter._id,
          content: faker.lorem.sentence(),
          rootId: null,
          immediateParent: null,
          ancestors: [],
          logicalDepth: 0,
          isDeleted: false,
          likes: []
        });

        await comment.save();
        totalComments++;

        // 30% chance to add a reply to this comment
        if (faker.datatype.boolean({ probability: 0.3 })) {
          const replier = faker.helpers.arrayElement(users);
          
          const reply = new Comment({
            postId: post._id,
            authorId: replier._id,
            content: faker.lorem.sentence(),
            rootId: comment._id,
            immediateParent: comment._id,
            ancestors: [comment._id],
            logicalDepth: 1,
            isDeleted: false,
            likes: []
          });

          await reply.save();
          totalComments++;
        }
      }

      if (totalComments % 100 === 0) {
        console.log(`   ✓ Created ${totalComments} comments...`);
      }
    }
    console.log(`✅ Created ${totalComments} comments\n`);

    // Create some messages between users
    console.log('💌 Creating messages...');
    let totalMessages = 0;

    for (let i = 0; i < 50; i++) {
      const sender = faker.helpers.arrayElement(users);
      const receiver = faker.helpers.arrayElement(users.filter(u => u._id.toString() !== sender._id.toString()));

      const numMessages = faker.number.int({ min: 2, max: 5 });

      for (let j = 0; j < numMessages; j++) {
        const message = new Message({
          senderId: sender._id,
          receiverId: receiver._id,
          content: faker.lorem.sentence(),
          image: null
        });

        await message.save();
        totalMessages++;
      }
    }
    console.log(`✅ Created ${totalMessages} messages\n`);

    // Add saved posts (each user saves 3-7 random posts)
    console.log('🔖 Adding saved posts...');
    let totalSaved = 0;

    for (const user of users) {
      const numToSave = faker.number.int({ min: 3, max: 7 });
      const postsToSave = faker.helpers.arrayElements(posts, numToSave);

      for (const post of postsToSave) {
        if (!user.savedPosts.includes(post._id)) {
          user.savedPosts.push(post._id);
          totalSaved++;
        }
      }

      await user.save();
    }
    console.log(`✅ Added ${totalSaved} saved posts\n`);

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✨ Database seeded successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`👥 Users: ${users.length}`);
    console.log(`📝 Posts: ${postCount}`);
    console.log(`🔗 Follow relationships: ${totalFollows}`);
    console.log(`❤️  Reactions: ${totalReactions}`);
    console.log(`💬 Comments: ${totalComments}`);
    console.log(`💌 Messages: ${totalMessages}`);
    console.log(`🔖 Saved posts: ${totalSaved}`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
