const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const favicon = require('serve-favicon');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(favicon(path.join(__dirname, '../frontend/public/favicon.ico')));
// app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'yatrik-erp-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Configure passport strategies
require('./config/passport');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/depot-auth', require('./routes/depotAuth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/depot', require('./routes/depot'));
app.use('/api/driver', require('./routes/driver'));
app.use('/api/conductor', require('./routes/conductor'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/seats', require('./routes/seats'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/booking', require('./routes/booking'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/status', require('./routes/status'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const apiStatus = 'running';
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      api: apiStatus
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API-only mode - no frontend serving
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: 'This is an API-only server. Please use the frontend application.'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});