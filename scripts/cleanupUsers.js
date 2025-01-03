require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const validUsernames = ['nishanth', 'alexandru', 'akshanan', 'caleb'];

async function cleanupUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // First, delete all users
    await User.deleteMany({});
    console.log('Deleted all users');

    // Verify no users remain
    const remainingUsers = await User.find({});
    console.log('\nRemaining users:', remainingUsers.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupUsers(); 