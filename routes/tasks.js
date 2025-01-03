const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'fullName')
      .populate('createdBy', 'fullName')
      .populate('inProgressBy', 'fullName')
      .populate('completedBy', 'fullName')
      .populate('notes.addedBy', 'fullName')
      .sort({ createdAt: -1 });
    
    // Add a flag to indicate if the current user is assigned to each task
    const tasksWithAssignment = tasks.map(task => {
      const taskObj = task.toObject();
      taskObj.isAssignedToCurrentUser = task.assignedTo.some(user => 
        user._id.toString() === req.user.userId.toString()
      );
      return taskObj;
    });
    
    console.log('Tasks with assignment:', tasksWithAssignment.map(t => ({
      id: t._id,
      assignedTo: t.assignedTo.map(u => u.fullName),
      isAssignedToCurrentUser: t.isAssignedToCurrentUser
    })));
    
    res.json(tasksWithAssignment);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Create a new task
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating task with data:', req.body);
    console.log('User from auth middleware:', req.user);
    
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Ensure assignedTo is an array of user IDs
    const assignedUsers = await User.find({
      '_id': { $in: req.body.assignedTo }
    }, 'fullName role');
    
    console.log('Found assigned users:', assignedUsers);

    const task = new Task({
      ...req.body,
      assignedTo: assignedUsers.map(user => user._id),
      createdBy: req.user.userId,
      status: 'pending'
    });
    
    await task.save();
    
    // Populate all user-related fields
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'fullName role')
      .populate('createdBy', 'fullName role')
      .populate('inProgressBy', 'fullName role')
      .populate('completedBy', 'fullName role')
      .populate('notes.addedBy', 'fullName role');
    
    // Add isAssignedToCurrentUser flag
    const taskObj = populatedTask.toObject();
    taskObj.isAssignedToCurrentUser = populatedTask.assignedTo.some(user => 
      user._id.toString() === req.user.userId
    );
    
    console.log('Created task:', taskObj);
    
    res.status(201).json(taskObj);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ message: error.message || 'Error creating task' });
  }
});

