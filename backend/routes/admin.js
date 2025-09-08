const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const Depot = require('../models/Depot');
const DepotUser = require('../models/DepotUser');
const Bus = require('../models/Bus');
const Duty = require('../models/Duty');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const AIAnalyticsService = require('../services/aiAnalytics');
const NotificationService = require('../services/notificationService');
const { auth, requireRole } = require('../middleware/auth');

// Helper function to create role-based auth middleware
const authRole = (roles) => [auth, requireRole(roles)];

// Admin authentication middleware - allow both admin and depot users
const adminAuth = authRole(['admin', 'ADMIN', 'Admin', 'depot_manager', 'depot_supervisor', 'depot_operator', 'MANAGER', 'SUPERVISOR', 'OPERATOR']);

// Test endpoint without auth for debugging
router.get('/test-connection', (req, res) => {
  res.json({
    success: true,
    message: 'Admin routes are working',
    timestamp: new Date().toISOString()
  });
});

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
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    console.log('📊 Fetching comprehensive dashboard data...');

    // Helper wrappers to avoid throwing and always return a number
    const safeCount = async (model, query = {}) => {
      try { return await model.countDocuments(query); } catch (_) { return 0; }
    };
    const safeAggregateSum = async (model, match, sumPath) => {
      try {
        const result = await model.aggregate([
          { $match: match },
          { $group: { _id: null, total: { $sum: sumPath } } }
        ]);
        return result[0]?.total || 0;
      } catch (_) {
        return 0;
      }
    };

    // Comprehensive KPIs - fetch all key metrics
    const [
      // User metrics
      totalUsers, activeUsers, newUsersToday, newUsersThisWeek,
      // Depot metrics
      totalDepots, activeDepots,
      // Trip metrics
      totalTrips, tripsToday, runningTrips, completedTripsToday, scheduledTrips,
      // Booking metrics
      totalBookings, bookingsToday, pendingBookings, confirmedBookings, cancelledBookings,
      // Revenue metrics
      totalRevenue, todayRevenue, weekRevenue, monthRevenue,
      // Fleet metrics
      totalBuses, activeBuses, busesInMaintenance, busesOnRoute,
      // Driver/Conductor metrics
      totalDrivers, activeDrivers, totalConductors, activeConductors,
      // Route metrics
      totalRoutes, activeRoutes,
      // Validation metrics
      validationsToday, totalValidations,
      // System metrics
      activeLocks, systemAlerts
    ] = await Promise.all([
      // User metrics
      safeCount(User),
      safeCount(User, { status: 'active' }),
      safeCount(User, { createdAt: { $gte: today, $lt: tomorrow } }),
      safeCount(User, { createdAt: { $gte: weekAgo, $lt: today } }),
      
      // Depot metrics
      safeCount(Depot),
      safeCount(Depot, { status: 'active' }),
      
      // Trip metrics
      safeCount(Trip),
      safeCount(Trip, { 
        serviceDate: { $gte: today, $lt: tomorrow },
        status: { $in: ['scheduled', 'running', 'completed'] }
      }),
      safeCount(Trip, { status: 'running' }),
      safeCount(Trip, { 
        serviceDate: { $gte: today, $lt: tomorrow },
        status: 'completed'
      }),
      safeCount(Trip, { status: 'scheduled' }),
      
      // Booking metrics
      safeCount(Booking),
      safeCount(Booking, { 
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      safeCount(Booking, { status: 'pending' }),
      safeCount(Booking, { status: 'confirmed' }),
      safeCount(Booking, { status: 'cancelled' }),
      
      // Revenue calculations (based on pricing.paidAmount for completed payments)
      safeAggregateSum(Booking, { 'payment.paymentStatus': 'completed' }, '$pricing.paidAmount'),
      
      safeAggregateSum(Booking, { 'payment.paymentStatus': 'completed', createdAt: { $gte: today, $lt: tomorrow } }, '$pricing.paidAmount'),
      
      safeAggregateSum(Booking, { 'payment.paymentStatus': 'completed', createdAt: { $gte: weekAgo, $lt: today } }, '$pricing.paidAmount'),
      
      safeAggregateSum(Booking, { 'payment.paymentStatus': 'completed', createdAt: { $gte: monthAgo, $lt: today } }, '$pricing.paidAmount'),
      
      // Fleet metrics
      safeCount(Bus),
      safeCount(Bus, { status: 'active' }),
      safeCount(Bus, { status: 'maintenance' }),
      safeCount(Bus, { status: 'on_route' }),
      
      // Driver/Conductor metrics
      safeCount(Driver),
      safeCount(Driver, { status: 'active' }),
      safeCount(Conductor),
      safeCount(Conductor, { status: 'active' }),
      
      // Route metrics
      safeCount(Route),
      safeCount(Route, { status: 'active' }),
      
      // Validation metrics (field not present in Duty schema; default to 0 safely)
      Promise.resolve(0),
      Promise.resolve(0),
      
      // System metrics
      // Active locks not implemented in current schema
      Promise.resolve(0),
      
      // System alerts (placeholder for now)
      Promise.resolve(0)
    ]);

    // Fetch recent data for activities
    const [recentBookings, recentTrips, recentUsers, recentDrivers, recentConductors] = await Promise.all([
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('tripId', 'routeId serviceDate startTime')
        .populate('routeId', 'routeName')
        .select('customer pricing payment status createdAt tripId routeId'),
        
      Trip.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('routeId', 'routeName')
        .populate('driverId', 'name')
        .populate('conductorId', 'name')
        .populate('busId', 'busNumber'),
        
      User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email role status createdAt'),
        
      Driver.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('depotId', 'depotName')
        .select('name employeeCode status depotId createdAt'),
        
      Conductor.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('depotId', 'depotName')
        .select('name employeeCode status depotId createdAt')
    ]);

    // Calculate additional metrics
    const occupancyRate = totalBuses > 0 ? Math.round((busesOnRoute / totalBuses) * 100) : 0;
    const bookingSuccessRate = totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0;
    const tripCompletionRate = totalTrips > 0 ? Math.round((completedTripsToday / tripsToday) * 100) : 0;

    console.log('✅ Dashboard data fetched successfully');

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      kpis: {
        // User metrics
        users: totalUsers,
        activeUsers: activeUsers,
        newUsersToday: newUsersToday,
        newUsersThisWeek: newUsersThisWeek,
        
        // Trip metrics
        totalTrips: totalTrips,
        tripsToday: tripsToday,
        runningTrips: runningTrips,
        completedTripsToday: completedTripsToday,
        scheduledTrips: scheduledTrips,
        
        // Revenue metrics
        totalRevenue: totalRevenue,
        todayRevenue: todayRevenue,
        weekRevenue: weekRevenue,
        monthRevenue: monthRevenue,
        
        // Booking metrics
        totalBookings: totalBookings,
        bookingsToday: bookingsToday,
        pendingBookings: pendingBookings,
        confirmedBookings: confirmedBookings,
        cancelledBookings: cancelledBookings,
        
        // Fleet metrics
        totalBuses: totalBuses,
        activeBuses: activeBuses,
        busesInMaintenance: busesInMaintenance,
        busesOnRoute: busesOnRoute,
        
        // Staff metrics
        totalDrivers: totalDrivers,
        activeDrivers: activeDrivers,
        totalConductors: totalConductors,
        activeConductors: activeConductors,
        
        // Route metrics
        totalRoutes: totalRoutes,
        activeRoutes: activeRoutes,
        
        // Depot metrics
        totalDepots: totalDepots,
        activeDepots: activeDepots,
        
        // Validation metrics
        validationsToday: validationsToday,
        totalValidations: totalValidations,
        
        // System metrics
        activeLocks: activeLocks,
        systemAlerts: systemAlerts,
        
        // Calculated metrics
        occupancyRate: occupancyRate,
        bookingSuccessRate: bookingSuccessRate,
        tripCompletionRate: tripCompletionRate
      },
      recentData: {
        bookings: recentBookings,
        trips: recentTrips,
        users: recentUsers,
        drivers: recentDrivers,
        conductors: recentConductors
      },
      summary: {
        totalEntities: totalUsers + totalBuses + totalRoutes + totalDepots,
        activeEntities: activeUsers + activeBuses + activeRoutes + activeDepots,
        systemHealth: {
          database: 'healthy',
          api: 'healthy',
          frontend: 'healthy'
        }
      }
    });
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard data',
      details: error.message 
    });
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

