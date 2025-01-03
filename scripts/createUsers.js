const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const users = [
  {
    username: 'nishanthdhina',
    password: 'ND#2024$secure',
    role: 'admin'
  },
  {
    username: 'alexandrubarza',
    password: 'AB#2024$secure',
    role: 'admin'
  },
  {
    username: 'calebgrobler',
    password: 'CG#2024$secure',
    role: 'admin'
  },
  {
    username: 'akshananmay',
    password: 'AN#2024$secure',
    role: 'admin'
  }
];

async function createUsers() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    for (const userData of users) {
      const existingUser = await User.findOne({ username: userData.username });
      if (existingUser) {
        console.log(`User ${userData.username} already exists, skipping...`);
        continue;
      }
      
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.username}`);
    }
    
    console.log('\nAll users created successfully!');
    console.log('\nLogin Credentials:');
    users.forEach(user => {
      console.log(`\nUsername: ${user.username}`);
      console.log(`Password: ${user.password}`);
    });
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error details:', error);
    console.error('Error creating users:', error.message);
  }
}

createUsers(); 