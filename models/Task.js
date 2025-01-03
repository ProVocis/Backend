const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  notes: [noteSchema],
  remarks: [{
    text: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'addressed'],
      default: 'pending'
    }
  }],
  votes: {
    delete: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    redo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  inProgressBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add a virtual property for isAssignedToCurrentUser
taskSchema.virtual('isAssignedToCurrentUser').get(function() {
  if (!this._currentUserId) return false;
  return this.assignedTo.some(userId => 
    userId.toString() === this._currentUserId.toString()
  );
});

// Method to set current user ID for the virtual property
taskSchema.methods.setCurrentUserId = function(userId) {
  this._currentUserId = userId;
  return this;
};

module.exports = mongoose.model('Task', taskSchema); 