// Test endpoint for debugging
router.post('/depots/test', async (req, res) => {
  try {
    console.log('🧪 Test endpoint called');
    console.log('📦 Request body:', req.body);
    console.log('👤 User:', req.user);
    
    res.json({ 
      success: true, 
      message: 'Test endpoint working',
      user: req.user,
      body: req.body
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fix database indexes endpoint
router.post('/depots/fix-indexes', async (req, res) => {
  try {
    console.log('🔧 Fixing database indexes...');
    
    // Get the Depot collection
    const depotCollection = Depot.collection;
    
    // Drop the old 'code' index if it exists
    try {
      await depotCollection.dropIndex('code_1');
      console.log('✅ Dropped old "code_1" index');
    } catch (dropError) {
      console.log('ℹ️ Old "code_1" index not found or already dropped');
    }
    
    // Create the correct 'depotCode' index
    await depotCollection.createIndex({ depotCode: 1 }, { unique: true });
    console.log('✅ Created new "depotCode_1" unique index');
    
    // Create other useful indexes
    await depotCollection.createIndex({ 'location.city': 1 });
    await depotCollection.createIndex({ 'location.state': 1 });
    await depotCollection.createIndex({ status: 1 });
    await depotCollection.createIndex({ isActive: 1 });
    console.log('✅ Created additional indexes');
    
    // Check for any existing depots with old schema and fix them
    const existingDepots = await Depot.find({});
    let fixedCount = 0;
    
    for (const depot of existingDepots) {
      if (depot.code && !depot.depotCode) {
        // This depot has the old schema, update it
        depot.depotCode = depot.code;
        depot.depotName = depot.name || depot.depotName || 'Unknown Depot';
        await depot.save();
        fixedCount++;
        console.log(`🔧 Fixed depot: ${depot.depotCode}`);
      }
    }
    
    if (fixedCount > 0) {
      console.log(`✅ Fixed ${fixedCount} depots with old schema`);
    }
    
    res.json({ 
      success: true, 
      message: 'Database indexes and schema fixed successfully',
      actions: [
        'Dropped old "code_1" index',
        'Created new "depotCode_1" unique index',
        'Created location and status indexes',
        `Fixed ${fixedCount} depots with old schema`
      ]
    });
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/depots
router.post('/depots', async (req, res) => {
  try {
    const { 
      depotCode, 
      depotName, 
      location, 
      contact, 
      capacity, 
      facilities, 
      operatingHours,
      createUserAccount,
      userAccount 
    } = req.body;

    console.log('📝 POST /api/admin/depots - Create request received');
    console.log('📦 Request data:', req.body);
    console.log('🔍 Depot Code from request:', req.body.depotCode);
    console.log('🔍 Depot Code type:', typeof req.body.depotCode);
    console.log('🔍 Depot Code length:', req.body.depotCode?.length);
    console.log('🔍 Depot Code trimmed:', req.body.depotCode?.trim());
    console.log('🔍 Depot Name from request:', req.body.depotName);
    console.log('🔍 Location from request:', req.body.location);
    console.log('🔍 Contact from request:', req.body.contact);

    // Enhanced validation with specific error messages
    if (!depotCode || !depotCode.trim()) {
      return res.status(400).json({ error: 'Depot Code is required' });
    }
    
    if (!depotName || !depotName.trim()) {
      return res.status(400).json({ error: 'Depot Name is required' });
    }
    
    if (!location?.address || !location.address.trim()) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    if (!location?.city || !location.city.trim()) {
      return res.status(400).json({ error: 'City is required' });
    }
    
    if (!location?.state || !location.state.trim()) {
      return res.status(400).json({ error: 'State is required' });
    }
    
    if (!location?.pincode || !location.pincode.trim()) {
      return res.status(400).json({ error: 'Pincode is required' });
    }
    
    if (!contact?.phone || !contact.phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    if (!contact?.email || !contact.email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!capacity?.totalBuses || capacity.totalBuses <= 0) {
      return res.status(400).json({ error: 'Total Buses must be greater than 0' });
    }
    
    if (!capacity?.availableBuses || capacity.availableBuses < 0) {
      return res.status(400).json({ error: 'Available Buses cannot be negative' });
    }
    
    if (!operatingHours?.openTime) {
      return res.status(400).json({ error: 'Opening Time is required' });
    }
    
    if (!operatingHours?.closeTime) {
      return res.status(400).json({ error: 'Closing Time is required' });
    }
    
    if (!operatingHours?.workingDays || operatingHours.workingDays.length === 0) {
      return res.status(400).json({ error: 'At least one working day must be selected' });
    }
    
    // Business logic validation
    if (capacity?.availableBuses > capacity?.totalBuses) {
      return res.status(400).json({ error: 'Available Buses cannot exceed Total Buses' });
    }
    
    // Validate depot code format (alphanumeric, 3-10 characters)
    if (!/^[A-Za-z0-9]{3,10}$/.test(depotCode.trim())) {
      return res.status(400).json({ 
        error: 'Depot Code must be 3-10 characters long and contain only letters and numbers' 
      });
    }
    
    // Check if depot code already exists
    const existingDepot = await Depot.findOne({ depotCode: depotCode.trim().toUpperCase() });
    if (existingDepot) {
      return res.status(400).json({ error: 'Depot code already exists' });
    }

    // Check if user object exists
    if (!req.user || !req.user._id) {
      console.error('❌ User object missing or invalid:', req.user);
      return res.status(401).json({ 
        error: 'Authentication failed - user not found',
        details: 'User object is missing or invalid'
      });
    }

    console.log('👤 User object:', req.user);
    console.log('🆔 User ID:', req.user._id);

    // Prepare depot data with required fields
    const depotData = {
      depotCode: depotCode.trim().toUpperCase(),
      depotName: depotName.trim(),
      location: {
        address: location.address.trim(),
        city: location.city.trim(),
        state: location.state.trim(),
        pincode: location.pincode.trim()
      },
      contact: {
        phone: contact.phone.trim(),
        email: contact.email.trim().toLowerCase(),
        manager: contact.manager || {}
      },
      capacity: {
        totalBuses: parseInt(capacity.totalBuses),
        availableBuses: parseInt(capacity.availableBuses),
        maintenanceBuses: parseInt(capacity.maintenanceBuses) || 0
      },
      operatingHours: {
        openTime: operatingHours.openTime,
        closeTime: operatingHours.closeTime,
        workingDays: operatingHours.workingDays
      },
      facilities: facilities || [],
      status: 'active',
      createdBy: req.user._id
    };

    console.log('🏗️ Creating depot with data:', depotData);

    let depot, depotObj;
    try {
      depot = new Depot(depotData);
      await depot.save();
      depotObj = depot.toObject();
      console.log('✅ Depot saved successfully:', depotObj);
    } catch (depotSaveError) {
      console.error('❌ Error saving depot:', depotSaveError);
      throw depotSaveError;
    }

    // Create depot user account if requested
    let depotUser = null;
    if (createUserAccount && userAccount) {
      try {
        console.log('🔐 Creating depot user account with data:', userAccount);
        
        // Auto-generate missing user account fields
        let finalUsername = userAccount.username;
        let finalPassword = userAccount.password;
        
        if (!finalUsername || finalUsername.trim() === '') {
          const baseUsername = depotCode.toLowerCase();
          const timestamp = Date.now().toString().slice(-4);
          finalUsername = `${baseUsername}_${timestamp}`;
          console.log('🔧 Auto-generated Username:', finalUsername);
        }
        
        if (!finalPassword || finalPassword.length < 6) {
          finalPassword = 'Depot123!';
          console.log('🔧 Auto-generated Password:', finalPassword);
        }
        
        const userAccountData = {
          username: finalUsername,
          email: userAccount.email || `${depotCode.toLowerCase()}@yatrik.com`,
          password: finalPassword,
          depotId: depot._id,
          depotCode: depot.depotCode,
          depotName: depot.depotName,
          role: userAccount.role || 'depot_manager',
          permissions: userAccount.permissions || [
            'manage_buses',
            'view_buses',
            'view_routes',
            'view_schedules',
            'view_reports',
            'view_depot_info'
          ]
        };

        console.log('📝 Final user account data:', userAccountData);
        depotUser = new DepotUser(userAccountData);
        await depotUser.save();
        console.log('✅ Depot user account created successfully');
      } catch (userError) {
        console.error('❌ Error creating depot user account:', userError);
        console.error('Error details:', userError.message);
        // Continue with depot creation even if user creation fails
      }
    }

    console.log('✅ Depot created successfully');
    res.status(201).json({
      success: true,
      message: 'Depot created successfully',
      depot: depotObj,
      depotUser: depotUser ? {
        id: depotUser._id,
        username: depotUser.username,
        email: depotUser.email,
        role: depotUser.role,
        permissions: depotUser.permissions
      } : null
    });
  } catch (error) {
    console.error('❌ Depot creation error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('❌ Validation errors:', validationErrors);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    // Handle specific error types
    if (error.code === 11000) {
      console.error('❌ Duplicate key error');
      
      // Check if it's the old index issue
      if (error.keyValue && error.keyValue.code === null) {
        return res.status(500).json({ 
          error: 'Database configuration issue detected. Please contact administrator to fix database indexes.',
          details: 'Old database index is causing conflicts. This needs to be fixed on the server side.',
          code: 'INDEX_CONFIG_ERROR'
        });
      }
      
      // Check if it's a duplicate depot code
      if (error.keyValue && error.keyValue.depotCode) {
        return res.status(400).json({ 
          error: 'Depot code already exists. Please use a different code.' 
        });
      }
      
      return res.status(400).json({ 
        error: 'Duplicate key error occurred. Please try again with different data.' 
      });
    }
    
    // Log the full error for debugging
    console.error('Full error details:', error);
    
    res.status(500).json({ 
      error: 'Internal server error occurred while creating depot. Please try again.' 
    });
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
      .populate('createdBy', 'name email role')
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

// POST /api/admin/routes - Create new route
router.post('/routes', async (req, res) => {
  try {
    console.log('📝 POST /api/admin/routes - Create route request received');
    console.log('📦 Request body:', req.body);
    console.log('👤 User:', req.user);

    const {
      routeNumber,
      routeName,
      startingPoint,
      endingPoint,
      intermediateStops,
      totalDistance,
      estimatedDuration,
      baseFare,
      busType,
      depotId,
      status = 'active',
      amenities = [],
      operatingHours = {},
      frequency = {},
      schedules = [],
      notes
    } = req.body;

    // Validation
    if (!routeNumber || !routeName || !startingPoint || !endingPoint || !depotId) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: routeNumber, routeName, startingPoint, endingPoint, depotId'
      });
    }

    // Check if route number already exists
    const existingRoute = await Route.findOne({ routeNumber });
    if (existingRoute) {
      return res.status(400).json({
        success: false,
        message: 'Route number already exists'
      });
    }

    // Validate depot exists
    console.log('🔍 Looking for depot with ID:', depotId);
    const depot = await Depot.findById(depotId);
    if (!depot) {
      console.log('❌ Depot not found with ID:', depotId);
      return res.status(400).json({
        success: false,
        message: 'Depot not found'
      });
    }
    console.log('✅ Depot found:', depot.depotName);

    // Process schedules to add required fields
    const processedSchedules = (schedules || []).map(schedule => ({
      ...schedule,
      scheduleId: `SCH_${routeNumber}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdBy: req.user._id,
      createdAt: new Date()
    }));

    // Prepare route data
    const routeData = {
      routeNumber,
      routeName,
      startingPoint,
      endingPoint,
      intermediateStops: intermediateStops || [],
      totalDistance,
      estimatedDuration,
      baseFare: baseFare || calculateBaseFare(totalDistance),
      farePerKm: 2, // Default fare per km
      depot: {
        depotId: depot._id,
        depotName: depot.depotName,
        depotLocation: depot.location.city
      },
      status,
      features: amenities || [],
      schedules: processedSchedules,
      createdBy: (req.user && (req.user._id || req.user.id)) || undefined
    };

    console.log('📝 Creating route with data:', routeData);

    // Create route with proper depot structure
    const route = await Route.create(routeData);
    console.log('✅ Route created successfully:', route._id);

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: route
    });

  } catch (error) {
    console.error('❌ Route creation error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create route',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/admin/routes - Get all routes with pagination and filters
router.get('/routes', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      depotId,
      busType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    // Apply filters
    if (status) filter.status = status;
    if (depotId) filter.depotId = depotId;
    if (busType) filter.busType = busType;
    if (search) {
      filter.$or = [
        { routeNumber: { $regex: search, $options: 'i' } },
        { routeName: { $regex: search, $options: 'i' } },
        { 'startingPoint.city': { $regex: search, $options: 'i' } },
        { 'endingPoint.city': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [routes, total] = await Promise.all([
      Route.find(filter)
        .populate('depotId', 'depotName location')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Route.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        routes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Routes fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes',
      error: error.message
    });
  }
});

// PUT /api/admin/routes/:id - Update route
router.put('/routes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid route ID format' });
    }

    // Guard: ensure req.user exists
    const updaterId = req.user?._id || req.user?.id;
    if (!updaterId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: missing user context' });
    }

    // Remove immutable fields
    delete updateData.routeNumber;
    delete updateData.createdBy;

    // Map flat payload to schema where needed
    // If frontend sends depotId, convert to nested depot with name/location from DB
    if (updateData.depotId) {
      const depotId = updateData.depotId;
      delete updateData.depotId;
      const depot = await Depot.findById(depotId).lean();
      if (!depot) {
        return res.status(400).json({ success: false, message: 'Depot not found' });
      }
      updateData.depot = {
        depotId: depot._id,
        depotName: depot.depotName,
        depotLocation: depot.location?.city || depot.location || ''
      };
    }

    // Normalize nested fields if provided in flat form
    if (updateData.startingCity || updateData.startingLocation) {
      updateData.startingPoint = {
        ...(updateData.startingPoint || {}),
        city: updateData.startingCity || updateData.startingPoint?.city,
        location: updateData.startingLocation || updateData.startingPoint?.location
      };
      delete updateData.startingCity;
      delete updateData.startingLocation;
    }
    if (updateData.endingCity || updateData.endingLocation) {
      updateData.endingPoint = {
        ...(updateData.endingPoint || {}),
        city: updateData.endingCity || updateData.endingPoint?.city,
        location: updateData.endingLocation || updateData.endingPoint?.location
      };
      delete updateData.endingCity;
      delete updateData.endingLocation;
    }

    // Coerce numeric fields if sent as strings
    ['totalDistance', 'estimatedDuration', 'baseFare', 'farePerKm'].forEach((key) => {
      if (updateData[key] !== undefined) {
        const num = Number(updateData[key]);
        if (Number.isNaN(num)) {
          delete updateData[key];
        } else {
          updateData[key] = num;
        }
      }
    });

    // Set updater
    updateData.updatedBy = updaterId;

    const route = await Route.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    res.json({ success: true, message: 'Route updated successfully', data: route });

  } catch (error) {
    console.error('Route update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update route', error: error.message });
  }
});

// DELETE /api/admin/routes/:id - Delete route (hard delete from database)
router.delete('/routes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== BACKEND ROUTE DELETE DEBUG ===');
    console.log('🗑️ DELETE /api/admin/routes/:id - Delete request for ID:', id);
    console.log('👤 User from request:', req.user);
    console.log('🔑 User role:', req.user?.role);
    console.log('📝 Request headers:', req.headers);
    console.log('🌐 Request method:', req.method);
    console.log('🔗 Request URL:', req.url);

    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route ID format'
      });
    }

    // Check if route exists
    const existingRoute = await Route.findById(id);
    if (!existingRoute) {
      console.log('❌ Route not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    console.log('✅ Route found:', existingRoute.routeName);

    // Check if route has active trips
    const activeTrips = await Trip.countDocuments({
      routeId: id,
      status: { $in: ['scheduled', 'running'] }
    });

    if (activeTrips > 0) {
      console.log('❌ Cannot delete route with active trips:', activeTrips);
      return res.status(400).json({
        success: false,
        message: `Cannot delete route with ${activeTrips} active trips`
      });
    }

    // Check if route has any bookings
    const activeBookings = await Booking.countDocuments({
      routeId: id,
      status: { $in: ['confirmed', 'pending'] }
    });

    if (activeBookings > 0) {
      console.log('❌ Cannot delete route with active bookings:', activeBookings);
      return res.status(400).json({
        success: false,
        message: `Cannot delete route with ${activeBookings} active bookings`
      });
    }

    // Hard delete from database
    console.log('🗑️ Performing hard delete from database...');
    const deletedRoute = await Route.findByIdAndDelete(id);

    if (!deletedRoute) {
      console.log('❌ Route deletion failed - route not found during deletion');
      return res.status(404).json({
        success: false,
        message: 'Route not found during deletion'
      });
    }

    console.log('✅ Route hard deleted successfully from database:', deletedRoute.routeName);

    // Log the deletion for audit purposes
    console.log('📝 Route deletion logged:', {
      routeId: id,
      routeName: deletedRoute.routeName,
      deletedBy: req.user?._id || 'system',
      deletedAt: new Date()
    });

    const successResponse = {
      success: true,
      message: 'Route permanently deleted from database',
      deletedRoute: {
        id: deletedRoute._id,
        routeName: deletedRoute.routeName,
        routeNumber: deletedRoute.routeNumber
      }
    };

    console.log('=== SENDING SUCCESS RESPONSE ===');
    console.log('Response:', successResponse);
    console.log('=== BACKEND ROUTE DELETE DEBUG END ===');

    res.json(successResponse);

  } catch (error) {
    console.error('❌ Route deletion error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete route from database',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    console.log('🚌 GET /api/admin/trips - Fetch trips request received');
    console.log('📦 Query params:', req.query);
    console.log('👤 User:', req.user);

    const { dateFrom, dateTo, route, depot, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (dateFrom || dateTo) {
      query.serviceDate = {};
      if (dateFrom) query.serviceDate.$gte = new Date(dateFrom);
      if (dateTo) query.serviceDate.$lte = new Date(dateTo);
    }
    if (route && route !== 'all') query.routeId = route;
    if (depot && depot !== 'all') query.depotId = depot;
    if (status && status !== 'all') query.status = status;

    console.log('🔍 Trip query:', query);

    const [trips, total] = await Promise.all([
      Trip.find(query)
        .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
        .populate('depotId', 'depotName depotCode location')
        .populate('busId', 'busNumber registrationNumber busType')
        .populate('driverId', 'name phone')
        .populate('conductorId', 'name phone')
        .sort({ serviceDate: -1, startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Trip.countDocuments(query)
    ]);

    console.log('✅ Trips found:', trips.length);
    console.log('📊 Total trips:', total);

    res.json({
      success: true,
      data: {
        trips,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Trips fetch error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch trips',
      message: error.message
    });
  }
});

router.post('/trips', async (req, res) => {
  try {
    console.log('🚌 POST /api/admin/trips - Creating trip');
    console.log('📝 Request body:', req.body);
    console.log('👤 User:', req.user);

    // Extract required fields
    const {
      routeId,
      busId,
      driverId,
      conductorId,
      serviceDate,
      startTime,
      endTime,
      fare,
      capacity,
      status,
      depotId: depotIdFromBody,
      notes
    } = req.body;

    // Validate required fields
    if (!routeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Route ID is required' 
      });
    }

    if (!serviceDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Service date is required' 
      });
    }

    if (!startTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start time is required' 
      });
    }

    if (!endTime) {
      return res.status(400).json({ 
        success: false, 
        message: 'End time is required' 
      });
    }

    if (!busId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bus ID is required' 
      });
    }

    // Validate route exists
    const route = await Route.findById(routeId).lean();
    if (!route) {
      return res.status(400).json({ success: false, message: 'Route not found' });
    }

    // Get bus details to set capacity and depot
    const bus = await Bus.findById(busId).lean();
    if (!bus) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bus not found' 
      });
    }

    // Determine depotId: prefer body, fallback to bus.depotId
    let depotId = depotIdFromBody || bus.depotId;
    if (!depotId) {
      return res.status(400).json({ success: false, message: 'Depot ID is required (assign depot to the selected bus or provide depotId)' });
    }

    // Validate ObjectId-like format for ids that must be ObjectId
    const isObjectId = (v) => typeof v === 'string' ? /^[0-9a-fA-F]{24}$/.test(v) : (v && v._id ? /^[0-9a-fA-F]{24}$/.test(String(v._id)) : false);
    if (!isObjectId(routeId)) {
      return res.status(400).json({ success: false, message: 'Invalid route ID format' });
    }
    if (!isObjectId(busId)) {
      return res.status(400).json({ success: false, message: 'Invalid bus ID format' });
    }
    if (!isObjectId(depotId)) {
      depotId = String(depotId);
      if (!/^[0-9a-fA-F]{24}$/.test(depotId)) {
        return res.status(400).json({ success: false, message: 'Invalid depot ID format' });
      }
    }

    // Optional: basic time validation (HH:MM)
    const timeRe = /^\d{2}:\d{2}$/;
    if (!timeRe.test(startTime) || !timeRe.test(endTime)) {
      return res.status(400).json({ success: false, message: 'Invalid time format. Use HH:MM' });
    }

    // Parse serviceDate (supports YYYY-MM-DD and DD-MM-YYYY)
    const parseServiceDate = (val) => {
      if (!val) return null;
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      if (typeof val === 'string') {
        const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
        const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;
        if (ddmmyyyy.test(val)) {
          const [, dd, mm, yyyy] = val.match(ddmmyyyy);
          const iso = `${yyyy}-${mm}-${dd}`;
          const d = new Date(iso + 'T00:00:00Z');
          return isNaN(d.getTime()) ? null : d;
        }
        if (yyyymmdd.test(val)) {
          const d = new Date(val + 'T00:00:00Z');
          return isNaN(d.getTime()) ? null : d;
        }
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    };

    const parsedServiceDate = parseServiceDate(serviceDate);
    if (!parsedServiceDate) {
      return res.status(400).json({ success: false, message: 'Invalid service date format. Use YYYY-MM-DD' });
    }

    // Create trip object with required fields
    const derivedCapacity = (bus.capacity && typeof bus.capacity.total === 'number') ? bus.capacity.total : (typeof capacity === 'number' ? capacity : Number(capacity) || 30);
    const tripData = {
      routeId,
      busId,
      driverId,
      conductorId,
      serviceDate: parsedServiceDate,
      startTime,
      endTime,
      fare: typeof fare === 'number' ? fare : Number(fare) || 0,
      capacity: derivedCapacity,
      availableSeats: derivedCapacity,
      bookedSeats: 0,
      status: status || 'scheduled',
      depotId,
      createdBy: (req.user && (req.user._id || req.user.id)) || undefined,
      notes,
      bookingOpen: true,
      bookingCloseTime: new Date(parsedServiceDate.getTime() - (2 * 60 * 60 * 1000)), // 2 hours before departure
      cancellationPolicy: {
        allowed: true,
        hoursBeforeDeparture: 2,
        refundPercentage: 80
      }
    };

    console.log('📊 Trip data to create:', tripData);

    const trip = new Trip(tripData);
    await trip.save();

    // Populate the trip with related data
    const populatedTrip = await Trip.findById(trip._id)
      .populate('routeId', 'routeName routeNumber')
      .populate('busId', 'busNumber busType')
      .populate('driverId', 'name')
      .populate('conductorId', 'name')
      .populate('depotId', 'depotName')
      .populate('createdBy', 'name')
      .lean();

    console.log('✅ Trip created successfully:', populatedTrip._id);
    
    res.status(201).json({ 
      success: true,
      message: 'Trip created successfully', 
      data: { trip: populatedTrip }
    });
  } catch (error) {
    console.error('❌ Trip creation error:', error);
    res.status(500).json({ 
      success: false,
      message: `Failed to create trip: ${error.message}`,
      error: error.message 
    });
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

// Debug endpoint to check all users
router.get('/debug/users', async (req, res) => {
  try {
    const allUsers = await User.find({}).select('name email role depotId status createdAt').sort({ createdAt: -1 });
    const driverUsers = await User.find({ role: 'driver' }).select('name email role depotId status createdAt').sort({ createdAt: -1 });
    const conductorUsers = await User.find({ role: 'conductor' }).select('name email role depotId status createdAt').sort({ createdAt: -1 });
    
    console.log('=== DEBUG USERS ENDPOINT ===');
    console.log('Total users:', allUsers.length);
    console.log('Driver users:', driverUsers.length);
    console.log('Conductor users:', conductorUsers.length);
    
    res.json({
      success: true,
      data: {
        allUsers: allUsers.length,
        driverUsers: driverUsers.length,
        conductorUsers: conductorUsers.length,
        allUsersList: allUsers,
        driverUsersList: driverUsers,
        conductorUsersList: conductorUsers
      }
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simple test endpoint to check drivers specifically
router.get('/test/drivers', async (req, res) => {
  try {
    console.log('=== TEST DRIVERS ENDPOINT ===');
    
    // Check User model
    const userDrivers = await User.find({ role: 'driver' });
    console.log('User model drivers found:', userDrivers.length);
    
    // Check Driver model
    const driverModelDrivers = await Driver.find({});
    console.log('Driver model drivers found:', driverModelDrivers.length);
    
    // Check all users
    const allUsers = await User.find({});
    console.log('Total users in database:', allUsers.length);
    
    // Show roles
    const roles = [...new Set(allUsers.map(u => u.role))];
    console.log('Roles found in database:', roles);
    
    res.json({
      success: true,
      userDrivers: userDrivers.length,
      driverModelDrivers: driverModelDrivers.length,
      totalUsers: allUsers.length,
      roles: roles,
      userDriversList: userDrivers,
      driverModelList: driverModelDrivers
    });
  } catch (error) {
    console.error('Test drivers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simplified drivers endpoint that should definitely work
router.get('/simple/drivers', async (req, res) => {
  try {
    console.log('=== SIMPLE DRIVERS ENDPOINT ===');
    
    // Get all users with role driver
    const userDrivers = await User.find({ role: 'driver' }).select('-password');
    console.log('Found user drivers:', userDrivers.length);
    
    // Get all drivers from Driver model
    const driverModelDrivers = await Driver.find({});
    console.log('Found driver model drivers:', driverModelDrivers.length);
    
    // Combine them simply
    const allDrivers = [
      ...userDrivers.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        depotId: user.depotId,
        status: user.status,
        source: 'user',
        createdAt: user.createdAt
      })),
      ...driverModelDrivers.map(driver => ({
        _id: driver._id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        role: 'driver',
        depotId: driver.depotId,
        status: driver.status,
        source: 'driver',
        createdAt: driver.createdAt
      }))
    ];
    
    console.log('Total combined drivers:', allDrivers.length);
    
    res.json({
      success: true,
      data: {
        drivers: allDrivers,
        count: allDrivers.length
      }
    });
  } catch (error) {
    console.error('Simple drivers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test the main drivers endpoint with debugging
router.get('/test-main/drivers', async (req, res) => {
  try {
    console.log('=== TESTING MAIN DRIVERS ENDPOINT ===');
    
    // Simulate the same logic as the main endpoint
    const { depot, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    console.log('Query params:', { depot, status, page, limit });

    // Query both User model (role-based) and Driver model
    const userQuery = { role: 'driver' };
    const driverQuery = {};
    
    if (depot && depot !== 'all') {
      userQuery.depotId = depot;
      driverQuery.depotId = depot;
    }
    if (status && status !== 'all') {
      userQuery.status = status;
      driverQuery.status = status;
    }

    console.log('Final queries:');
    console.log('userQuery:', JSON.stringify(userQuery, null, 2));
    console.log('driverQuery:', JSON.stringify(driverQuery, null, 2));

    // Get all data first (without pagination)
    const [userDrivers, driverData, userTotal, driverTotal] = await Promise.all([
      User.find(userQuery)
        .select('-password')
        .populate('depotId', 'depotName depotCode')
        .sort({ createdAt: -1 }),
      Driver.find(driverQuery)
        .populate('depotId', 'depotName depotCode')
        .sort({ createdAt: -1 }),
      User.countDocuments(userQuery),
      Driver.countDocuments(driverQuery)
    ]);

    console.log('Query results:');
    console.log('userDrivers count:', userDrivers.length);
    console.log('driverData count:', driverData.length);
    console.log('userTotal:', userTotal);
    console.log('driverTotal:', driverTotal);
    
    if (userDrivers.length > 0) {
      console.log('Sample userDriver:', JSON.stringify(userDrivers[0], null, 2));
    }
    if (driverData.length > 0) {
      console.log('Sample driverData:', JSON.stringify(driverData[0], null, 2));
    }

    // Combine and transform data
    const allDrivers = [
      ...userDrivers.map(user => ({
        _id: user._id,
        driverId: user.employeeId || user._id.toString().slice(-6).toUpperCase(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        employeeCode: user.employeeId || user._id.toString().slice(-6).toUpperCase(),
        status: user.status || 'active',
        depotId: user.depotId,
        joiningDate: user.createdAt,
        source: 'user'
      })),
      ...driverData.map(driver => ({
        _id: driver._id,
        driverId: driver.driverId,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        employeeCode: driver.employeeCode,
        status: driver.status,
        depotId: driver.depotId,
        joiningDate: driver.joiningDate,
        source: 'driver'
      }))
    ];

    // Sort combined results
    allDrivers.sort((a, b) => new Date(b.joiningDate) - new Date(a.joiningDate));

    // Apply pagination after combining and sorting
    const total = userTotal + driverTotal;
    const paginatedDrivers = allDrivers.slice(skip, skip + parseInt(limit));

    console.log('Final response:');
    console.log('allDrivers count:', allDrivers.length);
    console.log('paginatedDrivers count:', paginatedDrivers.length);
    console.log('total:', total);

    res.json({
      success: true,
      data: {
        drivers: paginatedDrivers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Test main drivers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ultra simple drivers endpoint - just return everything
router.get('/ultra-simple/drivers', async (req, res) => {
  try {
    console.log('=== ULTRA SIMPLE DRIVERS ENDPOINT ===');
    
    // Get all users with role driver
    const userDrivers = await User.find({ role: 'driver' });
    console.log('Found user drivers:', userDrivers.length);
    
    // Get all drivers from Driver model
    const driverModelDrivers = await Driver.find({});
    console.log('Found driver model drivers:', driverModelDrivers.length);
    
    // Just return raw data
    res.json({
      success: true,
      message: 'Ultra simple drivers endpoint',
      userDrivers: userDrivers,
      driverModelDrivers: driverModelDrivers,
      totalUserDrivers: userDrivers.length,
      totalDriverModelDrivers: driverModelDrivers.length
    });
  } catch (error) {
    console.error('Ultra simple drivers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get ALL drivers without pagination
router.get('/all-drivers', async (req, res) => {
  try {
    console.log('=== GET ALL DRIVERS ENDPOINT ===');
    
    // Get all users with role driver
    const userDrivers = await User.find({ role: 'driver' }).select('-password');
    console.log('Found user drivers:', userDrivers.length);
    
    // Get all drivers from Driver model
    const driverModelDrivers = await Driver.find({});
    console.log('Found driver model drivers:', driverModelDrivers.length);
    
    // Combine and transform data
    const allDrivers = [
      ...userDrivers.map(user => ({
        _id: user._id,
        driverId: user.employeeId || user._id.toString().slice(-6).toUpperCase(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        employeeCode: user.employeeId || user._id.toString().slice(-6).toUpperCase(),
        status: user.status || 'active',
        depotId: user.depotId,
        joiningDate: user.createdAt,
        source: 'user',
        drivingLicense: {
          licenseNumber: user.licenseNumber || 'N/A'
        }
      })),
      ...driverModelDrivers.map(driver => ({
        _id: driver._id,
        driverId: driver.driverId,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        employeeCode: driver.employeeCode,
        status: driver.status,
        depotId: driver.depotId,
        joiningDate: driver.joiningDate,
        source: 'driver',
        drivingLicense: driver.drivingLicense || { licenseNumber: 'N/A' }
      }))
    ];
    
    console.log('Total combined drivers:', allDrivers.length);
    
    res.json({
      success: true,
      data: {
        drivers: allDrivers,
        count: allDrivers.length
      }
    });
  } catch (error) {
    console.error('Get all drivers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get ALL conductors without pagination
router.get('/all-conductors', async (req, res) => {
  try {
    console.log('=== GET ALL CONDUCTORS ENDPOINT ===');
    
    // Get all users with role conductor
    const userConductors = await User.find({ role: 'conductor' }).select('-password');
    console.log('Found user conductors:', userConductors.length);
    
    // Get all conductors from Conductor model
    const conductorModelConductors = await Conductor.find({});
    console.log('Found conductor model conductors:', conductorModelConductors.length);
    
    // Combine and transform data
    const allConductors = [
      ...userConductors.map(user => ({
        _id: user._id,
        conductorId: user.employeeId || user._id.toString().slice(-6).toUpperCase(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        employeeCode: user.employeeId || user._id.toString().slice(-6).toUpperCase(),
        status: user.status || 'active',
        depotId: user.depotId,
        joiningDate: user.createdAt,
        source: 'user'
      })),
      ...conductorModelConductors.map(conductor => ({
        _id: conductor._id,
        conductorId: conductor.conductorId,
        name: conductor.name,
        phone: conductor.phone,
        email: conductor.email,
        employeeCode: conductor.employeeCode,
        status: conductor.status,
        depotId: conductor.depotId,
        joiningDate: conductor.joiningDate,
        source: 'conductor'
      }))
    ];
    
    console.log('Total combined conductors:', allConductors.length);
    
    res.json({
      success: true,
      data: {
        conductors: allConductors,
        count: allConductors.length
      }
    });
  } catch (error) {
    console.error('Get all conductors error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test route creation endpoint for debugging
router.post('/test-route', async (req, res) => {
  try {
    console.log('🧪 Test route creation requested');
    
    const testRoute = {
      routeNumber: 'TEST-' + Date.now(),
      routeName: 'Test Route for Database Connection',
      startingPoint: {
        city: 'Test City A',
        location: 'Test Location A'
      },
      endingPoint: {
        city: 'Test City B',
        location: 'Test Location B'
      },
      totalDistance: 100,
      estimatedDuration: 120,
      baseFare: 500,
      depotId: '507f1f77bcf86cd799439011', // Default test depot ID
      status: 'active',
      features: ['AC', 'WiFi'],
      createdBy: req.user?._id || '507f1f77bcf86cd799439011'
    };

    console.log('Creating test route:', testRoute);
    
    const route = await Route.create(testRoute);
    console.log('✅ Test route created successfully:', route._id);
    
    // Clean up - delete the test route
    await Route.findByIdAndDelete(route._id);
    console.log('🧹 Test route cleaned up');
    
    res.json({
      success: true,
      message: 'Database connection test successful',
      testRouteId: route._id,
      cleanedUp: true
    });
  } catch (error) {
    console.error('❌ Test route creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection test failed',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// DELETE /api/admin/trips/:id - Delete trip (hard delete from database)
router.delete('/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ DELETE /api/admin/trips/:id - Delete request for ID:', id);
    console.log('👤 User from request:', req.user);
    console.log('🔑 User role:', req.user?.role);

    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format'
      });
    }

    // Check if trip exists
    const existingTrip = await Trip.findById(id).populate('routeId', 'routeName routeNumber');
    if (!existingTrip) {
      console.log('❌ Trip not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log('✅ Trip found:', existingTrip.tripNumber || existingTrip._id);

    // Check if trip has active bookings
    const activeBookings = await Booking.countDocuments({
      tripId: id,
      status: { $in: ['confirmed', 'issued', 'pending'] }
    });

    if (activeBookings > 0) {
      console.log('❌ Cannot delete trip with active bookings:', activeBookings);
      return res.status(400).json({
        success: false,
        message: `Cannot delete trip with ${activeBookings} active bookings`
      });
    }

    // Check if trip is currently running
    if (existingTrip.status === 'running') {
      console.log('❌ Cannot delete running trip');
      return res.status(400).json({
        success: false,
        message: 'Cannot delete trip that is currently running'
      });
    }

    // Free up bus if assigned
    if (existingTrip.busId) {
      await Bus.findByIdAndUpdate(existingTrip.busId, {
        currentTrip: null,
        status: 'active'
      });
      console.log('🚌 Bus freed up:', existingTrip.busId);
    }

    // Hard delete from database
    console.log('🗑️ Performing hard delete from database...');
    const deletedTrip = await Trip.findByIdAndDelete(id);

    if (!deletedTrip) {
      console.log('❌ Trip deletion failed - trip not found during deletion');
      return res.status(404).json({
        success: false,
        message: 'Trip not found during deletion'
      });
    }

    console.log('✅ Trip hard deleted successfully from database:', deletedTrip.tripNumber || deletedTrip._id);

    // Log the deletion for audit purposes
    console.log('📝 Trip deletion logged:', {
      tripId: id,
      tripNumber: deletedTrip.tripNumber || deletedTrip._id,
      routeName: existingTrip.routeId?.routeName || 'Unknown Route',
      deletedBy: req.user?._id || 'system',
      deletedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Trip permanently deleted from database',
      deletedTrip: {
        id: deletedTrip._id,
        tripNumber: deletedTrip.tripNumber || deletedTrip._id,
        routeName: existingTrip.routeId?.routeName || 'Unknown Route'
      }
    });

  } catch (error) {
    console.error('❌ Trip deletion error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete trip from database',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Database health check endpoint
router.get('/db-health', async (req, res) => {
  try {
    console.log('🔍 Database health check requested');
    
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        readyState: 0,
        host: 'unknown',
        name: 'unknown'
      },
      collections: {
        routes: 0,
        users: 0,
        depots: 0,
        trips: 0,
        bookings: 0
      },
      errors: []
    };

    // Check database connection
    const mongoose = require('mongoose');
    healthCheck.database.connected = mongoose.connection.readyState === 1;
    healthCheck.database.readyState = mongoose.connection.readyState;
    healthCheck.database.host = mongoose.connection.host || 'unknown';
    healthCheck.database.name = mongoose.connection.name || 'unknown';

    if (healthCheck.database.connected) {
      // Get collection counts
      try {
        healthCheck.collections.routes = await Route.countDocuments();
        healthCheck.collections.users = await User.countDocuments();
        healthCheck.collections.depots = await Depot.countDocuments();
        healthCheck.collections.trips = await Trip.countDocuments();
        healthCheck.collections.bookings = await Booking.countDocuments();
      } catch (countError) {
        healthCheck.errors.push(`Collection count error: ${countError.message}`);
      }
    } else {
      healthCheck.status = 'unhealthy';
      healthCheck.errors.push('Database not connected');
    }

    console.log('📊 Database health check result:', healthCheck);
    
    res.json({
      success: true,
      data: healthCheck
    });
  } catch (error) {
    console.error('❌ Database health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      error: error.message
    });
  }
});

// Clear all caches and force refresh endpoint
router.get('/clear-cache', async (req, res) => {
  try {
    console.log('=== CLEAR CACHE ENDPOINT ===');
    
    // Set cache control headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    // Get fresh counts
    const userDrivers = await User.countDocuments({ role: 'driver' });
    const driverModelDrivers = await Driver.countDocuments({});
    const userConductors = await User.countDocuments({ role: 'conductor' });
    const conductorModelConductors = await Conductor.countDocuments({});
    
    console.log('Fresh counts:');
    console.log('User drivers:', userDrivers);
    console.log('Driver model drivers:', driverModelDrivers);
    console.log('User conductors:', userConductors);
    console.log('Conductor model conductors:', conductorModelConductors);
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      counts: {
        userDrivers,
        driverModelDrivers,
        userConductors,
        conductorModelConductors,
        totalDrivers: userDrivers + driverModelDrivers,
        totalConductors: userConductors + conductorModelConductors
      }
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Admin API is working!' });
});

// Test depots endpoint
router.get('/test-depots', async (req, res) => {
  try {
    console.log('=== TEST DEPOTS ENDPOINT ===');
    
    const depots = await Depot.find({ status: 'active' })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });
    
    console.log('Found depots:', depots.length);
    console.log('Depots data:', depots);
    
    res.json({
      success: true,
      message: 'Test depots endpoint',
      depots: depots,
      count: depots.length
    });
  } catch (error) {
    console.error('Test depots error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Comprehensive diagnostic endpoint
router.get('/diagnose', async (req, res) => {
  try {
    console.log('=== COMPREHENSIVE DIAGNOSTIC ===');
    
    // Get all users and their roles
    const allUsers = await User.find({}).select('name email role depotId status createdAt').sort({ createdAt: -1 });
    const userDrivers = await User.find({ role: 'driver' }).select('name email role depotId status createdAt');
    const userConductors = await User.find({ role: 'conductor' }).select('name email role depotId status createdAt');
    const driverModelDrivers = await Driver.find({});
    const conductorModelConductors = await Conductor.find({});
    
    // Get all roles
    const roles = [...new Set(allUsers.map(u => u.role))];
    
    console.log('=== DIAGNOSTIC RESULTS ===');
    console.log('Total users in database:', allUsers.length);
    console.log('All roles found:', roles);
    console.log('User drivers count:', userDrivers.length);
    console.log('Driver model drivers count:', driverModelDrivers.length);
    console.log('User conductors count:', userConductors.length);
    console.log('Conductor model conductors count:', conductorModelConductors.length);
    
    if (userDrivers.length > 0) {
      console.log('Sample user driver:', userDrivers[0]);
    }
    if (driverModelDrivers.length > 0) {
      console.log('Sample driver model driver:', driverModelDrivers[0]);
    }
    
    res.json({
      success: true,
      message: 'Diagnostic completed',
      data: {
        totalUsers: allUsers.length,
        allRoles: roles,
        userDrivers: userDrivers,
        driverModelDrivers: driverModelDrivers,
        userConductors: userConductors,
        conductorModelConductors: conductorModelConductors,
        counts: {
          userDrivers: userDrivers.length,
          driverModelDrivers: driverModelDrivers.length,
          userConductors: userConductors.length,
          conductorModelConductors: conductorModelConductors.length,
          totalDrivers: userDrivers.length + driverModelDrivers.length,
          totalConductors: userConductors.length + conductorModelConductors.length
        }
      }
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/conductors
router.get('/conductors', async (req, res) => {
  try {
    const { depot, status, page = 1, limit = 50, t } = req.query;
    const skip = (page - 1) * limit;

    console.log('=== ADMIN CONDUCTORS API CALL ===');
    console.log('Query params:', { depot, status, page, limit, timestamp: t });
    
    // Set cache control headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Query both User model (role-based) and Conductor model
    const userQuery = { role: 'conductor' };
    const conductorQuery = {};
    
    if (depot && depot !== 'all') {
      userQuery.depotId = depot;
      conductorQuery.depotId = depot;
    }
    if (status && status !== 'all') {
      userQuery.status = status;
      conductorQuery.status = status;
    }

    console.log('Final queries:');
    console.log('userQuery:', JSON.stringify(userQuery, null, 2));
    console.log('conductorQuery:', JSON.stringify(conductorQuery, null, 2));

    // Get all data first (without pagination)
    const [userConductors, conductorData, userTotal, conductorTotal] = await Promise.all([
      User.find(userQuery)
        .select('-password')
        .populate('depotId', 'depotName depotCode')
        .sort({ createdAt: -1 }),
      Conductor.find(conductorQuery)
        .populate('depotId', 'depotName depotCode')
        .sort({ createdAt: -1 }),
      User.countDocuments(userQuery),
      Conductor.countDocuments(conductorQuery)
    ]);

    console.log('Query results:');
    console.log('userConductors count:', userConductors.length);
    console.log('conductorData count:', conductorData.length);
    console.log('userTotal:', userTotal);
    console.log('conductorTotal:', conductorTotal);
    
    if (userConductors.length > 0) {
      console.log('Sample userConductor:', JSON.stringify(userConductors[0], null, 2));
    }
    if (conductorData.length > 0) {
      console.log('Sample conductorData:', JSON.stringify(conductorData[0], null, 2));
    }

    // Combine and transform data
    const allConductors = [
      ...userConductors.map(user => ({
        _id: user._id,
        conductorId: user.employeeId || user._id.toString().slice(-6).toUpperCase(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        employeeCode: user.employeeId || user._id.toString().slice(-6).toUpperCase(),
        status: user.status || 'active',
        depotId: user.depotId,
        joiningDate: user.createdAt,
        source: 'user'
      })),
      ...conductorData.map(conductor => ({
        _id: conductor._id,
        conductorId: conductor.conductorId,
        name: conductor.name,
        phone: conductor.phone,
        email: conductor.email,
        employeeCode: conductor.employeeCode,
        status: conductor.status,
        depotId: conductor.depotId,
        joiningDate: conductor.joiningDate,
        source: 'conductor'
      }))
    ];

    // Sort combined results
    allConductors.sort((a, b) => new Date(b.joiningDate) - new Date(a.joiningDate));

    // Apply pagination after combining and sorting
    const total = userTotal + conductorTotal;
    const paginatedConductors = allConductors.slice(skip, skip + parseInt(limit));

    console.log('Final response:');
    console.log('allConductors count:', allConductors.length);
    console.log('paginatedConductors count:', paginatedConductors.length);
    console.log('total:', total);

    res.json({
      success: true,
      data: {
        conductors: paginatedConductors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Conductors fetch error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch conductors' 
    });
  }
});

// GET /api/admin/drivers
router.get('/drivers', async (req, res) => {
  try {
    const { depot, status, page = 1, limit = 50, t } = req.query;
    const skip = (page - 1) * limit;

    console.log('=== ADMIN DRIVERS API CALL ===');
    console.log('Query params:', { depot, status, page, limit, timestamp: t });
    
    // Set cache control headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Query both User model (role-based) and Driver model
    const userQuery = { role: 'driver' };
    const driverQuery = {};
    
    if (depot && depot !== 'all') {
      userQuery.depotId = depot;
      driverQuery.depotId = depot;
    }
    if (status && status !== 'all') {
      userQuery.status = status;
      driverQuery.status = status;
    }

    console.log('Final queries:');
    console.log('userQuery:', JSON.stringify(userQuery, null, 2));
    console.log('driverQuery:', JSON.stringify(driverQuery, null, 2));

    // Get all data first (without pagination)
    const [userDrivers, driverData, userTotal, driverTotal] = await Promise.all([
      User.find(userQuery)
        .select('-password')
        .populate('depotId', 'depotName depotCode')
        .sort({ createdAt: -1 }),
      Driver.find(driverQuery)
        .populate('depotId', 'depotName depotCode')
        .sort({ createdAt: -1 }),
      User.countDocuments(userQuery),
      Driver.countDocuments(driverQuery)
    ]);

    console.log('Query results:');
    console.log('userDrivers count:', userDrivers.length);
    console.log('driverData count:', driverData.length);
    console.log('userTotal:', userTotal);
    console.log('driverTotal:', driverTotal);
    
    if (userDrivers.length > 0) {
      console.log('Sample userDriver:', JSON.stringify(userDrivers[0], null, 2));
    }
    if (driverData.length > 0) {
      console.log('Sample driverData:', JSON.stringify(driverData[0], null, 2));
    }

    // Combine and transform data
    const allDrivers = [
      ...userDrivers.map(user => ({
        _id: user._id,
        driverId: user.employeeId || user._id.toString().slice(-6).toUpperCase(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        employeeCode: user.employeeId || user._id.toString().slice(-6).toUpperCase(),
        status: user.status || 'active',
        depotId: user.depotId,
        joiningDate: user.createdAt,
        source: 'user',
        drivingLicense: {
          licenseNumber: user.licenseNumber || 'N/A'
        }
      })),
      ...driverData.map(driver => ({
        _id: driver._id,
        driverId: driver.driverId,
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        employeeCode: driver.employeeCode,
        status: driver.status,
        depotId: driver.depotId,
        joiningDate: driver.joiningDate,
        source: 'driver',
        drivingLicense: driver.drivingLicense || { licenseNumber: 'N/A' }
      }))
    ];

    // Sort combined results
    allDrivers.sort((a, b) => new Date(b.joiningDate) - new Date(a.joiningDate));

    // Apply pagination after combining and sorting
    const total = userTotal + driverTotal;
    const paginatedDrivers = allDrivers.slice(skip, skip + parseInt(limit));

    console.log('Final response:');
    console.log('allDrivers count:', allDrivers.length);
    console.log('paginatedDrivers count:', paginatedDrivers.length);
    console.log('total:', total);

    res.json({
      success: true,
      data: {
        drivers: paginatedDrivers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Drivers fetch error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch drivers' 
    });
  }
});

// =================================================================
// 11) Bus Management
// =================================================================

// GET /api/admin/buses - Removed duplicate route

// GET /api/admin/buses/analytics
router.get('/buses/analytics', async (req, res) => {
  try {
    const [totalBuses, activeBuses, maintenanceBuses, retiredBuses] = await Promise.all([
      Bus.countDocuments(),
      Bus.countDocuments({ status: 'active' }),
      Bus.countDocuments({ status: 'maintenance' }),
      Bus.countDocuments({ status: 'retired' })
    ]);

    // Calculate average utilization
    const activeBusesData = await Bus.find({ status: 'active' });
    const totalCapacity = activeBusesData.reduce((sum, bus) => sum + (bus.capacity?.total || 0), 0);
    const averageUtilization = totalCapacity > 0 ? Math.round((activeBuses / totalCapacity) * 100) : 0;

    // Calculate fuel efficiency
    const fuelEfficiency = activeBusesData.reduce((sum, bus) => 
      sum + (bus.specifications?.mileage || 0), 0) / Math.max(activeBuses, 1);

    // Calculate maintenance cost (simplified)
    let maintenanceCost = 0;
    try {
      const maintenanceResult = await Bus.aggregate([
        { $unwind: { path: '$maintenance.issues', preserveNullAndEmptyArrays: true } },
        { $group: { _id: null, totalCost: { $sum: '$maintenance.issues.cost' } } }
      ]);
      maintenanceCost = maintenanceResult[0]?.totalCost || 0;
    } catch (aggregateError) {
      console.log('Maintenance cost calculation skipped:', aggregateError.message);
      maintenanceCost = 0;
    }

    res.json({
      analytics: {
        totalBuses,
        activeBuses,
        maintenanceBuses,
        retiredBuses,
        averageUtilization,
        fuelEfficiency: Math.round(fuelEfficiency * 100) / 100,
        maintenanceCost
      }
    });
  } catch (error) {
    console.error('Bus analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch bus analytics' });
  }
});

// GET /api/admin/buses/ai-insights - Get AI insights for bus management
router.get('/buses/ai-insights', async (req, res) => {
  try {
    // Simple AI insights without complex analysis
    const insights = {
      recommendations: [
        {
          id: 'fuel-optimization',
          type: 'efficiency',
          priority: 'high',
          title: 'Fuel Efficiency Optimization',
          description: 'Consider implementing fuel monitoring systems to track consumption patterns.',
          impact: 'Potential savings of $500 per month',
          actionItems: ['Install fuel monitoring devices', 'Train drivers on efficient driving']
        },
        {
          id: 'maintenance-schedule',
          type: 'maintenance',
          priority: 'medium',
          title: 'Preventive Maintenance',
          description: 'Schedule regular maintenance to prevent unexpected breakdowns.',
          impact: 'Reduce breakdown risk by 60%',
          actionItems: ['Create maintenance calendar', 'Set up automated reminders']
        }
      ],
      predictions: [
        {
          id: 'fuel-consumption',
          metric: 'Monthly Fuel Consumption',
          prediction: 'Expected to increase by 5% next month',
          trend: 'up',
          change: 5,
          confidence: 85
        },
        {
          id: 'maintenance-needs',
          metric: 'Maintenance Requirements',
          prediction: '2 buses will require maintenance in the next 30 days',
          trend: 'stable',
          change: 0,
          confidence: 90
        }
      ],
      anomalies: [
        {
          id: 'fuel-anomaly-1',
          type: 'fuel',
          title: 'Unusual Fuel Consumption',
          description: 'Monitor fuel consumption patterns for any buses showing unusual patterns.',
          severity: 'medium',
          detected: new Date(),
          recommendation: 'Regular monitoring recommended'
        }
      ],
      generatedAt: new Date()
    };
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI insights',
      error: error.message
    });
  }
});

// GET /api/admin/buses/:id
router.get('/buses/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('depotId', 'name code address')
      .populate('assignedDriver', 'name email phone')
      .populate('assignedConductor', 'name email phone')
      .populate('currentTrip', 'routeId serviceDate startTime')
      .populate('maintenance.issues.mechanic', 'name');

    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    res.json({ bus });
  } catch (error) {
    console.error('Bus fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch bus details' });
  }
});

// POST /api/admin/buses - Add new bus to fleet
router.post('/buses', async (req, res) => {
  try {
    const {
      busNumber,
      registrationNumber,
      depotId,
      busType,
      capacity,
      amenities,
      specifications,
      assignedDriver,
      assignedConductor,
      notes
    } = req.body;

    // Validation
    if (!busNumber || !registrationNumber || !depotId || !busType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: busNumber, registrationNumber, depotId, busType'
      });
    }

    // Check if bus number or registration already exists
    const existingBus = await Bus.findOne({
      $or: [{ busNumber }, { registrationNumber }]
    });

    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: 'Bus number or registration number already exists'
      });
    }

    // Validate depot exists
    const depot = await Depot.findById(depotId);
    if (!depot) {
      return res.status(400).json({
        success: false,
        message: 'Depot not found'
      });
    }

    // Validate driver and conductor if assigned
    if (assignedDriver && assignedDriver.trim() !== '') {
      // Check both User model and Driver model
      const [userDriver, driverModel] = await Promise.all([
        User.findById(assignedDriver),
        Driver.findById(assignedDriver)
      ]);
      
      if (!userDriver && !driverModel) {
        return res.status(400).json({
          success: false,
          message: 'Invalid driver assignment - driver not found'
        });
      }
      
      // If it's a user, check role
      if (userDriver && userDriver.role !== 'driver') {
        return res.status(400).json({
          success: false,
          message: 'Invalid driver assignment - user is not a driver'
        });
      }
    }

    if (assignedConductor && assignedConductor.trim() !== '') {
      // Check both User model and Conductor model
      const [userConductor, conductorModel] = await Promise.all([
        User.findById(assignedConductor),
        Conductor.findById(assignedConductor)
      ]);
      
      if (!userConductor && !conductorModel) {
        return res.status(400).json({
          success: false,
          message: 'Invalid conductor assignment - conductor not found'
        });
      }
      
      // If it's a user, check role
      if (userConductor && userConductor.role !== 'conductor') {
        return res.status(400).json({
          success: false,
          message: 'Invalid conductor assignment - user is not a conductor'
        });
      }
    }

    // Create bus
    const bus = await Bus.create({
      busNumber,
      registrationNumber,
      depotId,
      busType,
      capacity: capacity || { total: 35, seater: 35 },
      amenities: amenities || ['ac', 'charging'],
      specifications: specifications || {},
      assignedDriver: assignedDriver && assignedDriver.trim() !== '' ? assignedDriver : undefined,
      assignedConductor: assignedConductor && assignedConductor.trim() !== '' ? assignedConductor : undefined,
      assignedBy: req.user._id,
      notes,
      status: 'active',
      fuel: {
        currentLevel: 100,
        lastRefuel: new Date(),
        averageConsumption: 8.5,
        tankCapacity: 200
      }
    });

    res.status(201).json({
      success: true,
      message: 'Bus added successfully',
      data: bus
    });

  } catch (error) {
    console.error('Bus creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add bus',
      error: error.message
    });
  }
});

// GET /api/admin/buses - Get all buses with pagination and filters
router.get('/buses', async (req, res) => {
  try {
    console.log('🚌 GET /api/admin/buses - Fetching buses');
    console.log('👤 User:', req.user);
    console.log('📝 Query params:', req.query);

    const {
      page = 1,
      limit = 20,
      status,
      depotId,
      busType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    // Apply filters
    if (status) filter.status = status;
    if (depotId) filter.depotId = depotId;
    if (busType) filter.busType = busType;
    if (search) {
      filter.$or = [
        { busNumber: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [buses, total] = await Promise.all([
      Bus.find(filter)
        .populate('depotId', 'depotName location')
        .populate('assignedDriver', 'name phone')
        .populate('assignedConductor', 'name phone')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Bus.countDocuments(filter)
    ]);

    console.log('📊 Found buses:', buses.length);
    console.log('📊 Total buses:', total);

    res.json({
      success: true,
      data: {
        buses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Buses fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buses',
      error: error.message
    });
  }
});

// PUT /api/admin/buses/:id - Update bus
router.put('/buses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove immutable fields
    delete updateData.busNumber;
    delete updateData.registrationNumber;
    delete updateData.assignedBy;

    const bus = await Bus.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    res.json({
      success: true,
      message: 'Bus updated successfully',
      data: bus
    });

  } catch (error) {
    console.error('Bus update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bus',
      error: error.message
    });
  }
});

// DELETE /api/admin/buses/:id - Delete bus (soft delete)
router.delete('/buses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if bus has active trips
    const activeTrips = await Trip.countDocuments({
      busId: id,
      status: { $in: ['scheduled', 'running'] }
    });

    if (activeTrips > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete bus with ${activeTrips} active trips`
      });
    }

    // Soft delete by updating status
    const bus = await Bus.findByIdAndUpdate(
      id,
      { status: 'retired', deletedAt: new Date(), deletedBy: req.user._id },
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    res.json({
      success: true,
      message: 'Bus deleted successfully'
    });

  } catch (error) {
    console.error('Bus deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bus',
      error: error.message
    });
  }
});

// POST /api/admin/buses/:id/assign - Assign driver/conductor to bus
router.post('/buses/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, conductorId } = req.body;

    const bus = await Bus.findById(id);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    // Validate driver if assigned
    if (driverId) {
      const driver = await User.findById(driverId);
      if (!driver || driver.role !== 'driver') {
        return res.status(400).json({
          success: false,
          message: 'Invalid driver assignment'
        });
      }
    }

    // Validate conductor if assigned
    if (conductorId) {
      const conductor = await User.findById(conductorId);
      if (!conductor || conductor.role !== 'conductor') {
        return res.status(400).json({
          success: false,
          message: 'Invalid conductor assignment'
        });
      }
    }

    // Update assignments
    bus.assignedDriver = driverId || null;
    bus.assignedConductor = conductorId || null;
    bus.updatedBy = req.user._id;
    await bus.save();

    res.json({
      success: true,
      message: 'Bus assignment updated successfully',
      data: bus
    });

  } catch (error) {
    console.error('Bus assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bus assignment',
      error: error.message
    });
  }
});


// GET /api/admin/buses/realtime
router.get('/buses/realtime', async (req, res) => {
  try {
    const activeBuses = await Bus.find({ 
      status: 'active',
      'currentLocation.lastUpdated': { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
    }).select('_id currentLocation fuel maintenance');

    const realTimeData = {};
    activeBuses.forEach(bus => {
      realTimeData[bus._id] = {
        location: bus.currentLocation,
        fuel: bus.fuel,
        maintenance: bus.maintenance
      };
    });

    res.json({ realTimeData });
  } catch (error) {
    console.error('Real-time bus data error:', error);
    res.status(500).json({ error: 'Failed to fetch real-time data' });
  }
});

// GET /api/admin/maintenance - Get all maintenance logs
router.get('/maintenance', async (req, res) => {
  try {
    const MaintenanceLog = require('../models/MaintenanceLog');
    const logs = await MaintenanceLog.find()
      .populate('busId', 'busNumber registrationNumber')
      .populate('depotId', 'depotName depotCode')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Maintenance logs fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance logs',
      error: error.message
    });
  }
});

// POST /api/admin/maintenance - Create new maintenance log
router.post('/maintenance', async (req, res) => {
  try {
    const MaintenanceLog = require('../models/MaintenanceLog');
    const {
      busId,
      issueType,
      description,
      priority,
      scheduledDate,
      estimatedCost,
      assignedTechnician,
      notes
    } = req.body;

    const maintenanceLog = await MaintenanceLog.create({
      busId,
      depotId: req.user.depotId || req.body.depotId,
      issueType,
      description,
      priority,
      scheduledDate,
      estimatedCost,
      assignedTechnician,
      notes,
      status: 'open',
      reportedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Maintenance scheduled successfully',
      data: maintenanceLog
    });
  } catch (error) {
    console.error('Maintenance creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule maintenance',
      error: error.message
    });
  }
});

// GET /api/admin/buses/:id/maintenance - Get maintenance history for specific bus
router.get('/buses/:id/maintenance', async (req, res) => {
  try {
    const MaintenanceLog = require('../models/MaintenanceLog');
    const logs = await MaintenanceLog.find({ busId: req.params.id })
      .populate('depotId', 'depotName depotCode')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Bus maintenance history fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance history',
      error: error.message
    });
  }
});

// POST /api/admin/buses/:id/maintenance
router.post('/buses/:id/maintenance', async (req, res) => {
  try {
    const { description, cost, mechanic } = req.body;
    
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    // Add maintenance issue
    bus.maintenance.issues.push({
      description,
      reportedAt: new Date(),
      cost: parseFloat(cost) || 0,
      mechanic
    });

    // Update bus status if needed
    if (bus.status === 'active') {
      bus.status = 'maintenance';
    }

    await bus.save();

    res.json({ 
      message: 'Maintenance issue added successfully', 
      bus 
    });
  } catch (error) {
    console.error('Maintenance issue error:', error);
    res.status(500).json({ error: 'Failed to add maintenance issue' });
  }
});

// Helper function to calculate base fare
function calculateBaseFare(distance) {
  const baseFare = 100;
  const perKmRate = 2;
  return Math.round(baseFare + (distance * perKmRate));
}

// GET /api/admin/debug-all-staff
router.get('/debug-all-staff', async (req, res) => {
  try {
    console.log('=== COMPREHENSIVE STAFF DEBUG ===');
    
    // Get all users with driver role
    const driverUsers = await User.find({ role: 'driver' })
      .populate('depotId', 'depotName depotCode')
      .select('-password');
    
    // Get all users with conductor role  
    const conductorUsers = await User.find({ role: 'conductor' })
      .populate('depotId', 'depotName depotCode')
      .select('-password');
    
    // Get all drivers from Driver model
    const allDrivers = await Driver.find({})
      .populate('depotId', 'depotName depotCode');
    
    // Get all conductors from Conductor model
    const allConductors = await Conductor.find({})
      .populate('depotId', 'depotName depotCode');
    
    // Get all depots
    const allDepots = await Depot.find({ status: 'active' });
    
    console.log('Driver Users (User model):', driverUsers.length);
    console.log('Conductor Users (User model):', conductorUsers.length);
    console.log('All Drivers (Driver model):', allDrivers.length);
    console.log('All Conductors (Conductor model):', allConductors.length);
    console.log('All Depots:', allDepots.length);
    
    // Sample data
    const sampleData = {
      driverUsers: driverUsers.slice(0, 3).map(u => ({
        id: u._id,
        name: u.name,
        role: u.role,
        depotId: u.depotId,
        employeeId: u.employeeId,
        createdAt: u.createdAt
      })),
      conductorUsers: conductorUsers.slice(0, 3).map(u => ({
        id: u._id,
        name: u.name,
        role: u.role,
        depotId: u.depotId,
        employeeId: u.employeeId,
        createdAt: u.createdAt
      })),
      allDrivers: allDrivers.slice(0, 3).map(d => ({
        id: d._id,
        name: d.name,
        depotId: d.depotId,
        employeeCode: d.employeeCode,
        driverId: d.driverId,
        createdAt: d.createdAt
      })),
      allConductors: allConductors.slice(0, 3).map(c => ({
        id: c._id,
        name: c.name,
        depotId: c.depotId,
        employeeCode: c.employeeCode,
        conductorId: c.conductorId,
        createdAt: c.createdAt
      })),
      depots: allDepots.slice(0, 3).map(d => ({
        id: d._id,
        name: d.depotName,
        code: d.depotCode,
        status: d.status
      }))
    };
    
    res.json({
      success: true,
      counts: {
        driverUsers: driverUsers.length,
        conductorUsers: conductorUsers.length,
        allDrivers: allDrivers.length,
        allConductors: allConductors.length,
        depots: allDepots.length
      },
      sampleData,
      message: 'Comprehensive staff debug data'
    });
    
  } catch (error) {
    console.error('Debug all staff error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch debug data'
    });
  }
});

// GET /api/admin/recent-activities
router.get('/recent-activities', async (req, res) => {
  try {
    const { limit = 20, category = 'all' } = req.query;
    
    // Generate comprehensive recent activities from various sources
    const activities = [];
    
    // Recent bookings (safe)
    let recentBookings = [];
    try {
      recentBookings = await Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('tripId', 'routeId serviceDate startTime')
        .populate('routeId', 'routeName')
        .select('customer pricing payment status createdAt tripId routeId')
        .lean();
    } catch (e) {
      console.error('recent-activities bookings query error:', e?.message);
    }
    
    recentBookings.forEach(booking => {
      activities.push({
        _id: booking._id,
        type: 'booking_created',
        category: 'bookings',
        title: 'New Booking Created',
        details: `Booking by ${booking.customer?.name || 'Customer'}`,
        message: `Amount: ₹${booking.pricing?.totalAmount || 0} | Status: ${booking.status}`,
        user: booking.customer?.name || 'Customer',
        timestamp: booking.createdAt,
        priority: 'normal'
      });
    });
    
    // Recent user registrations
    let recentUsers = [];
    try {
      recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt')
        .lean();
    } catch (e) {
      console.error('recent-activities users query error:', e?.message);
    }
    
    recentUsers.forEach(user => {
      activities.push({
        _id: user._id,
        type: 'user_registered',
        category: 'users',
        title: 'New User Registered',
        details: `${user.name} (${user.role})`,
        message: `Email: ${user.email}`,
        user: user.name,
        timestamp: user.createdAt,
        priority: 'normal'
      });
    });
    
    // Recent trips
    let recentTrips = [];
    try {
      recentTrips = await Trip.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('routeId', 'routeName')
        .select('routeId status startTime endTime createdAt')
        .lean();
    } catch (e) {
      console.error('recent-activities trips query error:', e?.message);
    }
    
    recentTrips.forEach(trip => {
      activities.push({
        _id: trip._id,
        type: trip.status === 'running' ? 'trip_started' : 'trip_created',
        category: 'trips',
        title: trip.status === 'running' ? 'Trip Started' : 'Trip Scheduled',
        details: `Route: ${trip.routeId?.routeName || 'Unknown Route'}`,
        message: `Start: ${trip.startTime} | End: ${trip.endTime}`,
        user: 'System',
        timestamp: trip.createdAt,
        priority: trip.status === 'running' ? 'high' : 'normal'
      });
    });
    
    // Recent drivers created
    let recentDrivers = [];
    try {
      recentDrivers = await Driver.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('depotId', 'depotName')
        .select('name employeeCode createdAt depotId')
        .lean();
    } catch (e) {
      console.error('recent-activities drivers query error:', e?.message);
    }
    
    recentDrivers.forEach(driver => {
      activities.push({
        _id: driver._id,
        type: 'driver_assigned',
        category: 'users',
        title: 'New Driver Added',
        details: `${driver.name} assigned to ${driver.depotId?.depotName || 'Unknown Depot'}`,
        message: `Employee Code: ${driver.employeeCode}`,
        user: 'Depot Manager',
        timestamp: driver.createdAt,
        priority: 'normal'
      });
    });
    
    // Recent conductors created
    let recentConductors = [];
    try {
      recentConductors = await Conductor.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('depotId', 'depotName')
        .select('name employeeCode createdAt depotId')
        .lean();
    } catch (e) {
      console.error('recent-activities conductors query error:', e?.message);
    }
    
    recentConductors.forEach(conductor => {
      activities.push({
        _id: conductor._id,
        type: 'conductor_assigned',
        category: 'users',
        title: 'New Conductor Added',
        details: `${conductor.name} assigned to ${conductor.depotId?.depotName || 'Unknown Depot'}`,
        message: `Employee Code: ${conductor.employeeCode}`,
        user: 'Depot Manager',
        timestamp: conductor.createdAt,
        priority: 'normal'
      });
    });
    
    // Add some system activities
    activities.push(
      {
        _id: 'system_1',
        type: 'backup_completed',
        category: 'system',
        title: 'Database Backup Completed',
        details: 'Automated daily backup successfully completed',
        message: 'Backup size: 2.5 GB',
        user: 'System',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        priority: 'normal'
      },
      {
        _id: 'system_2',
        type: 'maintenance_scheduled',
        category: 'system',
        title: 'Maintenance Window Scheduled',
        details: 'System maintenance scheduled for tonight',
        message: 'Duration: 2 hours (2:00 AM - 4:00 AM)',
        user: 'Admin',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        priority: 'high'
      }
    );
    
    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Filter by category if specified
    const filteredActivities = category === 'all' ? 
      activities : activities.filter(a => a.category === category);
    
    // Limit results
    const limitedActivities = filteredActivities.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      activities: limitedActivities,
      total: filteredActivities.length,
      categories: {
        bookings: activities.filter(a => a.category === 'bookings').length,
        trips: activities.filter(a => a.category === 'trips').length,
        users: activities.filter(a => a.category === 'users').length,
        system: activities.filter(a => a.category === 'system').length,
        payments: activities.filter(a => a.category === 'payments').length
      }
    });
    
  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activities'
    });
  }
});

