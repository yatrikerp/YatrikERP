const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/users/profile
router.get('/profile', async (req, res) => {
  try {
    // This would normally use auth middleware
    res.json({ success: true, message: 'User profile endpoint' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/users/lookup/:email - Lookup user by email for signup form
router.get('/lookup/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Find user by email (case insensitive)
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('name email phone role status').lean();
    
    console.log('🔍 Email lookup for:', email, 'Found:', !!user);

    if (user) {
      // User exists - return their data for auto-fill
      res.json({
        success: true,
        exists: true,
        user: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status
        },
        message: 'User found'
      });
    } else {
      // User doesn't exist - safe to proceed with signup
      res.json({
        success: true,
        exists: false,
        message: 'Email available for signup'
      });
    }
  } catch (error) {
    console.error('User lookup error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during user lookup' 
    });
  }
});

module.exports = router;
