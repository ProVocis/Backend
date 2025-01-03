require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const teamMembers = [
  {
    username: 'nishanth',
    password: 'Nishanth@2024',
    fullName: 'Nishanth Dhinakar',
    role: 'CEO'
  },
  {
    username: 'alexandru',
    password: 'Alexandru@2024',
    fullName: 'Alexandru Barza',
    role: 'CTO'
  },
  {
    username: 'akshanan',
    password: 'Akshanan@2024',
    fullName: 'Akshanan Mayuran',
    role: 'CFO'
  },
  {
    username: 'caleb',
    password: 'Caleb@2024',
    fullName: 'Caleb Grobler',
    role: 'COO'
  }
];

async function createTeamUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    for (const member of teamMembers) {
      const existingUser = await User.findOne({ username: member.username });
      if (existingUser) {
        console.log(`User ${member.username} already exists`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(member.password, 10);
      const user = new User({
        username: member.username,
        password: hashedPassword,
        fullName: member.fullName,
        role: member.role
      });

      await user.save();
      console.log(`Created user: ${member.fullName} (${member.role})`);
    }
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    mongoose.disconnect();
  }
}

createTeamUsers(); 