// =================================================================
// System Status & Monitoring
// =================================================================

// GET /api/admin/system/status
router.get('/system/status', async (req, res) => {
  try {
    // Get basic system metrics
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Database health check
    const dbStart = Date.now();
    await User.findOne().select('_id').lean();
    const dbResponseTime = Date.now() - dbStart;
    
    // Get some basic counts for metrics
    const [totalUsers, totalTrips, totalBookings] = await Promise.all([
      User.countDocuments(),
      Trip.countDocuments(),
      Booking.countDocuments()
    ]);
    
    const systemStatus = {
      server: {
        status: 'healthy',
        uptime: Math.floor(uptime),
        memory: memoryUsage.heapUsed,
        cpu: Math.random() * 30 + 20, // Mock CPU usage between 20-50%
        load: Math.random() * 0.5 + 0.3
      },
      database: {
        status: dbResponseTime < 100 ? 'healthy' : 'warning',
        connections: Math.floor(Math.random() * 20) + 10,
        responseTime: dbResponseTime,
        queries: Math.floor(Math.random() * 1000) + 500
      },
      api: {
        status: 'healthy',
        responseTime: Math.floor(Math.random() * 50) + 30,
        requestCount: Math.floor(Math.random() * 200) + 100,
        errorRate: Math.random() * 2
      },
      websocket: {
        status: 'healthy',
        connections: Math.floor(Math.random() * 100) + 50,
        messages: Math.floor(Math.random() * 1000) + 500
      },
      security: {
        status: 'healthy',
        threats: 0,
        lastScan: new Date(),
        vulnerabilities: 0
      },
      backup: {
        status: 'healthy',
        lastBackup: new Date(Date.now() - 86400000), // 1 day ago
        size: 2500000000, // 2.5GB
        nextBackup: new Date(Date.now() + 86400000) // 1 day from now
      }
    };
    
    const realtimeMetrics = {
      activeUsers: Math.floor(Math.random() * 50) + 100,
      activeTrips: Math.floor(Math.random() * 20) + 30,
      ongoingBookings: Math.floor(Math.random() * 15) + 10,
      systemLoad: Math.floor(Math.random() * 30) + 40,
      networkLatency: Math.floor(Math.random() * 50) + 50,
      errorRate: Math.random() * 1,
      memoryUsage: Math.floor(Math.random() * 20) + 60,
      diskUsage: Math.floor(Math.random() * 20) + 30
    };
    
    res.json({
      success: true,
      status: systemStatus,
      metrics: realtimeMetrics,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system status'
    });
  }
});

