const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000; // Use environment variable or default to 5000

// MongoDB Connection with proper error handling
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yatrik_erp');
    console.log('✅ Connected to MongoDB');
    console.log(`🗄️  Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// OAuth / Passport
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('./models/User');

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Session (used by OAuth flows)
app.use(session({
  secret: process.env.JWT_SECRET || 'yatrikerp',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err);
  }
});

const issueJwtForUser = (user) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'yatrikerp', { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// Import OAuth config
const oauthConfig = require('./config/oauth');

// Google Strategy - Only load if credentials are properly configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase() : undefined;
      const googleId = profile.id;
      let user = await User.findOne({ $or: [ { email }, { 'providerIds.google': googleId } ] });
      if (!user) {
        user = await User.create({
          name: profile.displayName || 'Google User',
          email: email || `${googleId}@google.local`,
          phone: '0000000000',
          password: 'oauth:google',
          role: 'passenger', // OAuth users can only be passengers
          authProvider: 'google',
          emailVerified: !!email,
          profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
          providerIds: { google: googleId }
        });
      } else {
        if (!user.providerIds) user.providerIds = {};
        if (!user.providerIds.google) user.providerIds.google = googleId;
        if (!user.authProvider || user.authProvider === 'local') user.authProvider = 'google';
        
        // Ensure OAuth users remain as passengers (security measure)
        if (user.authProvider === 'google' && user.role !== 'passenger') {
          console.log(`⚠️ OAuth user ${user.email} role changed from ${user.role} to passenger for security`);
          user.role = 'passenger';
        }
        
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
  console.log('✅ Google OAuth strategy configured successfully');
} else {
  console.error('❌ Google OAuth strategy not configured - missing credentials');
  console.error('   Required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET');
  console.error('   Server will start but Google OAuth will not work');
}

// Twitter Strategy
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: process.env.TWITTER_CALLBACK_URL || 'http://localhost:5000/api/auth/twitter/callback',
    includeEmail: true
  }, async (token, tokenSecret, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase() : undefined;
      const twitterId = profile.id;
      let user = await User.findOne({ $or: [ { email }, { 'providerIds.twitter': twitterId } ] });
      if (!user) {
        user = await User.create({
          name: profile.displayName || profile.username || 'Twitter User',
          email: email || `${twitterId}@twitter.local`,
          phone: '0000000000',
          password: 'oauth:twitter',
          role: 'passenger', // Default role for OAuth users
          authProvider: 'twitter',
          emailVerified: !!email,
          profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
          providerIds: { twitter: twitterId }
        });
      } else {
        if (!user.providerIds) user.providerIds = {};
        if (!user.providerIds.twitter) user.providerIds.twitter = twitterId;
        if (!user.authProvider || user.authProvider === 'local') user.authProvider = 'twitter';
        
        // Ensure OAuth users remain as passengers (security measure)
        if (user.authProvider === 'twitter' && user.role !== 'passenger') {
          console.log(`⚠️ OAuth user ${user.email} role changed from ${user.role} to passenger for security`);
          user.role = 'passenger';
        }
        
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
}

// Microsoft Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:5000/api/auth/microsoft/callback',
    scope: ['user.read']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase() : undefined;
      const msId = profile.id;
      let user = await User.findOne({ $or: [ { email }, { 'providerIds.microsoft': msId } ] });
      if (!user) {
        user = await User.create({
          name: profile.displayName || 'Microsoft User',
          email: email || `${msId}@microsoft.local`,
          phone: '0000000000',
          password: 'oauth:microsoft',
          role: 'passenger', // Default role for OAuth users
          authProvider: 'microsoft',
          emailVerified: !!email,
          profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
          providerIds: { microsoft: msId }
        });
      } else {
        if (!user.providerIds) user.providerIds = {};
        if (!user.providerIds.microsoft) user.providerIds.microsoft = msId;
        if (!user.authProvider || user.authProvider === 'local') user.authProvider = 'microsoft';
        
        // Ensure OAuth users remain as passengers (security measure)
        if (user.authProvider === 'microsoft' && user.role !== 'passenger') {
          console.log(`⚠️ OAuth user ${user.email} role changed from ${user.role} to passenger for security`);
          user.role = 'passenger';
        }
        
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/stops', require('./routes/stops'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/booking', require('./routes/booking'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/search', require('./routes/search'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/promos', require('./routes/promos'));
app.use('/api/conductor', require('./routes/conductor'));
app.use('/api/driver', require('./routes/driver'));
app.use('/api/duty', require('./routes/duty'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/depot', require('./routes/depot'));
app.use('/api/depot-auth', require('./routes/depotAuth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payment', require('./routes/payment'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// HTTP server and Socket.IO
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const { auth } = require('./middleware/auth');
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Make io available to the app for admin routes
app.set('io', io);

io.use((socket, next) => {
  try {
    const token = socket.handshake?.query?.token;
    if (!token) return next(new Error('NO_TOKEN'));
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yatrikerp');
    socket.user = {
      _id: decoded.userId || decoded._id || decoded.id,
      role: decoded.role || decoded.userRole || 'PASSENGER',
      name: decoded.name,
      email: decoded.email,
    };
    return next();
  } catch (err) {
    return next(new Error('INVALID_TOKEN'));
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  // Trip-specific rooms
  socket.on('trip:join', ({ tripId }) => {
    if (tripId) {
      socket.join(`trip:${tripId}`);
      console.log(`Socket ${socket.id} joined trip:${tripId}`);
    }
  });
  
  socket.on('trip:leave', ({ tripId }) => {
    if (tripId) {
      socket.leave(`trip:${tripId}`);
      console.log(`Socket ${socket.id} left trip:${tripId}`);
    }
  });

  // Duty-specific rooms
  socket.on('duty:join', ({ dutyId }) => {
    if (dutyId) {
      socket.join(`duty:${dutyId}`);
      console.log(`Socket ${socket.id} joined duty:${dutyId}`);
    }
  });

  socket.on('duty:leave', ({ dutyId }) => {
    if (dutyId) {
      socket.leave(`duty:${dutyId}`);
      console.log(`Socket ${socket.id} left duty:${dutyId}`);
    }
  });

  // Admin rooms
  socket.on('admin:join', () => {
    socket.join('admin:live');
    socket.join('admin:dashboard');
    console.log(`Socket ${socket.id} joined admin rooms`);
  });

  socket.on('admin:leave', () => {
    socket.leave('admin:live');
    socket.leave('admin:dashboard');
    console.log(`Socket ${socket.id} left admin rooms`);
  });

  // Generic room joining
  socket.on('join', (roomName) => {
    if (roomName) {
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined ${roomName}`);
    }
  });

  socket.on('leave', (roomName) => {
    if (roomName) {
      socket.leave(roomName);
      console.log(`Socket ${socket.id} left ${roomName}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

module.exports.io = io;

// Graceful server startup with port conflict handling
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Using default'}`);
      console.log(`📧 Email: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle server errors gracefully
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error(`   To fix this, run: netstat -ano | findstr :${PORT}`);
    console.error(`   Then kill the process: taskkill /PID <PID> /F`);
    console.error(`   Or use a different port by setting PORT environment variable`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Start the server
startServer();