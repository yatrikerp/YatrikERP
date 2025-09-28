const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const DepotUser = require('../models/DepotUser');
const Depot = require('../models/Depot');
const { auth } = require('../middleware/auth');

// Helper function to create auth middleware
const authMiddleware = auth;

// Depot User Login - OPTIMIZED FOR INSTANT RESPONSE
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (username || email || '').toString().trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required'
      });
    }

    // OPTIMIZED: Single query with lean() for fastest response
    const user = await DepotUser.findOne({
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    }).select('+password').lean();

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // OPTIMIZED: Fast password comparison
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ 
        success: false, 
        message: `Account is ${user.status}. Please contact administrator.` 
      });
    }

    // OPTIMIZED: Generate token immediately without waiting for depot data
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role || 'depot_manager',
        depotId: user.depotId,
        depotCode: user.depotCode,
        permissions: user.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // OPTIMIZED: Get depot data and update last login in parallel - non-blocking
    Promise.all([
      Depot.findById(user.depotId).lean(),
      DepotUser.updateOne(
        { _id: user._id },
        { lastLogin: new Date() }
      )
    ]).then(([depot]) => {
      // Update depot info in background if needed
      if (depot) {
        console.log(`Depot login background update for ${user.username}:`, depot.depotName);
      }
    }).catch(err => {
      console.warn('Background depot data update failed:', err);
      // Don't fail login for background updates
    });

    // OPTIMIZED: Return immediately with essential data only
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user._id,
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.username,
          role: user.role || 'depot_manager',
          depotId: user.depotId,
          depotCode: user.depotCode,
          depotName: user.depotName,
          permissions: user.permissions,
          status: user.status,
          lastLogin: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Depot login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
});

// Get Depot User Profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await DepotUser.findById(req.user.userId)
      .select('-password -loginAttempts -lockUntil')
      .populate('depotId', 'depotCode depotName location capacity status');

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: 'User not found'
      });
    }

    res.json({
      ok: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change Password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await DepotUser.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await user.changePassword(newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Depot Dashboard Data
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const depotId = req.user.depotId;
    
    // Get depot information
    const depot = await Depot.findById(depotId);
    if (!depot) {
      return res.status(404).json({
        success: false,
        message: 'Depot not found'
      });
    }

    // Get basic depot stats (you can expand this based on your needs)
    const dashboardData = {
      depot: {
        id: depot._id,
        depotCode: depot.depotCode,
        depotName: depot.depotName,
        location: depot.location,
        contact: depot.contact,
        capacity: depot.capacity,
        status: depot.status,
        operatingHours: depot.operatingHours,
        facilities: depot.facilities,
        isActive: depot.isActive,
        createdAt: depot.createdAt,
        updatedAt: depot.updatedAt
      },
      user: {
        username: req.user.username,
        role: req.user.role,
        permissions: req.user.permissions
      },
      stats: {
        totalBuses: depot.capacity.totalBuses,
        availableBuses: depot.capacity.availableBuses,
        maintenanceBuses: depot.capacity.maintenanceBuses,
        capacityPercentage: Math.round((depot.capacity.availableBuses / depot.capacity.totalBuses) * 100)
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // In a real application, you might want to add the token to a blacklist
    // For now, we'll just return success as the client removes the token
    
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Refresh Token (optional - for extending session)
router.post('/refresh-token', authMiddleware, async (req, res) => {
  try {
    const user = await DepotUser.findById(req.user.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        depotId: user.depotId,
        depotCode: user.depotCode,
        permissions: user.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Check if user has specific permission
router.get('/check-permission/:permission', authMiddleware, async (req, res) => {
  try {
    const { permission } = req.params;
    
    if (!req.user.permissions.includes(permission)) {
      return res.json({
        success: false,
        hasPermission: false,
        message: 'Permission denied'
      });
    }

    res.json({
      success: true,
      hasPermission: true,
      message: 'Permission granted'
    });

  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
