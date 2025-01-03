const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const tasksRoutes = require('./routes/tasks');
const meetingsRoutes = require('./routes/meetings');
const discussionsRouter = require('./routes/discussions');
require('dotenv').config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// CORS configuration
app.use(cors({
  origin: [
    'https://provocis-dashboard.vercel.app',
    'https://dashboardfrontend-qwwnewq9p-provocis-projects.vercel.app',
    /\.vercel\.app$/  // Allow all Vercel preview deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/discussions', discussionsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Print available routes
console.log('Available routes:');
console.log('- /api/auth/login');
console.log('- /api/auth/me');
console.log('- /api/users/status');
console.log('- /api/users/init');
console.log('- /api/tasks');
console.log('- /api/tasks/clear');
console.log('- /api/tasks/leaderboard');
console.log('- /api/meetings');
console.log('- /api/discussions');

module.exports = app; 