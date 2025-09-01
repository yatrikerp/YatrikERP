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
const { auth, requireRole } = require('../middleware/auth');

// Helper function to create role-based auth middleware
const authRole = (roles) => [auth, requireRole(roles)];

// Admin authentication middleware
const adminAuth = authRole(['admin', 'ADMIN', 'Admin']);

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
      notes
    } = req.body;

    // Validation
    if (!routeNumber || !routeName || !startingPoint || !endingPoint || !depotId) {
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
    const depot = await Depot.findById(depotId);
    if (!depot) {
      return res.status(400).json({
        success: false,
        message: 'Depot not found'
      });
    }

    // Create route
    const route = await Route.create({
      routeNumber,
      routeName,
      startingPoint,
      endingPoint,
      intermediateStops: intermediateStops || [],
      totalDistance,
      estimatedDuration,
      baseFare: baseFare || calculateBaseFare(totalDistance),
      busType: busType || 'ac_seater',
      depotId,
      status,
      amenities,
      operatingHours,
      frequency,
      notes,
      createdBy: req.user._id,
      popularity: 0
    });

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: route
    });

  } catch (error) {
    console.error('Route creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create route',
      error: error.message
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
    const updateData = req.body;

    // Remove immutable fields
    delete updateData.routeNumber;
    delete updateData.createdBy;

    const route = await Route.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    res.json({
      success: true,
      message: 'Route updated successfully',
      data: route
    });

  } catch (error) {
    console.error('Route update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update route',
      error: error.message
    });
  }
});

// DELETE /api/admin/routes/:id - Delete route (soft delete)
router.delete('/routes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if route has active trips
    const activeTrips = await Trip.countDocuments({
      routeId: id,
      status: { $in: ['scheduled', 'running'] }
    });

    if (activeTrips > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete route with ${activeTrips} active trips`
      });
    }

    // Soft delete by updating status
    const route = await Route.findByIdAndUpdate(
      id,
      { status: 'inactive', deletedAt: new Date(), deletedBy: req.user._id },
      { new: true }
    );

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    res.json({
      success: true,
      message: 'Route deleted successfully'
    });

  } catch (error) {
    console.error('Route deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete route',
      error: error.message
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

// =================================================================
// 11) Bus Management
// =================================================================

// GET /api/admin/buses
router.get('/buses', async (req, res) => {
  try {
    const { status, depot, busType, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (depot && depot !== 'all') query.depotId = depot;
    if (busType && busType !== 'all') query.busType = busType;

    const [buses, total] = await Promise.all([
      Bus.find(query)
        .populate('depotId', 'name code')
        .populate('assignedDriver', 'name email phone')
        .populate('assignedConductor', 'name email phone')
        .populate('currentTrip', 'routeId serviceDate startTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Bus.countDocuments(query)
    ]);

    res.json({
      buses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Buses fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch buses' });
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
    if (assignedDriver) {
      const driver = await User.findById(assignedDriver);
      if (!driver || driver.role !== 'driver') {
        return res.status(400).json({
          success: false,
          message: 'Invalid driver assignment'
        });
      }
    }

    if (assignedConductor) {
      const conductor = await User.findById(assignedConductor);
      if (!conductor || conductor.role !== 'conductor') {
        return res.status(400).json({
          success: false,
          message: 'Invalid conductor assignment'
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
      assignedDriver,
      assignedConductor,
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
    const totalCapacity = activeBusesData.reduce((sum, bus) => sum + (bus.capacity.total || 0), 0);
    const averageUtilization = totalCapacity > 0 ? Math.round((activeBuses / totalCapacity) * 100) : 0;

    // Calculate fuel efficiency
    const fuelEfficiency = activeBusesData.reduce((sum, bus) => 
      sum + (bus.specifications?.mileage || 0), 0) / Math.max(activeBuses, 1);

    // Calculate maintenance cost
    const maintenanceCost = await Bus.aggregate([
      { $unwind: '$maintenance.issues' },
      { $group: { _id: null, totalCost: { $sum: '$maintenance.issues.cost' } } }
    ]).then(result => result[0]?.totalCost || 0);

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

module.exports = router;
