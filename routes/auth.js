const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login and online status
    user.lastLogin = new Date();
    user.isOnline = true;
    await user.save();

    // Get first name for welcome message
    const firstName = user.fullName.split(' ')[0];

    console.log('User logged in successfully:', {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      firstName: firstName,
      role: user.role
    });

    // Create token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        fullName: user.fullName,
        firstName: firstName,
        name: firstName
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        firstName: firstName,
        name: firstName,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    console.log('Fetching current user with ID:', req.user.userId);
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get first name for consistency
    const firstName = user.fullName.split(' ')[0];
    
    console.log('Found user:', {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      firstName: firstName,
      role: user.role
    });
    
    res.json({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      firstName: firstName,
      name: firstName,
      role: user.role,
      email: user.email,
      isOnline: user.isOnline,
      lastLogin: user.lastLogin,
      lastActive: user.lastActive
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout route
router.post('/logout', auth, async (req, res) => {
  try {
    // Update last active timestamp and online status
    await User.findByIdAndUpdate(req.user.userId, {
      lastActive: new Date(),
      isOnline: false
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
module.exports = router; 