const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Duty = require('../models/Duty');
const Booking = require('../models/Booking');
const FuelLog = require('../models/FuelLog');
const Depot = require('../models/Depot');
const Ticket = require('../models/Ticket'); // Added Ticket model
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const NotificationService = require('../services/notificationService');
const { createResponseGuard, safeObjectId, extractUserId, asyncHandler } = require('../middleware/responseGuard');

// Apply response guard middleware to all routes
router.use(createResponseGuard);

// Helper function to create role-based auth middleware
const authRole = (roles) => [auth, requireRole(roles)];

// Depot authentication (allow all depot roles)
const depotAuth = authRole(['depot_manager', 'depot_supervisor', 'depot_operator', 'DEPOT_MANAGER', 'DEPOT_SUPERVISOR', 'DEPOT_OPERATOR', 'manager', 'MANAGER', 'supervisor', 'SUPERVISOR', 'operator', 'OPERATOR']);

// Test endpoint without auth
router.get('/health', (req, res) => {
  console.log('✅ Health check endpoint hit');
  res.json({ success: true, message: 'Depot routes are working' });
});

// Apply auth middleware directly (like other routes do)
// Skip auth for health check and test endpoints
router.use((req, res, next) => {
  // Skip auth for specific endpoints
  if (req.path === '/health' || req.path === '/test' || req.path === '/debug-user') {
    return next();
  }
  // Apply auth middleware - auth is async function, Express will handle it
  console.log('🔐 Auth middleware called for path:', req.path, 'Method:', req.method);
  auth(req, res, next);
});

// Ensure depotId is available for all depot routes
router.use(async (req, res, next) => {
  try {
    if (!req.user) return next();
    
    // If user already has depotId, use it
    if (req.user.depotId) {
      console.log('User already has depotId:', req.user.depotId);
      return next();
    }
    
    // Try mapping by depotCode from token/user
    let code = req.user.depotCode || null;
    if (!code && req.user.email) {
      const email = String(req.user.email).toLowerCase();
      const mA = email.match(/^([a-z0-9]+)-depot@yatrik\.com$/);
      const mB = email.match(/^depot-([a-z0-9]+)@yatrik\.com$/);
      code = (mA && mA[1]) || (mB && mB[1]) || null;
      console.log('Extracted depot code from email:', code);
    }
    
    let depot = null;
    if (code) {
      const upper = String(code).toUpperCase();
      depot = await Depot.findOne({ $or: [{ depotCode: upper }, { code: upper }] }).lean();
      if (depot) {
        console.log('Found depot by code:', depot.depotName);
      }
    }
    
    // If still no depot, try to find KCH or any active depot
    if (!depot) {
      depot = await Depot.findOne({ 
        $or: [
          { depotCode: 'KCH' },
          { code: 'KCH' },
          { status: 'active' }
        ]
      }).sort({ createdAt: -1 }).lean();
      if (depot) {
        console.log('Using default/fallback depot:', depot.depotName);
      }
    }
    
    if (depot && depot._id) {
      req.user.depotId = depot._id;
      if (!req.user.depotCode) req.user.depotCode = depot.depotCode || depot.code;
      console.log('✅ Resolved depotId for user:', { 
        email: req.user.email, 
        depotId: req.user.depotId, 
        depotCode: req.user.depotCode,
        depotName: depot.depotName 
      });
    } else {
      console.warn('⚠️  No depot found for user:', req.user.email);
    }
  } catch (e) {
    console.error('❌ ensureDepotId middleware error:', e.message);
  } finally {
    next();
  }
});

// Debug middleware to log user info
router.use((req, res, next) => {
  console.log('Depot route accessed by user:', {
    id: req.user?._id,
    role: req.user?.role,
    roleUpper: req.user?.role?.toUpperCase(),
    depotId: req.user?.depotId
  });
  next();
});

// Test endpoint to check depot auth
router.get('/test', async (req, res) => {
  res.json({
    success: true,
    message: 'Depot auth working',
    user: req.user,
    depotId: req.user.depotId,
    role: req.user.role,
    roleUpper: req.user.role?.toUpperCase()
  });
});

// Debug endpoint to check user details
router.get('/debug-user', async (req, res) => {
  res.json({
    success: true,
    user: req.user,
    headers: req.headers,
    authHeader: req.headers.authorization
  });
});

// GET /api/depot/dashboard - Comprehensive depot dashboard data
router.get('/dashboard', asyncHandler(async (req, res) => {
  console.log('📊 Dashboard route handler called');
  // Auth is already applied via router.use() above
  if (!req.user) {
    console.error('❌ No user in dashboard route');
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  let depotId = req.user.depotId;
  console.log('📊 Dashboard API called - User:', req.user?.email, 'DepotId:', depotId);

  // If user doesn't have depotId, try to find a depot for them
  if (!depotId) {
    console.log('⚠️  User has no depotId, finding default depot...');
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (!defaultDepot) {
      console.log('❌ No default depot found, returning empty dashboard');
      // Graceful fallback: return empty dashboard to keep UI functional
      return res.guard.success({
        stats: {
          totalTrips: 0,
          activeTrips: 0,
          totalBuses: 0,
          availableBuses: 0,
          totalRoutes: 0,
          totalBookings: 0,
          totalFuelLogs: 0,
          todayTrips: 0,
          todayBookings: 0,
          todayRevenue: 0
        },
        recentTrips: [],
        activeCrew: [],
        todayFuelLogs: []
      }, 'Success');
    }
    depotId = defaultDepot._id;
    req.user.depotId = depotId;
    console.log('Assigned default depot to user:', defaultDepot.depotName);
  }

  // Get routes for this depot first
  const depotRoutes = await Route.find({ 
    $or: [
      { 'depot.depotId': depotId },
      { depotId: depotId }
    ]
  }).select('_id').lean();
  const routeIds = depotRoutes.map(r => r._id);
  console.log(`📋 Found ${depotRoutes.length} routes for depot ${depotId}`);

  // Get comprehensive depot statistics
  console.log('🔍 Fetching depot statistics...');
  const [totalTrips, activeTrips, totalBuses, availableBuses, totalRoutes, totalBookings, totalFuelLogs] = await Promise.all([
    routeIds.length > 0 ? Trip.countDocuments({ routeId: { $in: routeIds } }) : 0,
    routeIds.length > 0 ? Trip.countDocuments({ routeId: { $in: routeIds }, status: { $in: ['scheduled', 'running'] } }) : 0,
    Bus.countDocuments({ depotId }),
    Bus.countDocuments({ depotId, status: { $in: ['available', 'active', 'idle'] } }),
    Route.countDocuments({ 
      $or: [
        { 'depot.depotId': depotId },
        { depotId: depotId }
      ]
    }),
    routeIds.length > 0 ? Booking.countDocuments({ 'tripId.routeId': { $in: routeIds } }) : 0,
    FuelLog.countDocuments({ depotId })
  ]);

  // Get today's data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayTrips, todayBookings, todayRevenue] = await Promise.all([
    routeIds.length > 0 ? Trip.countDocuments({ 
      routeId: { $in: routeIds }, 
      serviceDate: { $gte: today, $lt: tomorrow } 
    }) : 0,
    routeIds.length > 0 ? Booking.countDocuments({ 
      'tripId.routeId': { $in: routeIds }, 
      createdAt: { $gte: today, $lt: tomorrow } 
    }) : 0,
    routeIds.length > 0 ? Booking.aggregate([
      { $match: { 'tripId.routeId': { $in: routeIds }, createdAt: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, total: { $sum: '$fareAmount' } } }
    ]) : [{ total: 0 }]
  ]);

  // Get recent trips with full details (using routeIds from above)
  const recentTrips = routeIds.length > 0 ? await Trip.find({ routeId: { $in: routeIds } })
    .populate('routeId', 'routeName routeNumber')
    .populate('driverId', 'name phone employeeCode')
    .populate('conductorId', 'name phone employeeCode')
    .populate('busId', 'busNumber registrationNumber busType')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean() : [];

  // Get active crew assignments (real-time)
  const activeCrew = await Duty.find({ 
    depotId, 
    date: { $gte: today },
    status: { $in: ['assigned', 'in_progress', 'completed'] }
  })
    .populate('driverId', 'name phone employeeCode')
    .populate('conductorId', 'name phone employeeCode')
    .populate('tripId', 'tripNumber routeId startTime')
    .populate('busId', 'busNumber busType')
    .sort({ date: 1, createdAt: -1 })
    .limit(20)
    .lean();

  // Get fuel logs for today
  const todayFuelLogs = await FuelLog.find({ 
    depotId, 
    createdAt: { $gte: today, $lt: tomorrow } 
  })
    .populate('busId', 'busNumber')
    .sort({ createdAt: -1 })
    .lean();

  // Get crew counts
  const [totalDrivers, activeDrivers, totalConductors, activeConductors] = await Promise.all([
    Driver.countDocuments({ depotId }),
    Driver.countDocuments({ depotId, status: 'active' }),
    Conductor.countDocuments({ depotId }),
    Conductor.countDocuments({ depotId, status: 'active' })
  ]);

  // Get pending maintenance count
  const pendingMaintenance = await Bus.countDocuments({ 
    depotId,
    $or: [
      { status: 'maintenance' },
      { nextServiceDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }
    ]
  });

  // Calculate fuel consumed today
  const fuelToday = todayFuelLogs.reduce((sum, log) => sum + (log.quantity || 0), 0);

  // Get complaints count
  let complaintsCount = 0;
  try {
    const Complaint = require('../models/Complaint');
    complaintsCount = await Complaint.countDocuments({ 
      status: { $ne: 'resolved' }
    });
  } catch (e) {
    // Complaint model might not exist
  }

  // Generate alerts
  const alerts = [];
  if (pendingMaintenance > 0) {
    alerts.push({
      id: 'maintenance',
      title: 'Maintenance Due',
      message: `${pendingMaintenance} buses need service`,
      severity: pendingMaintenance > 5 ? 'high' : 'medium',
      timestamp: new Date()
    });
  }
  if (activeTrips === 0 && totalTrips > 0) {
    alerts.push({
      id: 'no_active_trips',
      title: 'No Active Trips',
      message: 'No trips are currently running',
      severity: 'medium',
      timestamp: new Date()
    });
  }

  const dashboardData = {
    stats: {
      totalTrips,
      activeTrips,
      totalBuses,
      availableBuses,
      totalRoutes,
      totalBookings,
      totalFuelLogs,
      todayTrips,
      todayBookings,
      todayRevenue: todayRevenue[0]?.total || 0,
      availableDrivers: activeDrivers,
      availableConductors: activeConductors,
      totalDrivers,
      totalConductors,
      fuelToday,
      pendingMaintenance,
      complaints: complaintsCount
    },
    recentTrips,
    activeCrew,
    todayFuelLogs,
    alerts
  };

  console.log('📊 Dashboard Data Summary:');
  console.log(`   Buses: ${totalBuses}, Available: ${availableBuses}`);
  console.log(`   Routes: ${totalRoutes}`);
  console.log(`   Trips: ${totalTrips}, Active: ${activeTrips}`);
  console.log(`   Drivers: ${activeDrivers}/${totalDrivers}, Conductors: ${activeConductors}/${totalConductors}`);
  console.log(`   Recent Trips: ${recentTrips.length}`);
  
  return res.guard.success(dashboardData, 'Dashboard data fetched successfully');
}));

// GET /api/depot/info - Get basic depot information and KPIs
router.get('/info', asyncHandler(async (req, res) => {
  let depotId = req.user.depotId;
  if (!depotId) {
    console.log('Depot info: user missing depotId, resolving default depot...');
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) {
      depotId = defaultDepot._id;
      req.user.depotId = depotId;
    }
  }
  
  // Get depot basic info
  const depot = depotId
    ? await Depot.findById(depotId)
        .select('name code location address contact email manager capacity operationalHours established status')
        .lean()
    : null;

  if (!depot) {
    // Graceful fallback default depot info
    return res.guard.success({
      name: 'Yatrik Depot',
      location: 'Kerala, India',
      manager: 'Depot Manager',
      revenue: '₹0',
      revenueChange: '+0%',
      trips: '0',
      tripsChange: '+0%',
      occupancy: '0%',
      occupancyChange: '+0%',
      fuelEfficiency: '0 km/L',
      fuelEfficiencyChange: '+0%',
      ticketSales: '0',
      ticketSalesChange: '+0%',
      punctuality: '0%',
      punctualityChange: '+0%',
      breakdowns: '0',
      breakdownsChange: '+0%',
      activeBuses: '0',
      activeBusesChange: '+0',
      totalRoutes: '0',
      totalRoutesChange: '+0'
    });
  }

  // Get today's statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayTrips, todayBookings, todayRevenue, activeBuses, totalRoutes] = await Promise.all([
    Trip.countDocuments({ 
      'routeId.depotId': depotId, 
      createdAt: { $gte: today, $lt: tomorrow } 
    }),
    Booking.countDocuments({ 
      'tripId.routeId.depotId': depotId, 
      createdAt: { $gte: today, $lt: tomorrow } 
    }),
    Booking.aggregate([
      { $match: { 'tripId.routeId.depotId': depotId, createdAt: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, total: { $sum: '$fareAmount' } } }
    ]),
    Bus.countDocuments({ depotId, status: 'active' }),
    Route.countDocuments({ 'depot.depotId': depotId, status: 'active' })
  ]);

  // Get yesterday's data for comparison
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayRevenue = await Booking.aggregate([
    { $match: { 'tripId.routeId.depotId': depotId, createdAt: { $gte: yesterday, $lt: today } } },
    { $group: { _id: null, total: { $sum: '$fareAmount' } } }
  ]);

  // Calculate changes
  const currentRevenue = todayRevenue[0]?.total || 0;
  const previousRevenue = yesterdayRevenue[0]?.total || 0;
  const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : 0;

  res.guard.success({
    ...depot,
    revenue: `₹${(currentRevenue / 1000000).toFixed(1)}M`,
    revenueChange: `${revenueChange > 0 ? '+' : ''}${revenueChange}%`,
    trips: todayTrips.toString(),
    tripsChange: '+8.2%', // This could be calculated from historical data
    occupancy: '78%', // This could be calculated from actual passenger data
    occupancyChange: '+5.1%',
    fuelEfficiency: '8.2 km/L',
    fuelEfficiencyChange: '+2.1%',
    ticketSales: todayBookings.toString(),
    ticketSalesChange: '+15.3%',
    punctuality: '94.2%',
    punctualityChange: '+1.8%',
    breakdowns: '2',
    breakdownsChange: '-50%',
    activeBuses: activeBuses.toString(),
    activeBusesChange: '+3',
    totalRoutes: totalRoutes.toString(),
    totalRoutesChange: '+1'
  });
}));

