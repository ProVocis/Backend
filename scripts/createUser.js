require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createUser(username, password) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('User already exists');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword
    });

    await user.save();
    console.log(`User ${username} created successfully`);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Usage:
// node createUser.js username password
const [,, username, password] = process.argv;
if (username && password) {
  createUser(username, password);
} else {
  console.log('Please provide username and password');
} 