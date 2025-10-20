const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');
const Duty = require('../models/Duty');
const Depot = require('../models/Depot');
const { auth, requireRole } = require('../middleware/auth');
const { validateDriverData } = require('../middleware/validation');
const { createResponseGuard, safeObjectId, extractUserId, asyncHandler } = require('../middleware/responseGuard');

// Apply response guard middleware to all routes
router.use(createResponseGuard);

// Driver Authentication Routes

// POST /api/driver/login - Driver login with attendance marking
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

    // Find driver
    const driver = await Driver.findOne({ username, status: 'active' });
    if (!driver) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account inactive'
      });
    }

    // Check if account is locked
    if (driver.lockUntil && driver.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    }

    // Check driving license validity
    if (driver.drivingLicense.status === 'expired') {
      return res.status(423).json({
        success: false,
        message: 'Driving license has expired. Please renew before logging in.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, driver.password);
    if (!isPasswordValid) {
      // Increment login attempts
      driver.loginAttempts += 1;
      
      // Lock account after 5 failed attempts for 30 minutes
      if (driver.loginAttempts >= 5) {
        driver.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      
      await driver.save();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    driver.loginAttempts = 0;
    driver.lockUntil = null;
    driver.lastLogin = new Date();
    
    // Initialize automatic location tracking on login
    if (location) {
      await driver.markAttendance('login', location);
      
      // Set current location
      driver.currentLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        lastUpdated: new Date(),
        accuracy: location.accuracy || null
      };
      
      // Initialize location tracking session
      driver.locationTracking = {
        isActive: true,
        startedAt: new Date(),
        sessionId: `session_${Date.now()}`,
        trackingHistory: [{
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date(),
          event: 'login'
        }]
      };
    }
    
    // Mark driver as online
    driver.isOnline = true;
    driver.lastSeen = new Date();
    
    await driver.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        driverId: driver._id,
        username: driver.username,
        depotId: driver.depotId,
        role: 'driver'
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Log activity
    await driver.logActivity(
      'login',
      'Driver logged in successfully',
      location,
      'system',
      null
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        driver: {
          id: driver._id,
          driverId: driver.driverId,
          name: driver.name,
          employeeCode: driver.employeeCode,
          depotId: driver.depotId,
          currentDuty: driver.currentDuty,
          drivingLicense: driver.drivingLicense
        },
        redirectPath: '/driver'
      }
    });

  } catch (error) {
    console.error('Driver login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/driver/logout - Driver logout with attendance marking
router.post('/logout', auth, async (req, res) => {
  try {
    const driverId = req.user.driverId || req.user._id;
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Mark attendance
    await driver.markAttendance('logout', req.body.location);

    // Log activity
    await driver.logActivity(
      'logout',
      'Driver logged out',
      req.body.location,
      'system',
      null
    );

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Driver logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/driver/profile - Get driver profile
router.get('/profile', auth, async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.driverId)
      .populate('depotId', 'depotName depotCode location')
      .select('-password');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      data: driver
    });

  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/driver/profile - Update driver profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, email, address, emergencyContact } = req.body;
    
    const driverId = req.user.driverId || req.user._id;
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Update allowed fields
    if (name) driver.name = name;
    if (phone) driver.phone = phone;
    if (email) driver.email = email;
    if (address) driver.address = address;
    if (emergencyContact) driver.emergencyContact = emergencyContact;

    driver.updatedBy = req.user.driverId || req.user._id;
    await driver.save();

    // Log activity
    await driver.logActivity(
      'profile_update',
      'Profile information updated',
      null,
      'system',
      null
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: driver
    });

  } catch (error) {
    console.error('Update driver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Duty Management Routes

// GET /api/driver/duties - Get driver's duties
router.get('/duties', auth, async (req, res) => {
  try {
    const { status, date } = req.query;
    
    // Ensure we have the correct driver ID
    const driverId = req.user.driverId || req.user._id;
    
    let query = { driverId: driverId };
    
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
      .populate('conductorId', 'name conductorId')
      .populate('busId', 'busNumber registrationNumber')
      .populate('tripId', 'tripCode')
      .populate('routeId', 'name routeCode')
      .sort({ scheduledStartTime: -1 });

    res.json({
      success: true,
      data: duties
    });

  } catch (error) {
    console.error('Get driver duties error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/driver/duties/current - Get current duty
router.get('/duties/current', auth, asyncHandler(async (req, res) => {
  // Ensure we have the correct driver ID
  if (!req.user) {
    return res.guard.success(null, 'Not authenticated');
  }
  
  let driverId;
  try {
    driverId = extractUserId(req, 'driver');
  } catch (error) {
    return res.guard.success(null, 'No current duty assigned');
  }
  
  const duty = await Duty.findOne({
    driverId: driverId,
    status: { $in: ['assigned', 'started', 'in-progress', 'on-break'] }
  })
  .populate('conductorId', 'name conductorId')
  .populate('busId', 'busNumber registrationNumber')
  .populate('tripId', 'tripCode')
  .populate('routeId', 'name routeCode');

  if (!duty) {
    return res.guard.success(null, 'No current duty assigned');
  }

  res.guard.success(duty);
}));

// POST /api/driver/duties/:dutyId/start - Start duty
router.post('/duties/:dutyId/start', auth, async (req, res) => {
  try {
    const { location } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      driverId: req.user.driverId || req.user._id,
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

    // Update driver's current duty
    const driverId = req.user.driverId || req.user._id;
    const driver = await Driver.findById(driverId);
    await driver.startDuty(duty._id, duty.tripId, duty.busId);

    // Log activity
    await driver.logActivity(
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

// POST /api/driver/duties/:dutyId/end - End duty
router.post('/duties/:dutyId/end', auth, async (req, res) => {
  try {
    const { location } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      driverId: req.user.driverId || req.user._id,
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

    // Update driver's duty status
    const driverId = req.user.driverId || req.user._id;
    const driver = await Driver.findById(driverId);
    await driver.endDuty();

    // Log activity
    await driver.logActivity(
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

// POST /api/driver/duties/:dutyId/break - Take break
router.post('/duties/:dutyId/break', auth, async (req, res) => {
  try {
    const { duration, location } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      driverId: req.user.driverId || req.user._id,
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
    const driverId = req.user.driverId || req.user._id;
    const driver = await Driver.findById(driverId);
    await driver.logActivity(
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

// POST /api/driver/duties/:dutyId/break/end - End break
router.post('/duties/:dutyId/break/end', auth, async (req, res) => {
  try {
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      driverId: req.user.driverId || req.user._id,
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
    const driverId = req.user.driverId || req.user._id;
    const driver = await Driver.findById(driverId);
    await driver.logActivity(
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

// POST /api/driver/duties/:dutyId/delay - Report delay
router.post('/duties/:dutyId/delay', auth, async (req, res) => {
  try {
    const { reason, duration, location } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      driverId: req.user.driverId || req.user._id,
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
    const driverId = req.user.driverId || req.user._id;
    const driver = await Driver.findById(driverId);
    await driver.logActivity(
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

// POST /api/driver/duties/:dutyId/incident - Report incident
router.post('/duties/:dutyId/incident', auth, async (req, res) => {
  try {
    const { type, description, severity, location } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      driverId: req.user.driverId || req.user._id,
      status: { $in: ['started', 'in-progress', 'on-break'] }
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or cannot report incident'
      });
    }

    // Report incident
    await duty.reportIncident(type, description, severity, location, req.user.driverId || req.user._id);

    // Log activity
    const driverId = req.user.driverId || req.user._id;
    const driver = await Driver.findById(driverId);
    await driver.logActivity(
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

// POST /api/driver/duties/:dutyId/safety-check - Complete safety checks
router.post('/duties/:dutyId/safety-check', auth, async (req, res) => {
  try {
    const { checkType, completed, notes, location } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      driverId: req.user.driverId || req.user._id,
      status: { $in: ['assigned', 'started', 'in-progress'] }
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or cannot complete safety check'
      });
    }

    // Update safety check
    if (checkType === 'pre-trip') {
      duty.safety.preTripCheck = {
        completed,
        completedBy: req.user.driverId || req.user._id,
        completedAt: new Date(),
        notes
      };
    } else if (checkType === 'post-trip') {
      duty.safety.postTripCheck = {
        completed,
        completedBy: req.user.driverId || req.user._id,
        completedAt: new Date(),
        notes
      };
    }

    await duty.save();

    // Log activity
    const driverId = req.user.driverId || req.user._id;
    const driver = await Driver.findById(driverId);
    await driver.logActivity(
      'safety_check_completed',
      `${checkType} safety check ${completed ? 'completed' : 'failed'}: ${notes}`,
      location,
      'duty',
      duty._id
    );

    res.json({
      success: true,
      message: 'Safety check updated successfully',
      data: duty
    });

  } catch (error) {
    console.error('Safety check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Activity & Attendance Routes

// GET /api/driver/attendance - Get attendance history
router.get('/attendance', auth, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    const driverId = req.user.driverId || req.user._id;
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    let attendance = driver.attendance;
    
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

// GET /api/driver/activities - Get activity log
router.get('/activities', auth, async (req, res) => {
  try {
    const { startDate, endDate, action, relatedEntity, limit = 50 } = req.query;
    
    const driverId = req.user.driverId || req.user._id;
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    let activities = driver.activities;
    
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

// GET /api/driver/performance - Get performance metrics
router.get('/performance', auth, async (req, res) => {
  try {
    const driver = await Driver.findById(req.user.driverId)
      .select('performance attendance drivingLicense');
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Calculate additional metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAttendance = driver.attendance.find(a => 
      a.date.getTime() === today.getTime()
    );
    
    const thisMonthAttendance = driver.attendance.filter(a => {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return a.date >= monthStart;
    });

    const performanceData = {
      ...driver.performance,
      todayAttendance: todayAttendance || null,
      thisMonthAttendance: {
        total: thisMonthAttendance.length,
        present: thisMonthAttendance.filter(a => a.status === 'present').length,
        absent: thisMonthAttendance.filter(a => a.status === 'absent').length,
        late: thisMonthAttendance.filter(a => a.status === 'late').length,
        halfDay: thisMonthAttendance.filter(a => a.status === 'half-day').length
      },
      licenseStatus: driver.drivingLicense.status,
      licenseExpiry: driver.drivingLicense.expiryDate
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

// GET /api/driver/depot - Get drivers for current depot (depot manager only)
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
    
    const drivers = await Driver.find(query)
      .select('-password -loginAttempts -lockUntil')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error('Error fetching depot drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/driver/all - Get all drivers (admin/depot manager - depot managers see only their depot)
router.get('/all', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { depotId, status, search } = req.query;
    
    let query = {};
    
    // If user is depot_manager, only show their depot's drivers
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
        { driverId: { $regex: search, $options: 'i' } },
        { 'drivingLicense.licenseNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const drivers = await Driver.find(query)
      .populate('depotId', 'depotName depotCode')
      .select('-password')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: drivers
    });

  } catch (error) {
    console.error('Get all drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/driver - Create new driver (admin/depot manager only)
router.post('/', auth, requireRole(['admin', 'depot_manager']), validateDriverData, async (req, res) => {
  try {
    const driverData = { ...req.body };

    // Ensure depotId comes from authenticated user if not provided
    if (!driverData.depotId && req.user?.depotId) {
      driverData.depotId = req.user.depotId;
    }

    // Map license field name from validation (drivingLicense.type) to model (licenseType)
    if (driverData.drivingLicense) {
      if (driverData.drivingLicense.type && !driverData.drivingLicense.licenseType) {
        driverData.drivingLicense.licenseType = driverData.drivingLicense.type;
        delete driverData.drivingLicense.type;
      }
      // Coerce date strings to Date
      if (driverData.drivingLicense.issueDate)
        driverData.drivingLicense.issueDate = new Date(driverData.drivingLicense.issueDate);
      if (driverData.drivingLicense.expiryDate)
        driverData.drivingLicense.expiryDate = new Date(driverData.drivingLicense.expiryDate);
    }

    // Generate driverId if missing
    if (!driverData.driverId) {
      const code = (driverData.employeeCode || 'DRV').toString().replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
      const ts = Date.now().toString().slice(-4);
      driverData.driverId = `${code}-${ts}${rnd}`.toUpperCase();
    }
    
    // Hash password
    const saltRounds = 12;
    driverData.password = await bcrypt.hash(driverData.password, saltRounds);
    
    // Set created by
    driverData.createdBy = req.user?._id || req.user?.id;
    
    const driver = new Driver(driverData);
    await driver.save();

    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: driver
    });

  } catch (error) {
    console.error('Create driver error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Driver with this username, email, phone, or license number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/driver/:id - Update driver (admin only)
router.put('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Prevent immutable fields from being updated directly
    delete updateData.username; // managed separately
    delete updateData.driverId;

    // Handle password hashing if provided
    if (updateData.password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    updateData.updatedBy = req.user.id;

    const driver = await Driver.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      message: 'Driver updated successfully',
      data: driver
    });

  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/driver/:id/reset-credentials - Admin resets credentials to policy and removes username
router.post('/:id/reset-credentials', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Fetch depot code/number
    let depotCode = '';
    if (driver.depotId) {
      const depot = await Depot.findById(driver.depotId).select('depotCode code');
      depotCode = depot?.depotCode || depot?.code || '';
    }

    // Build email: {name}{depot-number}@yatrik.com
    const nameSlug = String(driver.name || 'driver').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const digits = String(depotCode).match(/\d+/g)?.join('') || '';
    const depotSuffix = digits || String(depotCode || '').toLowerCase() || '000';
    const email = `${nameSlug}${depotSuffix}@yatrik.com`;

    // Hash default password
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash('Yatrik123', 12);

    // Update fields
    driver.email = email;
    driver.password = hashed;
    driver.markModified('password');

    // Remove username field
    if (driver.username) {
      driver.username = undefined;
      // Ensure unset in DB
      await Driver.updateOne({ _id: driver._id }, { $unset: { username: '' } });
    }

    await driver.save();

    return res.json({
      success: true,
      message: 'Driver credentials reset successfully',
      data: {
        id: driver._id,
        email,
        passwordPolicy: 'Yatrik123',
        usernameRemoved: true
      }
    });
  } catch (error) {
    console.error('Reset driver credentials error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/driver/:id - Delete driver (admin only)
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const driver = await Driver.findByIdAndDelete(id);
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    res.json({
      success: true,
      message: 'Driver deleted successfully'
    });

  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/driver/license-expiring - Get drivers with expiring licenses (admin only)
router.get('/license-expiring', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { depotId } = req.query;
    
    let query = { depotId };
    if (!depotId) {
      query = {};
    }
    
    const drivers = await Driver.findWithExpiringLicense(query.depotId)
      .populate('depotId', 'depotName depotCode')
      .select('name driverId employeeCode drivingLicense depotId')
      .sort({ 'drivingLicense.expiryDate': 1 });

    res.json({
      success: true,
      data: drivers
    });

  } catch (error) {
    console.error('Get expiring licenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// New Driver Dashboard API Routes

// GET /api/driver/duties/current - Get current duty assignment with real database integration
router.get('/duties/current', auth, requireRole(['driver']), async (req, res) => {
  try {
    const driverId = req.user.id;
    
    // Find current active duty with full population
    const currentDuty = await Duty.findOne({
      driverId,
      status: { $in: ['assigned', 'active'] },
      date: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    })
    .populate('routeId', 'routeName origin destination distance estimatedDuration')
    .populate('busId', 'busNumber registrationNumber totalSeats fuelCapacity')
    .populate('tripId', 'tripNumber scheduledDeparture scheduledArrival fare')
    .populate('depotId', 'depotName depotCode')
    .populate('assignedBy', 'name role');

    if (!currentDuty) {
      return res.json({
        success: true,
        data: null,
        message: 'No active duty assigned for today'
      });
    }

    // Calculate trip statistics
    const route = currentDuty.routeId;
    const bus = currentDuty.busId;
    const trip = currentDuty.tripId;
    
    // Get today's completed duties for this driver
    const todaysCompletedDuties = await Duty.countDocuments({
      driverId,
      status: 'completed',
      date: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    });

    // Calculate total distance covered today
    const completedDuties = await Duty.find({
      driverId,
      status: 'completed',
      date: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    }).populate('routeId', 'distance');

    const totalDistanceToday = completedDuties.reduce((total, duty) => {
      return total + (duty.routeId?.distance || 0);
    }, 0);

    // Calculate today's earnings
    const todaysEarnings = completedDuties.reduce((total, duty) => {
      return total + (duty.earnings || 0);
    }, 0);

    // Calculate trip progress if trip is active
    let tripProgress = 0;
    let nextStop = route?.origin || 'Starting Point';
    
    if (currentDuty.status === 'active' && currentDuty.startTime) {
      const tripDuration = trip?.estimatedDuration || route?.estimatedDuration || 120; // minutes
      const elapsedTime = (new Date() - new Date(currentDuty.startTime)) / (1000 * 60); // minutes
      tripProgress = Math.min(Math.round((elapsedTime / tripDuration) * 100), 100);
      
      // Determine next stop based on progress
      if (tripProgress < 50) {
        nextStop = 'Mid-route stops';
      } else if (tripProgress < 90) {
        nextStop = route?.destination || 'Final destination';
      } else {
        nextStop = 'Arriving at destination';
      }
    }

    const dutyData = {
      _id: currentDuty._id,
      status: currentDuty.status,
      busNumber: bus?.busNumber || bus?.registrationNumber || 'N/A',
      routeName: route?.routeName || 'N/A',
      origin: route?.origin || 'N/A',
      destination: route?.destination || 'N/A',
      totalDistance: route?.distance || 0,
      completedTrips: todaysCompletedDuties,
      earnings: todaysEarnings,
      totalDistanceToday,
      fuelLevel: bus?.currentFuelLevel || 85, // Default if not tracked
      currentSpeed: currentDuty.currentSpeed || 0,
      nextStop,
      progress: tripProgress,
      startTime: currentDuty.startTime,
      endTime: currentDuty.endTime,
      assignedBy: currentDuty.assignedBy,
      depot: currentDuty.depotId,
      tripDetails: {
        tripNumber: trip?.tripNumber,
        scheduledDeparture: trip?.scheduledDeparture,
        scheduledArrival: trip?.scheduledArrival,
        fare: trip?.fare
      }
    };

    res.json({
      success: true,
      data: dutyData
    });
  } catch (error) {
    console.error('Error fetching current duty:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/driver/notifications - Get driver notifications for new trip assignments
router.get('/notifications', auth, requireRole(['driver']), async (req, res) => {
  try {
    const driverId = req.user.id;
    
    // Find unread notifications for this driver
    const Notification = require('../models/Notification');
    const notifications = await Notification.find({
      recipientId: driverId,
      recipientType: 'driver',
      isRead: false,
      type: { $in: ['trip_assigned', 'duty_updated', 'route_changed'] }
    })
    .populate('relatedDuty', 'routeId busId tripId')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error fetching driver notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/driver/duties/:dutyId/start - Start duty/trip with real-time updates
router.post('/duties/:dutyId/start', auth, requireRole(['driver']), async (req, res) => {
  try {
    const { dutyId } = req.params;
    const driverId = req.user.id;

    const duty = await Duty.findOne({ _id: dutyId, driverId })
      .populate('routeId busId tripId depotId assignedBy');
      
    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or not assigned to you'
      });
    }

    if (duty.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: `Duty cannot be started. Current status: ${duty.status}`
      });
    }

    // Update duty status
    duty.status = 'active';
    duty.startTime = new Date();
    duty.actualStartTime = new Date();
    
    // Initialize trip tracking data
    duty.tripTracking = {
      startLocation: null, // Will be updated by GPS
      currentLocation: null,
      locationHistory: [],
      distanceCovered: 0,
      fuelConsumed: 0
    };

    await duty.save();

    // Create notification for depot manager and admin about trip start
    const Notification = require('../models/Notification');
    
    // Notify depot manager
    if (duty.depotId) {
      await Notification.create({
        recipientId: duty.depotId,
        recipientType: 'depot',
        type: 'trip_started',
        title: 'Trip Started',
        message: `Driver ${req.user.name} has started trip on route ${duty.routeId?.routeName}`,
        relatedDuty: duty._id,
        createdAt: new Date()
      });
    }

    // Notify admin
    const adminUsers = await require('../models/User').find({ role: 'admin' });
    for (const admin of adminUsers) {
      await Notification.create({
        recipientId: admin._id,
        recipientType: 'admin',
        type: 'trip_started',
        title: 'Trip Started',
        message: `Driver ${req.user.name} started trip ${duty.routeId?.routeName} (${duty.busId?.busNumber})`,
        relatedDuty: duty._id,
        createdAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Trip started successfully',
      data: duty
    });
  } catch (error) {
    console.error('Error starting trip:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/driver/duties/:dutyId/end - End duty/trip
router.post('/duties/:dutyId/end', auth, requireRole(['driver']), async (req, res) => {
  try {
    const { dutyId } = req.params;
    const driverId = req.user.id;

    const duty = await Duty.findOne({ _id: dutyId, driverId });
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
    
    // Generate trip report
    const report = {
      dutyId: duty._id,
      driverId,
      totalDistance: duty.totalDistance || 0,
      earnings: duty.earnings || 0,
      fuelConsumed: duty.fuelConsumed || 0,
      completedAt: new Date()
    };

    duty.tripReport = report;
    await duty.save();

    res.json({
      success: true,
      message: 'Trip completed successfully',
      data: { duty, report }
    });
  } catch (error) {
    console.error('Error ending trip:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/driver/duties/:dutyId/location - Update GPS location
router.post('/duties/:dutyId/location', auth, requireRole(['driver']), async (req, res) => {
  try {
    const { dutyId } = req.params;
    const { lat, lng, timestamp, speed } = req.body;
    const driverId = req.user.id;

    const duty = await Duty.findOne({ _id: dutyId, driverId, status: 'active' });
    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Active duty not found'
      });
    }

    // Update location data
    duty.currentLocation = {
      latitude: lat,
      longitude: lng,
      timestamp: new Date(timestamp),
      speed: speed || 0
    };

    duty.currentSpeed = Math.round((speed || 0) * 3.6); // Convert m/s to km/h

    // Add to location history
    if (!duty.locationHistory) {
      duty.locationHistory = [];
    }
    
    duty.locationHistory.push({
      latitude: lat,
      longitude: lng,
      timestamp: new Date(timestamp),
      speed: speed || 0
    });

    // Keep only last 100 location points
    if (duty.locationHistory.length > 100) {
      duty.locationHistory = duty.locationHistory.slice(-100);
    }

    await duty.save();

    res.json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/driver/emergency - Report emergency
router.post('/emergency', auth, requireRole(['driver']), async (req, res) => {
  try {
    const { type, location, dutyId, timestamp } = req.body;
    const driverId = req.user.id;

    // Create emergency report
    const emergencyReport = {
      driverId,
      dutyId,
      type,
      location,
      timestamp: new Date(timestamp),
      status: 'reported',
      reportedAt: new Date()
    };

    // In a real implementation, this would:
    // 1. Save to Emergency model
    // 2. Notify dispatch/control room
    // 3. Send alerts to relevant authorities
    // 4. Update duty status if needed

    console.log('Emergency Report:', emergencyReport);

    res.json({
      success: true,
      message: `${type} reported successfully. Emergency services have been notified.`,
      data: emergencyReport
    });
  } catch (error) {
    console.error('Error reporting emergency:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/driver/emergency - Report emergency
router.post('/emergency', auth, async (req, res) => {
  try {
    const { type, location, dutyId, timestamp, driverId, busNumber, routeName } = req.body;
    
    // Find the duty for this driver
    const duty = await Duty.findOne({
      driverId: req.user.driverId || req.user._id,
      status: { $in: ['started', 'in-progress'] }
    }).populate('conductorId').populate('busId').populate('routeId');

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'No active duty found'
      });
    }

    // Create emergency record
    const emergency = {
      type,
      location: location || {},
      dutyId: duty._id,
      driverId: req.user.driverId || req.user._id,
      conductorId: duty.conductorId?._id,
      busId: duty.busId?._id,
      routeId: duty.routeId?._id,
      reportedAt: new Date(timestamp || Date.now()),
      status: 'active',
      priority: type === 'Medical Emergency' ? 'high' : 'medium',
      details: {
        busNumber: duty.busId?.busNumber || busNumber,
        routeName: duty.routeId?.name || routeName,
        conductorName: duty.conductorId?.name || 'N/A'
      }
    };

    // Update duty status to emergency
    await Duty.findByIdAndUpdate(duty._id, {
      status: 'emergency',
      emergency: emergency,
      lastUpdated: new Date()
    });

    // Log activity
    const driver = await Driver.findById(req.user.driverId || req.user._id);
    await driver.logActivity(
      'emergency_reported',
      `Emergency reported: ${type}`,
      location,
      'duty',
      duty._id
    );

    // TODO: Send notifications to depot manager and admin
    // TODO: Send SMS/WhatsApp to emergency contacts

    res.json({
      success: true,
      message: 'Emergency reported successfully',
      data: {
        emergencyId: emergency._id || 'generated',
        type,
        reportedAt: emergency.reportedAt,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Report emergency error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/driver/duties/:dutyId/eta - Update ETA
router.post('/duties/:dutyId/eta', auth, async (req, res) => {
  try {
    const { etaMinutes, reason, location, timestamp } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      driverId: req.user.driverId || req.user._id,
      status: { $in: ['started', 'in-progress'] }
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or cannot update ETA'
      });
    }

    // Update ETA
    await duty.updateETA(etaMinutes, reason, location, req.user.driverId || req.user._id);

    // Log activity
    const driver = await Driver.findById(req.user.driverId || req.user._id);
    await driver.logActivity(
      'eta_updated',
      `ETA updated: ${etaMinutes} minutes - ${reason || 'No reason provided'}`,
      location,
      'duty',
      duty._id
    );

    res.json({
      success: true,
      message: 'ETA updated successfully',
      data: {
        etaMinutes,
        reason,
        updatedAt: new Date(timestamp || Date.now())
      }
    });

  } catch (error) {
    console.error('Update ETA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/driver/duties/:dutyId/delay - Report delay
router.post('/duties/:dutyId/delay', auth, async (req, res) => {
  try {
    const { delayMinutes, reason, location, timestamp } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      driverId: req.user.driverId || req.user._id,
      status: { $in: ['started', 'in-progress'] }
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or cannot report delay'
      });
    }

    // Add delay
    await duty.addDelay(reason, delayMinutes, location, req.user.driverId || req.user._id);

    // Log activity
    const driver = await Driver.findById(req.user.driverId || req.user._id);
    await driver.logActivity(
      'delay_reported',
      `Delay reported: ${reason} (${delayMinutes} minutes)`,
      location,
      'duty',
      duty._id
    );

    res.json({
      success: true,
      message: 'Delay reported successfully',
      data: {
        delayMinutes,
        reason,
        reportedAt: new Date(timestamp || Date.now())
      }
    });

  } catch (error) {
    console.error('Report delay error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