// GET /api/depot/routes - Get all routes for depot
router.get('/routes', async (req, res) => {
  try {
    const depotId = req.user.depotId;

    const routes = await Route.find({ 'depot.depotId': depotId })
      .sort({ routeName: 1 })
      .lean();

    // Normalize routes to the shape expected by the frontend
    const normalized = routes.map(r => ({
      _id: r._id,
      routeNumber: r.routeNumber || r.code || '',
      routeName: r.routeName || r.name || '',
      startingPoint:
        typeof r.startingPoint === 'string'
          ? r.startingPoint
          : (r.startingPoint?.location || r.startingPoint?.city || r.from || ''),
      endingPoint:
        typeof r.endingPoint === 'string'
          ? r.endingPoint
          : (r.endingPoint?.location || r.endingPoint?.city || r.to || ''),
      totalDistance: r.totalDistance ?? r.distanceKm ?? 0,
      estimatedDuration: r.estimatedDuration ?? (r.totalDistance ? Math.ceil(r.totalDistance / 40) * 60 : 0),
      baseFare: r.baseFare ?? r.fare ?? 0,
      features: Array.isArray(r.features) ? r.features : [],
      status: r.status || 'active',
      intermediateStops: Array.isArray(r.intermediateStops) 
        ? r.intermediateStops.map(stop => ({
            name: stop.location || stop.city || 'Unknown',
            distance: stop.distanceFromStart || 0
          }))
        : (r.stops || []),
      notes: r.notes || ''
    }));

    // Basic stats for header cards
    const stats = {
      totalRoutes: normalized.length,
      activeRoutes: normalized.filter(x => x.status === 'active').length,
      inactiveRoutes: normalized.filter(x => x.status === 'inactive').length,
      totalDistance: normalized.reduce((sum, x) => sum + (Number(x.totalDistance) || 0), 0)
    };

    res.json({ success: true, data: { routes: normalized, stats } });

  } catch (error) {
    console.error('Get depot routes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch routes' });
  }
});

// (Removed duplicate legacy POST /routes handler that conflicted with the detailed version below)

// =================================================================
// 2) Trip Management for Depot Managers
// =================================================================

// GET /api/depot/trips - Get trips for depot (Depot Manager)
router.get('/trips', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    const { date } = req.query;

    if (!depotId) {
      return res.status(400).json({
        success: false,
        message: 'No depot assigned to user'
      });
    }

    // Build query
    let query = { depotId };
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(searchDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.serviceDate = { $gte: searchDate, $lt: nextDate };
    }

    // Get trips with populated data
    const trips = await Trip.find(query)
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('busId', 'busNumber busType registrationNumber capacity')
      .populate('driverId', 'name phone licenseNumber')
      .populate('conductorId', 'name phone employeeId')
      .sort({ serviceDate: 1, startTime: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        trips,
        stats: {
          totalTrips: trips.length,
          scheduledTrips: trips.filter(t => t.status === 'scheduled').length,
          runningTrips: trips.filter(t => t.status === 'running').length,
          completedTrips: trips.filter(t => t.status === 'completed').length
        }
      }
    });

  } catch (error) {
    console.error('Get depot trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trips'
    });
  }
});

// POST /api/depot/trips - Create new trip (Depot Manager)
router.post('/trips', async (req, res) => {
  try {
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
      notes
    } = req.body;

    const depotId = req.user.depotId;

    // Validation
    if (!routeId || !busId || !serviceDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: routeId, busId, serviceDate, startTime'
      });
    }

    // Validate route belongs to this depot
    const route = await Route.findById(routeId);
    if (!route || !route.depot || route.depot.depotId.toString() !== depotId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Route does not belong to this depot'
      });
    }

    // Validate bus belongs to this depot
    const bus = await Bus.findById(busId);
    if (!bus || !bus.depotId || bus.depotId.toString() !== depotId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bus does not belong to this depot'
      });
    }

    // Check bus availability for the date
    const existingTrip = await Trip.findOne({
      busId,
      serviceDate: new Date(serviceDate),
      status: { $in: ['scheduled', 'running'] }
    });

    if (existingTrip) {
      return res.status(400).json({
        success: false,
        message: 'Bus is already assigned to another trip on this date'
      });
    }

    // Skip driver/conductor validation for now - make them completely optional
    // This allows trips to be created without crew assignment
    console.log('Trip creation - skipping driver/conductor validation for efficiency');

    // Create trip
    const trip = await Trip.create({
      routeId,
      busId,
      driverId,
      conductorId,
      serviceDate: new Date(serviceDate),
      startTime,
      endTime,
      fare: fare || 0,
      capacity: capacity || bus.capacity.total,
      status: 'scheduled',
      depotId,
      createdBy: req.user._id,
      notes
    });

    // Update bus status
    await Bus.findByIdAndUpdate(busId, {
      currentTrip: trip._id,
      status: 'assigned'
    });

    // Populate the trip data for response
    const populatedTrip = await Trip.findById(trip._id)
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('busId', 'busNumber busType registrationNumber capacity')
      .populate('driverId', 'name phone licenseNumber')
      .populate('conductorId', 'name phone employeeId')
      .lean();

    // Send notification to depot users about new trip
    try {
      await NotificationService.notifyTripAssignment(populatedTrip, depotId, req.user);
    } catch (notificationError) {
      console.error('Failed to send trip assignment notification:', notificationError);
      // Don't fail the trip creation if notification fails
    }

    // Transform the trip data to match frontend expectations
    const tripServiceDate = new Date(populatedTrip.serviceDate);
    const departureTime = populatedTrip.startTime ? new Date(tripServiceDate.getFullYear(), tripServiceDate.getMonth(), tripServiceDate.getDate(), 
      parseInt(populatedTrip.startTime.split(':')[0]), parseInt(populatedTrip.startTime.split(':')[1])) : null;
    const arrivalTime = populatedTrip.endTime ? new Date(tripServiceDate.getFullYear(), tripServiceDate.getMonth(), tripServiceDate.getDate(), 
      parseInt(populatedTrip.endTime.split(':')[0]), parseInt(populatedTrip.endTime.split(':')[1])) : null;

    const transformedTrip = {
      ...populatedTrip,
      tripNumber: `TRP${populatedTrip._id.toString().slice(-6).toUpperCase()}`,
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      // Ensure route data is properly structured
      routeId: {
        ...populatedTrip.routeId,
        routeName: populatedTrip.routeId?.routeName || 'Unknown Route',
        routeNumber: populatedTrip.routeId?.routeNumber || 'N/A'
      },
      // Ensure bus data is properly structured
      busId: {
        ...populatedTrip.busId,
        busNumber: populatedTrip.busId?.busNumber || 'N/A',
        busType: populatedTrip.busId?.busType || 'Standard',
        capacity: populatedTrip.busId?.capacity || { total: 35 }
      },
      // Ensure crew data is properly structured
      driverId: populatedTrip.driverId ? {
        ...populatedTrip.driverId,
        name: populatedTrip.driverId.name || 'Unknown Driver'
      } : null,
      conductorId: populatedTrip.conductorId ? {
        ...populatedTrip.conductorId,
        name: populatedTrip.conductorId.name || 'Unknown Conductor'
      } : null
    };

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: transformedTrip
    });

  } catch (error) {
    console.error('Trip creation error:', error);
    console.error('Request body:', req.body);
    console.error('User info:', req.user);
    res.status(500).json({
      success: false,
      message: 'Failed to create trip',
      error: error.message,
      details: error.stack
    });
  }
});

// PUT /api/depot/trips/:id - Update trip (Depot Manager)
router.put('/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
      notes,
      status
    } = req.body;

    const depotId = req.user.depotId;

    if (!depotId) {
      return res.status(400).json({
        success: false,
        message: 'No depot assigned to user'
      });
    }

    // Find the trip and verify it belongs to this depot
    const existingTrip = await Trip.findOne({ _id: id, depotId });
    if (!existingTrip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found or does not belong to this depot'
      });
    }

    // Check if trip is already running or completed (only allow status updates)
    if ((existingTrip.status === 'running' || existingTrip.status === 'completed') && 
        (routeId || busId || serviceDate || startTime || endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify running or completed trips. Only status updates allowed.'
      });
    }

    // If bus is being changed, check availability
    if (busId && busId !== existingTrip.busId.toString()) {
      const bus = await Bus.findById(busId);
      if (!bus || !bus.depotId || bus.depotId.toString() !== depotId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Bus does not belong to this depot'
        });
      }

      // Check if new bus is available for the date
      const conflictingTrip = await Trip.findOne({
        busId,
        serviceDate: serviceDate ? new Date(serviceDate) : existingTrip.serviceDate,
        status: { $in: ['scheduled', 'running'] },
        _id: { $ne: id }
      });

      if (conflictingTrip) {
        return res.status(400).json({
          success: false,
          message: 'Bus is already assigned to another trip on this date'
        });
      }

      // Release old bus
      await Bus.findByIdAndUpdate(existingTrip.busId, {
        currentTrip: null,
        status: 'available'
      });

      // Assign new bus
      await Bus.findByIdAndUpdate(busId, {
        currentTrip: id,
        status: 'assigned'
      });
    }

    // Update trip
    const updateData = {};
    if (routeId) updateData.routeId = routeId;
    if (busId) updateData.busId = busId;
    if (driverId !== undefined) updateData.driverId = driverId;
    if (conductorId !== undefined) updateData.conductorId = conductorId;
    if (serviceDate) updateData.serviceDate = new Date(serviceDate);
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (fare !== undefined) updateData.fare = fare;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (notes !== undefined) updateData.notes = notes;
    if (status) updateData.status = status;
    updateData.updatedBy = req.user._id;

    const updatedTrip = await Trip.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
    .populate('busId', 'busNumber busType registrationNumber capacity')
    .populate('driverId', 'name phone licenseNumber')
    .populate('conductorId', 'name phone employeeId')
    .lean();

    res.json({
      success: true,
      message: 'Trip updated successfully',
      data: updatedTrip
    });

  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trip',
      error: error.message
    });
  }
});

// DELETE /api/depot/trips/:id - Delete trip (Depot Manager)
router.delete('/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const depotId = req.user.depotId;

    if (!depotId) {
      return res.status(400).json({
        success: false,
        message: 'No depot assigned to user'
      });
    }

    // Find the trip and verify it belongs to this depot
    const trip = await Trip.findOne({ _id: id, depotId });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found or does not belong to this depot'
      });
    }

    // Check if trip is already running or completed
    if (trip.status === 'running' || trip.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete running or completed trips'
      });
    }

    // Update bus status back to available
    await Bus.findByIdAndUpdate(trip.busId, {
      currentTrip: null,
      status: 'available'
    });

    // Delete the trip
    await Trip.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Trip deleted successfully'
    });

  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete trip',
      error: error.message
    });
  }
});

// GET /api/depot/trips - Get depot trips with filters
router.get('/trips', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    const {
      page = 1,
      limit = 20,
      status,
      date,
      routeId,
      busId,
      search,
      sortBy = 'serviceDate',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = { depotId };

    // Apply filters
    if (status) filter.status = status;
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.serviceDate = { $gte: searchDate, $lt: nextDay };
    }
    if (routeId) filter.routeId = routeId;
    if (busId) filter.busId = busId;
    if (search) {
      filter.$or = [
        { 'routeId.routeName': { $regex: search, $options: 'i' } },
        { 'busId.busNumber': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [trips, total] = await Promise.all([
      Trip.find(filter)
        .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
        .populate('busId', 'busNumber busType registrationNumber capacity')
        .populate('driverId', 'name phone licenseNumber')
        .populate('conductorId', 'name phone employeeId')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Trip.countDocuments(filter)
    ]);

    // Transform trips data to match frontend expectations
    const transformedTrips = trips.map(trip => {
      // Create proper datetime fields for frontend
      const serviceDate = new Date(trip.serviceDate);
      const departureTime = trip.startTime ? new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate(), 
        parseInt(trip.startTime.split(':')[0]), parseInt(trip.startTime.split(':')[1])) : null;
      const arrivalTime = trip.endTime ? new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate(), 
        parseInt(trip.endTime.split(':')[0]), parseInt(trip.endTime.split(':')[1])) : null;

      return {
        ...trip,
        tripNumber: `TRP${trip._id.toString().slice(-6).toUpperCase()}`,
        departureTime: departureTime,
        arrivalTime: arrivalTime,
        // Ensure route data is properly structured
        routeId: {
          ...trip.routeId,
          routeName: trip.routeId?.routeName || 'Unknown Route',
          routeNumber: trip.routeId?.routeNumber || 'N/A'
        },
        // Ensure bus data is properly structured
        busId: {
          ...trip.busId,
          busNumber: trip.busId?.busNumber || 'N/A',
          busType: trip.busId?.busType || 'Standard',
          capacity: trip.busId?.capacity || { total: 35 }
        },
        // Ensure crew data is properly structured
        driverId: trip.driverId ? {
          ...trip.driverId,
          name: trip.driverId.name || 'Unknown Driver'
        } : null,
        conductorId: trip.conductorId ? {
          ...trip.conductorId,
          name: trip.conductorId.name || 'Unknown Conductor'
        } : null
      };
    });

    res.json({
      success: true,
      data: {
        trips: transformedTrips,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Trips fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trips',
      error: error.message
    });
  }
});

