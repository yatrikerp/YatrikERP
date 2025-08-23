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
const PORT = process.env.PORT || 5000;

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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Session (used by OAuth flows)
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
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
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// Import OAuth config
const oauthConfig = require('./config/oauth');

// Google Strategy
if (oauthConfig.google.clientSecret) {
  passport.use(new GoogleStrategy({
    clientID: oauthConfig.google.clientID,
    clientSecret: oauthConfig.google.clientSecret,
    callbackURL: oauthConfig.google.callbackURL
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

// Database connection
if (!process.env.MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI environment variable is not set!');
  console.log('Please create a .env file in the backend directory with:');
  console.log('MONGODB_URI=mongodb://localhost:27017/yatrik-erp');
  console.log('\nOr copy from env.example:');
  console.log('cp env.example .env');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    if (err.name === 'MongoServerSelectionError') {
      console.log('\n💡 Make sure MongoDB is running and MONGODB_URI is correct in your .env file');
    }
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/stops', require('./routes/stops'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/booking', require('./routes/booking'));
app.use('/api/search', require('./routes/search'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/promos', require('./routes/promos'));
app.use('/api/conductor', require('./routes/conductor'));
app.use('/api/driver', require('./routes/driver'));
app.use('/api/depot', require('./routes/depot'));
app.use('/api/admin', require('./routes/admin'));

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
const { wsAuth } = require('./middleware/auth');
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Make io available to the app for admin routes
app.set('io', io);

io.use(wsAuth);
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

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});