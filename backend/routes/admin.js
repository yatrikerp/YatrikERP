const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

const tokenBlacklist = require('../lib/tokenBlacklist');

// Import models
const User = require('../models/User');
const Depot = require('../models/Depot');
const Route = require('../models/Route');
const Stop = require('../models/Stop');
const Trip = require('../models/Trip');
const Duty = require('../models/Duty');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const SystemConfig = require('../models/SystemConfig');


// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  console.log('🏥 Admin health check hit');
  res.json({ 
    status: 'OK', 
    message: 'Admin routes are accessible',
    timestamp: new Date().toISOString()
  });
});

// Admin middleware - ensure user is ADMIN
const adminAuth = auth(['ADMIN']);

// Apply admin auth to all routes
router.use(adminAuth);

// =================================================================
// 1) Dashboard & Status
// =================================================================

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // KPIs
    const [users, depots, tripsToday, runningTrips, validationsToday, activeLocks] = await Promise.all([
      User.countDocuments({ status: 'active' }),
      Depot.countDocuments({ status: 'active' }),
      Trip.countDocuments({ 
        serviceDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['scheduled', 'running', 'completed'] }
      }),
      Trip.countDocuments({ status: 'running' }),
      Duty.aggregate([
        { $match: { date: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$validationCount' } } }
      ]).then(result => result[0]?.total || 0),
      Booking.countDocuments({ 
        status: 'locked',
        createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
      })
    ]);

    // Recent activities
    const [recentBookings, recentValidations] = await Promise.all([
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .populate('trip', 'routeId serviceDate startTime'),
      Duty.find({ date: { $gte: today, $lt: tomorrow } })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('conductor', 'name')
        .populate('trip', 'routeId serviceDate startTime')
    ]);

    res.json({
      kpis: {
        users,
        depots,
        tripsToday,
        runningTrips,
        validationsToday,
        activeLocks
      },
      top5Recent: {
        bookings: recentBookings,
        validations: recentValidations
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/admin/system/status
router.get('/system/status', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Database ping
    const dbStart = Date.now();
    await User.findOne().select('_id').lean();
    const dbPingMs = Date.now() - dbStart;

    // Socket clients count (if io is available)
    const socketClients = req.app.get('io') ? 
      req.app.get('io').engine.clientsCount : 0;

    res.json({
      api: 'ok',
      dbPingMs,
      socketClients,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({ error: 'Failed to fetch system status' });
  }
});

// =================================================================
// 2) Global Config & Fare Policy
// =================================================================

// GET /api/admin/config
router.get('/config', async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      // Create default config
      config = new SystemConfig({
        updatedBy: req.user._id
      });
      await config.save();
    }
    res.json(config);
  } catch (error) {
    console.error('Config fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch system config' });
  }
});

// PUT /api/admin/config
router.put('/config', async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
    }

    const before = config.toObject();
    
    // Update config
    Object.assign(config, req.body, {
      updatedBy: req.user._id,
      updatedAt: new Date()
    });

    await config.save();
    const after = config.toObject();

    

    // Emit to admin dashboard
    if (req.app.get('io')) {
      req.app.get('io').to('admin:dashboard').emit('admin:metrics', {
        type: 'config_update',
        timestamp: new Date().toISOString()
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Failed to update system config' });
  }
});

