const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Meeting = require('../models/Meeting');

// Get all meetings
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching meetings for user:', req.user);
    const meetings = await Meeting.find()
      .populate('createdBy', 'fullName')
      .sort({ date: 1, time: 1 });
    res.json(meetings);
  } catch (error) {
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching meetings', error: error.message });
  }
});

// Add new meeting
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating new meeting:', req.body);
    console.log('User:', req.user);
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const meeting = new Meeting({
      ...req.body,
      createdBy: req.user.userId
    });

    await meeting.save();
    
    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('createdBy', 'fullName');

    res.status(201).json(populatedMeeting);
  } catch (error) {
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error creating meeting', error: error.message });
  }
});

// Delete meeting
router.delete('/:id', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only allow creator or CEO to delete meetings
    if (meeting.createdBy.toString() !== req.user.userId && req.user.role !== 'CEO') {
      return res.status(403).json({ message: 'Not authorized to delete this meeting' });
    }

    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ message: 'Error deleting meeting' });
  }
});

module.exports = router; 