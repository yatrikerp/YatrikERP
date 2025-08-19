const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');

// POST /api/auth/register
router.post('/register', async (req, res) => {
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

    // Create user
    const user = new User({ name, email, phone, password, role });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: (user.role || 'passenger').toUpperCase(), name: user.name, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: { user: { ...user.toObject(), password: undefined }, token }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: (user.role || 'passenger').toUpperCase(), name: user.name, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: { user: { ...user.toObject(), password: undefined }, token }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// OAuth routes
router.get('/google', (req, res, next) => {
  // Store the 'next' parameter in the session for the callback
  if (req.query.next) {
    req.session.oauthNext = req.query.next;
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

const oauthConfig = require('../config/oauth');

router.get('/google/callback', passport.authenticate('google', { failureRedirect: oauthConfig.frontendURL + '/login' }), async (req, res) => {
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

router.get('/twitter/callback', passport.authenticate('twitter', { failureRedirect: process.env.FRONTEND_URL + '/login' }), async (req, res) => {
  try {
    const user = req.user;
    const token = jwt.sign({ 
      userId: user._id, 
      role: (user.role || 'passenger').toUpperCase(),
      name: user.name,
      email: user.email
    }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRE || '7d' });
    const userParam = encodeURIComponent(JSON.stringify({ ...user.toObject(), password: undefined }));
    
    // Get the stored 'next' parameter from session
    const nextParam = req.session.oauthNext || '/pax';
    delete req.session.oauthNext; // Clean up session
    
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/oauth/callback?token=${encodeURIComponent(token)}&user=${userParam}&next=${encodeURIComponent(nextParam)}`;
    res.redirect(redirectUrl);
  } catch (err) {
    res.redirect((process.env.FRONTEND_URL || 'http://localhost:3000') + '/login');
  }
});

router.get('/microsoft', (req, res, next) => {
  // Store the 'next' parameter in the session for the callback
  if (req.query.next) {
    req.session.oauthNext = req.query.next;
  }
  passport.authenticate('microsoft')(req, res, next);
});

router.get('/microsoft/callback', passport.authenticate('microsoft', { failureRedirect: process.env.FRONTEND_URL + '/login' }), async (req, res) => {
  try {
    const user = req.user;
    const token = jwt.sign({ 
      userId: user._id, 
      role: (user.role || 'passenger').toUpperCase(),
      name: user.name,
      email: user.email
    }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRE || '7d' });
    const userParam = encodeURIComponent(JSON.stringify({ ...user.toObject(), password: undefined }));
    
    // Get the stored 'next' parameter from session
    const nextParam = req.session.oauthNext || '/pax';
    delete req.session.oauthNext; // Clean up session
    
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/oauth/callback?token=${encodeURIComponent(token)}&user=${userParam}&next=${encodeURIComponent(nextParam)}`;
    res.redirect(redirectUrl);
  } catch (err) {
    res.redirect((process.env.FRONTEND_URL || 'http://localhost:3000') + '/login');
  }
});

module.exports = router;
