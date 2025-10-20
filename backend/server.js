const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
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

// Express performance and security tuning
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// HTTP compression (apply early)
app.use(compression({ threshold: 1024 }));

// Secure defaults and sane headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json());
app.use(favicon(path.join(__dirname, '../frontend/public/favicon.ico')));
// app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Enforce no-cache for all API responses to ensure live data
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

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
    
    // Use Atlas MongoDB only
    const connectionUri = process.env.MONGODB_URI;
    
    if (!connectionUri) {
      throw new Error('MONGODB_URI environment variable is required. Please set it in your .env file.');
    }
    
    console.log('📡 Using Atlas MongoDB');
    console.log('🔗 Connection URI:', connectionUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    await mongoose.connect(connectionUri, mongoOptions);
    console.log('✅ Connected to Atlas MongoDB successfully');
      console.log('📊 Database ready for operations');

    // Start continuous auto-scheduler after database connection
    // DISABLED: Continuous scheduler creates trips automatically
    // try {
    //   const ContinuousScheduler = require('./services/continuousScheduler');
    //   ContinuousScheduler.start();
    //   console.log('🚀 Continuous auto-scheduler started');
    // } catch (error) {
    //   console.error('❌ Failed to start continuous scheduler:', error.message);
    // }

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

// Global process error handlers to avoid unexpected crashes
process.on('unhandledRejection', (reason) => {
  try {
    console.error('Unhandled Promise Rejection:', reason);
  } catch {}
});

process.on('uncaughtException', (error) => {
  try {
    console.error('Uncaught Exception:', error);
  } catch {}
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
app.use('/api/otp', require('./routes/otp'));
app.use('/api/depot-auth', require('./routes/depotAuth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin', require('./routes/bulkAssignment'));
app.use('/api/depot', require('./routes/depot'));
app.use('/api/depots', require('./routes/depots'));
app.use('/api/admin/depot-users', require('./routes/depotUsers'));
app.use('/api/passenger', require('./routes/passenger'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/bus-schedule', require('./routes/busSchedule'));
app.use('/api/driver', require('./routes/driver'));
app.use('/api/conductor', require('./routes/conductor'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/seats', require('./routes/seats'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/booking', require('./routes/booking'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/stops', require('./routes/stops'));
app.use('/api/status', require('./routes/status'));
app.use('/api/email', require('./routes/emailStatus'));
app.use('/api/search', require('./routes/search'));
app.use('/api/auto-scheduler', require('./routes/autoScheduler'));
app.use('/api/trip-generator', require('./routes/tripGenerator'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/fastest-route', require('./routes/fastestRoute'));
app.use('/api/fare-policy', require('./routes/farePolicy'));
app.use('/api/admin/routes', require('./routes/conductorPricing'));
app.use('/api/conductor', require('./routes/conductorPricing'));
app.use('/api/bulk-scheduler', require('./routes/bulkTripScheduler-fixed'));
// app.use('/api/passenger-dashboard', require('./routes/passengerDashboard'));
app.use('/api/support', require('./routes/support'));
app.use('/api/data-collector', require('./routes/dataCollector'));
app.use('/api/fuel', require('./routes/fuel'));

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

// Central Express error handler (ensures single JSON response)
app.use((err, req, res, next) => {
  try {
    console.error('Express error handler:', err);
  } catch {}
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// Development fallback for depot endpoints to avoid 404s while wiring auth/depot middleware
app.get('/api/depot/health', (req, res) => {
  try {
    res.json({ success: true, message: 'Depot routes are working' });
  } catch (_) {
    res.json({ success: true });
  }
});

app.get('/api/depot/info', (req, res, next) => {
  // If the depot router handled this already, skip fallback
  if (res.headersSent) return;
  console.warn('[Fallback] Serving /api/depot/info');
  return res.json({
    success: true,
    data: {
      name: 'Yatrik Depot',
      location: 'Kerala, India',
      manager: 'Depot Manager',
      revenue: '₹0',
      revenueChange: '+0%',
      trips: '0',
      tripsChange: '+0%',
      occupancy: '0%',
      occupancyChange: '+0%',
      fuelEfficiency: '0 km/L',
      fuelEfficiencyChange: '+0%',
      ticketSales: '0',
      ticketSalesChange: '+0%',
      punctuality: '0%',
      punctualityChange: '+0%',
      breakdowns: '0',
      breakdownsChange: '+0%',
      activeBuses: '0',
      activeBusesChange: '+0',
      totalRoutes: '0',
      totalRoutesChange: '+0'
    }
  });
});

app.get('/api/depot/dashboard', (req, res, next) => {
  if (res.headersSent) return;
  console.warn('[Fallback] Serving /api/depot/dashboard');
  return res.json({
    success: true,
    data: {
      stats: {
        totalTrips: 0,
        activeTrips: 0,
        totalBuses: 0,
        availableBuses: 0,
        totalRoutes: 0,
        totalBookings: 0,
        totalFuelLogs: 0,
        todayTrips: 0,
        todayBookings: 0,
        todayRevenue: 0
      },
      recentTrips: [],
      activeCrew: [],
      todayFuelLogs: []
    }
  });
});

// Additional fallbacks for depot lists to prevent 404s during setup
app.get('/api/depot/buses', (req, res, next) => {
  if (res.headersSent) return;
  console.warn('[Fallback] Serving /api/depot/buses');
  return res.json({
    success: true,
    data: {
      buses: [],
      stats: { totalBuses: 0, availableBuses: 0, maintenanceBuses: 0 }
    }
  });
});

app.get('/api/depot/routes', (req, res, next) => {
  if (res.headersSent) return;
  console.warn('[Fallback] Serving /api/depot/routes');
  return res.json({
    success: true,
    data: { routes: [], stats: { totalRoutes: 0, activeRoutes: 0, inactiveRoutes: 0, totalDistance: 0 } }
  });
});

app.get('/api/depot/drivers', (req, res, next) => {
  if (res.headersSent) return;
  console.warn('[Fallback] Serving /api/depot/drivers');
  return res.json({
    success: true,
    data: { drivers: [], stats: { totalDrivers: 0 } }
  });
});

app.get('/api/depot/conductors', (req, res, next) => {
  if (res.headersSent) return;
  console.warn('[Fallback] Serving /api/depot/conductors');
  return res.json({
    success: true,
    data: { conductors: [], stats: { totalConductors: 0 } }
  });
});

// Reports fallback for depot dashboard widgets
app.get('/api/depot/reports', (req, res, next) => {
  if (res.headersSent) return;
  console.warn('[Fallback] Serving /api/depot/reports');
  const { startDate = null, endDate = null, type = 'daily' } = req.query || {};
  return res.json({
    success: true,
    data: {
      period: { start: startDate, end: endDate, type },
      trips: 0,
      bookings: 0,
      fuelLogs: 0,
      revenue: 0
    }
  });
});

// Lightweight admin fallbacks to prevent long timeouts during development
app.get('/api/admin/all-conductors', (req, res) => {
  if (res.headersSent) return;
  console.warn('[Fallback] Serving /api/admin/all-conductors');
  return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 0 } });
});

app.get('/api/admin/all-drivers', (req, res) => {
  if (res.headersSent) return;
  console.warn('[Fallback] Serving /api/admin/all-drivers');
  return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 0 } });
});

app.get('/api/admin/routes', (req, res) => {
  if (res.headersSent) return;
  console.warn('[Fallback] Serving /api/admin/routes');
  return res.json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 0 } });
});

// Explicit 404 for unmatched API routes (debug-friendly)
// Removed explicit '/api/*' 404 handler to avoid intercepting valid routes

// Catch-all route for non-API requests (API-only mode)
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