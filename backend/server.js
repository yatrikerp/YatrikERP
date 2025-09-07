const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const favicon = require('serve-favicon');
const passport = require('passport');
const session = require('express-session');
const { createServer } = require('http');
const { Server } = require('socket.io');
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

// Connect to MongoDB with enhanced error handling
console.log('🔌 Attempting MongoDB connection...');
console.log('📡 MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Using default');

const mongoOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  retryWrites: true,
  retryReads: true
};

// Connect to MongoDB and start server
async function startServer() {
  try {
    console.log('🔌 Attempting MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp', mongoOptions);
    console.log('✅ Connected to MongoDB successfully');
    console.log('📊 Database ready for operations');
    
    // Start the server after database connection
    const PORT = process.env.PORT || 5000;
    
    // Create HTTP server
    const server = createServer(app);
    
    // Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    
    // Store io instance for use in routes
    app.set('io', io);
    
    server.listen(PORT, () => {
      console.log(`Starting server...`);
      console.log(`Port: ${PORT}`);
      console.log(`Server running on port ${PORT}`);
      console.log('Socket.IO server ready');
      console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('🔍 Error details:', {
      name: error.name,
      code: error.code,
      codeName: error.codeName
    });
    process.exit(1);
  }
}

startServer();

const db = mongoose.connection;

// Enhanced database event handlers
db.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
  console.error('🔍 Error details:', {
    name: error.name,
    message: error.message,
    code: error.code
  });
});

db.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

db.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

db.on('open', () => {
  console.log('🚀 MongoDB connection opened');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT. Graceful shutdown...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/depot-auth', require('./routes/depotAuth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/depot', require('./routes/depot'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/bus-schedule', require('./routes/busSchedule'));
app.use('/api/driver', require('./routes/driver'));
app.use('/api/conductor', require('./routes/conductor'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/seats', require('./routes/seats'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/booking', require('./routes/booking-public'));
app.use('/api/booking-auth', require('./routes/booking'));
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

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT. Graceful shutdown...');
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM. Graceful shutdown...');
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
  
  process.exit(0);
});

// Server startup is now handled in startServer() function