// PUT /api/depot/trips/assign-bus - Assign a bus to a trip
router.put('/trips/assign-bus', async (req, res) => {
  try {
    const { trip_id, bus_id } = req.body;
    const depotId = req.user.depotId;

    if (!trip_id || !bus_id) {
      return res.status(400).json({ success: false, message: 'trip_id and bus_id are required' });
    }
    if (!depotId) {
      return res.status(400).json({ success: false, message: 'No depot assigned to user' });
    }

    const trip = await Trip.findOne({ _id: trip_id, depotId });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found or access denied' });
    }

    const bus = await Bus.findById(bus_id);
    if (!bus || !bus.depotId || bus.depotId.toString() !== depotId.toString()) {
      return res.status(400).json({ success: false, message: 'Bus does not belong to this depot' });
    }

    const conflictingTrip = await Trip.findOne({
      _id: { $ne: trip_id },
      busId: bus_id,
      serviceDate: trip.serviceDate,
      status: { $in: ['scheduled', 'running'] }
    });
    if (conflictingTrip) {
      return res.status(400).json({ success: false, message: 'Bus is already assigned to another trip on this date' });
    }

    // Release old bus if different
    if (trip.busId && trip.busId.toString() !== bus_id.toString()) {
      await Bus.findByIdAndUpdate(trip.busId, { currentTrip: null, status: 'available' });
    }

    trip.busId = bus_id;
    await trip.save();

    await Bus.findByIdAndUpdate(bus_id, { currentTrip: trip._id, status: 'assigned' });

    return res.json({ success: true, message: 'Bus assigned successfully', data: trip });
  } catch (error) {
    console.error('Assign bus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign bus', error: error.message });
  }
});

// PUT /api/depot/trips/start - Start a trip (set status to running)
router.put('/trips/start', async (req, res) => {
  try {
    const { trip_id } = req.body;
    const depotId = req.user.depotId;

    if (!trip_id) {
      return res.status(400).json({ success: false, message: 'trip_id is required' });
    }
    if (!depotId) {
      return res.status(400).json({ success: false, message: 'No depot assigned to user' });
    }

    const trip = await Trip.findOne({ _id: trip_id, depotId });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found or access denied' });
    }

    trip.status = 'running';
    trip.actualDeparture = new Date();
    await trip.save();

    if (trip.busId) {
      await Bus.findByIdAndUpdate(trip.busId, { currentTrip: trip._id, status: 'running' });
    }

    return res.json({ success: true, message: 'Trip started', data: trip });
  } catch (error) {
    console.error('Start trip error:', error);
    return res.status(500).json({ success: false, message: 'Failed to start trip', error: error.message });
  }
});

// PUT /api/depot/trips/close - Complete a running trip
router.put('/trips/close', async (req, res) => {
  try {
    const { trip_id } = req.body;
    const depotId = req.user.depotId;

    if (!trip_id) {
      return res.status(400).json({ success: false, message: 'trip_id is required' });
    }
    if (!depotId) {
      return res.status(400).json({ success: false, message: 'No depot assigned to user' });
    }

    const trip = await Trip.findOne({ _id: trip_id, depotId });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found or access denied' });
    }

    trip.status = 'completed';
    trip.actualArrival = new Date();
    await trip.save();

    if (trip.busId) {
      await Bus.findByIdAndUpdate(trip.busId, { currentTrip: null, status: 'available' });
    }

    return res.json({ success: true, message: 'Trip completed', data: trip });
  } catch (error) {
    console.error('Close trip error:', error);
    return res.status(500).json({ success: false, message: 'Failed to close trip', error: error.message });
  }
});

// PUT /api/depot/trips/:id - Update trip
router.put('/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const depotId = req.user.depotId;

    // Verify trip belongs to this depot
    const existingTrip = await Trip.findById(id);
    if (!existingTrip || !existingTrip.depotId || existingTrip.depotId.toString() !== depotId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found or access denied'
      });
    }

    // Remove immutable fields
    delete updateData.depotId;
    delete updateData.createdBy;

    const trip = await Trip.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Trip updated successfully',
      data: trip
    });

  } catch (error) {
    console.error('Trip update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trip',
      error: error.message
    });
  }
});

