require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const teamMembers = [
  {
    username: 'nishanth',
    password: 'Nishanth@2024',
    fullName: 'Nishanth Dhinakar',
    role: 'CEO',
    email: 'nishanth@provocis.com',
    isOnline: false
  },
  {
    username: 'alexandru',
    password: 'Alexandru@2024',
    fullName: 'Alexandru Barza',
    role: 'CTO',
    email: 'alexandru@provocis.com',
    isOnline: false
  },
  {
    username: 'akshanan',
    password: 'Akshanan@2024',
    fullName: 'Akshanan Mayuran',
    role: 'CFO',
    email: 'akshanan@provocis.com',
    isOnline: false
  },
  {
    username: 'caleb',
    password: 'Caleb@2024',
    fullName: 'Caleb Grobler',
    role: 'COO',
    email: 'caleb@provocis.com',
    isOnline: false
  }
];

async function createTeamMembers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const member of teamMembers) {
      const existingUser = await User.findOne({ username: member.username });
      if (existingUser) {
        console.log(`User ${member.username} already exists`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(member.password, 10);
      const user = new User({
        ...member,
        password: hashedPassword,
        lastLogin: null,
        lastActive: null
      });

      await user.save();
      console.log(`Created user: ${member.fullName} (${member.role})`);
    }

    console.log('All team members created successfully');
  } catch (error) {
    console.error('Error creating team members:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTeamMembers(); 