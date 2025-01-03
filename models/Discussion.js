const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const discussionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  replies: [replySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
discussionSchema.index({ createdAt: -1 });
discussionSchema.index({ userId: 1 });

// Pre-save middleware to ensure replies have unique IDs
discussionSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('replies')) {
    this.replies.forEach(reply => {
      if (!reply._id) {
        reply._id = new mongoose.Types.ObjectId();
      }
    });
  }
  next();
});

module.exports = mongoose.model('Discussion', discussionSchema); 