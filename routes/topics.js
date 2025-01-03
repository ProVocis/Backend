const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');

// Get all topics
router.get('/', async (req, res) => {
  try {
    const topics = await Topic.find().sort({ timestamp: -1 });
    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Error fetching topics' });
  }
});

// Post a new topic
router.post('/', async (req, res) => {
  try {
    const { heading, subtext } = req.body;
    const newTopic = new Topic({ heading, subtext });
    const savedTopic = await newTopic.save();
    res.status(201).json(savedTopic);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: 'Error creating topic' });
  }
});

module.exports = router; 