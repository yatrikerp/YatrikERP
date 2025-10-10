const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Conductor = require('../models/Conductor');
const mongoose = require('mongoose');
const Duty = require('../models/Duty');
const Depot = require('../models/Depot');
const { auth, requireRole } = require('../middleware/auth');
const { validateConductorData } = require('../middleware/validation');

// Conductor Authentication Routes

// POST /api/conductor/login - Conductor login with attendance marking
router.post('/login', async (req, res) => {
  try {
    const { username, password, location } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find conductor
    const conductor = await Conductor.findOne({ username, status: 'active' });
    if (!conductor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account inactive'
      });
    }

    // Check if account is locked
    if (conductor.lockUntil && conductor.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, conductor.password);
    if (!isPasswordValid) {
      // Increment login attempts
      conductor.loginAttempts += 1;
      
      // Lock account after 5 failed attempts for 30 minutes
      if (conductor.loginAttempts >= 5) {
        conductor.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      
      await conductor.save();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    conductor.loginAttempts = 0;
    conductor.lockUntil = null;
    conductor.lastLogin = new Date();
    
    // Mark attendance
    if (location) {
      await conductor.markAttendance('login', location);
    }
    
    await conductor.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: conductor._id,
        conductorId: conductor._id,
        username: conductor.username,
        depotId: conductor.depotId,
        role: 'conductor'
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Log activity
    await conductor.logActivity(
      'login',
      'Conductor logged in successfully',
      location,
      'system',
      null
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        conductor: {
          id: conductor._id,
          conductorId: conductor.conductorId,
          name: conductor.name,
          employeeCode: conductor.employeeCode,
          depotId: conductor.depotId,
          currentDuty: conductor.currentDuty
        },
        redirectPath: '/conductor'
      }
    });

  } catch (error) {
    console.error('Conductor login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/logout - Conductor logout with attendance marking
router.post('/logout', auth, async (req, res) => {
  try {
    const conductorId = req.user.conductorId || req.user._id;
    if (!mongoose.Types.ObjectId.isValid(conductorId)) {
      console.warn('Invalid conductorId in token payload:', conductorId);
      return res.json({ success: true, data: null, message: 'No current duty assigned' });
    }
    const conductor = await Conductor.findById(conductorId);
    if (!conductor) {
      return res.status(404).json({
        success: false,
        message: 'Conductor not found'
      });
    }

    // Mark attendance
    await conductor.markAttendance('logout', req.body.location);

    // Log activity
    await conductor.logActivity(
      'logout',
      'Conductor logged out',
      req.body.location,
      'system',
      null
    );

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Conductor logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/conductor/profile - Get conductor profile
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('Conductor profile request - User object:', req.user);
    
    // Try multiple possible conductor ID fields
    const conductorId = req.user.conductorId || req.user._id || req.user.id;
    
    console.log('Extracted conductor ID:', conductorId);
    
    if (!conductorId) {
      console.error('No conductor ID found in user object:', req.user);
      return res.status(400).json({
        success: false,
        message: 'Conductor ID not found in token',
        debug: { userObject: req.user }
      });
    }

    const conductor = await Conductor.findById(conductorId)
      .populate('depotId', 'depotName depotCode location')
      .select('-password -loginAttempts -lockUntil');

    console.log('Found conductor:', conductor ? 'Yes' : 'No');

    if (!conductor) {
      console.error('Conductor not found in database for ID:', conductorId);
      return res.status(404).json({
        success: false,
        message: 'Conductor not found',
        debug: { conductorId }
      });
    }

    // Format the response to match frontend expectations
    const profileData = {
      _id: conductor._id,
      conductorId: conductor.conductorId,
      name: conductor.name,
      employeeCode: conductor.employeeCode,
      phone: conductor.phone,
      email: conductor.email,
      address: conductor.address,
      emergencyContact: conductor.emergencyContact,
      depotId: conductor.depotId,
      status: conductor.status,
      currentDuty: conductor.currentDuty,
      createdAt: conductor.createdAt,
      updatedAt: conductor.updatedAt
    };

    console.log('Returning profile data:', profileData);

    res.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Get conductor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// PUT /api/conductor/profile - Update conductor profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, email, address, emergencyContact } = req.body;
    
    const conductorId = req.user.conductorId || req.user._id;
    const conductor = await Conductor.findById(conductorId);
    if (!conductor) {
      return res.status(404).json({
        success: false,
        message: 'Conductor not found'
      });
    }

    // Update allowed fields
    if (name) conductor.name = name;
    if (phone) conductor.phone = phone;
    if (email) conductor.email = email;
    if (address) conductor.address = address;
    if (emergencyContact) conductor.emergencyContact = emergencyContact;

    conductor.updatedBy = req.user.conductorId || req.user._id;
    await conductor.save();

    // Log activity
    await conductor.logActivity(
      'profile_update',
      'Profile information updated',
      null,
      'system',
      null
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: conductor
    });

  } catch (error) {
    console.error('Update conductor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Duty Management Routes

// GET /api/conductor/duties - Get conductor's duties
router.get('/duties', auth, async (req, res) => {
  try {
    const { status, date } = req.query;
    
    // Ensure we have the correct conductor ID
    const conductorId = req.user.conductorId || req.user._id;
    
    let query = { conductorId: conductorId };
    
    if (status) {
      query.status = status;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.scheduledStartTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const duties = await Duty.find(query)
      .populate('driverId', 'name driverId')
      .populate('busId', 'busNumber registrationNumber')
      .populate('tripId', 'tripCode')
      .populate('routeId', 'name routeCode')
      .sort({ scheduledStartTime: -1 });

    res.json({
      success: true,
      data: duties
    });

  } catch (error) {
    console.error('Get conductor duties error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/conductor/duties/current - Get current duty
router.get('/duties/current', auth, async (req, res) => {
  try {
    // Ensure we have the correct conductor ID
    if (!req.user) {
      return res.json({ success: true, data: null, message: 'Not authenticated' });
    }
    const conductorId = req.user.conductorId || req.user._id;
    if (!conductorId) {
      return res.json({ success: true, data: null, message: 'No conductor ID found in token' });
    }
    
    const duty = await Duty.findOne({
      conductorId: conductorId,
      status: { $in: ['assigned', 'started', 'in-progress', 'on-break'] }
    })
    .populate('driverId', 'name driverId')
    .populate('busId', 'busNumber registrationNumber')
    .populate('tripId', 'tripCode')
    .populate('routeId', 'name routeCode');

    if (!duty) {
      return res.json({
        success: true,
        data: null,
        message: 'No current duty assigned'
      });
    }

    res.json({
      success: true,
      data: duty
    });

  } catch (error) {
    console.error('Get current duty error:', error);
    return res.json({
      success: true,
      data: null,
      message: 'No current duty assigned'
    });
  }
});

// POST /api/conductor/duties/:dutyId/start - Start duty
router.post('/duties/:dutyId/start', auth, async (req, res) => {
  try {
    const { location } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      conductorId: req.user.conductorId || req.user._id,
      status: 'assigned'
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or cannot be started'
      });
    }

    // Start duty
    await duty.startDuty(location);

    // Update conductor's current duty
    const conductorId = req.user.conductorId || req.user._id;
    const conductor = await Conductor.findById(conductorId);
    await conductor.startDuty(duty._id, duty.tripId, duty.busId);

    // Log activity
    await conductor.logActivity(
      'duty_started',
      `Started duty: ${duty.title}`,
      location,
      'duty',
      duty._id
    );

    res.json({
      success: true,
      message: 'Duty started successfully',
      data: duty
    });

  } catch (error) {
    console.error('Start duty error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/duties/:dutyId/end - End duty
router.post('/duties/:dutyId/end', auth, async (req, res) => {
  try {
    const { location } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      conductorId: req.user.conductorId || req.user._id,
      status: { $in: ['started', 'in-progress', 'on-break'] }
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or cannot be ended'
      });
    }

    // Complete duty
    await duty.completeDuty(location);

    // Update conductor's duty status
    const conductorId = req.user.conductorId || req.user._id;
    const conductor = await Conductor.findById(conductorId);
    await conductor.endDuty();

    // Log activity
    await conductor.logActivity(
      'duty_completed',
      `Completed duty: ${duty.title}`,
      location,
      'duty',
      duty._id
    );

    res.json({
      success: true,
      message: 'Duty completed successfully',
      data: duty
    });

  } catch (error) {
    console.error('End duty error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/duties/:dutyId/break - Take break
router.post('/duties/:dutyId/break', auth, async (req, res) => {
  try {
    const { duration, location } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      conductorId: req.user.conductorId || req.user._id,
      status: { $in: ['started', 'in-progress'] }
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or cannot take break'
      });
    }

    // Take break
    await duty.takeBreak(location, duration);

    // Log activity
    const conductorId = req.user.conductorId || req.user._id;
    const conductor = await Conductor.findById(conductorId);
    await conductor.logActivity(
      'break_started',
      `Started break for ${duration} minutes`,
      location,
      'duty',
      duty._id
    );

    res.json({
      success: true,
      message: 'Break started successfully',
      data: duty
    });

  } catch (error) {
    console.error('Take break error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/duties/:dutyId/break/end - End break
router.post('/duties/:dutyId/break/end', auth, async (req, res) => {
  try {
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      conductorId: req.user.conductorId || req.user._id,
      status: 'on-break'
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or not on break'
      });
    }

    // End break
    await duty.endBreak();

    // Log activity
    const conductorId = req.user.conductorId || req.user._id;
    const conductor = await Conductor.findById(conductorId);
    await conductor.logActivity(
      'break_ended',
      'Break ended',
      null,
      'duty',
      duty._id
    );

    res.json({
      success: true,
      message: 'Break ended successfully',
      data: duty
    });

  } catch (error) {
    console.error('End break error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/duties/:dutyId/delay - Report delay
router.post('/duties/:dutyId/delay', auth, async (req, res) => {
  try {
    const { reason, duration, location } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      conductorId: req.user.conductorId || req.user._id,
      status: { $in: ['started', 'in-progress'] }
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or cannot report delay'
      });
    }

    // Add delay
    await duty.addDelay(reason, duration, location);

    // Log activity
    const conductorId = req.user.conductorId || req.user._id;
    const conductor = await Conductor.findById(conductorId);
    await conductor.logActivity(
      'delay_reported',
      `Delay reported: ${reason} (${duration} minutes)`,
      location,
      'duty',
      duty._id
    );

    res.json({
      success: true,
      message: 'Delay reported successfully',
      data: duty
    });

  } catch (error) {
    console.error('Report delay error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/duties/:dutyId/incident - Report incident
router.post('/duties/:dutyId/incident', auth, async (req, res) => {
  try {
    const { type, description, severity, location } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      conductorId: req.user.conductorId || req.user._id,
      status: { $in: ['started', 'in-progress', 'on-break'] }
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or cannot report incident'
      });
    }

    // Report incident
    await duty.reportIncident(type, description, severity, location, req.user.conductorId || req.user._id);

    // Log activity
    const conductorId = req.user.conductorId || req.user._id;
    const conductor = await Conductor.findById(conductorId);
    await conductor.logActivity(
      'incident_reported',
      `Incident reported: ${type} - ${description}`,
      location,
      'duty',
      duty._id
    );

    res.json({
      success: true,
      message: 'Incident reported successfully',
      data: duty
    });

  } catch (error) {
    console.error('Report incident error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Activity & Attendance Routes

// GET /api/conductor/attendance - Get attendance history
router.get('/attendance', auth, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    const conductorId = req.user.conductorId || req.user._id;
    const conductor = await Conductor.findById(conductorId);
    if (!conductor) {
      return res.status(404).json({
        success: false,
        message: 'Conductor not found'
      });
    }

    let attendance = conductor.attendance;
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      attendance = attendance.filter(a => a.date >= start && a.date <= end);
    }
    
    // Filter by status
    if (status) {
      attendance = attendance.filter(a => a.status === status);
    }

    // Sort by date (newest first)
    attendance.sort((a, b) => b.date - a.date);

    res.json({
      success: true,
      data: attendance
    });

  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/conductor/activities - Get activity log
router.get('/activities', auth, async (req, res) => {
  try {
    const { startDate, endDate, action, relatedEntity, limit = 50 } = req.query;
    
    const conductorId = req.user.conductorId || req.user._id;
    const conductor = await Conductor.findById(conductorId);
    if (!conductor) {
      return res.status(404).json({
        success: false,
        message: 'Conductor not found'
      });
    }

    let activities = conductor.activities;
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      activities = activities.filter(a => a.timestamp >= start && a.timestamp <= end);
    }
    
    // Filter by action
    if (action) {
      activities = activities.filter(a => a.action === action);
    }
    
    // Filter by related entity
    if (relatedEntity) {
      activities = activities.filter(a => a.relatedEntity === relatedEntity);
    }

    // Sort by timestamp (newest first) and limit
    activities.sort((a, b) => b.timestamp - a.timestamp);
    activities = activities.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/conductor/performance - Get performance metrics
router.get('/performance', auth, async (req, res) => {
  try {
    const conductor = await Conductor.findById(req.user.conductorId)
      .select('performance attendance');
    
    if (!conductor) {
      return res.status(404).json({
        success: false,
        message: 'Conductor not found'
      });
    }

    // Calculate additional metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAttendance = conductor.attendance.find(a => 
      a.date.getTime() === today.getTime()
    );
    
    const thisMonthAttendance = conductor.attendance.filter(a => {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return a.date >= monthStart;
    });

    const performanceData = {
      ...conductor.performance,
      todayAttendance: todayAttendance || null,
      thisMonthAttendance: {
        total: thisMonthAttendance.length,
        present: thisMonthAttendance.filter(a => a.status === 'present').length,
        absent: thisMonthAttendance.filter(a => a.status === 'absent').length,
        late: thisMonthAttendance.filter(a => a.status === 'late').length,
        halfDay: thisMonthAttendance.filter(a => a.status === 'half-day').length
      }
    };

    res.json({
      success: true,
      data: performanceData
    });

  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin/Depot Manager Routes (require proper authorization)

// GET /api/conductor/depot - Get conductors for current depot (depot manager only)
router.get('/depot', auth, requireRole(['depot_manager']), async (req, res) => {
  try {
    const { status, search } = req.query;
    const depotId = req.user.depotId;
    
    let query = { depotId };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const conductors = await Conductor.find(query)
      .select('-password -loginAttempts -lockUntil')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: conductors
    });
  } catch (error) {
    console.error('Error fetching depot conductors:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/conductor/all - Get all conductors (admin/depot manager - depot managers see only their depot)
router.get('/all', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { depotId, status, search } = req.query;
    
    let query = {};
    
    // If user is depot_manager, only show their depot's conductors
    if (req.user.role === 'depot_manager') {
      query.depotId = req.user.depotId;
    } else if (depotId) {
      // Admin can filter by specific depot
      query.depotId = depotId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
        { conductorId: { $regex: search, $options: 'i' } }
      ];
    }

    const conductors = await Conductor.find(query)
      .populate('depotId', 'depotName depotCode')
      .select('-password')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: conductors
    });

  } catch (error) {
    console.error('Get all conductors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor - Create new conductor (admin/depot manager only)
router.post('/', auth, requireRole(['admin', 'depot_manager']), validateConductorData, async (req, res) => {
  try {
    const conductorData = { ...req.body };

    // Ensure depotId from token if not provided
    if (!conductorData.depotId && req.user?.depotId) {
      conductorData.depotId = req.user.depotId;
    }

    // Generate conductorId if missing
    if (!conductorData.conductorId) {
      const code = (conductorData.employeeCode || 'CND').toString().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
      const ts = Date.now().toString().slice(-4);
      conductorData.conductorId = `${code}-${ts}${rnd}`.toUpperCase();
    }
    
    // Hash password
    const saltRounds = 12;
    conductorData.password = await bcrypt.hash(conductorData.password, saltRounds);
    
    // Set created by
    conductorData.createdBy = req.user?._id || req.user?.id;
    
    const conductor = new Conductor(conductorData);
    await conductor.save();

    res.status(201).json({
      success: true,
      message: 'Conductor created successfully',
      data: conductor
    });

  } catch (error) {
    console.error('Create conductor error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Conductor with this username, email, or phone already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/conductor/:id - Update conductor (admin only)
router.put('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Prevent immutable fields from being updated directly
    delete updateData.username; // managed separately
    delete updateData.conductorId;

    // Handle password hashing if provided
    if (updateData.password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    updateData.updatedBy = req.user.id;

    const conductor = await Conductor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!conductor) {
      return res.status(404).json({
        success: false,
        message: 'Conductor not found'
      });
    }

    res.json({
      success: true,
      message: 'Conductor updated successfully',
      data: conductor
    });

  } catch (error) {
    console.error('Update conductor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/:id/reset-credentials - Admin resets credentials to policy and removes username
router.post('/:id/reset-credentials', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const conductor = await Conductor.findById(id);
    if (!conductor) {
      return res.status(404).json({ success: false, message: 'Conductor not found' });
    }

    let depotCode = '';
    if (conductor.depotId) {
      const depot = await Depot.findById(conductor.depotId).select('depotCode code');
      depotCode = depot?.depotCode || depot?.code || '';
    }

    const nameSlug = String(conductor.name || 'conductor').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const digits = String(depotCode).match(/\d+/g)?.join('') || '';
    const depotSuffix = digits || String(depotCode || '').toLowerCase() || '000';
    const email = `${nameSlug}${depotSuffix}@yatrik.com`;

    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('Yatrik123', 12);

    conductor.email = email;
    conductor.password = hashed;
    conductor.markModified('password');

    if (conductor.username) {
      conductor.username = undefined;
      await Conductor.updateOne({ _id: conductor._id }, { $unset: { username: '' } });
    }

    await conductor.save();

    return res.json({
      success: true,
      message: 'Conductor credentials reset successfully',
      data: {
        id: conductor._id,
        email,
        passwordPolicy: 'Yatrik123',
        usernameRemoved: true
      }
    });
  } catch (error) {
    console.error('Reset conductor credentials error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/conductor/:id - Delete conductor (admin only)
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const conductor = await Conductor.findByIdAndDelete(id);
    
    if (!conductor) {
      return res.status(404).json({
        success: false,
        message: 'Conductor not found'
      });
    }

    res.json({
      success: true,
      message: 'Conductor deleted successfully'
    });

  } catch (error) {
    console.error('Delete conductor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// New Conductor Dashboard API Routes

// GET /api/conductor/duties/current - Get current duty assignment
router.get('/duties/current', auth, async (req, res) => {
  try {
    const conductorId = req.user?.conductorId || req.user?._id || req.user?.id;
    if (!conductorId) {
      return res.json({ success: true, data: null, message: 'No active duty assigned' });
    }
    
    // Find current active duty
    const currentDuty = await Duty.findOne({
      conductorId,
      status: { $in: ['assigned', 'started', 'in-progress', 'on-break', 'active'] },
      date: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    })
    .populate('routeId', 'routeName origin destination')
    .populate('busId', 'busNumber totalSeats')
    .populate('tripId');

    if (!currentDuty) {
      return res.json({
        success: true,
        data: null,
        message: 'No active duty assigned'
      });
    }

    // Calculate passenger statistics
    const passengerCount = currentDuty.passengerManifest ? currentDuty.passengerManifest.length : 0;
    const boardedCount = currentDuty.passengerManifest ? 
      currentDuty.passengerManifest.filter(p => p.boardingStatus === 'boarded').length : 0;

    const dutyData = {
      _id: currentDuty._id,
      status: currentDuty.status,
      busNumber: currentDuty.busId?.busNumber || 'N/A',
      routeName: currentDuty.routeId?.routeName || 'N/A',
      origin: currentDuty.routeId?.origin || 'N/A',
      destination: currentDuty.routeId?.destination || 'N/A',
      totalSeats: currentDuty.busId?.totalSeats || 0,
      boardedCount,
      revenue: currentDuty.revenue || 0,
      nextStop: currentDuty.nextStop || '',
      progress: currentDuty.progress || 0,
      startTime: currentDuty.startTime,
      endTime: currentDuty.endTime
    };

    res.json({
      success: true,
      data: dutyData
    });
  } catch (error) {
    console.error('Error fetching current duty:', error);
    // Return non-failing response to avoid UI 500 spam
    return res.json({ success: true, data: null, message: 'No active duty assigned' });
  }
});

// POST /api/conductor/duties/:dutyId/start - Start duty
router.post('/duties/:dutyId/start', auth, requireRole(['conductor']), async (req, res) => {
  try {
    const { dutyId } = req.params;
    const conductorId = req.user.id;

    const duty = await Duty.findOne({ _id: dutyId, conductorId });
    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found'
      });
    }

    if (duty.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: 'Duty cannot be started'
      });
    }

    duty.status = 'active';
    duty.startTime = new Date();
    await duty.save();

    res.json({
      success: true,
      message: 'Duty started successfully',
      data: duty
    });
  } catch (error) {
    console.error('Error starting duty:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/duties/:dutyId/end - End duty
router.post('/duties/:dutyId/end', auth, requireRole(['conductor']), async (req, res) => {
  try {
    const { dutyId } = req.params;
    const conductorId = req.user.id;

    const duty = await Duty.findOne({ _id: dutyId, conductorId });
    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found'
      });
    }

    if (duty.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Duty is not active'
      });
    }

    duty.status = 'completed';
    duty.endTime = new Date();
    
    // Generate final report
    const report = {
      dutyId: duty._id,
      conductorId,
      totalPassengers: duty.passengerManifest ? duty.passengerManifest.length : 0,
      boardedPassengers: duty.passengerManifest ? 
        duty.passengerManifest.filter(p => p.boardingStatus === 'boarded').length : 0,
      revenue: duty.revenue || 0,
      completedAt: new Date()
    };

    duty.finalReport = report;
    await duty.save();

    res.json({
      success: true,
      message: 'Duty completed successfully',
      data: { duty, report }
    });
  } catch (error) {
    console.error('Error ending duty:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/conductor/trips/:tripId/passengers - Get passenger list for trip
router.get('/trips/:tripId/passengers', auth, requireRole(['conductor']), async (req, res) => {
  try {
    const { tripId } = req.params;
    
    const duty = await Duty.findOne({ 
      tripId,
      conductorId: req.user.id,
      status: { $in: ['assigned', 'active'] }
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found or not assigned to you'
      });
    }

    const passengers = duty.passengerManifest || [];

    res.json({
      success: true,
      data: passengers
    });
  } catch (error) {
    console.error('Error fetching passengers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/validate-ticket - Validate QR ticket (signed payload)
router.post('/validate-ticket', auth, requireRole(['conductor']), async (req, res) => {
  try {
    const { qr } = req.body; // expects stringified signed payload
    const conductorId = req.user.id;

    // Find the duty
    const duty = await Duty.findOne({
      conductorId,
      status: 'active'
    });

    if (!duty) {
      return res.status(400).json({
        success: false,
        message: 'No active duty found'
      });
    }

    if (!qr || typeof qr !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing QR payload' });
    }

    // Parse and verify QR
    let parsed;
    try {
      parsed = JSON.parse(qr);
    } catch (_e) {
      return res.status(400).json({ success: false, message: 'Invalid QR format' });
    }

    const { verifySignature } = require('../utils/qrSignature');
    const valid = verifySignature(parsed);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'QR signature invalid' });
    }

    // Basic expiry check
    if (parsed.exp && Date.now() > parsed.exp) {
      return res.status(400).json({ success: false, message: 'Ticket expired' });
    }

    // Locate active ticket by PNR or booking reference
    const Ticket = require('../models/Ticket');
    const Booking = require('../models/Booking');
    const ticket = await Ticket.findOne({ pnr: parsed.pnr, state: 'active' }).populate('bookingId');
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found or inactive' });
    }

    // Ensure ticket trip matches current duty trip
    if (ticket.tripDetails?.tripId?.toString() !== duty.tripId?.toString()) {
      return res.status(400).json({ success: false, message: 'Ticket is not valid for this trip' });
    }

    // Prevent double-scan
    if (ticket.scannedAt) {
      return res.status(400).json({ success: false, message: 'Ticket already scanned', data: { scannedAt: ticket.scannedAt, scannedBy: ticket.scannedBy } });
    }

    // Mark ticket scanned and add to history
    ticket.scannedAt = new Date();
    ticket.scannedBy = req.user.conductorId || req.user._id;
    ticket.scannedLocation = duty.busId?.currentLocation || 'On Board';
    ticket.validationHistory = ticket.validationHistory || [];
    ticket.validationHistory.push({
      conductorId: req.user.conductorId || req.user._id,
      validatedAt: ticket.scannedAt,
      location: { stopName: duty.nextStop || 'Unknown' }
    });
    ticket.state = 'validated';
    await ticket.save();

    // Update booking as boarded and set seat sold/boarded
    if (ticket.bookingId) {
      const booking = await Booking.findById(ticket.bookingId._id || ticket.bookingId);
      if (booking) {
        booking.status = 'boarded';
        booking.boardedAt = ticket.scannedAt;
        if (Array.isArray(booking.seats)) {
          booking.seats = booking.seats.map(s =>
            s.seatNumber === ticket.seatNumber ? { ...s.toObject?.() || s, status: 'boarded' } : s
          );
        }
        await booking.save();
      }
    }

    // Update duty manifest
    if (!duty.passengerManifest) duty.passengerManifest = [];
    const existingPassenger = duty.passengerManifest.find(p => p.pnr === ticket.pnr);
    if (existingPassenger) {
      existingPassenger.boardingStatus = 'boarded';
      existingPassenger.boardingTime = ticket.scannedAt;
    } else {
      duty.passengerManifest.push({
        pnr: ticket.pnr,
        seatNumber: ticket.seatNumber,
        name: ticket.passengerName,
        boardingStatus: 'boarded',
        boardingTime: ticket.scannedAt
      });
    }
    duty.boardedCount = (duty.boardedCount || 0) + 1;
    await duty.save();

    return res.json({
      success: true,
      message: 'Ticket validated successfully',
      data: {
        pnr: ticket.pnr,
        seatNumber: ticket.seatNumber,
        passengerName: ticket.passengerName,
        scannedAt: ticket.scannedAt
      }
    });
  } catch (error) {
    console.error('Error validating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/vacant-seat - Mark seat as vacant
router.post('/vacant-seat', auth, requireRole(['conductor']), async (req, res) => {
  try {
    const { tripId, seatNumber } = req.body;
    const conductorId = req.user.id;

    const duty = await Duty.findOne({
      conductorId,
      status: 'active'
    });

    if (!duty) {
      return res.status(400).json({
        success: false,
        message: 'No active duty found'
      });
    }

    // Remove passenger from manifest or mark as vacant
    if (duty.passengerManifest) {
      duty.passengerManifest = duty.passengerManifest.filter(p => p.seatNumber !== seatNumber);
    }

    await duty.save();

    res.json({
      success: true,
      message: 'Seat marked as vacant successfully'
    });
  } catch (error) {
    console.error('Error marking seat vacant:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/validate-ticket - Validate QR ticket
router.post('/validate-ticket', auth, async (req, res) => {
  try {
    const { ticketId, tripId, scannedAt, conductorId } = req.body;
    
    // Find the duty for this conductor
    const duty = await Duty.findOne({
      conductorId: req.user.conductorId || req.user._id,
      status: { $in: ['started', 'in-progress'] }
    }).populate('tripId').populate('busId');

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'No active duty found'
      });
    }

    // Find ticket by PNR or QR data
    const ticket = await Ticket.findOne({
      $or: [
        { pnr: ticketId },
        { qrPayload: { $regex: ticketId, $options: 'i' } }
      ],
      state: 'active'
    }).populate('bookingId');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or invalid'
      });
    }

    // Check if ticket is for the correct trip
    if (ticket.tripDetails?.tripId?.toString() !== duty.tripId?._id?.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not valid for this trip'
      });
    }

    // Check if ticket has already been scanned
    if (ticket.scannedAt) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has already been scanned',
        data: {
          scannedAt: ticket.scannedAt,
          scannedBy: ticket.scannedBy
        }
      });
    }

    // Mark ticket as scanned
    await Ticket.findByIdAndUpdate(ticket._id, {
      scannedAt: new Date(scannedAt),
      scannedBy: req.user.conductorId || req.user._id,
      scannedLocation: duty.busId?.currentLocation || 'On Board'
    });

    // Update booking status
    await Booking.findByIdAndUpdate(ticket.bookingId, {
      status: 'boarded',
      boardedAt: new Date(scannedAt)
    });

    // Update duty statistics
    await Duty.findByIdAndUpdate(duty._id, {
      $inc: { boardedCount: 1 },
      $push: {
        passengerLog: {
          pnr: ticket.pnr,
          seatNumber: ticket.seatNumber,
          passengerName: ticket.passengerName,
          boardedAt: new Date(scannedAt),
          conductorId: req.user.conductorId || req.user._id
        }
      }
    });

    // Log activity
    const conductor = await Conductor.findById(req.user.conductorId || req.user._id);
    await conductor.logActivity(
      'ticket_scanned',
      `Scanned ticket for ${ticket.passengerName} - Seat ${ticket.seatNumber}`,
      null,
      'duty',
      duty._id
    );

    res.json({
      success: true,
      message: 'Ticket validated successfully',
      data: {
        pnr: ticket.pnr,
        seatNumber: ticket.seatNumber,
        passengerName: ticket.passengerName,
        fareAmount: ticket.fareAmount,
        boardingStop: ticket.boardingStop,
        destinationStop: ticket.destinationStop,
        scannedAt: new Date(scannedAt)
      }
    });

  } catch (error) {
    console.error('Validate ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/duties/:dutyId/assign - Assign duty (Step 2)
router.post('/duties/:dutyId/assign', auth, async (req, res) => {
  try {
    const { status, assignedAt, conductorId } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      status: 'unassigned'
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or already assigned'
      });
    }

    duty.status = 'assigned';
    duty.conductorId = req.user.conductorId || req.user._id;
    duty.assignedAt = new Date();
    await duty.save();

    res.json({
      success: true,
      message: 'Duty assigned successfully',
      data: duty
    });

  } catch (error) {
    console.error('Assign duty error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/duties/:dutyId/interest - Mark duty interest (Assign Later)
router.post('/duties/:dutyId/interest', auth, async (req, res) => {
  try {
    const { conductorId, interestedAt } = req.body;
    
    const duty = await Duty.findById(req.params.dutyId);

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found'
      });
    }

    // Mark conductor interest without changing status
    duty.interestedConductors = duty.interestedConductors || [];
    if (!duty.interestedConductors.includes(req.user.conductorId || req.user._id)) {
      duty.interestedConductors.push(req.user.conductorId || req.user._id);
    }
    await duty.save();

    res.json({
      success: true,
      message: 'Interest marked successfully',
      data: duty
    });

  } catch (error) {
    console.error('Mark duty interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/notify-status - Notify depot and admin of status changes
router.post('/notify-status', auth, async (req, res) => {
  try {
    const { dutyId, conductorId, conductorName, status, timestamp, routeId, busId, depotId } = req.body;
    
    // Create notification record
    const notification = {
      type: 'duty_status_change',
      dutyId,
      conductorId,
      conductorName,
      status,
      timestamp: new Date(),
      routeId,
      busId,
      depotId,
      message: `Conductor ${conductorName} - Status changed to ${status}`
    };

    // In a real implementation, you would:
    // 1. Save to notifications collection
    // 2. Send real-time updates via WebSocket
    // 3. Update depot and admin dashboards
    
    console.log('Status notification:', notification);

    res.json({
      success: true,
      message: 'Status notification sent successfully'
    });

  } catch (error) {
    console.error('Notify status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/update-passenger-status - Update passenger status (Step 5)
router.post('/update-passenger-status', auth, async (req, res) => {
  try {
    const { tripId, seatNumber, status, updatedAt, conductorId } = req.body;
    
    // Update passenger status in the booking system
    const Booking = require('../models/Booking');
    const booking = await Booking.findOne({
      'journey.tripId': tripId,
      'seats.seatNumber': seatNumber
    });

    if (booking) {
      booking.seats = booking.seats.map(seat => 
        seat.seatNumber === seatNumber 
          ? { ...seat, status, updatedAt: new Date(), updatedBy: conductorId }
          : seat
      );
      await booking.save();
    }

    res.json({
      success: true,
      message: 'Passenger status updated successfully'
    });

  } catch (error) {
    console.error('Update passenger status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Enhanced Dashboard API Routes

// GET /api/conductor/dashboard/stats - Get dashboard statistics
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const conductorId = req.user.conductorId || req.user._id;
    
    // Get current duty
    const currentDuty = await Duty.findOne({
      conductorId,
      status: { $in: ['assigned', 'started', 'in-progress', 'on-break'] }
    });

    // Calculate statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get today's duties
    const todayDuties = await Duty.find({
      conductorId,
      scheduledStartTime: { $gte: today, $lte: endOfDay }
    });

    // Calculate stats
    const stats = {
      totalTrips: todayDuties.length,
      activeTrips: todayDuties.filter(d => ['started', 'in-progress', 'on-break'].includes(d.status)).length,
      completedTrips: todayDuties.filter(d => d.status === 'completed').length,
      totalRevenue: todayDuties.reduce((sum, d) => sum + (d.revenue || 0), 0),
      totalPassengers: todayDuties.reduce((sum, d) => sum + (d.passengerManifest?.length || 0), 0),
      fuelConsumption: 0, // Placeholder - would need fuel tracking
      maintenanceAlerts: 0, // Placeholder - would need maintenance system
      delayAlerts: todayDuties.filter(d => d.delays && d.delays.length > 0).length
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/conductor/notifications - Get notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const conductorId = req.user.conductorId || req.user._id;
    
    // Get conductor activities as notifications
    const conductor = await Conductor.findById(conductorId);
    if (!conductor) {
      return res.status(404).json({
        success: false,
        message: 'Conductor not found'
      });
    }

    // Get recent activities (last 10)
    const notifications = conductor.activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map(activity => ({
        id: activity._id,
        title: activity.description,
        message: activity.description,
        type: activity.action,
        timestamp: activity.timestamp,
        severity: activity.action.includes('error') ? 'high' : 'medium'
      }));

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/conductor/alerts - Get alerts
router.get('/alerts', auth, async (req, res) => {
  try {
    const conductorId = req.user.conductorId || req.user._id;
    
    // Get current duty
    const currentDuty = await Duty.findOne({
      conductorId,
      status: { $in: ['assigned', 'started', 'in-progress', 'on-break'] }
    });

    const alerts = [];

    // Check for duty-related alerts
    if (currentDuty) {
      // Check for delays
      if (currentDuty.delays && currentDuty.delays.length > 0) {
        alerts.push({
          id: 'delay-alert',
          title: 'Trip Delay',
          message: `Trip is delayed by ${currentDuty.delays[currentDuty.delays.length - 1].duration} minutes`,
          severity: 'high',
          timestamp: new Date(),
          type: 'delay'
        });
      }

      // Check for incidents
      if (currentDuty.incidents && currentDuty.incidents.length > 0) {
        alerts.push({
          id: 'incident-alert',
          title: 'Incident Reported',
          message: `Incident: ${currentDuty.incidents[currentDuty.incidents.length - 1].type}`,
          severity: 'critical',
          timestamp: new Date(),
          type: 'incident'
        });
      }
    }

    // Add sample alerts for demonstration
    alerts.push({
      id: 'maintenance-alert',
      title: 'Bus Maintenance Due',
      message: 'Bus #1234 requires oil change',
      severity: 'medium',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'maintenance'
    });

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/conductor/tracking/:dutyId - Get live tracking data
router.get('/tracking/:dutyId', auth, async (req, res) => {
  try {
    const { dutyId } = req.params;
    const conductorId = req.user.conductorId || req.user._id;
    
    const duty = await Duty.findOne({
      _id: dutyId,
      conductorId,
      status: { $in: ['started', 'in-progress', 'on-break'] }
    }).populate('busId');

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or not active'
      });
    }

    // Get bus location (placeholder - would integrate with GPS system)
    const trackingData = {
      currentLocation: duty.busId?.currentLocation || 'GPS Offline',
      speed: duty.busId?.currentSpeed || 0,
      direction: duty.busId?.currentDirection || 'N',
      lastUpdate: duty.busId?.lastLocationUpdate || new Date(),
      route: duty.routeId?.name || 'Unknown Route',
      nextStop: duty.nextStop || 'Unknown'
    };

    res.json({
      success: true,
      data: trackingData
    });

  } catch (error) {
    console.error('Get tracking data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Test endpoint to verify conductor authentication
router.get('/test-auth', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Authentication working',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

module.exports = router;