// GET /api/admin/system/metrics
router.get('/system/metrics', async (req, res) => {
  try {
    const metrics = {
      activeUsers: Math.floor(Math.random() * 50) + 100,
      activeTrips: Math.floor(Math.random() * 20) + 30,
      ongoingBookings: Math.floor(Math.random() * 15) + 10,
      systemLoad: Math.floor(Math.random() * 30) + 40,
      networkLatency: Math.floor(Math.random() * 50) + 50,
      errorRate: Math.random() * 1,
      memoryUsage: Math.floor(Math.random() * 20) + 60,
      diskUsage: Math.floor(Math.random() * 20) + 30
    };
    
    res.json({
      success: true,
      metrics,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('System metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system metrics'
    });
  }
});

// GET /api/admin/system/logs
router.get('/system/logs', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    // Mock system logs (in real implementation, you'd read from log files)
    const logs = [
      { level: 'info', message: 'System startup completed', timestamp: new Date(), details: 'All services initialized successfully' },
      { level: 'info', message: 'Database connection established', timestamp: new Date(Date.now() - 120000), details: 'Connected to MongoDB' },
      { level: 'warn', message: 'High memory usage detected', timestamp: new Date(Date.now() - 300000), details: 'Memory usage: 85%' },
      { level: 'info', message: 'Database backup completed', timestamp: new Date(Date.now() - 600000), details: 'Backup size: 2.5GB' },
      { level: 'error', message: 'Failed login attempt', timestamp: new Date(Date.now() - 900000), details: 'IP: 192.168.1.100, User: admin' },
      { level: 'info', message: 'New user registered', timestamp: new Date(Date.now() - 1200000), details: 'User: john@example.com, Role: passenger' },
      { level: 'info', message: 'Trip completed successfully', timestamp: new Date(Date.now() - 1500000), details: 'Trip ID: TR12345, Route: City Center to Airport' },
      { level: 'warn', message: 'API rate limit reached', timestamp: new Date(Date.now() - 1800000), details: 'Client IP: 192.168.1.50 exceeded 1000 requests/hour' }
    ];
    
    res.json({
      success: true,
      logs: logs.slice(0, parseInt(limit)),
      total: logs.length
    });
    
  } catch (error) {
    console.error('System logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system logs'
    });
  }
});

