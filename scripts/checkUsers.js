require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log('\nTotal users found:', users.length);
    console.log('\nExisting users:');
    users.forEach(user => {
      console.log(`\nID: ${user._id}`);
      console.log(`Username: ${user.username}`);
      console.log(`Full Name: ${user.fullName}`);
      console.log(`Role: ${user.role}`);
      console.log(`Online: ${user.isOnline}`);
      console.log(`Last Login: ${user.lastLogin}`);
      console.log('------------------------');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers(); 