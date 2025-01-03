const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Discussion = require('../models/Discussion');

// Get all discussions
router.get('/', auth, async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(discussions);
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new discussion
router.post('/', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content is required' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'Content is too long (max 1000 characters)' });
    }

    // Ensure we have a valid username and userId
    if (!req.user._id || !req.user.username) {
      console.error('Missing user information:', req.user);
      return res.status(400).json({ message: 'Invalid user information' });
    }

    console.log('User info from auth middleware:', {
      userId: req.user._id,
      username: req.user.username,
      fullName: req.user.fullName
    });

    const discussion = new Discussion({
      content: content.trim(),
      username: req.user.username.toLowerCase(), // Ensure consistent casing
      userId: req.user._id,
      replies: []
    });

    console.log('Creating discussion:', {
      content: discussion.content,
      username: discussion.username,
      userId: discussion.userId
    });

    const savedDiscussion = await discussion.save();
    console.log('Saved discussion:', savedDiscussion);
    res.status(201).json(savedDiscussion);
  } catch (error) {
    console.error('Error creating discussion:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message,
        errors: error.errors
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a reply to a discussion
router.post('/:id/replies', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    if (content.length > 500) {
      return res.status(400).json({ message: 'Reply is too long (max 500 characters)' });
    }

    // Ensure we have a valid username and userId
    if (!req.user._id || !req.user.username) {
      console.error('Missing user information:', req.user);
      return res.status(400).json({ message: 'Invalid user information' });
    }

    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const reply = {
      content: content.trim(),
      username: req.user.username.toLowerCase(), // Ensure consistent casing
      userId: req.user._id,
      createdAt: new Date()
    };

    discussion.replies.push(reply);
    await discussion.save();
    res.json(discussion);
  } catch (error) {
    console.error('Error adding reply:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message,
        errors: error.errors
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a discussion
router.delete('/:id', auth, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Only allow the creator or admin to delete
    if (discussion.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this discussion' });
    }

    await Discussion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Discussion deleted' });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a reply
router.delete('/:id/replies/:replyId', auth, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const reply = discussion.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // Only allow the creator or admin to delete
    if (reply.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this reply' });
    }

    discussion.replies = discussion.replies.filter(
      reply => reply._id.toString() !== req.params.replyId
    );
    
    await discussion.save();
    res.json(discussion);
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 