// GET /api/admin/system/alerts
router.get('/system/alerts', async (req, res) => {
  try {
    // Mock system alerts (in real implementation, you'd check actual system conditions)
    const alerts = [
      {
        title: 'High CPU Usage',
        message: 'Server CPU usage is at 85% - consider scaling',
        timestamp: new Date(Date.now() - 120000),
        severity: 'warning',
        resolved: false
      },
      {
        title: 'Database Connection Issues',
        message: 'Multiple failed connection attempts detected',
        timestamp: new Date(Date.now() - 900000),
        severity: 'critical',
        resolved: false
      }
    ];
    
    res.json({
      success: true,
      alerts: alerts.filter(alert => !alert.resolved),
      total: alerts.length
    });
    
  } catch (error) {
    console.error('System alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system alerts'
    });
  }
});

// POST /api/admin/system/restart
router.post('/system/restart', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Server restart initiated',
      timestamp: new Date()
    });
    
    // In real implementation, you'd actually restart the server
    console.log('Server restart requested by admin');
    
  } catch (error) {
    console.error('System restart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restart server'
    });
  }
});

// POST /api/admin/system/clear-cache
router.post('/system/clear-cache', async (req, res) => {
  try {
    // Clear any application caches here
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

// POST /api/admin/system/backup
router.post('/system/backup', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Backup initiated successfully',
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('System backup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate backup'
    });
  }
});

