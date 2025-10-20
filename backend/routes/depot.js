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
  res.json({ success: true, message: 'Depot routes are working' });
});

// Apply depot auth to all routes except health
router.use((req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  
  // Apply auth middleware
  return auth(req, res, (err) => {
    if (err) {
      console.error('Auth error:', err);
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication failed' 
      });
    }
    
    // Allow all authenticated users to access depot routes
    console.log('Depot route access granted to user:', {
      role: req.user?.role,
      userId: req.user?._id,
      userName: req.user?.name,
      userDepotId: req.user?.depotId,
      userEmail: req.user?.email
    });
    
    next();
  });
});

// Ensure depotId is available for all depot routes
router.use(async (req, res, next) => {
  try {
    if (!req.user || req.user.depotId) return next();
    // Try mapping by depotCode from token/user
    let code = req.user.depotCode || null;
    if (!code && req.user.email) {
      const email = String(req.user.email).toLowerCase();
      const mA = email.match(/^([a-z0-9]+)-depot@yatrik\.com$/);
      const mB = email.match(/^depot-([a-z0-9]+)@yatrik\.com$/);
      code = (mA && mA[1]) || (mB && mB[1]) || null;
    }
    let depot = null;
    if (code) {
      const upper = String(code).toUpperCase();
      depot = await Depot.findOne({ $or: [{ depotCode: upper }, { code: upper }] }).lean();
    }
    if (!depot) {
      depot = await Depot.findOne({ status: 'active' }).lean();
    }
    if (depot && depot._id) {
      req.user.depotId = depot._id;
      if (!req.user.depotCode) req.user.depotCode = depot.depotCode || depot.code;
      console.log('Resolved depotId for user via middleware:', { depotId: req.user.depotId, depotCode: req.user.depotCode });
    }
  } catch (e) {
    console.warn('ensureDepotId middleware warning:', e.message);
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
  let depotId = req.user.depotId;

  // If user doesn't have depotId, try to find a depot for them
  if (!depotId) {
    console.log('User has no depotId, finding default depot...');
    const defaultDepot = await Depot.findOne({ status: 'active' });
    if (!defaultDepot) {
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

  // Get comprehensive depot statistics
  const [totalTrips, activeTrips, totalBuses, availableBuses, totalRoutes, totalBookings, totalFuelLogs] = await Promise.all([
    Trip.countDocuments({ 'routeId.depotId': depotId }),
    Trip.countDocuments({ 'routeId.depotId': depotId, status: { $in: ['scheduled', 'running'] } }),
    Bus.countDocuments({ depotId }),
    Bus.countDocuments({ depotId, status: 'available' }),
    Route.countDocuments({ 'depot.depotId': depotId }),
    Booking.countDocuments({ 'tripId.routeId.depotId': depotId }),
    FuelLog.countDocuments({ depotId })
  ]);

  // Get today's data
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayTrips, todayBookings, todayRevenue] = await Promise.all([
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
    ])
  ]);

  // Get recent trips with full details
  const recentTrips = await Trip.find({ 'routeId.depotId': depotId })
    .populate('routeId')
    .populate('driverId', 'name phone')
    .populate('conductorId', 'name phone')
    .populate('busId', 'busNumber registrationNumber')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Get active crew assignments
  const activeCrew = await Duty.find({ 
    depotId, 
    date: { $gte: today },
    status: { $in: ['assigned', 'in_progress'] }
  })
    .populate('driverId', 'name phone')
    .populate('conductorId', 'name phone')
    .populate('tripId')
    .populate('busId', 'busNumber')
    .sort({ date: 1 })
    .lean();

  // Get fuel logs for today
  const todayFuelLogs = await FuelLog.find({ 
    depotId, 
    createdAt: { $gte: today, $lt: tomorrow } 
  })
    .populate('busId', 'busNumber')
    .sort({ createdAt: -1 })
    .lean();

  return res.guard.success({
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
      todayRevenue: todayRevenue[0]?.total || 0
    },
    recentTrips,
    activeCrew,
    todayFuelLogs
  });
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
    
    // Get all drivers in the depot
    const drivers = await User.find({
      role: 'driver',
      depotId: depotId,
      status: 'active'
    })
    .select('name phone email licenseNumber staffDetails')
    .lean();

    res.json({
      success: true,
      data: {
        drivers,
        stats: {
          totalDrivers: drivers.length
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
    
    // Get all conductors in the depot
    const conductors = await User.find({
      role: 'conductor',
      depotId: depotId,
      status: 'active'
    })
    .select('name phone email staffDetails')
    .lean();

    res.json({
      success: true,
      data: {
        conductors,
        stats: {
          totalConductors: conductors.length
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

    // Verify driver exists and has correct role (if provided)
    let driver = null;
    if (driverId) {
      driver = await User.findById(driverId);
      if (!driver || driver.role !== 'driver') {
        return res.status(400).json({
          success: false,
          message: 'Invalid driver ID or user is not a driver'
        });
      }
    }

    // Verify conductor exists and has correct role (if provided)
    let conductor = null;
    if (conductorId) {
      conductor = await User.findById(conductorId);
      if (!conductor || conductor.role !== 'conductor') {
        return res.status(400).json({
          success: false,
          message: 'Invalid conductor ID or user is not a conductor'
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

module.exports = router;