// Update task status (start or complete)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    console.log('Raw request body:', req.body);
    console.log('Task status update request:', {
      taskId: req.params.id,
      body: req.body,
      user: req.user
    });

    // Handle case where action might be nested in the request body
    let action;
    
    // If no action is provided in the request, determine it based on the current task status
    if (!req.body || Object.keys(req.body).length === 0) {
      const currentTask = await Task.findById(req.params.id);
      action = currentTask.status === 'pending' ? 'start' : 'complete';
      console.log('No action provided, defaulting based on task status:', action);
    } else if (typeof req.body === 'string') {
      action = req.body;
    } else if (req.body.action) {
      action = req.body.action;
    } else if (req.body.status && req.body.status.action) {
      action = req.body.status.action;
    } else if (req.body.type) {
      action = req.body.type;
    }

    console.log('Initial action value:', action);
    
    // Convert action to lowercase and normalize
    action = String(action || '').toLowerCase().trim();
    if (action.includes('start') || action.includes('working') || action === 'accept') {
      action = 'start';
    } else if (action.includes('complete') || action.includes('done') || action.includes('finish')) {
      action = 'complete';
    }

    console.log('Normalized action:', action);

    let task = await Task.findById(req.params.id)
      .populate('assignedTo', 'fullName')
      .populate('createdBy', 'fullName');

    if (!task) {
      console.log('Task not found:', req.params.id);
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('Found task:', {
      id: task._id,
      title: task.title,
      status: task.status,
      assignedTo: task.assignedTo.map(u => ({ id: u._id.toString(), fullName: u.fullName }))
    });

    // Check if user is assigned to the task
    const isAssigned = task.assignedTo.some(user => 
      user._id.toString() === req.user.userId.toString()
    );

    console.log('User assignment check:', {
      userId: req.user.userId,
      assignedUserIds: task.assignedTo.map(u => u._id.toString()),
      isAssigned: isAssigned
    });

    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }

    // Get user's full name from assigned users
    const assignedUser = task.assignedTo.find(user => 
      user._id.toString() === req.user.userId.toString()
    );
    const userFullName = assignedUser ? assignedUser.fullName : 'User';

    // Update task based on action
    if (action === 'start') {
      if (task.status !== 'pending') {
        console.log('Invalid status transition:', {
          currentStatus: task.status,
          action: action
        });
        return res.status(400).json({ message: 'Task can only be started when pending' });
      }
      task.status = 'in-progress';
      task.inProgressBy = req.user.userId;
      task.startedAt = new Date();
      
      // Add a note about user starting work
      task.notes.push({
        text: `${userFullName} has started working on this task`,
        addedBy: req.user.userId
      });

      console.log('Task started:', {
        status: task.status,
        inProgressBy: task.inProgressBy,
        startedAt: task.startedAt
      });
    } else if (action === 'complete') {
      if (task.status !== 'in-progress') {
        console.log('Invalid status transition:', {
          currentStatus: task.status,
          action: action
        });
        return res.status(400).json({ message: 'Task can only be completed when in progress' });
      }
      task.status = 'completed';
      task.completedBy = req.user.userId;
      task.completedAt = new Date();
      task.progress = 100;
      
      // Add a note about task completion
      task.notes.push({
        text: `${userFullName} has completed this task`,
        addedBy: req.user.userId
      });

      console.log('Task completed:', {
        status: task.status,
        completedBy: task.completedBy,
        completedAt: task.completedAt
      });
    } else {
      console.log('Invalid action received:', {
        action: action,
        originalBody: req.body,
        bodyType: typeof req.body,
        bodyKeys: Object.keys(req.body)
      });
      return res.status(400).json({ 
        message: 'Invalid action. Must be "start" or "complete".',
        receivedAction: action,
        allowedActions: ['start', 'complete'],
        originalBody: req.body
      });
    }

    await task.save();

    task = await Task.findById(task._id)
      .populate('assignedTo', 'fullName')
      .populate('createdBy', 'fullName')
      .populate('inProgressBy', 'fullName')
      .populate('completedBy', 'fullName')
      .populate('notes.addedBy', 'fullName');

    // Add isAssignedToCurrentUser flag
    const taskObj = task.toObject();
    taskObj.isAssignedToCurrentUser = true; // We already know it's assigned since we checked above

    console.log('Task updated successfully:', taskObj);
    res.json(taskObj);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(400).json({ message: 'Error updating task status', error: error.message });
  }
});

// Update task progress
router.patch('/:id/progress', auth, async (req, res) => {
  try {
    const { progress } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { progress },
      { new: true }
    ).populate('assignedTo', 'fullName')
     .populate('createdBy', 'fullName')
     .populate('inProgressBy', 'fullName')
     .populate('completedBy', 'fullName')
     .populate('notes.addedBy', 'fullName');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error updating task progress:', error);
    res.status(400).json({ message: 'Error updating task progress' });
  }
});

// Add note to task
router.post('/:id/notes', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          notes: {
            text,
            addedBy: req.user.id
          }
        }
      },
      { new: true }
    ).populate('assignedTo', 'fullName')
     .populate('createdBy', 'fullName')
     .populate('inProgressBy', 'fullName')
     .populate('completedBy', 'fullName')
     .populate('notes.addedBy', 'fullName');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(400).json({ message: 'Error adding note' });
  }
});

// Vote on task (delete or redo)
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const { voteType } = req.body;
    const userId = req.user.userId;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Initialize votes array if it doesn't exist
    if (!task.votes) {
      task.votes = { delete: [], redo: [] };
    }
    if (!task.votes[voteType]) {
      task.votes[voteType] = [];
    }

    const votes = task.votes[voteType];
    const userVoteIndex = votes.indexOf(userId);

    if (userVoteIndex > -1) {
      // Remove vote if user already voted
      votes.splice(userVoteIndex, 1);
    } else {
      // Add vote if user hasn't voted
      votes.push(userId);
    }

    // If 2 delete votes, actually delete the task
    if (voteType === 'delete' && votes.length >= 2) {
      await Task.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Task deleted' });
    }

    // If 2 redo votes, reset the task
    if (voteType === 'redo' && votes.length >= 2) {
      task.status = 'pending';
      task.completedBy = null;
      task.completedAt = null;
      task.inProgressBy = null;
      task.startedAt = null;
      task.votes.delete = [];
      task.votes.redo = [];
    }

    await task.save();
    
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'fullName')
      .populate('createdBy', 'fullName')
      .populate('inProgressBy', 'fullName')
      .populate('completedBy', 'fullName')
      .populate('notes.addedBy', 'fullName');

    res.json(updatedTask);
  } catch (error) {
    console.error('Error processing vote:', error);
    res.status(400).json({ message: 'Error processing vote' });
  }
});