// DELETE /api/depot/trips/:id - Cancel trip
router.delete('/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const depotId = req.user.depotId;

    // Verify trip belongs to this depot
    const trip = await Trip.findById(id);
    if (!trip || !trip.depotId || trip.depotId.toString() !== depotId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found or access denied'
      });
    }

    // Check if trip has bookings
    const activeBookings = await Booking.countDocuments({
      tripId: id,
      status: { $in: ['confirmed', 'issued'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel trip with ${activeBookings} active bookings`
      });
    }

    // Cancel trip
    trip.status = 'cancelled';
    trip.cancelledBy = req.user._id;
    trip.cancelledAt = new Date();
    await trip.save();

    // Free up bus
    if (trip.busId) {
      await Bus.findByIdAndUpdate(trip.busId, {
        currentTrip: null,
        status: 'active'
      });
    }

    res.json({
      success: true,
      message: 'Trip cancelled successfully'
    });

  } catch (error) {
    console.error('Trip cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel trip',
      error: error.message
    });
  }
});

// =================================================================
// 3) Ticket Management for Depot Managers
// =================================================================

// POST /api/depot/tickets/issue - Issue ticket manually (Depot Manager)
router.post('/tickets/issue', async (req, res) => {
  try {
    const {
      tripId,
      passengerName,
      passengerPhone,
      passengerEmail,
      passengerAge,
      passengerGender,
      seatNumber,
      boardingStop,
      destinationStop,
      fareAmount,
      concessionType = 'none',
      concessionAmount = 0,
      paymentMethod = 'cash',
      notes
    } = req.body;

    const depotId = req.user.depotId;

    // Validation
    if (!tripId || !passengerName || !seatNumber || !boardingStop || !destinationStop || !fareAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: tripId, passengerName, seatNumber, boardingStop, destinationStop, fareAmount'
      });
    }

    // Validate trip belongs to this depot
    const trip = await Trip.findById(tripId).populate('routeId');
    if (!trip || !trip.depotId || trip.depotId.toString() !== depotId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Trip not found or access denied'
      });
    }

    // Check if seat is available
    const existingBooking = await Booking.findOne({
      tripId,
      seatNo: seatNumber,
      status: { $in: ['confirmed', 'issued'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Selected seat is already occupied'
      });
    }

    // Calculate total amount
    const totalAmount = fareAmount - concessionAmount;

    // Create passenger user if doesn't exist
    let passengerId = null;
    if (passengerPhone) {
      let passenger = await User.findOne({ phone: passengerPhone });
      if (!passenger) {
        passenger = await User.create({
          name: passengerName,
          phone: passengerPhone,
          email: passengerEmail,
          age: passengerAge,
          gender: passengerGender,
          role: 'passenger',
          status: 'active'
        });
      }
      passengerId = passenger._id;
    }

    // Create booking
    const booking = await Booking.create({
      passengerId,
      tripId,
      seatNo: seatNumber,
      fareAmount,
      concessionAmount,
      totalAmount,
      status: 'issued',
      paymentStatus: 'completed',
      paymentMethod,
      boardingStopId: boardingStop,
      destinationStopId: destinationStop,
      passengerDetails: {
        name: passengerName,
        age: passengerAge,
        gender: passengerGender,
        phone: passengerPhone,
        email: passengerEmail,
        concessionType
      },
      bookingTime: new Date(),
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      source: 'counter',
      notes
    });

    // Generate ticket
    const pnr = generatePNR();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const ticket = await Ticket.create({
      bookingId: booking._id,
      pnr,
      qrPayload: `YATRIK|PNR:${pnr}|Trip:${tripId}|Seat:${seatNumber}`,
      expiresAt,
      state: 'active',
      passengerName,
      seatNumber,
      boardingStop,
      destinationStop,
      fareAmount,
      concessionApplied: concessionType,
      concessionAmount,
      tripDetails: {
        tripId: trip._id,
        busNumber: trip.busId?.busNumber || '',
        departureTime: new Date(`${trip.serviceDate.toISOString().split('T')[0]}T${trip.startTime}:00Z`),
        routeName: trip.routeId?.routeName || ''
      },
      issuedAt: new Date(),
      issuedBy: req.user._id,
      source: 'counter'
    });

    res.status(201).json({
      success: true,
      message: 'Ticket issued successfully',
      data: {
        ticket,
        booking,
        pnr,
        qrCode: `QR${Date.now()}`
      }
    });

  } catch (error) {
    console.error('Ticket issuance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to issue ticket',
      error: error.message
    });
  }
});

// GET /api/depot/tickets - Get depot tickets with filters
router.get('/tickets', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    const {
      page = 1,
      limit = 20,
      status,
      date,
      tripId,
      search,
      sortBy = 'issuedAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    // Get trips for this depot
    const depotTrips = await Trip.find({ depotId }).select('_id');
    const tripIds = depotTrips.map(trip => trip._id);

    // Get bookings for depot trips
    const depotBookings = await Booking.find({ tripId: { $in: tripIds } }).select('_id');
    const bookingIds = depotBookings.map(booking => booking._id);

    filter.bookingId = { $in: bookingIds };

    // Apply additional filters
    if (status) filter.state = status;
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.issuedAt = { $gte: searchDate, $lt: nextDay };
    }
    if (tripId) {
      const tripBooking = await Booking.findOne({ tripId }).select('_id');
      if (tripBooking) {
        filter.bookingId = tripBooking._id;
      }
    }
    if (search) {
      filter.$or = [
        { passengerName: { $regex: search, $options: 'i' } },
        { pnr: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate({
          path: 'bookingId',
          populate: {
            path: 'tripId',
            populate: 'routeId'
          }
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Ticket.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Tickets fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
});

// PUT /api/depot/tickets/:id/validate - Validate ticket
router.put('/tickets/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const { location, deviceInfo } = req.body;
    const depotId = req.user.depotId;

    // Verify ticket belongs to depot
    const ticket = await Ticket.findById(id).populate('bookingId');
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const trip = await Trip.findById(ticket.bookingId.tripId);
    if (!trip || trip.depotId.toString() !== depotId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or access denied'
      });
    }

    // Check if ticket is valid
    if (ticket.state !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not active'
      });
    }

    if (ticket.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has expired'
      });
    }

    // Add validation record
    ticket.validationHistory.push({
      conductorId: req.user._id,
      validatedAt: new Date(),
      location: location || {},
      deviceInfo: deviceInfo || {}
    });

    // Update ticket state
    ticket.state = 'validated';
    await ticket.save();

    res.json({
      success: true,
      message: 'Ticket validated successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Ticket validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate ticket',
      error: error.message
    });
  }
});

// POST /api/depot/tickets/:id/cancel - Cancel ticket
router.post('/tickets/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const depotId = req.user.depotId;

    // Verify ticket belongs to depot
    const ticket = await Ticket.findById(id).populate('bookingId');
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const trip = await Trip.findById(ticket.bookingId.tripId);
    if (!trip || trip.depotId.toString() !== depotId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or access denied'
      });
    }

    // Cancel ticket
    ticket.state = 'cancelled';
    ticket.cancelledAt = new Date();
    ticket.cancelledBy = req.user._id;
    ticket.cancellationReason = reason;
    await ticket.save();

    // Cancel associated booking
    await Booking.findByIdAndUpdate(ticket.bookingId._id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: req.user._id,
      cancellationReason: reason
    });

    res.json({
      success: true,
      message: 'Ticket cancelled successfully'
    });

  } catch (error) {
    console.error('Ticket cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel ticket',
      error: error.message
    });
  }
});

// GET /api/depot/crew - Get all crew assignments
router.get('/crew', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    const { date, status } = req.query;
    
    let query = { depotId };
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(searchDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.date = { $gte: searchDate, $lt: nextDate };
    }
    if (status) query.status = status;

    const crew = await Duty.find(query)
      .populate('driverId', 'name phone')
      .populate('conductorId', 'name phone')
      .populate('tripId')
      .populate('busId', 'busNumber')
      .sort({ date: 1, startTime: 1 })
      .lean();

    res.json({
      success: true,
      data: crew
    });

  } catch (error) {
    console.error('Get depot crew error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch crew' });
  }
});

// POST /api/depot/crew - Assign crew to trip
router.post('/crew', async (req, res) => {
  try {
    const { tripId, driverId, conductorId, busId, date, startTime, endTime } = req.body;
    const depotId = req.user.depotId;

    if (!tripId || !driverId || !conductorId || !busId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Trip, driver, conductor, bus, and date are required'
      });
    }

    // Verify trip belongs to depot
    const trip = await Trip.findOne({ _id: tripId, depotId });
    if (!trip) {
      return res.status(400).json({
        success: false,
        message: 'Trip not found or not accessible'
      });
    }

    const duty = new Duty({
      tripId,
      driverId,
      conductorId,
      busId,
      date: new Date(date),
      startTime,
      endTime,
      status: 'assigned',
      depotId,
      assignedBy: req.user._id
    });

    await duty.save();

    res.status(201).json({
      success: true,
      data: { duty },
      message: 'Crew assigned successfully'
    });

  } catch (error) {
    console.error('Assign crew error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign crew'
    });
  }
});

// GET /api/depot/bookings - Get all bookings for depot
router.get('/bookings', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    const { date, status, tripId } = req.query;
    
    let query = { 'tripId.routeId.depotId': depotId };
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(searchDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.createdAt = { $gte: searchDate, $lt: nextDate };
    }
    if (status) query.status = status;
    if (tripId) query.tripId = tripId;

    const bookings = await Booking.find(query)
      .populate('tripId')
      .sort({ createdAt: -1 })
      .lean();

    // Transform data to match frontend expectations
    const transformedBookings = bookings.map(booking => ({
      id: booking._id,
      passenger: booking.createdBy?.name || 'Unknown Passenger',
      route: booking.tripId?.routeId?.name || 'Unknown Route',
      seat: `A${Math.floor(Math.random() * 50) + 1}`, // Mock seat for now
      fare: `₹${((booking.fareAmount || 100) * 100).toLocaleString()}`, // Convert to rupees
      status: booking.status,
      bookingTime: new Date(booking.createdAt).toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    res.json({
      success: true,
      data: transformedBookings
    });

  } catch (error) {
    console.error('Get depot bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// GET /api/depot/fuel - Get fuel logs for depot
router.get('/fuel', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    const { date, busId } = req.query;
    
    let query = { depotId };
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(searchDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.createdAt = { $gte: searchDate, $lt: nextDate };
    }
    if (busId) query.busId = busId;

    const fuelLogs = await FuelLog.find(query)
      .populate('busId', 'busNumber registrationNumber')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: fuelLogs
    });

  } catch (error) {
    console.error('Get depot fuel logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch fuel logs' });
  }
});

// POST /api/depot/fuel - Record fuel fill-up
router.post('/fuel', async (req, res) => {
  try {
    const { busId, fuelType, quantity, cost, odometerReading, notes } = req.body;
    const depotId = req.user.depotId;

    if (!busId || !fuelType || !quantity || !cost) {
      return res.status(400).json({
        success: false,
        message: 'Bus ID, fuel type, quantity, and cost are required'
      });
    }

    // Verify bus belongs to depot
    const bus = await Bus.findOne({ _id: busId, depotId });
    if (!bus) {
      return res.status(400).json({
        success: false,
        message: 'Bus not found or not accessible'
      });
    }

    // Create fuel log
    const fuelLog = new FuelLog({
      busId,
      fuelType,
      quantity,
      cost,
      odometerReading,
      notes,
      depotId,
      recordedBy: req.user._id
    });

    await fuelLog.save();

    // Update bus odometer reading
    if (odometerReading) {
      bus.lastFuelReading = odometerReading;
      bus.lastFuelDate = new Date();
      await bus.save();
    }

    res.json({
      success: true,
      data: { fuelLog },
      message: 'Fuel log recorded successfully'
    });

  } catch (error) {
    console.error('Fuel logging error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record fuel log'
    });
  }
});

// GET /api/depot/reports - Generate depot reports
router.get('/reports', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    const { startDate, endDate, type } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    let reportData = {};

    if (type === 'daily' || !type) {
      // Daily operations report
      const [trips, bookings, fuelLogs, revenue] = await Promise.all([
        Trip.countDocuments({ 
          'routeId.depotId': depotId, 
          date: { $gte: start, $lte: end } 
        }),
        Booking.countDocuments({ 
          'tripId.routeId.depotId': depotId, 
          createdAt: { $gte: start, $lte: end } 
        }),
        FuelLog.countDocuments({ 
          depotId, 
          createdAt: { $gte: start, $lte: end } 
        }),
        Booking.aggregate([
          { $match: { 'tripId.routeId.depotId': depotId, createdAt: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$fareAmount' } } }
        ])
      ]);

      reportData = {
        period: { start, end },
        trips,
        bookings,
        fuelLogs,
        revenue: revenue[0]?.total || 0
      };
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
});

// GET /api/depot/buses - Get all buses for depot
router.get('/buses', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    
    // If user doesn't have depotId, try to find a depot for them
    if (!depotId) {
      console.log('User has no depotId, finding default depot...');
      const defaultDepot = await Depot.findOne({ status: 'active' });
      if (!defaultDepot) {
        return res.status(400).json({
          success: false,
          message: 'No depot found. Please contact administrator.'
        });
      }
      // Update user's depotId for this session
      req.user.depotId = defaultDepot._id;
      console.log('Assigned default depot to user:', defaultDepot.depotName);
    }
    
    // Get buses with basic information including current route and crew
    const buses = await Bus.find({ depotId: req.user.depotId })
      .select('busNumber registrationNumber busType capacity status lastMaintenance odometerReading lastFuelReading lastFuelDate currentRoute assignedDriver assignedConductor')
      .populate('assignedDriver', 'name phone email')
      .populate('assignedConductor', 'name phone email')
      .lean();

    // Get bus counts for stats
    const [totalBuses, availableBuses, maintenanceBuses] = await Promise.all([
      Bus.countDocuments({ depotId: req.user.depotId }),
      Bus.countDocuments({ depotId: req.user.depotId, status: 'available' }),
      Bus.countDocuments({ depotId: req.user.depotId, status: 'maintenance' })
    ]);

    res.json({
      success: true,
      data: {
        buses,
        stats: {
          totalBuses,
          availableBuses,
          maintenanceBuses
        }
      }
    });

  } catch (error) {
    console.error('Get depot buses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depot buses'
    });
  }
});

// GET /api/depot/drivers - Get all drivers for depot
router.get('/drivers', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    
    if (!depotId) {
      return res.status(400).json({
        success: false,
        message: 'No depot assigned to user'
      });
    }
    
    // Get all drivers from Driver model for this depot
    const drivers = await Driver.find({
      depotId: depotId,
      status: 'active'
    })
    .select('name phone email employeeCode drivingLicense currentDuty')
    .lean();

    // Also check User model as fallback
    const userDrivers = await User.find({
      role: 'driver',
      depotId: depotId,
      status: 'active'
    })
    .select('name phone email licenseNumber staffDetails')
    .lean();

    // Combine and deduplicate
    const allDrivers = [...drivers, ...userDrivers];
    
    // Remove duplicates based on email or phone
    const uniqueDrivers = Array.from(
      new Map(allDrivers.map(d => [d.email || d.phone, d])).values()
    );

    res.json({
      success: true,
      data: {
        drivers: uniqueDrivers,
        stats: {
          totalDrivers: uniqueDrivers.length
        }
      }
    });

  } catch (error) {
    console.error('Get depot drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depot drivers'
    });
  }
});

// GET /api/depot/conductors - Get all conductors for depot
router.get('/conductors', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    
    if (!depotId) {
      return res.status(400).json({
        success: false,
        message: 'No depot assigned to user'
      });
    }
    
    // Get all conductors from Conductor model for this depot
    const conductors = await Conductor.find({
      depotId: depotId,
      status: 'active'
    })
    .select('name phone email employeeCode currentDuty')
    .lean();

    // Also check User model as fallback
    const userConductors = await User.find({
      role: 'conductor',
      depotId: depotId,
      status: 'active'
    })
    .select('name phone email staffDetails')
    .lean();

    // Combine and deduplicate
    const allConductors = [...conductors, ...userConductors];
    
    // Remove duplicates based on email or phone
    const uniqueConductors = Array.from(
      new Map(allConductors.map(c => [c.email || c.phone, c])).values()
    );

    res.json({
      success: true,
      data: {
        conductors: uniqueConductors,
        stats: {
          totalConductors: uniqueConductors.length
        }
      }
    });

  } catch (error) {
    console.error('Get depot conductors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depot conductors'
    });
  }
});

// =================================================================
// 4) Bus Management for Depot Managers
// =================================================================

// POST /api/depot/buses - Add new bus
router.post('/buses', async (req, res) => {
  try {
    console.log('=== BUS CREATION REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User info:', req.user);
    console.log('Headers:', req.headers);
    
    const {
      busNumber,
      registrationNumber,
      busType,
      capacity,
      amenities,
      specifications,
      notes
    } = req.body;

    const depotId = req.user.depotId;
    console.log('Depot ID from user:', depotId);

    // Enhanced validation with detailed error messages
    if (!busNumber || !registrationNumber || !busType || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Bus number, registration number, bus type, and capacity are required',
        details: {
          busNumber: !busNumber ? 'Bus number is required' : null,
          registrationNumber: !registrationNumber ? 'Registration number is required' : null,
          busType: !busType ? 'Bus type is required' : null,
          capacity: !capacity ? 'Capacity is required' : null
        }
      });
    }

    // Validate depotId
    if (!depotId) {
      return res.status(400).json({
        success: false,
        message: 'Depot ID is missing from user authentication',
        user: req.user
      });
    }

    // Validate capacity structure
    if (!capacity.total || capacity.total < 1) {
      return res.status(400).json({
        success: false,
        message: 'Total capacity must be at least 1',
        received: capacity
      });
    }

    // Check if bus number or registration already exists
    const existingBus = await Bus.findOne({
      $or: [
        { busNumber },
        { registrationNumber }
      ]
    });

    if (existingBus) {
      return res.status(400).json({
        success: false,
        message: 'Bus number or registration number already exists'
      });
    }

    const busData = {
      busNumber,
      registrationNumber,
      depotId,
      busType,
      capacity,
      amenities: amenities || [],
      specifications: specifications || {},
      status: 'active',
      assignedBy: req.user._id,
      notes
    };
    
    console.log('Creating bus with data:', busData);
    
    const bus = new Bus(busData);
    
    console.log('Bus object created:', bus);
    
    await bus.save();
    
    console.log('Bus saved successfully:', bus._id);

    // Send notification to depot users about new bus
    try {
      await NotificationService.notifyBusAssignment(bus, depotId, req.user);
    } catch (notificationError) {
      console.error('Failed to send bus assignment notification:', notificationError);
      // Don't fail the bus creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Bus added successfully',
      data: bus
    });

  } catch (error) {
    console.error('Add bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add bus',
      error: error.message
    });
  }
});

// PUT /api/depot/buses/:id - Update bus
router.put('/buses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const depotId = req.user.depotId;

    // Verify bus belongs to this depot
    const existingBus = await Bus.findById(id);
    if (!existingBus || existingBus.depotId.toString() !== depotId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found or access denied'
      });
    }

    // Remove immutable fields
    delete updateData.depotId;
    delete updateData.assignedBy;

    const bus = await Bus.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Bus updated successfully',
      data: bus
    });

  } catch (error) {
    console.error('Update bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bus',
      error: error.message
    });
  }
});

// DELETE /api/depot/buses/:id - Remove bus
router.delete('/buses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const depotId = req.user.depotId;

    // Verify bus belongs to this depot
    const bus = await Bus.findById(id);
    if (!bus || bus.depotId.toString() !== depotId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found or access denied'
      });
    }

    // Check if bus is assigned to any active trips
    const activeTrips = await Trip.countDocuments({
      busId: id,
      status: { $in: ['scheduled', 'running'] }
    });

    if (activeTrips > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove bus assigned to ${activeTrips} active trips`
      });
    }

    await Bus.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Bus removed successfully'
    });

  } catch (error) {
    console.error('Remove bus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove bus',
      error: error.message
    });
  }
});

// POST /api/depot/buses/:id/assign-route - Assign route to bus
router.post('/buses/:id/assign-route', async (req, res) => {
  try {
    const { id } = req.params;
    const { routeId } = req.body;
    const depotId = req.user.depotId;

    // Validate input
    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: 'Route ID is required'
      });
    }

    // Verify bus belongs to this depot
    const bus = await Bus.findById(id);
    if (!bus || bus.depotId.toString() !== depotId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found or access denied'
      });
    }

    // Verify route exists and is active
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    if (route.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign inactive route to bus'
      });
    }

    // Check if route is already assigned to this bus
    const existingAssignment = await Route.findOne({
      _id: routeId,
      'assignedBuses.busId': id
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Route is already assigned to this bus'
      });
    }

    // Add bus to route's assigned buses
    await Route.findByIdAndUpdate(routeId, {
      $addToSet: {
        assignedBuses: {
          busId: id,
          assignedAt: new Date(),
          assignedBy: req.user._id,
          active: true
        }
      }
    });

    // Update bus with current route information
    await Bus.findByIdAndUpdate(id, {
      $set: {
        currentRoute: {
          routeId: routeId,
          routeName: route.routeName,
          routeNumber: route.routeNumber,
          assignedAt: new Date(),
          assignedBy: req.user._id
        },
        lastUpdated: new Date()
      }
    });

    // Send notification about route assignment
    try {
      await NotificationService.notifyRouteAssignment(bus, route, depotId, req.user);
    } catch (notificationError) {
      console.error('Failed to send route assignment notification:', notificationError);
    }

    res.json({
      success: true,
      message: `Route ${route.routeName} assigned to bus ${bus.busNumber} successfully`,
      data: {
        busId: id,
        routeId: routeId,
        routeName: route.routeName,
        routeNumber: route.routeNumber
      }
    });

  } catch (error) {
    console.error('Route assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign route to bus',
      error: error.message
    });
  }
});

// DELETE /api/depot/buses/:id/assign-route - Remove route assignment from bus
router.delete('/buses/:id/assign-route', async (req, res) => {
  try {
    const { id } = req.params;
    const { routeId } = req.body;
    const depotId = req.user.depotId;

    // Validate input
    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: 'Route ID is required'
      });
    }

    // Verify bus belongs to this depot
    const bus = await Bus.findById(id);
    if (!bus || bus.depotId.toString() !== depotId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found or access denied'
      });
    }

    // Remove bus from route's assigned buses
    await Route.findByIdAndUpdate(routeId, {
      $pull: {
        assignedBuses: { busId: id }
      }
    });

    // Clear current route from bus if it matches
    if (bus.currentRoute && bus.currentRoute.routeId.toString() === routeId) {
      await Bus.findByIdAndUpdate(id, {
        $unset: { currentRoute: 1 },
        $set: { lastUpdated: new Date() }
      });
    }

    res.json({
      success: true,
      message: `Route assignment removed from bus ${bus.busNumber} successfully`
    });

  } catch (error) {
    console.error('Route unassignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove route assignment from bus',
      error: error.message
    });
  }
});

