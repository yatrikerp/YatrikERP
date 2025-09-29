const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const DepotUser = require('../models/DepotUser');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const { sendEmail } = require('../config/email');
const { queueEmail } = require('../services/emailQueue');
const { validateRegistrationEmail, validateProfileUpdateEmail } = require('../middleware/emailValidation');
const { userValidations, handleValidationErrors } = require('../middleware/validation');

// POST /api/auth/check-email - Check if email exists
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    res.json({
      success: true,
      exists: !!existingUser,
      message: existingUser ? 'Email already exists' : 'Email available'
    });

  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during email check'
    });
  }
});

// POST /api/auth/register
router.post('/register', userValidations.register, handleValidationErrors, validateRegistrationEmail, async (req, res) => {
  try {
    const { name, email, phone, password, role = 'passenger' } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create user (password will be hashed by the model's pre-save middleware)
    const user = new User({ 
      name, 
      email, 
      phone, 
      password, // Let the model handle hashing
      role,
      authProvider: 'local' // Ensure authProvider is set for validation
    });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: (user.role || 'passenger').toUpperCase(), name: user.name, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Queue welcome email ONLY for passengers
    if (String(user.role || '').toLowerCase() === 'passenger') {
      queueEmail(email, 'registrationWelcome', {
        userName: user.name,
        userEmail: user.email
      });
      console.log('📧 Welcome email queued for passenger:', email);
    }

    res.status(201).json({
      success: true,
      data: { user: { ...user.toObject(), password: undefined }, token }
    });

  } catch (error) {
    console.error('Registration error details:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // OPTIMIZED: Fast input validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    const normalizedEmail = email.toLowerCase();
    
    // Check for depot email pattern: {depotname}-depot@yatrik.com
    const depotEmailPattern = /^[a-z0-9]+-depot@yatrik\.com$/;
    const isDepotEmail = depotEmailPattern.test(normalizedEmail);
    
    let user = null;
    
    if (isDepotEmail) {
      // Try to find depot user first
      const depotUser = await DepotUser.findOne({ email: normalizedEmail }).select('+password').lean();
      if (depotUser) {
        // Convert depot user to user format for consistency
        user = {
          _id: depotUser._id,
          name: depotUser.username,
          email: depotUser.email,
          password: depotUser.password,
          role: depotUser.role || 'depot_manager',
          status: depotUser.status,
          depotId: depotUser.depotId,
          depotCode: depotUser.depotCode,
          depotName: depotUser.depotName,
          permissions: depotUser.permissions,
          lastLogin: depotUser.lastLogin,
          isDepotUser: true
        };
      }
    }
    
    // If not found as depot user or not depot email, try regular user
    if (!user) {
      user = await User.findOne({ email: normalizedEmail }).select('+password').lean();
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // OPTIMIZED: Fast status checks
    if (user.status && user.status !== 'active') {
      return res.status(403).json({ 
        success: false,
        message: `Account is ${user.status}. Please contact administrator.` 
      });
    }

    // OPTIMIZED: Fast password comparison with bcrypt directly
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // OPTIMIZED: Non-blocking login attempt increment
      User.findByIdAndUpdate(user._id, { $inc: { loginAttempts: 1 } }).catch(err => 
        console.warn('Failed to increment login attempts:', err)
      );
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // OPTIMIZED: Generate token immediately with depot-specific data
    const tokenPayload = {
      userId: user._id, 
      role: (user.role || 'passenger').toUpperCase(), 
      name: user.name, 
      email: user.email
    };
    
    // Add depot-specific information if it's a depot user
    if (user.isDepotUser) {
      tokenPayload.depotId = user.depotId;
      tokenPayload.depotCode = user.depotCode;
      tokenPayload.depotName = user.depotName;
      tokenPayload.permissions = user.permissions;
      tokenPayload.isDepotUser = true;
    }
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // OPTIMIZED: Reset login attempts and update last login in background
    if (user.isDepotUser) {
      // Update depot user
      DepotUser.findByIdAndUpdate(user._id, { 
        loginAttempts: 0, 
        lastLogin: new Date() 
      }).catch(err => console.warn('Background depot user login update failed:', err));
    } else {
      // Update regular user
      User.findByIdAndUpdate(user._id, { 
        loginAttempts: 0, 
        lastLogin: new Date() 
      }).catch(err => console.warn('Background login update failed:', err));
    }

    // OPTIMIZED: Return response immediately for fastest login
    const { password: _removed, ...safeUser } = user;
    
    // Ensure depot-specific data is included in response
    const responseUser = {
      ...safeUser,
      role: user.role || 'passenger'
    };
    
    res.json({ 
      success: true,
      token, 
      user: responseUser 
    });

    // OPTIMIZED: Queue login notification email in background (non-blocking)
    if (String(user.role || '').toLowerCase() === 'passenger' || String(user.role || '').toLowerCase() === 'user') {
      const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
      const loginTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      // Fetch latest trips and services in background
      setImmediate(async () => {
        try {
          // Import Trip model for fetching latest trips
          const Trip = require('../models/Trip');
          
          // Get latest 5 trips with available seats
          const latestTrips = await Trip.find({
            status: 'scheduled',
            departureTime: { $gte: new Date() }
          })
          .populate('route', 'name')
          .populate('bus', 'busNumber totalSeats')
          .sort({ departureTime: 1 })
          .limit(5)
          .lean();

          // Format trips data for email
          const formattedTrips = latestTrips.map(trip => ({
            route: trip.route?.name || 'N/A',
            departureTime: trip.departureTime ? new Date(trip.departureTime).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A',
            fare: trip.fare || 'N/A',
            availableSeats: trip.bus ? (trip.bus.totalSeats - (trip.bookedSeats?.length || 0)) : 'N/A'
          }));

          // Define new services/features
          const newServices = [
            {
              name: 'Real-time Bus Tracking',
              description: 'Track your bus in real-time and get live updates on departure and arrival times.'
            },
            {
              name: 'QR Code Boarding',
              description: 'Show your QR ticket to the conductor for quick and contactless boarding.'
            },
            {
              name: 'Smart Notifications',
              description: 'Get instant updates about delays, route changes, and important announcements.'
            }
          ];

          // Queue email with enhanced data
          queueEmail(user.email, 'loginNotification', {
            userName: user.name,
            loginTime: loginTime,
            ipAddress: clientIP,
            userRole: user.role || 'passenger',
            latestTrips: formattedTrips,
            newServices: newServices
          });
          
          console.log('📧 Enhanced login notification email queued for passenger:', user.email);
        } catch (err) {
          console.warn('Failed to fetch trip data for login email:', err);
          
          // Fallback: send basic login notification
          queueEmail(user.email, 'loginNotification', {
            userName: user.name,
            loginTime: loginTime,
            ipAddress: clientIP,
            userRole: user.role || 'passenger'
          });
        }
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed. Please try again.' 
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate a secure reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Store reset token in user document with expiration (24 hours)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Create reset link
    const resetLink = `${oauthConfig.frontendURL}/reset-password?token=${resetToken}`;
    
    // Send email with reset link
    const emailResult = await sendEmail(email, 'passwordReset', {
      resetLink: resetLink,
      userName: user.name
    });

    if (emailResult.success) {
      console.log(`Password reset email sent to ${email}`);
      res.json({
        success: true,
        message: 'Password reset link has been sent to your email.'
      });
    } else {
      console.error('Failed to send email:', emailResult.error);
      // Still return success to user, but log the email failure
      res.json({
        success: true,
        message: 'Password reset link has been sent to your email.'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request'
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

// GET /api/auth/me - Get current user profile for redirection
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Check if it's a depot user based on token payload
    let user = null;
    if (payload.isDepotUser) {
      user = await DepotUser.findById(payload.userId).select('-password');
      if (user) {
        // Convert depot user to standard format
        user = {
          _id: user._id,
          name: user.username,
          email: user.email,
          role: user.role || 'depot_manager',
          depotId: user.depotId,
          depotCode: user.depotCode,
          depotName: user.depotName,
          permissions: user.permissions,
          status: user.status,
          isDepotUser: true
        };
      }
    } else {
      user = await User.findById(payload.userId).select('-password');
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    return res.json({ 
      success: true, 
      data: { 
        user: {
          id: user._id, 
          name: user.name, 
          email: user.email,
          role: user.role, 
          depotId: user.depotId || null,
          depotCode: user.depotCode || null,
          depotName: user.depotName || null,
          permissions: user.permissions || null,
          status: user.status,
          isDepotUser: user.isDepotUser || false
        } 
      }
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
});

// OAuth routes - RESTRICTED TO PASSENGERS ONLY
// Staff members (conductors, drivers, depot managers, admins) must use email/password authentication
router.get('/google', (req, res, next) => {
  // Pass the 'next' parameter directly to Google OAuth
  const nextParam = req.query.next || '/pax';
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state: Buffer.from(JSON.stringify({ next: nextParam })).toString('base64')
  })(req, res, next);
});

const oauthConfig = require('../config/oauth');

router.get('/google/callback', passport.authenticate('google', { failureRedirect: oauthConfig.frontendURL + '/login' }), async (req, res) => {
  try {
    const user = req.user;
    
    // Generate JWT token instantly
    const token = jwt.sign({ 
      userId: user._id, 
      role: (user.role || 'passenger').toUpperCase(),
      name: user.name,
      email: user.email
    }, oauthConfig.jwtSecret, { expiresIn: oauthConfig.jwtExpire });
    
    // Get the 'next' parameter from state (faster than session)
    let nextParam = '/pax';
    try {
      if (req.query.state) {
        const stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
        nextParam = stateData.next || '/pax';
      }
    } catch (e) {
      // Fallback to default if state parsing fails
      nextParam = '/pax';
    }
    
    // Encode user data (remove password)
    const userParam = encodeURIComponent(JSON.stringify({ ...user.toObject(), password: undefined }));
    
    // Instant redirect with all data
    const redirectUrl = `${oauthConfig.frontendURL}/oauth/callback?token=${encodeURIComponent(token)}&user=${userParam}&next=${encodeURIComponent(nextParam)}`;
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(oauthConfig.frontendURL + '/login');
  }
});

router.get('/twitter', (req, res, next) => {
  // Store the 'next' parameter in the session for the callback
  if (req.query.next) {
    req.session.oauthNext = req.query.next;
  }
  passport.authenticate('twitter')(req, res, next);
});

router.get('/twitter/callback', passport.authenticate('twitter', { failureRedirect: oauthConfig.frontendURL + '/login' }), async (req, res) => {
  try {
    const user = req.user;
    const token = jwt.sign({ 
      userId: user._id, 
      role: (user.role || 'passenger').toUpperCase(),
      name: user.name,
      email: user.email
    }, oauthConfig.jwtSecret, { expiresIn: oauthConfig.jwtExpire });
    const userParam = encodeURIComponent(JSON.stringify({ ...user.toObject(), password: undefined }));
    
    // Get the stored 'next' parameter from session
    const nextParam = req.session.oauthNext || '/pax';
    delete req.session.oauthNext; // Clean up session
    
    const redirectUrl = `${oauthConfig.frontendURL}/oauth/callback?token=${encodeURIComponent(token)}&user=${userParam}&next=${encodeURIComponent(nextParam)}`;
    res.redirect(redirectUrl);
  } catch (err) {
    res.redirect(oauthConfig.frontendURL + '/login');
  }
});

router.get('/microsoft', (req, res, next) => {
  // Store the 'next' parameter in the session for the callback
  if (req.query.next) {
    req.session.oauthNext = req.query.next;
  }
  passport.authenticate('microsoft')(req, res, next);
});

router.get('/microsoft/callback', passport.authenticate('microsoft', { failureRedirect: oauthConfig.frontendURL + '/login' }), async (req, res) => {
  try {
    const user = req.user;
    const token = jwt.sign({ 
      userId: user._id, 
      role: (user.role || 'passenger').toUpperCase(),
      name: user.name,
      email: user.email
    }, oauthConfig.jwtSecret, { expiresIn: oauthConfig.jwtExpire });
    const userParam = encodeURIComponent(JSON.stringify({ ...user.toObject(), password: undefined }));
    
    // Get the stored 'next' parameter from session
    const nextParam = req.session.oauthNext || 'pax';
    delete req.session.oauthNext; // Clean up session
    
    const redirectUrl = `${oauthConfig.frontendURL}/oauth/callback?token=${encodeURIComponent(token)}&user=${userParam}&next=${encodeURIComponent(nextParam)}`;
    res.redirect(redirectUrl);
  } catch (err) {
    res.redirect(oauthConfig.frontendURL + '/login');
  }
});

module.exports = router;
 
// Unified role-based login
// POST /api/auth/role-login
// Body: { role: 'admin'|'passenger'|'depot'|'driver'|'conductor', username/email/phone, password }
router.post('/role-login', async (req, res) => {
  try {
    const { role, username, email, phone, password } = req.body;
    if (!role || !password) return res.status(400).json({ success: false, message: 'Role and password are required' });

    const normalizedRole = String(role).toLowerCase();

    if (normalizedRole === 'admin' || normalizedRole === 'passenger' || normalizedRole === 'user') {
      const identifier = (email || phone || username || '').toString().trim().toLowerCase();
      if (!identifier) return res.status(400).json({ success: false, message: 'Email/phone required' });
      const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] }).select('+password');
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      if (user.status && user.status !== 'active') return res.status(403).json({ success: false, message: 'Account is not active' });
      const token = jwt.sign({ userId: user._id, role: (user.role || 'passenger').toUpperCase(), name: user.name, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      const { password: _pw, ...safe } = user.toObject();
      return res.json({ success: true, token, user: safe });
    }

    if (normalizedRole === 'depot' || normalizedRole === 'depot_manager' || normalizedRole === 'depot-supervisor' || normalizedRole === 'depot-operator') {
      const identifier = (username || email || '').toString().trim().toLowerCase();
      if (!identifier) return res.status(400).json({ success: false, message: 'Username/email required' });
      const user = await DepotUser.findOne({ $or: [{ username: identifier }, { email: identifier }] }).select('+password');
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      if (user.status !== 'active') return res.status(403).json({ success: false, message: `Account is ${user.status}` });
      const token = jwt.sign({ userId: user._id, username: user.username, role: (user.role || 'depot_manager').toUpperCase(), depotId: user.depotId, depotCode: user.depotCode, permissions: user.permissions }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
      return res.json({ success: true, token, user: { _id: user._id, username: user.username, email: user.email, name: user.username, role: user.role || 'depot_manager', depotId: user.depotId, depotCode: user.depotCode, depotName: user.depotName, permissions: user.permissions, status: user.status, lastLogin: new Date() } });
    }

    if (normalizedRole === 'driver') {
      const identifier = (username || '').toString().trim();
      if (!identifier) return res.status(400).json({ success: false, message: 'Username required' });
      const driver = await Driver.findOne({ username: identifier }).select('+password');
      if (!driver) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, driver.password);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      if (driver.status !== 'active') return res.status(403).json({ success: false, message: 'Account is not active' });
      const token = jwt.sign({ driverId: driver._id, username: driver.username, depotId: driver.depotId, role: 'DRIVER' }, process.env.JWT_SECRET || 'secret', { expiresIn: '12h' });
      return res.json({ success: true, token, user: { _id: driver._id, name: driver.name, username: driver.username, role: 'driver', depotId: driver.depotId } });
    }

    if (normalizedRole === 'conductor') {
      const identifier = (username || '').toString().trim();
      if (!identifier) return res.status(400).json({ success: false, message: 'Username required' });
      const conductor = await Conductor.findOne({ username: identifier }).select('+password');
      if (!conductor) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, conductor.password);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      if (conductor.status !== 'active') return res.status(403).json({ success: false, message: 'Account is not active' });
      const token = jwt.sign({ conductorId: conductor._id, username: conductor.username, depotId: conductor.depotId, role: 'CONDUCTOR' }, process.env.JWT_SECRET || 'secret', { expiresIn: '12h' });
      return res.json({ success: true, token, user: { _id: conductor._id, name: conductor.name, username: conductor.username, role: 'conductor', depotId: conductor.depotId } });
    }

    return res.status(400).json({ success: false, message: 'Unsupported role' });
  } catch (error) {
    console.error('Role login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
