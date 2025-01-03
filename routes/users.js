const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Initialize users
router.post('/init', async (req, res) => {
  try {
    console.log('Starting user initialization...');
    
    // Drop existing users collection
    await User.collection.drop().catch(err => {
      if (err.code !== 26) { // 26 is collection doesn't exist error
        throw err;
      }
    });
    console.log('Cleared existing users');

    // Create initial users with plain password (will be hashed by pre-save hook)
    const users = [
      {
        username: 'nishanth',
        password: 'password123',
        fullName: 'Nishanth Dhinakar',
        role: 'CEO',
        email: 'nishanth@example.com',
        isOnline: false
      },
      {
        username: 'alex',
        password: 'password123',
        fullName: 'Alexandru Barza',
        role: 'CTO',
        email: 'alex@example.com',
        isOnline: false
      },
      {
        username: 'akshanan',
        password: 'password123',
        fullName: 'Akshanan Mayuran',
        role: 'CFO',
        email: 'akshanan@example.com',
        isOnline: false
      },
      {
        username: 'caleb',
        password: 'password123',
        fullName: 'Caleb Grobler',
        role: 'COO',
        email: 'caleb@example.com',
        isOnline: false
      }
    ];

    console.log('Creating users with roles:', users.map(u => ({ username: u.username, role: u.role })));
    const createdUsers = await User.create(users);
    console.log('Users created successfully:', createdUsers.map(u => ({ username: u.username, role: u.role })));
    
    res.json({ 
      message: 'Users initialized successfully', 
      users: createdUsers.map(u => ({ 
        username: u.username, 
        fullName: u.fullName, 
        role: u.role 
      }))
    });
  } catch (error) {
    console.error('Error initializing users:', error);
    res.status(500).json({ 
      message: 'Failed to initialize users', 
      error: error.message,
      details: error.errors ? Object.values(error.errors).map(e => e.message) : []
    });
  }
});

// Get all users with status
router.get('/status', auth, async (req, res) => {
  try {
    console.log('Fetching users status...');
    console.log('Auth user:', req.user);
    
    // Get unique users by username
    const users = await User.find()
      .select('-password')
      .sort({ fullName: 1 }); // Sort by full name

    console.log('Found users:', users);

    if (!users || users.length === 0) {
      console.log('No users found');
      return res.json([]);
    }

    // Create a Map to ensure uniqueness by username
    const uniqueUsers = new Map();
    users.forEach(user => {
      if (!uniqueUsers.has(user.username)) {
        uniqueUsers.set(user.username, user);
      }
    });

    // Convert Map values back to array
    const uniqueUsersArray = Array.from(uniqueUsers.values());
    console.log('Sending unique users:', uniqueUsersArray.map(u => ({ username: u.username, role: u.role })));
    
    res.json(uniqueUsersArray);
  } catch (error) {
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Update user active status
router.post('/active', auth, async (req, res) => {
  try {
    console.log('Updating active status for user:', req.user);
    const userId = req.user.userId;
    
    if (!userId) {
      console.error('No userId in request');
      return res.status(400).json({ message: 'No user ID provided' });
    }

    const user = await User.findById(userId);
    console.log('Found user:', user);
    
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    user.lastActive = new Date();
    await user.save();
    console.log('Updated user active status:', user);

    res.json({ message: 'Active status updated' });
  } catch (error) {
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to update active status', error: error.message });
  }
});

module.exports = router; 