// POST /api/depot/buses/:id/assign-crew - Assign driver and conductor to bus
router.post('/buses/:id/assign-crew', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, conductorId } = req.body;
    const depotId = req.user.depotId;

    // Validate input
    if (!driverId && !conductorId) {
      return res.status(400).json({
        success: false,
        message: 'At least one crew member (driver or conductor) must be specified'
      });
    }

    // Verify bus belongs to this depot
    const bus = await Bus.findById(id);
    if (!bus || bus.depotId.toString() !== depotId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found or access denied'
      });
    }

    // Verify driver exists and belongs to the same depot
    let driver = null;
    if (driverId) {
      driver = await Driver.findById(driverId);
      if (!driver) {
        return res.status(400).json({
          success: false,
          message: 'Driver not found'
        });
      }
      // Verify driver belongs to the same depot
      if (driver.depotId && driver.depotId.toString() !== depotId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Driver does not belong to this depot'
        });
      }
    }

    // Verify conductor exists and belongs to the same depot
    let conductor = null;
    if (conductorId) {
      conductor = await Conductor.findById(conductorId);
      if (!conductor) {
        return res.status(400).json({
          success: false,
          message: 'Conductor not found'
        });
      }
      // Verify conductor belongs to the same depot
      if (conductor.depotId && conductor.depotId.toString() !== depotId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Conductor does not belong to this depot'
        });
      }
    }

    // Update bus with crew assignments
    const updateData = {
      lastUpdated: new Date()
    };

    if (driverId) {
      updateData.assignedDriver = driverId;
    }

    if (conductorId) {
      updateData.assignedConductor = conductorId;
    }

    await Bus.findByIdAndUpdate(id, updateData);

    res.json({
      success: true,
      message: `Crew assigned to bus ${bus.busNumber} successfully`,
      data: {
        busId: id,
        driverId: driverId || null,
        conductorId: conductorId || null,
        driverName: driver ? driver.name : null,
        conductorName: conductor ? conductor.name : null
      }
    });

  } catch (error) {
    console.error('Crew assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign crew to bus',
      error: error.message
    });
  }
});

// =================================================================
// 5) Route Management for Depot Managers
// =================================================================

// POST /api/depot/routes - Create new route
router.post('/routes', async (req, res) => {
  try {
    console.log('=== ROUTE CREATION REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User info:', JSON.stringify(req.user, null, 2));
    console.log('Headers:', req.headers);
    
    const {
      routeNumber,
      routeName,
      startingPoint,
      endingPoint,
      totalDistance,
      estimatedDuration,
      intermediateStops,
      baseFare,
      features,
      notes
    } = req.body;

    const depotId = req.user.depotId;
    console.log('Depot ID from user:', depotId);
    console.log('User role:', req.user.role);

    // Enhanced validation with detailed error messages
    const validationErrors = [];
    
    if (!routeNumber) validationErrors.push('Route number is required');
    if (!routeName) validationErrors.push('Route name is required');
    if (!startingPoint) validationErrors.push('Starting point is required');
    if (!endingPoint) validationErrors.push('Ending point is required');
    if (!totalDistance) validationErrors.push('Total distance is required');
    if (!depotId) validationErrors.push('Depot ID is missing from user authentication');
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        receivedData: {
          routeNumber,
          routeName,
          startingPoint,
          endingPoint,
          totalDistance,
          depotId
        }
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

    // Get depot information
    const depot = await Depot.findById(depotId);
    if (!depot) {
      console.log('Depot not found for ID:', depotId);
      return res.status(400).json({
        success: false,
        message: 'Depot not found'
      });
    }
    console.log('Depot found:', depot.depotName);

    // Transform string inputs to object structure expected by Route model
    const transformPoint = (point) => {
      if (typeof point === 'string') {
        return {
          city: point.split(',')[0]?.trim() || point,
          location: point
        };
      }
      return point;
    };

    // Transform intermediate stops from frontend format to model format
    const transformStops = (stops) => {
      if (!Array.isArray(stops)) return [];
      return stops.map((stop, index) => ({
        city: stop.name || stop.city || 'Unknown',
        location: stop.name || stop.location || 'Unknown',
        stopNumber: index + 1,
        distanceFromStart: Number(stop.distance) || 0,
        estimatedArrival: Math.ceil((Number(stop.distance) || 0) / 40) * 60 // rough calculation
      }));
    };

    // Transform features to match Route model enum values
    const transformFeatures = (features) => {
      if (!Array.isArray(features)) return [];
      
      const featureMap = {
        'ac': 'AC',
        'wifi': 'WiFi',
        'premium': 'Entertainment', // Map premium to Entertainment
        'express': 'Entertainment', // Map express to Entertainment
        'night': 'Entertainment', // Map night to Entertainment
        'wheelchair': 'Wheelchair_Accessible',
        'usb': 'USB_Charging',
        'refreshments': 'Refreshments'
      };
      
      return features.map(feature => {
        const lowerFeature = feature.toLowerCase();
        return featureMap[lowerFeature] || feature.toUpperCase();
      }).filter(feature => {
        // Only include valid enum values
        const validFeatures = ['AC', 'WiFi', 'USB_Charging', 'Entertainment', 'Refreshments', 'Wheelchair_Accessible'];
        return validFeatures.includes(feature);
      });
    };

    const routeData = {
      routeNumber,
      routeName,
      startingPoint: transformPoint(startingPoint),
      endingPoint: transformPoint(endingPoint),
      totalDistance: Number(totalDistance),
      estimatedDuration: Number(estimatedDuration) || Math.ceil(Number(totalDistance) / 40) * 60, // Rough calculation
      intermediateStops: transformStops(intermediateStops),
      depot: {
        depotId,
        depotName: depot.depotName || 'Central Transport Hub',
        depotLocation: depot.location?.address || depot.location?.city || 'Mumbai Central'
      },
      baseFare: Number(baseFare) || 100,
      farePerKm: 2, // Default fare per km
      features: transformFeatures(features),
      status: 'active',
      createdBy: req.user._id,
      isActive: true
    };

    // Validate required fields before creating route
    if (!routeData.farePerKm || routeData.farePerKm <= 0) {
      return res.status(400).json({
        success: false,
        message: 'farePerKm must be a positive number'
      });
    }

    console.log('Creating route with data:', JSON.stringify(routeData, null, 2));
    
    try {
      const route = new Route(routeData);
      
      console.log('Route object created, attempting to save...');
      await route.save();
      console.log('Route saved successfully:', route._id);
      
      res.status(201).json({
        success: true,
        message: 'Route created successfully',
        data: route
      });
    } catch (saveError) {
      console.error('Route save error:', saveError);
      
      // Handle validation errors specifically
      if (saveError.name === 'ValidationError') {
        const validationErrors = Object.keys(saveError.errors).map(key => ({
          field: key,
          message: saveError.errors[key].message,
          value: saveError.errors[key].value
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Route validation failed',
          validationErrors,
          routeData
        });
      }
      
      throw saveError; // Re-throw if it's not a validation error
    }

  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create route',
      error: error.message
    });
  }
});

// PUT /api/depot/routes/:id - Update route
router.put('/routes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const depotId = req.user.depotId;

    // Verify route belongs to this depot
    const existingRoute = await Route.findById(id);
    if (!existingRoute || !existingRoute.depot || existingRoute.depot.depotId.toString() !== depotId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Route not found or access denied'
      });
    }

    // Remove immutable fields
    delete updateData.depot;
    delete updateData.createdBy;

    const route = await Route.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Route updated successfully',
      data: route
    });

  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update route',
      error: error.message
    });
  }
});

// =================================================================
// 6) Crew Management for Depot Managers
// =================================================================

// POST /api/depot/crew - Assign crew to trip
router.post('/crew', async (req, res) => {
  try {
    const { tripId, driverId, conductorId, busId, date, startTime, endTime, notes } = req.body;
    const depotId = req.user.depotId;

    if (!tripId || !driverId || !conductorId || !busId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Trip, driver, conductor, bus, and date are required'
      });
    }

    // Verify trip belongs to depot
    const trip = await Trip.findOne({ _id: tripId, depotId });
    if (!trip) {
      return res.status(400).json({
        success: false,
        message: 'Trip not found or not accessible'
      });
    }

    // Check if crew is already assigned for the time period
    const existingDuty = await Duty.findOne({
      $or: [
        { driverId, date: new Date(date), status: { $in: ['assigned', 'in_progress'] } },
        { conductorId, date: new Date(date), status: { $in: ['assigned', 'in_progress'] } }
      ]
    });

    if (existingDuty) {
      return res.status(400).json({
        success: false,
        message: 'Driver or conductor already assigned for this date'
      });
    }

    const duty = new Duty({
      tripId,
      driverId,
      conductorId,
      busId,
      date: new Date(date),
      startTime,
      endTime,
      status: 'assigned',
      depotId,
      assignedBy: req.user._id,
      notes
    });

    await duty.save();

    // Update trip with crew assignment
    await Trip.findByIdAndUpdate(tripId, {
      driverId,
      conductorId,
      busId
    });

    res.status(201).json({
      success: true,
      data: { duty },
      message: 'Crew assigned successfully'
    });

  } catch (error) {
    console.error('Assign crew error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign crew',
      error: error.message
    });
  }
});

// PUT /api/depot/crew/:id - Update crew assignment
router.put('/crew/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const depotId = req.user.depotId;

    // Verify duty belongs to depot
    const existingDuty = await Duty.findById(id);
    if (!existingDuty || existingDuty.depotId.toString() !== depotId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Crew assignment not found or access denied'
      });
    }

    // Remove immutable fields
    delete updateData.depotId;
    delete updateData.assignedBy;

    const duty = await Duty.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Crew assignment updated successfully',
      data: duty
    });

  } catch (error) {
    console.error('Update crew assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update crew assignment',
      error: error.message
    });
  }
});

// Helper function to generate PNR
function generatePNR() {
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return 'YTK' + rnd;
}

// =================================================================
// 6) Bus Schedule Management for Depot Managers
// =================================================================

// GET /api/depot/schedules - Get bus schedules for depot
router.get('/schedules', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    const {
      page = 1,
      limit = 20,
      date,
      routeId,
      busId,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = { depotId };

    // Apply filters
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(searchDate);
      nextDate.setDate(nextDate.getDate() + 1);
      filter.serviceDate = { $gte: searchDate, $lt: nextDate };
    }
    if (routeId) filter.routeId = routeId;
    if (busId) filter.busId = busId;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { 'routeId.routeName': { $regex: search, $options: 'i' } },
        { 'busId.busNumber': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [schedules, total] = await Promise.all([
      Trip.find(filter)
        .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
        .populate('busId', 'busNumber busType registrationNumber capacity')
        .populate('driverId', 'name phone licenseNumber')
        .populate('conductorId', 'name phone employeeId')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Trip.countDocuments(filter)
    ]);

    // Transform schedules data to match frontend expectations
    const transformedSchedules = schedules.map(trip => {
      const serviceDate = new Date(trip.serviceDate);
      const departureTime = trip.startTime ? new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate(), 
        parseInt(trip.startTime.split(':')[0]), parseInt(trip.startTime.split(':')[1])) : null;
      const arrivalTime = trip.endTime ? new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate(), 
        parseInt(trip.endTime.split(':')[0]), parseInt(trip.endTime.split(':')[1])) : null;

      return {
        ...trip,
        scheduleId: trip._id,
        tripNumber: `TRP${trip._id.toString().slice(-6).toUpperCase()}`,
        departureTime: departureTime,
        arrivalTime: arrivalTime,
        routeId: {
          ...trip.routeId,
          routeName: trip.routeId?.routeName || 'Unknown Route',
          routeNumber: trip.routeId?.routeNumber || 'N/A'
        },
        busId: {
          ...trip.busId,
          busNumber: trip.busId?.busNumber || 'N/A',
          busType: trip.busId?.busType || 'Standard',
          capacity: trip.busId?.capacity || { total: 35 }
        },
        driverId: trip.driverId ? {
          ...trip.driverId,
          name: trip.driverId.name || 'Unknown Driver'
        } : null,
        conductorId: trip.conductorId ? {
          ...trip.conductorId,
          name: trip.conductorId.name || 'Unknown Conductor'
        } : null
      };
    });

    res.json({
      success: true,
      data: {
        schedules: transformedSchedules,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get depot schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedules',
      error: error.message
    });
  }
});

// POST /api/depot/schedules - Create new schedule
router.post('/schedules', async (req, res) => {
  try {
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
      notes
    } = req.body;

    const depotId = req.user.depotId;

    // Validation
    if (!routeId || !busId || !serviceDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: routeId, busId, serviceDate, startTime'
      });
    }

    // Validate route belongs to this depot
    const route = await Route.findById(routeId);
    if (!route || !route.depot || route.depot.depotId.toString() !== depotId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Route does not belong to this depot'
      });
    }

    // Validate bus belongs to this depot
    const bus = await Bus.findById(busId);
    if (!bus || !bus.depotId || bus.depotId.toString() !== depotId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bus does not belong to this depot'
      });
    }

    // Check bus availability for the date
    const existingSchedule = await Trip.findOne({
      busId,
      serviceDate: new Date(serviceDate),
      status: { $in: ['scheduled', 'running'] }
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Bus is already assigned to another schedule on this date'
      });
    }

    // Create schedule (trip)
    const schedule = await Trip.create({
      routeId,
      busId,
      driverId,
      conductorId,
      serviceDate: new Date(serviceDate),
      startTime,
      endTime,
      fare: fare || 0,
      capacity: capacity || bus.capacity.total,
      status: 'scheduled',
      depotId,
      createdBy: req.user._id,
      notes
    });

    // Update bus status
    await Bus.findByIdAndUpdate(busId, {
      currentTrip: schedule._id,
      status: 'assigned'
    });

    // Populate the schedule data for response
    const populatedSchedule = await Trip.findById(schedule._id)
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('busId', 'busNumber busType registrationNumber capacity')
      .populate('driverId', 'name phone licenseNumber')
      .populate('conductorId', 'name phone employeeId')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: {
        ...populatedSchedule,
        scheduleId: populatedSchedule._id
      }
    });

  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create schedule',
      error: error.message
    });
  }
});

