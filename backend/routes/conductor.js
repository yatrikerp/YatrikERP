const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Conductor = require('../models/Conductor');
const Duty = require('../models/Duty');
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
        }
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
    const conductor = await Conductor.findById(req.user.conductorId);
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
    const conductor = await Conductor.findById(req.user.conductorId)
      .populate('depotId', 'depotName depotCode location')
      .select('-password');

    if (!conductor) {
      return res.status(404).json({
        success: false,
        message: 'Conductor not found'
      });
    }

    res.json({
      success: true,
      data: conductor
    });

  } catch (error) {
    console.error('Get conductor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/conductor/profile - Update conductor profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, email, address, emergencyContact } = req.body;
    
    const conductor = await Conductor.findById(req.user.conductorId);
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

    conductor.updatedBy = req.user.conductorId;
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
    
    let query = { conductorId: req.user.conductorId };
    
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
    const duty = await Duty.findOne({
      conductorId: req.user.conductorId,
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
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/conductor/duties/:dutyId/start - Start duty
router.post('/duties/:dutyId/start', auth, async (req, res) => {
  try {
    const { location } = req.body;
    
    const duty = await Duty.findOne({
      _id: req.params.dutyId,
      conductorId: req.user.conductorId,
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
    const conductor = await Conductor.findById(req.user.conductorId);
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
      conductorId: req.user.conductorId,
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
    const conductor = await Conductor.findById(req.user.conductorId);
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
      conductorId: req.user.conductorId,
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
    const conductor = await Conductor.findById(req.user.conductorId);
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
      conductorId: req.user.conductorId,
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
    const conductor = await Conductor.findById(req.user.conductorId);
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
      conductorId: req.user.conductorId,
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
    const conductor = await Conductor.findById(req.user.conductorId);
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
      conductorId: req.user.conductorId,
      status: { $in: ['started', 'in-progress', 'on-break'] }
    });

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found or cannot report incident'
      });
    }

    // Report incident
    await duty.reportIncident(type, description, severity, location, req.user.conductorId);

    // Log activity
    const conductor = await Conductor.findById(req.user.conductorId);
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
    
    const conductor = await Conductor.findById(req.user.conductorId);
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
    
    const conductor = await Conductor.findById(req.user.conductorId);
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

// GET /api/conductor/all - Get all conductors (admin/depot manager only)
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
    const conductorData = req.body;
    
    // Hash password
    const saltRounds = 12;
    conductorData.password = await bcrypt.hash(conductorData.password, saltRounds);
    
    // Set created by
    conductorData.createdBy = req.user.id;
    
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

// PUT /api/conductor/:id - Update conductor (admin/depot manager only)
router.put('/:id', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated
    delete updateData.password;
    delete updateData.username;
    delete updateData.conductorId;
    
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

module.exports = router;
