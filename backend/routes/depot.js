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

// Helper function to create role-based auth middleware
const authRole = (roles) => [auth, requireRole(roles)];

// Depot Manager authentication
const depotAuth = authRole(['depot_manager', 'DEPOT_MANAGER']);

// Apply depot auth to all routes
router.use(depotAuth);

// GET /api/depot/dashboard - Comprehensive depot dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    
    // Get comprehensive depot statistics
    const [totalTrips, activeTrips, totalBuses, availableBuses, totalRoutes, totalBookings, totalFuelLogs] = await Promise.all([
      Trip.countDocuments({ 'routeId.depotId': depotId }),
      Trip.countDocuments({ 'routeId.depotId': depotId, status: { $in: ['scheduled', 'running'] } }),
      Bus.countDocuments({ depotId }),
      Bus.countDocuments({ depotId, status: 'available' }),
      Route.countDocuments({ depotId }),
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

    res.json({
      success: true,
      data: {
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
      }
    });

  } catch (error) {
    console.error('Depot dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch depot data' });
  }
});

// GET /api/depot/routes - Get all routes for depot
router.get('/routes', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    
    const routes = await Route.find({ depotId })
      .populate('stops')
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: routes
    });

  } catch (error) {
    console.error('Get depot routes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch routes' });
  }
});

// POST /api/depot/routes - Create new route
router.post('/routes', async (req, res) => {
  try {
    const { name, from, to, distanceKm, stops, fare, schedule } = req.body;
    const depotId = req.user.depotId;

    if (!name || !from || !to || !distanceKm) {
      return res.status(400).json({
        success: false,
        message: 'Route name, from, to, and distance are required'
      });
    }

    const route = new Route({
      name,
      from,
      to,
      distanceKm,
      stops: stops || [],
      baseFare: fare || 100,
      schedule: schedule || [],
      depotId,
      status: 'active',
      createdBy: req.user._id
    });

    await route.save();

    res.status(201).json({
      success: true,
      data: { route },
      message: 'Route created successfully'
    });

  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create route'
    });
  }
});

// GET /api/depot/trips - Get all trips for depot
router.get('/trips', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    const { status, date } = req.query;
    
    let query = { 'routeId.depotId': depotId };
    if (status) query.status = status;
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(searchDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query.date = { $gte: searchDate, $lt: nextDate };
    }

    const trips = await Trip.find(query)
      .populate('routeId')
      .populate('driverId', 'name phone')
      .populate('conductorId', 'name phone')
      .populate('busId', 'busNumber registrationNumber')
      .sort({ date: 1, departureTime: 1 })
      .lean();

    res.json({
      success: true,
      data: trips
    });

  } catch (error) {
    console.error('Get depot trips error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trips' });
  }
});

// POST /api/depot/trips - Create new trip
router.post('/trips', async (req, res) => {
  try {
    const { routeId, date, departureTime, arrivalTime, busId, driverId, conductorId, fare } = req.body;
    const depotId = req.user.depotId;

    if (!routeId || !date || !departureTime || !busId) {
      return res.status(400).json({
        success: false,
        message: 'Route, date, departure time, and bus are required'
      });
    }

    // Verify route belongs to depot
    const route = await Route.findOne({ _id: routeId, depotId });
    if (!route) {
      return res.status(400).json({
        success: false,
        message: 'Route not found or not accessible'
      });
    }

    const trip = new Trip({
      routeId,
      date: new Date(date),
      departureTime,
      arrivalTime,
      busId,
      driverId,
      conductorId,
      baseFare: fare || route.baseFare,
      status: 'scheduled',
      depotId,
      createdBy: req.user._id
    });

    await trip.save();

    res.status(201).json({
      success: true,
      data: { trip },
      message: 'Trip created successfully'
    });

  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create trip'
    });
  }
});

// PUT /api/depot/trips/:id - Update trip
router.put('/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const depotId = req.user.depotId;
    const updates = req.body;

    const trip = await Trip.findOne({ _id: id, depotId });
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    Object.assign(trip, updates);
    await trip.save();

    res.json({
      success: true,
      data: { trip },
      message: 'Trip updated successfully'
    });

  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trip'
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
      .populate('passengerId', 'name phone')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: bookings
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
    
    // Get buses with basic information
    const buses = await Bus.find({ depotId })
      .select('busNumber registrationNumber busType capacity status lastMaintenance odometerReading lastFuelReading lastFuelDate')
      .lean();

    // Get bus counts for stats
    const [totalBuses, availableBuses, maintenanceBuses] = await Promise.all([
      Bus.countDocuments({ depotId }),
      Bus.countDocuments({ depotId, status: 'available' }),
      Bus.countDocuments({ depotId, status: 'maintenance' })
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

module.exports = router;
