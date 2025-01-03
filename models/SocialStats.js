const mongoose = require('mongoose');

const socialStatsSchema = new mongoose.Schema({
  followers: {
    instagram: { type: Number, default: 0 },
    facebook: { type: Number, default: 0 },
    twitter: { type: Number, default: 0 },
    linkedin: { type: Number, default: 0 }
  },
  engagement: {
    instagram: { type: Number, default: 0 },
    facebook: { type: Number, default: 0 },
    twitter: { type: Number, default: 0 },
    linkedin: { type: Number, default: 0 }
  },
  growth: {
    instagram: { type: Number, default: 0 },
    facebook: { type: Number, default: 0 },
    twitter: { type: Number, default: 0 },
    linkedin: { type: Number, default: 0 }
  },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SocialStats', socialStatsSchema); 