const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');

// Generate temporary invite links
router.post('/generate-invite', async (req, res) => {
  const inviteCode = crypto.randomBytes(16).toString('hex');
  // Store invite code in database with expiration
  res.json({ inviteCode });
});

module.exports = router; 