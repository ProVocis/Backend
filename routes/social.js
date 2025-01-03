const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Debug middleware
router.use((req, res, next) => {
  console.log('Social route accessed:', req.path);
  console.log('Headers:', req.headers);
  next();
});

// Test route - no auth required
router.get('/test', (req, res) => {
  res.json({ message: 'Social route is working' });
});

// Get social media stats
router.get('/stats', auth, async (req, res) => {
  try {
    console.log('Handling /stats request');
    console.log('User from token:', req.user);
    
    // Mock data with realistic numbers
    const mockStats = {
      followers: {
        instagram: Math.floor(Math.random() * 5000) + 15000,  // 15k-20k followers
        facebook: Math.floor(Math.random() * 10000) + 20000,  // 20k-30k followers
        twitter: Math.floor(Math.random() * 3000) + 10000,    // 10k-13k followers
        linkedin: Math.floor(Math.random() * 2000) + 8000     // 8k-10k followers
      },
      engagement: {
        instagram: (Math.random() * 2 + 3).toFixed(1),  // 3-5%
        facebook: (Math.random() * 2 + 2).toFixed(1),   // 2-4%
        twitter: (Math.random() * 1.5 + 2).toFixed(1),  // 2-3.5%
        linkedin: (Math.random() * 3 + 4).toFixed(1)    // 4-7%
      },
      growth: {
        instagram: (Math.random() * 3 + 1).toFixed(1),   // 1-4%
        facebook: (Math.random() * 2 + 1).toFixed(1),    // 1-3%
        twitter: (Math.random() * 4 - 2).toFixed(1),     // -2-2%
        linkedin: (Math.random() * 4 + 2).toFixed(1)     // 2-6%
      }
    };

    // Add timestamp
    mockStats.lastUpdated = new Date().toISOString();

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(mockStats);
  } catch (error) {
    console.error('Error in social stats route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed platform stats
router.get('/platform/:platform', auth, async (req, res) => {
  const { platform } = req.params;
  try {
    // Mock detailed platform data
    const detailedStats = {
      platform,
      metrics: {
        followers: Math.floor(Math.random() * 10000) + 10000,
        engagement: (Math.random() * 5 + 2).toFixed(1),
        posts: Math.floor(Math.random() * 50) + 100,
        reach: Math.floor(Math.random() * 50000) + 100000,
      },
      recentPosts: Array(5).fill(null).map((_, i) => ({
        id: `post-${i}`,
        content: `Sample post content ${i + 1}`,
        likes: Math.floor(Math.random() * 1000),
        comments: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50),
        date: new Date(Date.now() - i * 86400000).toISOString()
      }))
    };

    res.json(detailedStats);
  } catch (error) {
    console.error(`Error fetching ${platform} stats:`, error);
    res.status(500).json({ error: `Failed to fetch ${platform} statistics` });
  }
});

module.exports = router; 