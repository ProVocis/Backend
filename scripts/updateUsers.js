require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function updateUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update users with proper full names
    const updates = [
      {
        username: 'nishanth',
        update: {
          fullName: 'Nishanth Dhinakar',
          email: 'nishanth@provocis.com',
          role: 'CEO'
        }
      },
      {
        username: 'alex',
        update: {
          fullName: 'Alexandru Barza',
          email: 'alex@provocis.com',
          role: 'CTO'
        }
      },
      {
        username: 'akshanan',
        update: {
          fullName: 'Akshanan Mayuran',
          email: 'akshanan@provocis.com',
          role: 'CFO'
        }
      },
      {
        username: 'caleb',
        update: {
          fullName: 'Caleb Grobler',
          email: 'caleb@provocis.com',
          role: 'COO'
        }
      }
    ];

    for (const { username, update } of updates) {
      const result = await User.findOneAndUpdate(
        { username },
        { $set: update },
        { new: true }
      );
      
      if (result) {
        console.log(`Updated user ${username}:`, result);
      } else {
        console.log(`User ${username} not found`);
      }
    }

    console.log('User updates completed');

    // Verify updates
    const users = await User.find({});
    console.log('\nCurrent users:');
    users.forEach(user => {
      console.log(`${user.username}: ${user.fullName} (${user.role})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateUsers(); 