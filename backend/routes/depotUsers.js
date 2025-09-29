const express = require('express');
const router = express.Router();
const DepotUser = require('../models/DepotUser');
const Depot = require('../models/Depot');
const { auth, requireRole } = require('../middleware/auth');

// Helper function to create role-based auth middleware
const authRole = (roles) => [auth, requireRole(roles)];

// Get all depot users (admin only)
router.get('/', authRole(['admin']), async (req, res) => {
  try {
    const depotUsers = await DepotUser.find()
      .populate('depotId', 'depotName depotCode location')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: depotUsers
    });
  } catch (error) {
    console.error('Error fetching depot users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depot users',
      error: error.message
    });
  }
});

// Create depot user (admin only)
router.post('/', authRole(['admin']), async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      depotId,
      depotCode,
      depotName,
      role = 'depot_manager',
      permissions = [
        'manage_buses',
        'view_buses',
        'manage_routes',
        'view_routes',
        'manage_schedules',
        'view_schedules',
        'view_reports',
        'view_depot_info'
      ]
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !depotCode || !depotName) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, depotCode, and depotName are required'
      });
    }

    // Check if depot exists
    let depot;
    if (depotId) {
      depot = await Depot.findById(depotId);
    } else {
      depot = await Depot.findOne({ depotCode: depotCode });
    }

    if (!depot) {
      return res.status(400).json({
        success: false,
        message: 'Depot not found'
      });
    }

    // Check if user already exists
    const existingUser = await DepotUser.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this username or email already exists'
      });
    }

    // Create depot user
    const depotUserData = {
      username,
      email: email.toLowerCase(),
      password,
      depotId: depot._id,
      depotCode: depot.depotCode,
      depotName: depot.depotName,
      role,
      permissions,
      status: 'active'
    };

    const depotUser = new DepotUser(depotUserData);
    await depotUser.save();

    // Return user without password
    const { password: _, ...userResponse } = depotUser.toObject();

    res.status(201).json({
      success: true,
      message: 'Depot user created successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('Error creating depot user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create depot user',
      error: error.message
    });
  }
});

// Get depot user by ID (admin only)
router.get('/:id', authRole(['admin']), async (req, res) => {
  try {
    const depotUser = await DepotUser.findById(req.params.id)
      .populate('depotId', 'depotName depotCode location')
      .lean();

    if (!depotUser) {
      return res.status(404).json({
        success: false,
        message: 'Depot user not found'
      });
    }

    res.json({
      success: true,
      data: depotUser
    });
  } catch (error) {
    console.error('Error fetching depot user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depot user',
      error: error.message
    });
  }
});

// Update depot user (admin only)
router.put('/:id', authRole(['admin']), async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    const depotUser = await DepotUser.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('depotId', 'depotName depotCode location');

    if (!depotUser) {
      return res.status(404).json({
        success: false,
        message: 'Depot user not found'
      });
    }

    // Update password separately if provided
    if (password) {
      depotUser.password = password;
      await depotUser.save();
    }

    const { password: _, ...userResponse } = depotUser.toObject();

    res.json({
      success: true,
      message: 'Depot user updated successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('Error updating depot user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update depot user',
      error: error.message
    });
  }
});

// Delete depot user (admin only)
router.delete('/:id', authRole(['admin']), async (req, res) => {
  try {
    const depotUser = await DepotUser.findByIdAndDelete(req.params.id);

    if (!depotUser) {
      return res.status(404).json({
        success: false,
        message: 'Depot user not found'
      });
    }

    res.json({
      success: true,
      message: 'Depot user deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting depot user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete depot user',
      error: error.message
    });
  }
});

// Reset depot user password (admin only)
router.post('/:id/reset-password', authRole(['admin']), async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    const depotUser = await DepotUser.findById(req.params.id);

    if (!depotUser) {
      return res.status(404).json({
        success: false,
        message: 'Depot user not found'
      });
    }

    depotUser.password = newPassword;
    await depotUser.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});

// Get depot users by depot (admin only)
router.get('/depot/:depotId', authRole(['admin']), async (req, res) => {
  try {
    const depotUsers = await DepotUser.find({ depotId: req.params.depotId })
      .populate('depotId', 'depotName depotCode location')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: depotUsers
    });
  } catch (error) {
    console.error('Error fetching depot users by depot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depot users',
      error: error.message
    });
  }
});

// Bulk create depot users (admin only)
router.post('/bulk-create', authRole(['admin']), async (req, res) => {
  try {
    const { depotUsers } = req.body;

    if (!Array.isArray(depotUsers) || depotUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Depot users array is required'
      });
    }

    const createdUsers = [];
    const errors = [];

    for (const userData of depotUsers) {
      try {
        const {
          username,
          email,
          password,
          depotCode,
          depotName,
          role = 'depot_manager',
          permissions = [
            'manage_buses',
            'view_buses',
            'manage_routes',
            'view_routes',
            'manage_schedules',
            'view_schedules',
            'view_reports',
            'view_depot_info'
          ]
        } = userData;

        // Find depot
        const depot = await Depot.findOne({ depotCode: depotCode });

        if (!depot) {
          errors.push({
            depotCode,
            error: 'Depot not found'
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await DepotUser.findOne({
          $or: [{ username }, { email }]
        });

        if (existingUser) {
          errors.push({
            username,
            email,
            error: 'User already exists'
          });
          continue;
        }

        // Create depot user
        const depotUserData = {
          username,
          email: email.toLowerCase(),
          password,
          depotId: depot._id,
          depotCode: depot.depotCode,
          depotName: depot.depotName,
          role,
          permissions,
          status: 'active'
        };

        const depotUser = new DepotUser(depotUserData);
        await depotUser.save();

        const { password: _, ...userResponse } = depotUser.toObject();
        createdUsers.push(userResponse);

      } catch (userError) {
        errors.push({
          username: userData.username,
          email: userData.email,
          error: userError.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdUsers.length} depot users`,
      data: {
        created: createdUsers,
        errors: errors
      }
    });

  } catch (error) {
    console.error('Error bulk creating depot users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk create depot users',
      error: error.message
    });
  }
});

module.exports = router;