// =================================================================
// 3) Users Management
// =================================================================

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { role, status, q, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('staffDetails.supervisor', 'name role'),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/admin/users
router.post('/users', async (req, res) => {
  try {
    const { name, email, phone, role, status, password, depotId, address, emergencyContact, dateOfBirth, gender } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }

    // Create user object
    const userData = {
      name,
      email,
      phone,
      role,
      status: status || 'active',
      emailVerified: true,
      phoneVerified: true
    };

    // Add password if provided, otherwise generate temporary one
    if (password) {
      userData.password = password;
    } else {
      userData.password = Math.random().toString(36).slice(-8);
    }

    // Add depotId if provided
    if (depotId) {
      userData.depotId = depotId;
    }

    // Add passenger details if role is passenger
    if (role === 'passenger') {
      userData.passengerDetails = {};
      if (address) userData.passengerDetails.address = address;
      if (emergencyContact) userData.passengerDetails.emergencyContact = emergencyContact;
      if (dateOfBirth) userData.passengerDetails.dateOfBirth = dateOfBirth;
      if (gender) userData.passengerDetails.gender = gender;
    }

    // Create user
    const user = new User(userData);
    await user.save();
    const userObj = user.toObject();

    

    res.status(201).json({
      message: 'User created successfully',
      user: userObj,
      temporaryPassword: user.password
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role, status, reason, depotId, address, emergencyContact, dateOfBirth, gender } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const before = user.toObject();

    // Handle role change with reason
    if (role && role !== user.role) {
      if (!reason) {
        return res.status(400).json({ error: 'Reason required for role change' });
      }

      user.roleHistory.push({
        from: user.role,
        to: role,
        by: req.user._id,
        reason
      });
    }

    // Update basic fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;
    if (depotId !== undefined) user.depotId = depotId;

    // Update passenger details if role is passenger
    if (role === 'passenger' || user.role === 'passenger') {
      if (!user.passengerDetails) user.passengerDetails = {};
      if (address !== undefined) user.passengerDetails.address = address;
      if (emergencyContact !== undefined) user.passengerDetails.emergencyContact = emergencyContact;
      if (dateOfBirth !== undefined) user.passengerDetails.dateOfBirth = dateOfBirth;
      if (gender !== undefined) user.passengerDetails.gender = gender;
    }

    await user.save();
    const after = user.toObject();



    res.json({
      message: 'User updated successfully',
      user: after
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const before = user.toObject();
    
    // Generate new password
    const newPassword = Math.random().toString(36).slice(-8);
    user.password = newPassword;
    user.loginAttempts = 0;
    
    await user.save();
    const after = user.toObject();



    res.json({
      message: 'Password reset successfully',
      newPassword
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /api/admin/users/:id/force-logout
router.post('/users/:id/force-logout', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Note: This would require JWT to include jti (JWT ID) for blacklisting
    // For now, we'll just log the action


    res.json({ message: 'Force logout logged successfully' });
  } catch (error) {
    console.error('Force logout error:', error);
    res.status(500).json({ error: 'Failed to process force logout' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user.role === 'admin' && req.user._id === id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    // Prevent deletion of the last admin user
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    const before = user.toObject();

    // Delete the user
    await User.findByIdAndDelete(id);



    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// =================================================================
// 4) Depot Management
// =================================================================

// POST /api/admin/depots
router.post('/depots', async (req, res) => {
  try {
    const { code, name, address, contact, manager, capacity, facilities, operatingHours } = req.body;

    console.log('📝 POST /api/admin/depots - Create request received');
    console.log('📦 Request data:', req.body);

    // Basic validation
    if (!code || !name) {
      return res.status(400).json({ error: 'Missing required fields: code and name are required' });
    }

    // Check if depot code already exists
    const existingDepot = await Depot.findOne({ code: code.toUpperCase() });
    if (existingDepot) {
      return res.status(400).json({ error: 'Depot code already exists' });
    }

    const depot = new Depot({
      code: code.toUpperCase(),
      name,
      address,
      contact,
      manager,
      capacity,
      facilities,
      operatingHours
    });

    console.log('🏗️ Creating depot with data:', depot);

    await depot.save();
    const depotObj = depot.toObject();



    console.log('✅ Depot created successfully');
    res.status(201).json({
      message: 'Depot created successfully',
      depot: depotObj
    });
  } catch (error) {
    console.error('❌ Depot creation error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    // Handle custom validation errors from pre-save middleware
    if (error.message && error.message.includes('Missing required fields')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message && error.message.includes('Invalid phone number format')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message && error.message.includes('Invalid pincode format')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to create depot' });
  }
});

// GET /api/admin/depots
router.get('/depots', async (req, res) => {
  try {
    console.log('🔍 GET /api/admin/depots - Request received');
    console.log('👤 User from request:', req.user);
    console.log('🔑 User role:', req.user?.role);
    
    console.log('🔍 Fetching depots from database...');
    
    // Check if user wants to see all depots (including inactive)
    const { showAll } = req.query;
    const query = showAll === 'true' ? {} : { status: 'active' };
    
    const depots = await Depot.find(query)
      .populate('manager', 'name email role')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${depots.length} depots (${showAll === 'true' ? 'all' : 'active only'})`);
    console.log('📦 Depots data:', depots);
    
    res.json({ depots });
  } catch (error) {
    console.error('❌ Depots fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch depots' });
  }
});

// GET /api/admin/depots/:id
router.get('/depots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 GET /api/admin/depots/:id - Request received for ID:', id);
    
    const depot = await Depot.findById(id)
      .populate('manager', 'name email role');
    
    if (!depot) {
      return res.status(404).json({ error: 'Depot not found' });
    }

    console.log('✅ Depot found:', depot);
    res.json({ depot });
  } catch (error) {
    console.error('❌ Depot fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch depot' });
  }
});

// PUT /api/admin/depots/:id
router.put('/depots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('🔄 PUT /api/admin/depots/:id - Update request for ID:', id);
    console.log('📝 Update data:', updateData);

    const depot = await Depot.findById(id);
    if (!depot) {
      return res.status(404).json({ error: 'Depot not found' });
    }

    const before = depot.toObject();

    // Update depot
    Object.assign(depot, updateData);
    await depot.save();
    const after = depot.toObject();



    console.log('✅ Depot updated successfully');
    res.json({
      message: 'Depot updated successfully',
      depot: after
    });
  } catch (error) {
    console.error('❌ Depot update error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    res.status(500).json({ error: 'Failed to update depot' });
  }
});

// DELETE /api/admin/depots/:id (soft delete)
router.delete('/depots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ DELETE /api/admin/depots/:id - Delete request for ID:', id);
    
    const depot = await Depot.findById(id);
    
    if (!depot) {
      return res.status(404).json({ error: 'Depot not found' });
    }

    const before = depot.toObject();
    
    // Soft delete - change status to inactive
    depot.status = 'inactive';
    await depot.save();
    const after = depot.toObject();



    console.log('✅ Depot soft deleted successfully');
    res.json({
      message: 'Depot deactivated successfully',
      depot: after
    });
  } catch (error) {
    console.error('❌ Depot delete error:', error);
    res.status(500).json({ error: 'Failed to delete depot' });
  }
});

// =================================================================
// 5) Global Route/Stop/Trip CRUD
// =================================================================

// Routes
router.get('/routes', async (req, res) => {
  try {
    const routes = await Route.find().populate('depot', 'name code').sort({ createdAt: -1 });
    res.json(routes);
  } catch (error) {
    console.error('Routes fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

router.post('/routes', async (req, res) => {
  try {
    const route = new Route(req.body);
    await route.save();
    

    
    res.status(201).json({ message: 'Route created successfully', route });
  } catch (error) {
    console.error('Route creation error:', error);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

// Stops
router.get('/stops', async (req, res) => {
  try {
    const stops = await Stop.find().sort({ createdAt: -1 });
    res.json(stops);
  } catch (error) {
    console.error('Stops fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stops' });
  }
});

router.post('/stops', async (req, res) => {
  try {
    const stop = new Stop(req.body);
    await stop.save();
    

    
    res.status(201).json({ message: 'Stop created successfully', stop });
  } catch (error) {
    console.error('Stop creation error:', error);
    res.status(500).json({ error: 'Failed to create stop' });
  }
});

// Trips
router.get('/trips', async (req, res) => {
  try {
    const { dateFrom, dateTo, route, depot, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (dateFrom || dateTo) {
      query.serviceDate = {};
      if (dateFrom) query.serviceDate.$gte = new Date(dateFrom);
      if (dateTo) query.serviceDate.$lte = new Date(dateTo);
    }
    if (route) query.routeId = route;
    if (depot) query.depotId = depot;
    if (status) query.status = status;

    const [trips, total] = await Promise.all([
      Trip.find(query)
        .populate('routeId', 'name code')
        .populate('depotId', 'name code')
        .populate('busId', 'number plate')
        .sort({ serviceDate: -1, startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Trip.countDocuments(query)
    ]);

    res.json({
      trips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Trips fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

router.post('/trips', async (req, res) => {
  try {
    const trip = new Trip(req.body);
    await trip.save();
    

    
    res.status(201).json({ message: 'Trip created successfully', trip });
  } catch (error) {
    console.error('Trip creation error:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// Assign crew to trip
router.put('/trips/:id/assign-crew', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, conductorId } = req.body;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const before = trip.toObject();

    // Update trip with crew
    trip.driverId = driverId;
    trip.conductorId = conductorId;

    // Create or update duty
    let duty = await Duty.findOne({ tripId: id });
    if (!duty) {
      duty = new Duty({
        tripId: id,
        conductorId,
        driverId,
        date: trip.serviceDate,
        status: 'open'
      });
    } else {
      duty.conductorId = conductorId;
      duty.driverId = driverId;
      duty.status = 'open';
    }

    await Promise.all([trip.save(), duty.save()]);
    const after = trip.toObject();



    res.json({
      message: 'Crew assigned successfully',
      trip: after,
      duty
    });
  } catch (error) {
    console.error('Crew assignment error:', error);
    res.status(500).json({ error: 'Failed to assign crew' });
  }
});

// =================================================================
// 6) Conductor Control
// =================================================================

// GET /api/admin/duties
router.get('/duties', async (req, res) => {
  try {
    const { date, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(queryDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.date = { $gte: queryDate, $lt: nextDate };
    }
    if (status) query.status = status;

    const [duties, total] = await Promise.all([
      Duty.find(query)
        .populate('tripId', 'routeId serviceDate startTime')
        .populate('conductorId', 'name phone')
        .populate('driverId', 'name phone')
        .populate('tripId.routeId', 'name code')
        .sort({ date: -1, 'tripId.startTime': -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Duty.countDocuments(query)
    ]);

    res.json({
      duties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Duties fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch duties' });
  }
});

// Force close duty
router.post('/duties/:id/close-force', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason required for force close' });
    }

    const duty = await Duty.findById(id);
    if (!duty) {
      return res.status(404).json({ error: 'Duty not found' });
    }

    const before = duty.toObject();
    duty.status = 'force_closed';
    duty.forceClosedBy = req.user._id;
    duty.forceClosedAt = new Date();
    duty.forceCloseReason = reason;

    await duty.save();
    const after = duty.toObject();



    res.json({
      message: 'Duty force closed successfully',
      duty: after
    });
  } catch (error) {
    console.error('Duty force close error:', error);
    res.status(500).json({ error: 'Failed to force close duty' });
  }
});

// =================================================================
// 7) Driver Control
// =================================================================

// GET /api/admin/driver-trips
router.get('/driver-trips', async (req, res) => {
  try {
    const { date, driverId } = req.query;

    const query = {};
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(queryDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.serviceDate = { $gte: queryDate, $lt: nextDate };
    }
    if (driverId) query.driverId = driverId;

    const trips = await Trip.find(query)
      .populate('driverId', 'name phone')
      .populate('routeId', 'name code')
      .populate('depotId', 'name code')
      .sort({ serviceDate: -1, startTime: -1 });

    res.json(trips);
  } catch (error) {
    console.error('Driver trips fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch driver trips' });
  }
});

// =================================================================
// 8) Passenger Control
// =================================================================

// GET /api/admin/passengers
router.get('/passengers', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { role: 'passenger' };
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ];
    }

    const [passengers, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      passengers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Passengers fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch passengers' });
  }
});

// GET /api/admin/passengers/:id/bookings
router.get('/passengers/:id/bookings', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find({ userId: id })
        .populate('tripId', 'routeId serviceDate startTime')
        .populate('tripId.routeId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments({ userId: id })
    ]);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Passenger bookings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch passenger bookings' });
  }
});



// =================================================================
// 10) Conductor & Driver Management
// =================================================================

// GET /api/admin/conductors
router.get('/conductors', async (req, res) => {
  try {
    const { depot, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { role: 'conductor' };
    if (depot && depot !== 'all') query.depotId = depot;
    if (status && status !== 'all') query.status = status;

    const [conductors, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('depotId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      conductors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Conductors fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch conductors' });
  }
});

// GET /api/admin/drivers
router.get('/drivers', async (req, res) => {
  try {
    const { depot, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { role: 'driver' };
    if (depot && depot !== 'all') query.depotId = depot;
    if (status && status !== 'all') query.status = status;

    const [drivers, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('depotId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      drivers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Drivers fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

module.exports = router;