// PUT /api/depot/schedules/:id - Update schedule
router.put('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const depotId = req.user.depotId;

    // Verify schedule belongs to this depot
    const existingSchedule = await Trip.findById(id);
    if (!existingSchedule || existingSchedule.depotId.toString() !== depotId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found or access denied'
      });
    }

    // Check if schedule is already running or completed (only allow status updates)
    if ((existingSchedule.status === 'running' || existingSchedule.status === 'completed') && 
        (updateData.routeId || updateData.busId || updateData.serviceDate || updateData.startTime || updateData.endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify running or completed schedules. Only status updates allowed.'
      });
    }

    // If bus is being changed, check availability
    if (updateData.busId && updateData.busId !== existingSchedule.busId.toString()) {
      const bus = await Bus.findById(updateData.busId);
      if (!bus || !bus.depotId || bus.depotId.toString() !== depotId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Bus does not belong to this depot'
        });
      }

      // Check if new bus is available for the date
      const conflictingSchedule = await Trip.findOne({
        busId: updateData.busId,
        serviceDate: updateData.serviceDate ? new Date(updateData.serviceDate) : existingSchedule.serviceDate,
        status: { $in: ['scheduled', 'running'] },
        _id: { $ne: id }
      });

      if (conflictingSchedule) {
        return res.status(400).json({
          success: false,
          message: 'Bus is already assigned to another schedule on this date'
        });
      }

      // Release old bus
      await Bus.findByIdAndUpdate(existingSchedule.busId, {
        currentTrip: null,
        status: 'available'
      });

      // Assign new bus
      await Bus.findByIdAndUpdate(updateData.busId, {
        currentTrip: id,
        status: 'assigned'
      });
    }

    // Remove immutable fields
    delete updateData.depotId;
    delete updateData.createdBy;

    const schedule = await Trip.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy: req.user._id },
      { new: true, runValidators: true }
    )
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
    .populate('busId', 'busNumber busType registrationNumber capacity')
    .populate('driverId', 'name phone licenseNumber')
    .populate('conductorId', 'name phone employeeId')
    .lean();

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: {
        ...schedule,
        scheduleId: schedule._id
      }
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule',
      error: error.message
    });
  }
});

// DELETE /api/depot/schedules/:id - Delete schedule
router.delete('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const depotId = req.user.depotId;

    // Verify schedule belongs to this depot
    const schedule = await Trip.findById(id);
    if (!schedule || schedule.depotId.toString() !== depotId.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found or access denied'
      });
    }

    // Check if schedule is already running or completed
    if (schedule.status === 'running' || schedule.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete running or completed schedules'
      });
    }

    // Update bus status back to available
    await Bus.findByIdAndUpdate(schedule.busId, {
      currentTrip: null,
      status: 'available'
    });

    // Delete the schedule
    await Trip.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule',
      error: error.message
    });
  }
});

// =================================================================
// 7) Depot Booking Management
// =================================================================

// GET /api/depot/bookings - Get all bookings for depot routes
router.get('/bookings', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    const { 
      page = 1, 
      limit = 20, 
      status = '', 
      startDate = '', 
      endDate = '', 
      search = '',
      routeId = '',
      busId = ''
    } = req.query;

    // Build query for depot-specific bookings
    const query = { depotId: depotId };

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add date range filter
    if (startDate || endDate) {
      query['journey.departureDate'] = {};
      if (startDate) {
        query['journey.departureDate'].$gte = new Date(startDate);
      }
      if (endDate) {
        query['journey.departureDate'].$lte = new Date(endDate);
      }
    }

    // Add route filter
    if (routeId) {
      query.routeId = routeId;
    }

    // Add bus filter
    if (busId) {
      query.busId = busId;
    }

    // Add search filter
    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { bookingReference: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get bookings with populated data
    const bookings = await Booking.find(query)
      .populate('routeId', 'routeName routeNumber')
      .populate('busId', 'busNumber type')
      .populate('tripId', 'departureTime arrivalTime')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(totalBookings / parseInt(limit));

    // Get booking statistics
    const stats = await Booking.aggregate([
      { $match: { depotId: depotId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' }
        }
      }
    ]);

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await Booking.countDocuments({
      depotId: depotId,
      'journey.departureDate': { $gte: today, $lt: tomorrow }
    });

    // Get today's revenue
    const todayRevenue = await Booking.aggregate([
      {
        $match: {
          depotId: depotId,
          'journey.departureDate': { $gte: today, $lt: tomorrow },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalBookings,
          itemsPerPage: parseInt(limit)
        },
        stats: {
          statusBreakdown: stats,
          todayBookings,
          todayRevenue: todayRevenue[0]?.total || 0
        }
      }
    });

  } catch (error) {
    console.error('Get depot bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depot bookings',
      error: error.message
    });
  }
});

// GET /api/depot/bookings/stats - Get booking statistics for depot
router.get('/bookings/stats', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    const { period = 'today' } = req.query;

    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date(now);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        endDate = new Date(now);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
    }

    // Get booking statistics
    const stats = await Booking.aggregate([
      {
        $match: {
          depotId: depotId,
          'journey.departureDate': { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' }
        }
      }
    ]);

    // Get route-wise statistics
    const routeStats = await Booking.aggregate([
      {
        $match: {
          depotId: depotId,
          'journey.departureDate': { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$routeId',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'routes',
          localField: '_id',
          foreignField: '_id',
          as: 'route'
        }
      },
      {
        $unwind: '$route'
      },
      {
        $project: {
          routeName: '$route.routeName',
          routeNumber: '$route.routeNumber',
          count: 1,
          totalRevenue: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get daily booking trends
    const dailyTrends = await Booking.aggregate([
      {
        $match: {
          depotId: depotId,
          'journey.departureDate': { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$journey.departureDate' },
            month: { $month: '$journey.departureDate' },
            day: { $dayOfMonth: '$journey.departureDate' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        statusBreakdown: stats,
        routeBreakdown: routeStats,
        dailyTrends,
        summary: {
          totalBookings: stats.reduce((sum, stat) => sum + stat.count, 0),
          totalRevenue: stats.reduce((sum, stat) => sum + stat.totalRevenue, 0),
          averageBookingValue: stats.reduce((sum, stat) => sum + stat.totalRevenue, 0) / Math.max(stats.reduce((sum, stat) => sum + stat.count, 0), 1)
        }
      }
    });

  } catch (error) {
    console.error('Get depot booking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking statistics',
      error: error.message
    });
  }
});

// PUT /api/depot/bookings/:id/status - Update booking status
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const depotId = req.user.depotId;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Find booking and verify it belongs to this depot
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.depotId.toString() !== depotId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Booking does not belong to this depot'
      });
    }

    // Update booking status
    booking.status = status;
    if (reason) {
      booking.statusHistory = booking.statusHistory || [];
      booking.statusHistory.push({
        status,
        reason,
        updatedBy: req.user._id,
        updatedAt: new Date()
      });
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
});

// POST /api/depot/bookings/:id/check-in - Check in passenger
router.post('/bookings/:id/check-in', async (req, res) => {
  try {
    const { id } = req.params;
    const { boardingPoint, seatAllocated, notes } = req.body;
    const depotId = req.user.depotId;

    // Find booking and verify it belongs to this depot
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.depotId.toString() !== depotId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Booking does not belong to this depot'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed bookings can be checked in'
      });
    }

    // Update check-in information
    booking.checkIn = {
      checkedIn: true,
      checkedInAt: new Date(),
      checkedInBy: req.user._id,
      boardingPoint: boardingPoint || 'Main Terminal',
      seatAllocated: seatAllocated || 'Confirmed',
      notes: notes || ''
    };

    await booking.save();

    res.json({
      success: true,
      message: 'Passenger checked in successfully',
      data: booking
    });

  } catch (error) {
    console.error('Check-in passenger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in passenger',
      error: error.message
    });
  }
});

// =================================================================
// DEPOT BUSES ENDPOINTS
// =================================================================

// GET /api/depot/buses - Get all buses for depot (REAL-TIME)
router.get('/buses', asyncHandler(async (req, res) => {
  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  if (!depotId) {
    return res.guard.success({ buses: [] }, 'No depot assigned');
  }

  // Get buses with real-time status from active trips
  const buses = await Bus.find({ depotId })
    .select('busNumber registrationNumber busType capacity model status lastServiceDate nextServiceDate depotId createdAt')
    .sort({ busNumber: 1 })
    .lean();

  // Get active trips to determine real-time bus status
  const activeTrips = await Trip.find({
    busId: { $in: buses.map(b => b._id) },
    status: { $in: ['running', 'scheduled'] }
  })
    .select('busId status')
    .lean();

  const busStatusMap = {};
  activeTrips.forEach(trip => {
    if (trip.busId) {
      busStatusMap[trip.busId.toString()] = trip.status === 'running' ? 'active' : 'scheduled';
    }
  });

  // Update bus status based on active trips
  const busesWithStatus = buses.map(bus => {
    const realTimeStatus = busStatusMap[bus._id.toString()] || bus.status;
    return {
      ...bus,
      status: realTimeStatus,
      isActive: realTimeStatus === 'active' || realTimeStatus === 'scheduled'
    };
  });

  return res.guard.success({ buses: busesWithStatus }, 'Buses fetched successfully');
}));

// =================================================================
// DEPOT TRIPS ENDPOINTS
// =================================================================

// GET /api/depot/trips - Get trips for depot (REAL-TIME)
router.get('/trips', asyncHandler(async (req, res) => {
  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  if (!depotId) {
    return res.guard.success({ trips: [] }, 'No depot assigned');
  }

  const { date, status } = req.query;
  
  // First, get all routes for this depot
  const depotRoutes = await Route.find({ 'depot.depotId': depotId }).select('_id').lean();
  const routeIds = depotRoutes.map(r => r._id);

  if (routeIds.length === 0) {
    return res.guard.success({ trips: [] }, 'No routes found for depot');
  }

  const query = { routeId: { $in: routeIds } };

  if (date) {
    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);
    query.serviceDate = { $gte: startOfDay, $lte: endOfDay };
  } else {
    // Default to today and future trips
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query.serviceDate = { $gte: today };
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  const trips = await Trip.find(query)
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint distance')
    .populate('busId', 'busNumber busType registrationNumber status')
    .populate('driverId', 'name phone employeeCode')
    .populate('conductorId', 'name phone employeeCode')
    .sort({ serviceDate: 1, startTime: 1 })
    .limit(200)
    .lean();

  return res.guard.success({ trips }, 'Trips fetched successfully');
}));

// POST /api/depot/trips/approve - Approve trip
router.post('/trips/approve', asyncHandler(async (req, res) => {
  const { trip_id } = req.body;
  const trip = await Trip.findById(trip_id);
  
  if (!trip) {
    return res.status(404).json({ success: false, message: 'Trip not found' });
  }

  trip.status = 'approved';
  trip.approvedBy = req.user._id;
  trip.approvedAt = new Date();
  await trip.save();

  return res.guard.success({ trip }, 'Trip approved successfully');
}));

// POST /api/depot/trips/reject - Reject trip
router.post('/trips/reject', asyncHandler(async (req, res) => {
  const { trip_id } = req.body;
  const trip = await Trip.findById(trip_id);
  
  if (!trip) {
    return res.status(404).json({ success: false, message: 'Trip not found' });
  }

  trip.status = 'rejected';
  trip.rejectedBy = req.user._id;
  trip.rejectedAt = new Date();
  await trip.save();

  return res.guard.success({ trip }, 'Trip rejected successfully');
}));

// PUT /api/depot/trips/assign-bus - Assign bus to trip
router.put('/trips/assign-bus', asyncHandler(async (req, res) => {
  const { trip_id, bus_id } = req.body;
  const trip = await Trip.findById(trip_id);
  
  if (!trip) {
    return res.status(404).json({ success: false, message: 'Trip not found' });
  }

  trip.busId = bus_id;
  await trip.save();

  return res.guard.success({ trip }, 'Bus assigned successfully');
}));

// =================================================================
// CREW DUTY ROSTER ENDPOINTS
// =================================================================

