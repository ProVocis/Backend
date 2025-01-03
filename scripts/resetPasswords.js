require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const users = [
  {
    username: 'nishanth',
    password: 'Nishanth@2024'
  },
  {
    username: 'alexandru',
    password: 'Alexandru@2024'
  },
  {
    username: 'akshanan',
    password: 'Akshanan@2024'
  },
  {
    username: 'caleb',
    password: 'Caleb@2024'
  }
];

async function resetPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await User.findOneAndUpdate(
        { username: user.username },
        { password: hashedPassword }
      );
      console.log(`Reset password for user: ${user.username}`);
    }

    console.log('All passwords have been reset');
  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resetPasswords(); 