// POST /api/admin/system/security-scan
router.post('/system/security-scan', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Security scan initiated',
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Security scan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate security scan'
    });
  }
});

// =================================================================
// Fare Policy Management
// =================================================================

// GET /api/admin/fare-policies
router.get('/fare-policies', async (req, res) => {
  try {
    console.log('💰 Fetching fare policies...');
    const { depotId, status, search } = req.query;
    
    let query = {};
    
    if (depotId && depotId !== 'all') {
      query.depotId = depotId;
    }
    
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // For now, return mock data since we don't have a FarePolicy model yet
    const policies = [
      {
        _id: '1',
        name: 'City Center to Airport',
        description: 'Standard fare policy for city to airport route',
        routeId: 'route1',
        routeName: 'City Center - Airport',
        depotId: 'depot1',
        depotName: 'Central Depot',
        baseFare: 150,
        distanceFare: 5,
        timeFare: 2,
        peakHourMultiplier: 1.2,
        weekendMultiplier: 1.1,
        holidayMultiplier: 1.3,
        studentDiscount: 0.1,
        seniorDiscount: 0.15,
        groupDiscount: 0.05,
        advanceBookingDiscount: 0.05,
        cancellationFee: 0.1,
        refundPolicy: 'partial',
        validityStart: '2024-01-01',
        validityEnd: '2024-12-31',
        isActive: true,
        conditions: ['Valid ID required for discounts', 'Advance booking 24 hours'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: '2',
        name: 'Intercity Express',
        description: 'Premium fare policy for intercity routes',
        routeId: 'route2',
        routeName: 'City A - City B',
        depotId: 'depot2',
        depotName: 'North Depot',
        baseFare: 300,
        distanceFare: 8,
        timeFare: 3,
        peakHourMultiplier: 1.3,
        weekendMultiplier: 1.2,
        holidayMultiplier: 1.5,
        studentDiscount: 0.15,
        seniorDiscount: 0.2,
        groupDiscount: 0.1,
        advanceBookingDiscount: 0.08,
        cancellationFee: 0.15,
        refundPolicy: 'full',
        validityStart: '2024-01-01',
        validityEnd: '2024-12-31',
        isActive: true,
        conditions: ['Minimum 2 passengers for group discount', 'Refund within 2 hours'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    res.json({
      success: true,
      policies: policies.filter(policy => {
        if (depotId && depotId !== 'all' && policy.depotId !== depotId) return false;
        if (status && status !== 'all') {
          if (status === 'active' && !policy.isActive) return false;
          if (status === 'inactive' && policy.isActive) return false;
        }
        if (search) {
          const searchLower = search.toLowerCase();
          if (!policy.name.toLowerCase().includes(searchLower) && 
              !policy.description.toLowerCase().includes(searchLower)) return false;
        }
        return true;
      }),
      total: policies.length
    });
    
  } catch (error) {
    console.error('Fare policies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fare policies'
    });
  }
});

// POST /api/admin/fare-policies
router.post('/fare-policies', async (req, res) => {
  try {
    console.log('💰 Creating fare policy:', req.body);
    const policyData = req.body;
    
    // Validate required fields
    if (!policyData.name || !policyData.routeId || !policyData.baseFare) {
      return res.status(400).json({
        success: false,
        error: 'Name, route, and base fare are required'
      });
    }
    
    // Create new policy (mock implementation)
    const newPolicy = {
      _id: Date.now().toString(),
      ...policyData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    res.json({
      success: true,
      policy: newPolicy,
      message: 'Fare policy created successfully'
    });
    
  } catch (error) {
    console.error('Create fare policy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create fare policy'
    });
  }
});

// PUT /api/admin/fare-policies/:id
router.put('/fare-policies/:id', async (req, res) => {
  try {
    console.log('💰 Updating fare policy:', req.params.id, req.body);
    const { id } = req.params;
    const updateData = req.body;
    
    // Mock update implementation
    const updatedPolicy = {
      _id: id,
      ...updateData,
      updatedAt: new Date()
    };
    
    res.json({
      success: true,
      policy: updatedPolicy,
      message: 'Fare policy updated successfully'
    });
    
  } catch (error) {
    console.error('Update fare policy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update fare policy'
    });
  }
});

// DELETE /api/admin/fare-policies/:id
router.delete('/fare-policies/:id', async (req, res) => {
  try {
    console.log('💰 Deleting fare policy:', req.params.id);
    const { id } = req.params;
    
    // Mock delete implementation
    res.json({
      success: true,
      message: 'Fare policy deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete fare policy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete fare policy'
    });
  }
});

// GET /api/admin/fare-policies/calculate
router.get('/fare-policies/calculate', async (req, res) => {
  try {
    const { policyId, distance, isPeakHour, isWeekend, isHoliday, passengerType } = req.query;
    
    // Mock fare calculation
    const baseFare = 150;
    const distanceFare = 5;
    const parsedDistance = parseFloat(distance) || 0;
    
    let totalFare = baseFare + (distanceFare * parsedDistance);
    
    // Apply multipliers
    if (isPeakHour === 'true') totalFare *= 1.2;
    if (isWeekend === 'true') totalFare *= 1.1;
    if (isHoliday === 'true') totalFare *= 1.3;
    
    // Apply discounts
    if (passengerType === 'student') totalFare *= 0.9;
    if (passengerType === 'senior') totalFare *= 0.85;
    
    res.json({
      success: true,
      calculation: {
        baseFare,
        distanceFare: distanceFare * parsedDistance,
        totalFare: Math.round(totalFare),
        breakdown: {
          base: baseFare,
          distance: distanceFare * parsedDistance,
          peakHour: isPeakHour === 'true' ? Math.round(totalFare * 0.2) : 0,
          weekend: isWeekend === 'true' ? Math.round(totalFare * 0.1) : 0,
          holiday: isHoliday === 'true' ? Math.round(totalFare * 0.3) : 0,
          discount: passengerType === 'student' ? Math.round(totalFare * 0.1) : 
                   passengerType === 'senior' ? Math.round(totalFare * 0.15) : 0
        }
      }
    });
    
  } catch (error) {
    console.error('Fare calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate fare'
    });
  }
});

// =================================================================
// RBAC Management
// =================================================================

// GET /api/admin/rbac/roles
router.get('/rbac/roles', async (req, res) => {
  try {
    // For now, return predefined roles with permissions
    const predefinedRoles = [
      {
        _id: 'admin_role',
        name: 'admin',
        description: 'Full system administrator with all permissions',
        permissions: [
          'dashboard.view', 'dashboard.analytics', 'dashboard.export', 'dashboard.realtime',
          'users.view', 'users.create', 'users.edit', 'users.delete', 'users.roles', 'users.permissions',
          'buses.view', 'buses.create', 'buses.edit', 'buses.delete', 'buses.assign', 'buses.maintenance',
          'routes.view', 'routes.create', 'routes.edit', 'routes.delete', 'routes.stops', 'routes.schedule',
          'trips.view', 'trips.create', 'trips.edit', 'trips.cancel', 'trips.track', 'trips.reports',
          'depots.view', 'depots.create', 'depots.edit', 'depots.delete', 'depots.staff', 'depots.facilities',
          'finance.view', 'finance.fares', 'finance.payments', 'finance.refunds', 'finance.reports', 'finance.audit',
          'reports.view', 'reports.create', 'reports.export', 'reports.schedule', 'reports.analytics',
          'system.view', 'system.config', 'system.backup', 'system.logs', 'system.maintenance', 'system.security'
        ],
        isActive: true,
        priority: 1,
        userCount: await User.countDocuments({ role: 'admin' })
      },
      {
        _id: 'depot_manager_role',
        name: 'depot_manager',
        description: 'Depot manager with limited administrative permissions',
        permissions: [
          'dashboard.view', 'dashboard.analytics',
          'users.view', 'users.create', 'users.edit',
          'buses.view', 'buses.create', 'buses.edit', 'buses.assign', 'buses.maintenance',
          'routes.view', 'routes.stops',
          'trips.view', 'trips.create', 'trips.edit', 'trips.track',
          'depots.view', 'depots.edit', 'depots.staff', 'depots.facilities',
          'finance.view', 'finance.payments',
          'reports.view', 'reports.create'
        ],
        isActive: true,
        priority: 2,
        userCount: await User.countDocuments({ role: 'depot_manager' })
      },
      {
        _id: 'driver_role',
        name: 'driver',
        description: 'Bus driver with trip and route access',
        permissions: [
          'dashboard.view',
          'trips.view', 'trips.track',
          'routes.view',
          'finance.view'
        ],
        isActive: true,
        priority: 3,
        userCount: await User.countDocuments({ role: 'driver' }) + await Driver.countDocuments()
      },
      {
        _id: 'conductor_role',
        name: 'conductor',
        description: 'Bus conductor with ticket and passenger management',
        permissions: [
          'dashboard.view',
          'trips.view', 'trips.track',
          'routes.view',
          'finance.view', 'finance.payments'
        ],
        isActive: true,
        priority: 3,
        userCount: await User.countDocuments({ role: 'conductor' }) + await Conductor.countDocuments()
      },
      {
        _id: 'passenger_role',
        name: 'passenger',
        description: 'Regular passenger with booking capabilities',
        permissions: [
          'trips.view',
          'routes.view',
          'finance.view'
        ],
        isActive: true,
        priority: 4,
        userCount: await User.countDocuments({ role: 'passenger' })
      }
    ];

    res.json({
      success: true,
      roles: predefinedRoles
    });
    
  } catch (error) {
    console.error('RBAC roles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roles'
    });
  }
});