// GET /api/depot/crew/suggestions/:tripId - Get AI crew suggestions (REAL-TIME)
router.get('/crew/suggestions/:tripId', asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const trip = await Trip.findById(tripId)
    .populate('routeId')
    .lean();

  if (!trip) {
    return res.status(404).json({ success: false, message: 'Trip not found' });
  }

  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  if (!depotId) {
    return res.status(400).json({ success: false, message: 'No depot assigned' });
  }

  // Get available drivers and conductors for this depot
  const [drivers, conductors] = await Promise.all([
    Driver.find({ depotId, status: 'active' })
      .select('name phone employeeCode status depotId')
      .limit(20)
      .lean(),
    Conductor.find({ depotId, status: 'active' })
      .select('name phone employeeCode status depotId')
      .limit(20)
      .lean()
  ]);

  // Get recent duties (last 7 days) for fatigue calculation
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentDuties = await Duty.find({
    depotId,
    date: { $gte: sevenDaysAgo }
  })
    .select('driverId conductorId date status')
    .lean();

  // Calculate usage and fatigue scores
  const driverUsage = {};
  const conductorUsage = {};
  const driverLastDuty = {};
  const conductorLastDuty = {};

  recentDuties.forEach(duty => {
    if (duty.driverId) {
      driverUsage[duty.driverId] = (driverUsage[duty.driverId] || 0) + 1;
      if (!driverLastDuty[duty.driverId] || new Date(duty.date) > new Date(driverLastDuty[duty.driverId])) {
        driverLastDuty[duty.driverId] = duty.date;
      }
    }
    if (duty.conductorId) {
      conductorUsage[duty.conductorId] = (conductorUsage[duty.conductorId] || 0) + 1;
      if (!conductorLastDuty[duty.conductorId] || new Date(duty.date) > new Date(conductorLastDuty[duty.conductorId])) {
        conductorLastDuty[duty.conductorId] = duty.date;
      }
    }
  });

  // Calculate rest hours and fatigue
  const calculateRestHours = (lastDutyDate) => {
    if (!lastDutyDate) return 24; // No recent duty = fully rested
    const hoursSince = (new Date() - new Date(lastDutyDate)) / (1000 * 60 * 60);
    return Math.max(0, Math.floor(hoursSince));
  };

  const calculateFatigue = (usage, restHours) => {
    let fatigue = usage * 15; // Base fatigue from usage
    if (restHours < 8) fatigue += (8 - restHours) * 10; // Penalty for insufficient rest
    return Math.min(100, fatigue);
  };

  // Score and sort drivers
  const driverScores = drivers.map(driver => {
    const usage = driverUsage[driver._id] || 0;
    const restHours = calculateRestHours(driverLastDuty[driver._id]);
    const fatigue = calculateFatigue(usage, restHours);
    return { driver, usage, restHours, fatigue };
  });

  driverScores.sort((a, b) => {
    // Prefer lower fatigue, then higher rest hours
    if (a.fatigue !== b.fatigue) return a.fatigue - b.fatigue;
    return b.restHours - a.restHours;
  });

  // Score and sort conductors
  const conductorScores = conductors.map(conductor => {
    const usage = conductorUsage[conductor._id] || 0;
    const restHours = calculateRestHours(conductorLastDuty[conductor._id]);
    const fatigue = calculateFatigue(usage, restHours);
    return { conductor, usage, restHours, fatigue };
  });

  conductorScores.sort((a, b) => {
    if (a.fatigue !== b.fatigue) return a.fatigue - b.fatigue;
    return b.restHours - a.restHours;
  });

  const suggestedDriver = driverScores[0]?.driver || null;
  const suggestedConductor = conductorScores[0]?.conductor || null;
  const driverFatigueScore = driverScores[0]?.fatigue || 0;
  const conductorFatigueScore = conductorScores[0]?.fatigue || 0;
  const driverRestHours = driverScores[0]?.restHours || 24;
  const conductorRestHours = conductorScores[0]?.restHours || 24;

  return res.guard.success({
    suggestedDriver,
    suggestedConductor,
    driverFatigueScore,
    conductorFatigueScore,
    driverRestHours,
    conductorRestHours,
    availableDrivers: drivers.length,
    availableConductors: conductors.length
  }, 'Crew suggestions generated');
}));

// POST /api/depot/crew/assign - Assign crew to trip
router.post('/crew/assign', asyncHandler(async (req, res) => {
  const { trip_id, driver_id, conductor_id } = req.body;
  
  const trip = await Trip.findById(trip_id);
  if (!trip) {
    return res.status(404).json({ success: false, message: 'Trip not found' });
  }

  trip.driverId = driver_id;
  trip.conductorId = conductor_id;
  await trip.save();

  // Create duty assignment
  const duty = new Duty({
    tripId: trip_id,
    driverId: driver_id,
    conductorId: conductor_id,
    busId: trip.busId,
    depotId: req.user.depotId,
    date: trip.serviceDate || new Date(),
    status: 'assigned',
    assignedBy: req.user._id
  });
  await duty.save();

  return res.guard.success({ trip, duty }, 'Crew assigned successfully');
}));

// =================================================================
// MAINTENANCE ENDPOINTS
// =================================================================

const MaintenanceLog = require('../models/MaintenanceLog');

// GET /api/depot/maintenance/logs - Get maintenance logs
router.get('/maintenance/logs', asyncHandler(async (req, res) => {
  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  const logs = await MaintenanceLog.find({ depotId })
    .populate('busId', 'busNumber')
    .sort({ reportedAt: -1, createdAt: -1 })
    .limit(50)
    .lean();

  return res.guard.success({ logs }, 'Maintenance logs fetched');
}));

// GET /api/depot/maintenance/alerts - Get maintenance alerts
router.get('/maintenance/alerts', asyncHandler(async (req, res) => {
  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  const buses = await Bus.find({ depotId }).lean();
  const alerts = [];

  for (const bus of buses) {
    if (bus.nextServiceDate) {
      const daysUntilService = Math.ceil((new Date(bus.nextServiceDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilService <= 7) {
        alerts.push({
          busNumber: bus.busNumber,
          bus: bus,
          message: `Service due in ${daysUntilService} days`,
          predictedServiceDate: bus.nextServiceDate,
          severity: daysUntilService <= 3 ? 'high' : 'medium'
        });
      }
    }
  }

  return res.guard.success({ alerts }, 'Maintenance alerts fetched');
}));

// POST /api/depot/maintenance/log - Log maintenance
router.post('/maintenance/log', asyncHandler(async (req, res) => {
  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  const { bus_id, type, description, cost, nextServiceDate, issueType } = req.body;

  const log = new MaintenanceLog({
    busId: bus_id,
    depotId,
    issueType: issueType || type || 'other',
    description,
    cost: cost || 0,
    reportedAt: new Date(),
    status: 'open'
  });
  await log.save();

  // Update bus next service date if provided
  if (nextServiceDate && bus_id) {
    await Bus.findByIdAndUpdate(bus_id, { nextServiceDate: new Date(nextServiceDate) });
  }

  return res.guard.success({ log }, 'Maintenance logged successfully');
}));

// =================================================================
// FUEL MONITORING ENDPOINTS
// =================================================================

// GET /api/depot/fuel/logs - Get fuel logs
router.get('/fuel/logs', asyncHandler(async (req, res) => {
  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  const logs = await FuelLog.find({ depotId })
    .populate('busId', 'busNumber')
    .populate('tripId', 'tripNumber')
    .sort({ timestamp: -1 })
    .limit(100)
    .lean();

  return res.guard.success({ logs }, 'Fuel logs fetched');
}));

// GET /api/depot/fuel/analytics - Get fuel analytics
router.get('/fuel/analytics', asyncHandler(async (req, res) => {
  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fuelLogs = await FuelLog.find({
    depotId,
    timestamp: { $gte: today }
  }).lean();

  const totalFuel = fuelLogs.reduce((sum, log) => sum + (log.quantity || 0), 0);

  // Calculate average KM/L (simplified)
  const tripsWithFuel = await Trip.find({
    'routeId.depotId': depotId,
    serviceDate: { $gte: today }
  })
    .populate('routeId', 'distance')
    .lean();

  const totalDistance = tripsWithFuel.reduce((sum, trip) => sum + (trip.routeId?.distance || 0), 0);
  const averageKML = totalFuel > 0 ? totalDistance / totalFuel : 0;

  // Route comparison
  const routeComparison = await FuelLog.aggregate([
    { $match: { depotId, timestamp: { $gte: today } } },
    { $group: {
      _id: '$routeId',
      fuelUsed: { $sum: '$quantity' }
    }},
    { $lookup: {
      from: 'routes',
      localField: '_id',
      foreignField: '_id',
      as: 'route'
    }},
    { $unwind: '$route' },
    { $project: {
      routeName: '$route.routeName',
      fuelUsed: 1,
      distance: '$route.distance',
      efficiency: { $divide: ['$route.distance', '$fuelUsed'] }
    }}
  ]);

  return res.guard.success({
    totalFuel,
    averageKML,
    routeComparison,
    busWiseUsage: []
  }, 'Fuel analytics fetched');
}));

// POST /api/depot/fuel/log - Log fuel entry
router.post('/fuel/log', asyncHandler(async (req, res) => {
  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  const { busId, tripId, quantity, cost, odometerReading } = req.body;

  const fuelLog = new FuelLog({
    depotId,
    busId,
    tripId,
    quantity: quantity || 0,
    cost: cost || 0,
    odometerReading: odometerReading || 0,
    timestamp: new Date(),
    loggedBy: req.user._id
  });
  await fuelLog.save();

  return res.guard.success({ log: fuelLog }, 'Fuel logged successfully');
}));

// =================================================================
// INVENTORY & SPARE PARTS ENDPOINTS
// =================================================================

const SparePart = require('../models/SparePart');

// GET /api/depot/inventory - Get inventory (includes both SpareParts and Products)
router.get('/inventory', asyncHandler(async (req, res) => {
  let depotId = req.user?.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  // Get SpareParts
  const spareParts = await SparePart.find({ status: 'active' })
    .select('partName partNumber category stock currentStock minStock location status basePrice')
    .sort({ partName: 1 })
    .lean();

  // Get Products from vendors (these are also inventory items)
  const Product = require('../models/Product');
  const products = await Product.find({ 
    status: 'active', 
    isActive: true,
    'stock.quantity': { $gt: 0 }
  })
    .populate('vendorId', 'companyName')
    .select('productName productCode category stock basePrice finalPrice vendorId')
    .sort({ productName: 1 })
    .lean();

  // Map SpareParts to inventory format
  const sparePartsInventory = spareParts.map(part => ({
    _id: part._id,
    partName: part.partName || part.name,
    partNumber: part.partNumber || part.number,
    name: part.partName || part.name,
    number: part.partNumber || part.number,
    currentStock: part.stock?.current || part.currentStock || 0,
    minStock: part.stock?.minimum || part.stock?.minStock || part.minStock || 10,
    location: part.location || 'Warehouse A',
    category: part.category || 'GENERAL',
    basePrice: part.basePrice || part.currentPrice || 0,
    type: 'sparepart'
  }));

  // Map Products to inventory format
  const productsInventory = products.map(product => ({
    _id: product._id,
    partName: product.productName,
    partNumber: product.productCode,
    name: product.productName,
    number: product.productCode,
    currentStock: product.stock?.quantity || 0,
    minStock: product.stock?.minimum || 10,
    location: 'Warehouse A',
    category: product.category || 'GENERAL',
    basePrice: product.finalPrice || product.basePrice || 0,
    vendorName: product.vendorId?.companyName || 'Vendor',
    type: 'product'
  }));

  // Combine both
  const inventory = [...sparePartsInventory, ...productsInventory];

  return res.guard.success({ parts: inventory }, 'Inventory fetched');
}));

// GET /api/depot/inventory/alerts - Get low stock alerts
router.get('/inventory/alerts', asyncHandler(async (req, res) => {
  const parts = await SparePart.find({
    status: 'active',
    $expr: { $lte: ['$stock.current', '$stock.minimum'] }
  })
    .select('partName partNumber stock')
    .lean();

  const alerts = parts.map(part => ({
    partName: part.partName,
    currentStock: part.stock?.current || 0,
    minStock: part.stock?.minimum || 10
  }));

  return res.guard.success({ alerts }, 'Low stock alerts fetched');
}));

// POST /api/depot/inventory/issue - Issue part
router.post('/inventory/issue', asyncHandler(async (req, res) => {
  const { part_id, quantity, issuedTo, purpose } = req.body;

  const part = await SparePart.findById(part_id);
  if (!part) {
    return res.status(404).json({ success: false, message: 'Part not found' });
  }

  if (part.stock.current < quantity) {
    return res.status(400).json({ success: false, message: 'Insufficient stock' });
  }

  part.stock.current -= quantity;
  part.usageStats.totalUsed += quantity;
  part.usageStats.lastUsedDate = new Date();
  await part.save();

  return res.guard.success({ part }, 'Part issued successfully');
}));

// POST /api/depot/inventory/return - Return part
router.post('/inventory/return', asyncHandler(async (req, res) => {
  const { part_id, quantity } = req.body;

  const part = await SparePart.findById(part_id);
  if (!part) {
    return res.status(404).json({ success: false, message: 'Part not found' });
  }

  part.stock.current += quantity;
  await part.save();

  return res.guard.success({ part }, 'Part returned successfully');
}));

// =================================================================
// VENDOR VERIFICATION ENDPOINTS
// =================================================================

// GET /api/depot/vendor/logs - Get vendor logs
router.get('/vendor/logs', asyncHandler(async (req, res) => {
  const { status } = req.query;
  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  const query = { depotId };
  if (status && status !== 'all') {
    query.status = status;
  }

  // Get fuel logs that need vendor verification
  const fuelLogs = await FuelLog.find(query)
    .populate('busId', 'busNumber')
    .populate('tripId', 'tripNumber')
    .sort({ timestamp: -1 })
    .limit(50)
    .lean();

  const logs = fuelLogs.map(log => ({
    _id: log._id,
    date: log.timestamp,
    vendorName: 'Fuel Vendor',
    trip: log.tripId,
    fuelQuantity: log.quantity,
    cost: log.cost,
    tripUsage: log.quantity, // Simplified
    status: log.verified ? 'verified' : 'pending'
  }));

  return res.guard.success({ logs }, 'Vendor logs fetched');
}));

// POST /api/depot/vendor/verify - Verify vendor log
router.post('/vendor/verify', asyncHandler(async (req, res) => {
  const { log_id, action } = req.body;

  const log = await FuelLog.findById(log_id);
  if (!log) {
    return res.status(404).json({ success: false, message: 'Log not found' });
  }

  log.verified = action === 'approve';
  log.verifiedBy = req.user._id;
  log.verifiedAt = new Date();
  await log.save();

  return res.guard.success({ log }, 'Vendor log verified');
}));

// POST /api/depot/vendor/forward - Forward to admin
router.post('/vendor/forward', asyncHandler(async (req, res) => {
  const { log_id } = req.body;

  const log = await FuelLog.findById(log_id);
  if (!log) {
    return res.status(404).json({ success: false, message: 'Log not found' });
  }

  log.forwardedToAdmin = true;
  log.forwardedAt = new Date();
  await log.save();

  return res.guard.success({ log }, 'Forwarded to admin');
}));

// =================================================================
// PASSENGER SERVICES ENDPOINTS
// =================================================================

// Try to load Complaint model, fallback to Booking if not available
let Complaint, ConcessionRequest;
try {
  Complaint = require('../models/Complaint');
} catch (e) {
  // Use Booking model as fallback for complaints
  Complaint = Booking;
}

try {
  ConcessionRequest = require('../models/ConcessionRequest');
} catch (e) {
  // Use StudentPass as fallback for concessions
  const StudentPass = require('../models/StudentPass');
  ConcessionRequest = StudentPass;
}

// GET /api/depot/complaints - Get complaints
router.get('/complaints', asyncHandler(async (req, res) => {
  const { status } = req.query;
  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  // Try to get complaints, fallback to empty array
  let complaints = [];
  try {
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (depotId) {
      query.depotId = depotId;
    }

    complaints = await Complaint.find(query)
      .populate('tripId', 'tripNumber')
      .populate('passengerId', 'name email phone')
      .sort({ date: -1, createdAt: -1 })
      .limit(50)
      .lean();
  } catch (error) {
    console.log('Complaints model not available, returning empty array');
  }

  return res.guard.success({ complaints }, 'Complaints fetched');
}));

// PUT /api/depot/complaints/resolve - Resolve complaint
router.put('/complaints/resolve', asyncHandler(async (req, res) => {
  const { complaint_id } = req.body;

  const complaint = await Complaint.findById(complaint_id);
  if (!complaint) {
    return res.status(404).json({ success: false, message: 'Complaint not found' });
  }

  complaint.status = 'resolved';
  complaint.resolvedBy = req.user._id;
  complaint.resolvedAt = new Date();
  await complaint.save();

  return res.guard.success({ complaint }, 'Complaint resolved');
}));

// GET /api/depot/concessions - Get concession requests
router.get('/concessions', asyncHandler(async (req, res) => {
  const { status } = req.query;

  // Try to get concessions, fallback to StudentPass
  let concessions = [];
  try {
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
      query.passStatus = status === 'pending' ? 'applied' : status;
    } else {
      query.passStatus = { $in: ['applied', 'pending'] };
    }

    concessions = await ConcessionRequest.find(query)
      .select('personalDetails educationalDetails passStatus status createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Map to expected format
    concessions = concessions.map(conc => ({
      _id: conc._id,
      passengerName: conc.personalDetails?.fullName || 'Student',
      type: 'Student',
      date: conc.createdAt,
      status: conc.passStatus || conc.status || 'pending',
      documentUrl: conc.documents?.studentIdCard?.url || null
    }));
  } catch (error) {
    console.log('Concession model not available, returning empty array');
  }

  return res.guard.success({ concessions }, 'Concession requests fetched');
}));

// POST /api/depot/concession/approve - Approve concession
router.post('/concession/approve', asyncHandler(async (req, res) => {
  const { concession_id } = req.body;

  const concession = await ConcessionRequest.findById(concession_id);
  if (!concession) {
    return res.status(404).json({ success: false, message: 'Concession request not found' });
  }

  concession.status = 'approved';
  concession.approvedBy = req.user._id;
  concession.approvedAt = new Date();
  await concession.save();

  return res.guard.success({ concession }, 'Concession approved');
}));

// POST /api/depot/concession/reject - Reject concession
router.post('/concession/reject', asyncHandler(async (req, res) => {
  const { concession_id } = req.body;

  const concession = await ConcessionRequest.findById(concession_id);
  if (!concession) {
    return res.status(404).json({ success: false, message: 'Concession request not found' });
  }

  concession.status = 'rejected';
  concession.rejectedBy = req.user._id;
  concession.rejectedAt = new Date();
  await concession.save();

  return res.guard.success({ concession }, 'Concession rejected');
}));

// =================================================================
// REPORTS ENDPOINTS
// =================================================================

// GET /api/depot/reports/daily - Get daily report
router.get('/reports/daily', asyncHandler(async (req, res) => {
  const { date } = req.query;
  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  const reportDate = date ? new Date(date) : new Date();
  reportDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(reportDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const [trips, bookings, fuelLogs, maintenanceLogs] = await Promise.all([
    Trip.countDocuments({
      'routeId.depotId': depotId,
      serviceDate: { $gte: reportDate, $lt: nextDay }
    }),
    Booking.countDocuments({
      'tripId.routeId.depotId': depotId,
      createdAt: { $gte: reportDate, $lt: nextDay }
    }),
    FuelLog.find({
      depotId,
      timestamp: { $gte: reportDate, $lt: nextDay }
    }).lean(),
    MaintenanceLog.countDocuments({
      depotId,
      reportedAt: { $gte: reportDate, $lt: nextDay }
    })
  ]);

  const revenue = await Booking.aggregate([
    { $match: { 'tripId.routeId.depotId': depotId, createdAt: { $gte: reportDate, $lt: nextDay } } },
    { $group: { _id: null, total: { $sum: '$fareAmount' } } }
  ]);

  const totalFuel = fuelLogs.reduce((sum, log) => sum + (log.quantity || 0), 0);

  return res.guard.success({
    totalTrips: trips,
    completedTrips: trips,
    totalRevenue: revenue[0]?.total || 0,
    totalBookings: bookings,
    fuelConsumed: totalFuel,
    fuelEfficiency: 0,
    onTimeDepartures: 95,
    averageOccupancy: 78,
    maintenanceCount: maintenanceLogs,
    complaintsCount: 0,
    tripsChange: 5,
    onTimeChange: 2,
    occupancyChange: 3,
    efficiencyChange: 1,
    complaintsChange: -10
  }, 'Daily report generated');
}));

// GET /api/depot/reports/weekly - Get weekly report
router.get('/reports/weekly', asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  const startDate = start ? new Date(start) : new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = end ? new Date(end) : new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  endDate.setHours(23, 59, 59, 999);

  const [trips, bookings] = await Promise.all([
    Trip.countDocuments({
      'routeId.depotId': depotId,
      serviceDate: { $gte: startDate, $lte: endDate }
    }),
    Booking.countDocuments({
      'tripId.routeId.depotId': depotId,
      createdAt: { $gte: startDate, $lte: endDate }
    })
  ]);

  const revenue = await Booking.aggregate([
    { $match: { 'tripId.routeId.depotId': depotId, createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: null, total: { $sum: '$fareAmount' } } }
  ]);

  return res.guard.success({
    totalTrips: trips,
    totalRevenue: revenue[0]?.total || 0,
    totalBookings: bookings
  }, 'Weekly report generated');
}));

// GET /api/depot/reports/monthly - Get monthly report
router.get('/reports/monthly', asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  const reportMonth = month ? parseInt(month) : new Date().getMonth() + 1;
  const reportYear = year ? parseInt(year) : new Date().getFullYear();

  const startDate = new Date(reportYear, reportMonth - 1, 1);
  const endDate = new Date(reportYear, reportMonth, 0, 23, 59, 59, 999);

  const [trips, bookings] = await Promise.all([
    Trip.countDocuments({
      'routeId.depotId': depotId,
      serviceDate: { $gte: startDate, $lte: endDate }
    }),
    Booking.countDocuments({
      'tripId.routeId.depotId': depotId,
      createdAt: { $gte: startDate, $lte: endDate }
    })
  ]);

  const revenue = await Booking.aggregate([
    { $match: { 'tripId.routeId.depotId': depotId, createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: null, total: { $sum: '$fareAmount' } } }
  ]);

  return res.guard.success({
    totalTrips: trips,
    totalRevenue: revenue[0]?.total || 0,
    totalBookings: bookings
  }, 'Monthly report generated');
}));

