const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true
  },
  subtext: {
    type: String,
    required: true
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Topic', topicSchema); 