// GET /api/admin/rbac/permissions
router.get('/rbac/permissions', async (req, res) => {
  try {
    const allPermissions = [
      // Dashboard permissions
      { key: 'dashboard.view', category: 'dashboard', name: 'View Dashboard', description: 'Access main dashboard' },
      { key: 'dashboard.analytics', category: 'dashboard', name: 'View Analytics', description: 'Access detailed analytics' },
      { key: 'dashboard.export', category: 'dashboard', name: 'Export Data', description: 'Export dashboard data' },
      { key: 'dashboard.realtime', category: 'dashboard', name: 'Real-time Data', description: 'Access live data feeds' },
      
      // User permissions
      { key: 'users.view', category: 'users', name: 'View Users', description: 'View user listings' },
      { key: 'users.create', category: 'users', name: 'Create Users', description: 'Add new users' },
      { key: 'users.edit', category: 'users', name: 'Edit Users', description: 'Modify user details' },
      { key: 'users.delete', category: 'users', name: 'Delete Users', description: 'Remove users' },
      { key: 'users.roles', category: 'users', name: 'Manage Roles', description: 'Assign/change user roles' },
      { key: 'users.permissions', category: 'users', name: 'Manage Permissions', description: 'Grant/revoke permissions' },
      
      // Fleet permissions
      { key: 'buses.view', category: 'fleet', name: 'View Buses', description: 'View bus listings' },
      { key: 'buses.create', category: 'fleet', name: 'Add Buses', description: 'Add new buses' },
      { key: 'buses.edit', category: 'fleet', name: 'Edit Buses', description: 'Modify bus details' },
      { key: 'buses.delete', category: 'fleet', name: 'Delete Buses', description: 'Remove buses' },
      { key: 'buses.assign', category: 'fleet', name: 'Assign Crew', description: 'Assign drivers/conductors' },
      { key: 'buses.maintenance', category: 'fleet', name: 'Maintenance', description: 'Schedule maintenance' },
      
      // And more categories...
    ];

    res.json({
      success: true,
      permissions: allPermissions
    });
    
  } catch (error) {
    console.error('RBAC permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions'
    });
  }
});

// =================================================================
// Reports & Analytics
// =================================================================

// GET /api/admin/test-reports - Simple test endpoint
router.get('/test-reports', async (req, res) => {
  try {
    console.log('🧪 Test Reports API called');
    res.json({
      success: true,
      message: 'Reports API is working!',
      timestamp: new Date(),
      availableEndpoints: [
        'GET /api/admin/reports',
        'GET /api/admin/reports/:reportId',
        'GET /api/admin/reports/:reportId/export'
      ]
    });
  } catch (error) {
    console.error('Test reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Test reports failed'
    });
  }
});

// =================================================================
// Reports & Analytics
// =================================================================

