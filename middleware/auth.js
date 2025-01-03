const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Remove Bearer from token if present
    const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    // Verify token
    const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
    
    // Get fresh user data from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user info to request
    req.user = {
      _id: user._id,
      userId: user._id,
      role: user.role,
      fullName: user.fullName,
      firstName: user.fullName.split(' ')[0],
      username: user.username // Use the actual username field from the User model
    };
    
    console.log('Auth middleware - User:', {
      userId: req.user.userId,
      role: req.user.role,
      fullName: req.user.fullName,
      firstName: req.user.firstName,
      username: req.user.username
    });
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 