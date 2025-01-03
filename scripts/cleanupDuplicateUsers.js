require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function cleanupDuplicateUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Total users before cleanup: ${users.length}`);

    // Group users by fullName
    const usersByFullName = {};
    users.forEach(user => {
      if (!usersByFullName[user.fullName]) {
        usersByFullName[user.fullName] = [];
      }
      usersByFullName[user.fullName].push(user);
    });

    // Find and remove duplicates
    for (const [fullName, userList] of Object.entries(usersByFullName)) {
      if (userList.length > 1) {
        console.log(`\nFound ${userList.length} instances of user: ${fullName}`);
        
        // Sort by creation date (if available) or ID, and keep the oldest one
        userList.sort((a, b) => a._id.getTimestamp() - b._id.getTimestamp());
        
        // Keep the first (oldest) user and remove the rest
        const keepUser = userList[0];
        const removeUsers = userList.slice(1);
        
        console.log(`Keeping user with ID: ${keepUser._id} (username: ${keepUser.username})`);
        for (const user of removeUsers) {
          console.log(`Removing duplicate with ID: ${user._id} (username: ${user.username})`);
          await User.findByIdAndDelete(user._id);
        }
      }
    }

    // Final count
    const remainingUsers = await User.find({});
    console.log(`\nTotal users after cleanup: ${remainingUsers.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupDuplicateUsers(); 