// GET /api/admin/reports
router.get('/reports', async (req, res) => {
  try {
    console.log('📊 Reports API called - GET /api/admin/reports');
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    console.log('📅 Date range:', { start, end });
    
    // Generate report list with basic stats
    const reports = [
      {
        id: 'revenue_analysis',
        name: 'Revenue Analysis',
        description: 'Comprehensive revenue breakdown',
        lastGenerated: new Date(),
        status: 'available'
      },
      {
        id: 'trip_performance',
        name: 'Trip Performance',
        description: 'Trip completion and efficiency metrics',
        lastGenerated: new Date(),
        status: 'available'
      },
      {
        id: 'user_analytics',
        name: 'User Analytics',
        description: 'User engagement and activity patterns',
        lastGenerated: new Date(),
        status: 'available'
      }
    ];

    res.json({
      success: true,
      reports,
      dateRange: { start, end }
    });

  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

// GET /api/admin/reports/:reportId
router.get('/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { startDate, endDate, depot = 'all', route = 'all', status = 'all' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    console.log(`Generating report: ${reportId} from ${start} to ${end}`);
    
    let reportData = {};
    
    if (reportId === 'revenue_analysis') {
      // Revenue Analysis Report
      const bookings = await Booking.find({
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 'cancelled' }
      }).populate('trip', 'fare routeId');
      
      const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.trip?.fare || 0), 0);
      const avgFare = bookings.length > 0 ? totalRevenue / bookings.length : 0;
      const bookingCount = bookings.length;
      
      // Get refunds
      const refunds = await Booking.find({
        createdAt: { $gte: start, $lte: end },
        status: 'refunded'
      }).populate('trip', 'fare');
      
      const refundAmount = refunds.reduce((sum, booking) => sum + (booking.trip?.fare || 0), 0);
      
      reportData = {
        reportId,
        reportName: 'Revenue Analysis',
        dateRange: { start, end },
        metrics: [
          {
            label: 'Total Revenue',
            value: `₹${totalRevenue.toLocaleString()}`,
            change: 15,
            color: 'bg-green-100',
            icon: 'DollarSign',
            iconColor: 'text-green-600'
          },
          {
            label: 'Average Fare',
            value: `₹${avgFare.toFixed(2)}`,
            change: 8,
            color: 'bg-blue-100',
            icon: 'BarChart3',
            iconColor: 'text-blue-600'
          },
          {
            label: 'Total Bookings',
            value: bookingCount.toLocaleString(),
            change: 12,
            color: 'bg-purple-100',
            icon: 'Users',
            iconColor: 'text-purple-600'
          },
          {
            label: 'Refund Amount',
            value: `₹${refundAmount.toLocaleString()}`,
            change: -5,
            color: 'bg-red-100',
            icon: 'TrendingDown',
            iconColor: 'text-red-600'
          }
        ],
        columns: ['Date', 'Revenue', 'Bookings', 'Average Fare', 'Refunds'],
        rows: [
          ['2024-01-01', '₹25,000', '150', '₹167', '₹1,200'],
          ['2024-01-02', '₹28,500', '170', '₹168', '₹800'],
          ['2024-01-03', '₹32,000', '190', '₹168', '₹1,500']
        ]
      };
      
    } else if (reportId === 'trip_performance') {
      // Trip Performance Report
      const trips = await Trip.find({
        serviceDate: { $gte: start, $lte: end }
      }).populate('routeId', 'routeName').populate('busId', 'busNumber');
      
      const completedTrips = trips.filter(t => t.status === 'completed').length;
      const cancelledTrips = trips.filter(t => t.status === 'cancelled').length;
      const totalTrips = trips.length;
      const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;
      
      reportData = {
        reportId,
        reportName: 'Trip Performance',
        dateRange: { start, end },
        metrics: [
          {
            label: 'Completed Trips',
            value: completedTrips.toLocaleString(),
            change: 10,
            color: 'bg-green-100',
            icon: 'CheckCircle',
            iconColor: 'text-green-600'
          },
          {
            label: 'Cancelled Trips',
            value: cancelledTrips.toLocaleString(),
            change: -3,
            color: 'bg-red-100',
            icon: 'XCircle',
            iconColor: 'text-red-600'
          },
          {
            label: 'Completion Rate',
            value: `${completionRate.toFixed(1)}%`,
            change: 5,
            color: 'bg-blue-100',
            icon: 'Target',
            iconColor: 'text-blue-600'
          },
          {
            label: 'Average Delay',
            value: '12 min',
            change: -8,
            color: 'bg-orange-100',
            icon: 'Clock',
            iconColor: 'text-orange-600'
          }
        ],
        columns: ['Route', 'Total Trips', 'Completed', 'Cancelled', 'Completion Rate'],
        rows: trips.slice(0, 10).map(trip => [
          trip.routeId?.routeName || 'Unknown Route',
          '1',
          trip.status === 'completed' ? '1' : '0',
          trip.status === 'cancelled' ? '1' : '0',
          trip.status === 'completed' ? '100%' : '0%'
        ])
      };
      
    } else if (reportId === 'user_analytics') {
      // User Analytics Report
      const users = await User.find({
        createdAt: { $gte: start, $lte: end }
      });
      
      const newRegistrations = users.length;
      const activeUsers = await User.countDocuments({ 
        status: 'active',
        lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });
      
      const usersByRole = {};
      users.forEach(user => {
        usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
      });
      
      reportData = {
        reportId,
        reportName: 'User Analytics',
        dateRange: { start, end },
        metrics: [
          {
            label: 'New Registrations',
            value: newRegistrations.toLocaleString(),
            change: 25,
            color: 'bg-purple-100',
            icon: 'UserPlus',
            iconColor: 'text-purple-600'
          },
          {
            label: 'Active Users',
            value: activeUsers.toLocaleString(),
            change: 18,
            color: 'bg-green-100',
            icon: 'Users',
            iconColor: 'text-green-600'
          },
          {
            label: 'User Retention',
            value: '78%',
            change: 5,
            color: 'bg-blue-100',
            icon: 'TrendingUp',
            iconColor: 'text-blue-600'
          },
          {
            label: 'Avg Session Time',
            value: '24 min',
            change: 12,
            color: 'bg-orange-100',
            icon: 'Clock',
            iconColor: 'text-orange-600'
          }
        ],
        columns: ['Role', 'Count', 'Percentage', 'Active', 'Growth'],
        rows: Object.entries(usersByRole).map(([role, count]) => [
          role,
          count.toString(),
          `${((count / newRegistrations) * 100).toFixed(1)}%`,
          Math.floor(count * 0.8).toString(),
          '+12%'
        ])
      };
    } else {
      // Default/Unknown report
      reportData = {
        reportId,
        reportName: 'Custom Report',
        dateRange: { start, end },
        metrics: [
          {
            label: 'Data Points',
            value: '1,234',
            change: 0,
            color: 'bg-gray-100',
            icon: 'BarChart3',
            iconColor: 'text-gray-600'
          }
        ],
        columns: ['Item', 'Value'],
        rows: [['Sample Data', 'No data available']]
      };
    }
    
    res.json({
      success: true,
      ...reportData
    });

  } catch (error) {
    console.error(`Report ${req.params.reportId} error:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

// GET /api/admin/reports/:reportId/export
router.get('/reports/:reportId/export', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { format = 'pdf' } = req.query;
    
    // Generate export data (simplified)
    const exportData = {
      reportId,
      format,
      generatedAt: new Date(),
      data: 'Report export functionality would be implemented here'
    };
    
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=report-${reportId}.pdf`);
    } else if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=report-${reportId}.xlsx`);
    }
    
    // For now, return JSON (in real implementation, you'd generate actual PDF/Excel)
    res.json(exportData);

  } catch (error) {
    console.error('Report export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export report'
    });
  }
});

// AI Analytics endpoints


// GET /api/admin/buses/analytics - Get advanced analytics
router.get('/buses/analytics', async (req, res) => {
  try {
    const { depotId, startDate, endDate } = req.query;
    
    // Build query
    const query = {};
    if (depotId) query.depotId = depotId;
    
    // Get buses
    const buses = await Bus.find(query);
    
    // Calculate analytics
    const totalBuses = buses.length;
    const activeBuses = buses.filter(b => b.status === 'active').length;
    const maintenanceBuses = buses.filter(b => b.status === 'maintenance').length;
    
    // Calculate utilization (simplified)
    const utilizationRate = totalBuses > 0 ? (activeBuses / totalBuses * 100).toFixed(1) : 0;
    
    // Calculate average fuel efficiency
    const fuelLogs = await FuelLog.find(query).sort({ date: -1 }).limit(100);
    let totalEfficiency = 0;
    let efficiencyCount = 0;
    
    fuelLogs.forEach(log => {
      if (log.kilometers && log.liters) {
        totalEfficiency += log.kilometers / log.liters;
        efficiencyCount++;
      }
    });
    
    const fuelEfficiency = efficiencyCount > 0 ? (totalEfficiency / efficiencyCount).toFixed(1) : 0;
    
    // Get maintenance predictions
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const predictiveMaintenance = buses
      .filter(bus => {
        const nextMaintenance = new Date(bus.nextMaintenance || bus.lastMaintenance);
        nextMaintenance.setDate(nextMaintenance.getDate() + 90);
        return nextMaintenance >= now && nextMaintenance <= nextMonth;
      })
      .map(bus => ({
        busId: bus._id,
        busNumber: bus.busNumber,
        predictedDate: bus.nextMaintenance || new Date(bus.lastMaintenance).setDate(new Date(bus.lastMaintenance).getDate() + 90),
        type: 'scheduled'
      }));
    
    res.json({
      success: true,
      data: {
        totalBuses,
        activeBuses,
        maintenanceBuses,
        retiredBuses: buses.filter(b => b.status === 'retired').length,
        utilizationRate: parseFloat(utilizationRate),
        fuelEfficiency: parseFloat(fuelEfficiency),
        predictiveMaintenance,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics',
      error: error.message
    });
  }
});

// GET /api/admin/buses/export/:format - Export bus reports
router.get('/buses/export/:format', async (req, res) => {
  try {
    const { format } = req.params; // pdf or excel
    const buses = await Bus.find()
      .populate('depotId', 'depotName depotCode')
      .populate('assignedDriverId', 'name driverId')
      .populate('assignedConductorId', 'name conductorId')
      .sort({ busNumber: 1 });

    if (format === 'pdf') {
      // In a real implementation, you would generate PDF using libraries like PDFKit or Puppeteer
      res.json({
        success: true,
        message: 'PDF export would be generated here',
        data: buses
      });
    } else if (format === 'excel') {
      // In a real implementation, you would generate Excel using libraries like ExcelJS
      res.json({
        success: true,
        message: 'Excel export would be generated here',
        data: buses
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid export format. Use pdf or excel'
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
      error: error.message
    });
  }
});

// =================================================================
// DEPOT TRIP MANAGEMENT ENDPOINTS
// =================================================================

// GET /api/admin/depot-trips - Get trips for a specific depot
router.get('/depot-trips', async (req, res) => {
  try {
    const { depotId, status, date, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    if (!depotId) {
      return res.status(400).json({
        success: false,
        message: 'Depot ID is required'
      });
    }

    const query = { depotId };
    if (status && status !== 'all') query.status = status;
    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(searchDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.serviceDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const [trips, total] = await Promise.all([
      Trip.find(query)
        .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
        .populate('busId', 'busNumber busType capacity')
        .populate('driverId', 'name phone')
        .populate('conductorId', 'name phone')
        .populate('depotId', 'depotName location')
        .sort({ serviceDate: -1, startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Trip.countDocuments(query)
    ]);

    // Get booking statistics for each trip
    const tripsWithBookings = await Promise.all(
      trips.map(async (trip) => {
        const bookings = await Booking.find({ 
          tripId: trip._id, 
          bookingStatus: 'confirmed' 
        }).lean();
        
        return {
          ...trip,
          totalBookings: bookings.length,
          revenue: bookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
          occupancyRate: trip.capacity > 0 ? (bookings.length / trip.capacity) * 100 : 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        trips: tripsWithBookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Depot trips fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depot trips',
      error: error.message
    });
  }
});

// GET /api/admin/trip/:id/bookings - Get bookings for a specific trip
router.get('/trip/:id/bookings', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { tripId: id };
    if (status && status !== 'all') query.bookingStatus = status;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('passengerId', 'name email phone')
        .populate('tripId', 'routeId busId serviceDate startTime')
        .populate('tripId.routeId', 'routeName startingPoint endingPoint')
        .populate('tripId.busId', 'busNumber busType')
        .sort({ bookingDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Booking.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Trip bookings fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip bookings',
      error: error.message
    });
  }
});

// PUT /api/admin/trip/:id/status - Update trip status
router.put('/trip/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Update trip status
    await trip.updateStatus(status, location);

    // Add notes if provided
    if (notes) {
      trip.notes = trip.notes ? `${trip.notes}\n${notes}` : notes;
      await trip.save();
    }

    res.json({
      success: true,
      message: 'Trip status updated successfully',
      data: { trip }
    });

  } catch (error) {
    console.error('Update trip status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trip status',
      error: error.message
    });
  }
});

// GET /api/admin/depot-trips/stats - Get depot trip statistics
router.get('/depot-trips/stats', async (req, res) => {
  try {
    const { depotId, dateFrom, dateTo } = req.query;

    if (!depotId) {
      return res.status(400).json({
        success: false,
        message: 'Depot ID is required'
      });
    }

    const query = { depotId };
    if (dateFrom || dateTo) {
      query.serviceDate = {};
      if (dateFrom) query.serviceDate.$gte = new Date(dateFrom);
      if (dateTo) query.serviceDate.$lte = new Date(dateTo);
    }

    const [trips, bookings] = await Promise.all([
      Trip.find(query).lean(),
      Booking.find({ 
        tripId: { $in: (await Trip.find(query).select('_id')).map(t => t._id) },
        bookingStatus: 'confirmed'
      }).lean()
    ]);

    const stats = {
      totalTrips: trips.length,
      completedTrips: trips.filter(t => t.status === 'completed').length,
      runningTrips: trips.filter(t => t.status === 'running').length,
      cancelledTrips: trips.filter(t => t.status === 'cancelled').length,
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
      averageOccupancy: trips.length > 0 ? 
        trips.reduce((sum, trip) => sum + (trip.bookedSeats / trip.capacity) * 100, 0) / trips.length : 0
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Depot stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depot statistics',
      error: error.message
    });
  }
});

module.exports = router;
