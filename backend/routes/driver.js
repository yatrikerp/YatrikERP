const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');
const Duty = require('../models/Duty');
const { auth, requireRole } = require('../middleware/auth');
const { validateDriverData } = require('../middleware/validation');

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
    
    // Mark attendance
    if (location) {
      await driver.markAttendance('login', location);
    }
    
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
        }
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
    const driver = await Driver.findById(req.user.driverId);
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
    
    const driver = await Driver.findById(req.user.driverId);
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

    driver.updatedBy = req.user.driverId;
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
    
    let query = { driverId: req.user.driverId };
    
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
router.get('/duties/current', auth, async (req, res) => {
  try {
    const duty = await Duty.findOne({
      driverId: req.user.driverId,
      status: { $in: ['assigned', 'started', 'in-progress', 'on-break'] }
    })
    .populate('conductorId', 'name conductorId')
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
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/driver/duties/:dutyId/start - Start duty
router.post('/duties/:dutyId/start', auth, async (req, res) => {
  try {
    const { location } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      driverId: req.user.driverId,
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
    const driver = await Driver.findById(req.user.driverId);
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
      driverId: req.user.driverId,
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
    const driver = await Driver.findById(req.user.driverId);
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
      driverId: req.user.driverId,
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
    const driver = await Driver.findById(req.user.driverId);
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
      driverId: req.user.driverId,
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
    const driver = await Driver.findById(req.user.driverId);
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
      driverId: req.user.driverId,
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
    const driver = await Driver.findById(req.user.driverId);
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
      driverId: req.user.driverId,
      status: { $in: ['started', 'in-progress', 'on-break'] }
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or cannot report incident'
      });
    }

    // Report incident
    await duty.reportIncident(type, description, severity, location, req.user.driverId);

    // Log activity
    const driver = await Driver.findById(req.user.driverId);
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
      driverId: req.user.driverId,
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
        completedBy: req.user.driverId,
        completedAt: new Date(),
        notes
      };
    } else if (checkType === 'post-trip') {
      duty.safety.postTripCheck = {
        completed,
        completedBy: req.user.driverId,
        completedAt: new Date(),
        notes
      };
    }

    await duty.save();

    // Log activity
    const driver = await Driver.findById(req.user.driverId);
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
    
    const driver = await Driver.findById(req.user.driverId);
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
    
    const driver = await Driver.findById(req.user.driverId);
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

// GET /api/driver/all - Get all drivers (admin/depot manager only)
router.get('/all', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { depotId, status, search } = req.query;
    
    let query = {};
    
    if (depotId) {
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
    const driverData = req.body;
    
    // Hash password
    const saltRounds = 12;
    driverData.password = await bcrypt.hash(driverData.password, saltRounds);
    
    // Set created by
    driverData.createdBy = req.user.id;
    
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

// PUT /api/driver/:id - Update driver (admin/depot manager only)
router.put('/:id', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated
    delete updateData.password;
    delete updateData.username;
    delete updateData.driverId;
    
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

// GET /api/driver/license-expiring - Get drivers with expiring licenses (admin/depot manager only)
router.get('/license-expiring', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
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

module.exports = router;