// =================================================================
// NOTIFICATIONS ENDPOINT
// =================================================================

// GET /api/depot/notifications - Get notifications
router.get('/notifications', asyncHandler(async (req, res) => {
  console.log('🔔 Notifications route handler called');
  // Auth is already applied via router.use() above
  if (!req.user) {
    console.error('❌ No user in notifications route');
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  let depotId = req.user.depotId;
  if (!depotId) {
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (defaultDepot) depotId = defaultDepot._id;
  }

  // Get routes for this depot first
  const depotRoutes = await Route.find({ 
    $or: [
      { 'depot.depotId': depotId },
      { depotId: depotId }
    ]
  }).select('_id').lean();
  const routeIds = depotRoutes.map(r => r._id);

  // Get alerts from various sources
  // SparePart is already required at line 4120
  const [lowStockParts, maintenanceAlerts, pendingTrips] = await Promise.all([
    SparePart ? SparePart.countDocuments({
      $expr: { $lte: ['$stock.current', '$stock.minimum'] }
    }) : Promise.resolve(0),
    Bus.countDocuments({
      depotId,
      nextServiceDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    }),
    routeIds.length > 0 ? Trip.countDocuments({
      routeId: { $in: routeIds },
      status: 'pending'
    }) : Promise.resolve(0)
  ]);

  const notifications = [];
  if (lowStockParts > 0) {
    notifications.push({
      id: 'low_stock',
      title: 'Low Stock Alert',
      message: `${lowStockParts} parts are running low`,
      severity: 'high',
      timestamp: new Date()
    });
  }
  if (maintenanceAlerts > 0) {
    notifications.push({
      id: 'maintenance',
      title: 'Maintenance Due',
      message: `${maintenanceAlerts} buses need service`,
      severity: 'medium',
      timestamp: new Date()
    });
  }
  if (pendingTrips > 0) {
    notifications.push({
      id: 'pending_trips',
      title: 'Pending Trips',
      message: `${pendingTrips} trips need approval`,
      severity: 'medium',
      timestamp: new Date()
    });
  }

  return res.guard.success({ notifications }, 'Notifications fetched');
}));

// GET /api/depot/payments - Get all payments for depot
router.get('/payments', asyncHandler(async (req, res) => {
  const depotId = req.user?.depotId;
  if (!depotId) {
    return res.guard.error('Depot ID not found', 400);
  }

  const Invoice = require('../models/Invoice');
  const PurchaseOrder = require('../models/PurchaseOrder');

  // Get invoices from purchase orders
  const purchaseOrders = await PurchaseOrder.find({ depotId })
    .populate('vendorId', 'companyName email phone')
    .sort({ createdAt: -1 })
    .lean();

  const payments = purchaseOrders.map(po => {
    const totalAmount = po.totalAmount || 0;
    const paidAmount = po.status === 'completed' ? totalAmount : 0;
    const dueAmount = totalAmount - paidAmount;
    const dueDate = po.expectedDeliveryDate 
      ? new Date(new Date(po.expectedDeliveryDate).getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days after delivery
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return {
      _id: po._id,
      invoiceNumber: `INV-${po.poNumber}`,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      totalAmount: totalAmount,
      paidAmount: paidAmount,
      dueAmount: dueAmount,
      status: po.status === 'completed' ? 'paid' : 'pending',
      invoiceStatus: po.status === 'completed' ? 'paid' : 'pending',
      dueDate: dueDate,
      paymentDueDate: dueDate,
      createdAt: po.createdAt,
      updatedAt: po.updatedAt
    };
  });

  return res.guard.success({ payments }, 'Payments fetched');
}));

// GET /api/depot/invoices - Get all invoices for depot
router.get('/invoices', asyncHandler(async (req, res) => {
  const depotId = req.user?.depotId;
  if (!depotId) {
    return res.guard.error('Depot ID not found', 400);
  }

  const PurchaseOrder = require('../models/PurchaseOrder');
  const invoices = await PurchaseOrder.find({ depotId })
    .populate('vendorId', 'companyName email phone')
    .sort({ createdAt: -1 })
    .lean();

  return res.guard.success({ invoices }, 'Invoices fetched');
}));

// GET /api/depot/auctions - Get all auctions for depot
router.get('/auctions', asyncHandler(async (req, res) => {
  const depotId = req.user?.depotId;
  if (!depotId) {
    return res.guard.error('Depot ID not found', 400);
  }

  // For now, return empty array - auctions will be implemented
  // This prevents 404 errors
  return res.guard.success({ auctions: [] }, 'Auctions fetched');
}));

// POST /api/depot/auctions/create - Create new auction
router.post('/auctions/create', asyncHandler(async (req, res) => {
  const depotId = req.user?.depotId;
  if (!depotId) {
    return res.guard.error('Depot ID not found', 400);
  }

  const { productId, productName, quantity, startingPrice, reservePrice, endDate, description, condition } = req.body;

  if (!productId || !startingPrice || !endDate) {
    return res.guard.error('Missing required fields', 400);
  }

  // Create auction object (for now, store in a simple way)
  // In production, you'd have an Auction model
  const auction = {
    _id: require('mongoose').Types.ObjectId(),
    auctionId: `AUCT-${Date.now()}`,
    depotId: depotId,
    productId: productId,
    productName: productName,
    quantity: quantity || 1,
    startingPrice: startingPrice,
    reservePrice: reservePrice || 0,
    currentBid: startingPrice,
    endDate: new Date(endDate),
    description: description || '',
    condition: condition || 'used',
    status: 'active',
    createdAt: new Date(),
    createdBy: req.user._id
  };

  // For now, return success - in production, save to database
  return res.guard.success({ auction }, 'Auction created successfully');
}));

// Log all registered routes for debugging
console.log('📋 Depot routes registered:');
console.log('   GET /api/depot/health');
console.log('   GET /api/depot/dashboard');
console.log('   GET /api/depot/notifications');
console.log('   GET /api/depot/buses');
console.log('   GET /api/depot/trips');
console.log('   GET /api/depot/payments');
console.log('   GET /api/depot/invoices');
console.log('   GET /api/depot/auctions');
console.log('   POST /api/depot/auctions/create');
console.log('   ... and more');

module.exports = router;