// Clear all tasks
router.delete('/clear', auth, async (req, res) => {
  try {
    console.log('Clear tasks request received');
    console.log('User role:', req.user.role);
    
    // Check if user is CEO
    if (req.user.role !== 'CEO') {
      console.log('Unauthorized: User is not CEO');
      return res.status(403).json({ message: 'Only CEO can clear all tasks' });
    }

    await Task.deleteMany({});
    console.log('All tasks cleared successfully');
    res.status(200).json({ message: 'All tasks cleared successfully' });
  } catch (error) {
    console.error('Error clearing tasks:', error);
    res.status(500).json({ message: 'Failed to clear tasks' });
  }
});

// Get task leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    // Get all users first
    const users = await User.find().select('_id fullName role');
    const tasks = await Task.find({ status: { $in: ['completed', 'pending'] } })
      .populate('completedBy', '_id fullName role');
    
    // Create a map to store user stats
    const userStats = new Map();
    
    // Initialize all users with 0 tasks
    users.forEach(user => {
      userStats.set(user._id.toString(), {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        tasksCompleted: 0
      });
    });

    // Count completed and redo tasks
    tasks.forEach(task => {
      if (task.status === 'completed' && task.completedBy) {
        const userId = task.completedBy._id.toString();
        const userStat = userStats.get(userId);
        if (userStat) {
          userStat.tasksCompleted += 1;
        }
      }
      
      if (task.status === 'pending' && task.votes?.redo?.length >= 2 && task.completedBy) {
        const userId = task.completedBy._id.toString();
        const userStat = userStats.get(userId);
        if (userStat && userStat.tasksCompleted > 0) {
          userStat.tasksCompleted -= 1;
        }
      }
    });

    // Convert map to array and sort by completed tasks
    const leaderboard = Array.from(userStats.values())
      .sort((a, b) => b.tasksCompleted - a.tasksCompleted);

    res.json(leaderboard);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ message: 'Failed to get leaderboard' });
  }
});

// Add remark to task
router.post('/:id/remarks', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'fullName')
      .populate('createdBy', 'fullName')
      .populate('inProgressBy', 'fullName')
      .populate('completedBy', 'fullName')
      .populate('notes.addedBy', 'fullName')
      .populate('remarks.addedBy', 'fullName');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.remarks.push({
      text,
      addedBy: req.user.userId,
      status: 'pending'
    });

    await task.save();

    // Re-populate the task to get the new remark with user details
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'fullName')
      .populate('createdBy', 'fullName')
      .populate('inProgressBy', 'fullName')
      .populate('completedBy', 'fullName')
      .populate('notes.addedBy', 'fullName')
      .populate('remarks.addedBy', 'fullName');

    res.json(updatedTask);
  } catch (error) {
    console.error('Error adding remark:', error);
    res.status(400).json({ message: 'Error adding remark' });
  }
});

// Update remark status
router.patch('/:id/remarks/:remarkId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const remark = task.remarks.id(req.params.remarkId);
    if (!remark) {
      return res.status(404).json({ message: 'Remark not found' });
    }

    remark.status = status;
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'fullName')
      .populate('createdBy', 'fullName')
      .populate('inProgressBy', 'fullName')
      .populate('completedBy', 'fullName')
      .populate('notes.addedBy', 'fullName')
      .populate('remarks.addedBy', 'fullName');

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating remark status:', error);
    res.status(400).json({ message: 'Error updating remark status' });
  }
});

module.exports = router; 