require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const teamMembers = [
  {
    username: 'nishanth',
    fullName: 'Nishanth Dhinakar',
    role: 'CEO'
  },
  {
    username: 'alexandru',
    fullName: 'Alexandru Barza',
    role: 'CTO'
  },
  {
    username: 'akshanan',
    fullName: 'Akshanan Mayuran',
    role: 'CFO'
  },
  {
    username: 'caleb',
    fullName: 'Caleb Grobler',
    role: 'COO'
  }
];

async function updateTeamMembers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const member of teamMembers) {
      await User.findOneAndUpdate(
        { username: member.username },
        { 
          fullName: member.fullName,
          role: member.role,
          isOnline: false,
          lastLogin: null,
          lastActive: null
        },
        { upsert: true }
      );
      console.log(`Updated user: ${member.fullName}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateTeamMembers(); 