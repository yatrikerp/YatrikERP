const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Duty = require('../models/Duty');

// Helper function to create role-based auth middleware
const authRole = (roles) => [auth, requireRole(roles)];

// Depot Manager authentication
const depotAuth = authRole(['depot_manager', 'DEPOT_MANAGER']);

// Apply depot auth to all routes
router.use(depotAuth);

// GET /api/depot/dashboard - Depot dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    
    // Get depot statistics
    const [totalTrips, activeTrips, totalBuses, availableBuses] = await Promise.all([
      Trip.countDocuments({ 'routeId.depotId': depotId }),
      Trip.countDocuments({ 'routeId.depotId': depotId, status: { $in: ['scheduled', 'running'] } }),
      Bus.countDocuments({ depotId }),
      Bus.countDocuments({ depotId, status: 'available' })
    ]);

    // Get recent trips
    const recentTrips = await Trip.find({ 'routeId.depotId': depotId })
      .populate('routeId')
      .populate('driverId', 'name')
      .populate('conductorId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get crew assignments
    const crewAssignments = await Duty.find({ depotId })
      .populate('driverId', 'name phone')
      .populate('conductorId', 'name phone')
      .populate('tripId')
      .sort({ date: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        stats: {
          totalTrips,
          activeTrips,
          totalBuses,
          availableBuses
        },
        recentTrips,
        crewAssignments
      }
    });

  } catch (error) {
    console.error('Depot dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch depot data' });
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
    console.error('Route creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create route'
    });
  }
});

// GET /api/depot/routes - Get depot routes
router.get('/routes', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    
    const routes = await Route.find({ depotId, status: 'active' })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { routes },
      message: `Found ${routes.length} routes`
    });

  } catch (error) {
    console.error('Fetch routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes'
    });
  }
});

// PUT /api/depot/routes/:id - Update route
router.put('/routes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const depotId = req.user.depotId;
    const updateData = req.body;

    const route = await Route.findOne({ _id: id, depotId });
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    Object.assign(route, updateData);
    await route.save();

    res.json({
      success: true,
      data: { route },
      message: 'Route updated successfully'
    });

  } catch (error) {
    console.error('Route update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update route'
    });
  }
});

// DELETE /api/depot/routes/:id - Delete route
router.delete('/routes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const depotId = req.user.depotId;

    const route = await Route.findOne({ _id: id, depotId });
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Check if route has active trips
    const activeTrips = await Trip.countDocuments({ routeId: id, status: { $in: ['scheduled', 'running'] } });
    if (activeTrips > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete route with active trips'
      });
    }

    route.status = 'inactive';
    await route.save();

    res.json({
      success: true,
      message: 'Route deactivated successfully'
    });

  } catch (error) {
    console.error('Route deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete route'
    });
  }
});

// POST /api/depot/trips - Create new trip
router.post('/trips', async (req, res) => {
  try {
    const { routeId, busId, driverId, conductorId, serviceDate, startTime } = req.body;
    const depotId = req.user.depotId;

    if (!routeId || !serviceDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Route ID, service date, and start time are required'
      });
    }

    // Verify route belongs to depot
    const route = await Route.findOne({ _id: routeId, depotId });
    if (!route) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route for this depot'
      });
    }

    const trip = new Trip({
      routeId,
      busId,
      driverId,
      conductorId,
      serviceDate: new Date(serviceDate),
      startTime,
      status: 'scheduled',
      createdBy: req.user._id
    });

    await trip.save();

    res.status(201).json({
      success: true,
      data: { trip },
      message: 'Trip created successfully'
    });

  } catch (error) {
    console.error('Trip creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create trip'
    });
  }
});

// GET /api/depot/trips - Get depot trips
router.get('/trips', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    const { status, date } = req.query;

    let query = { 'routeId.depotId': depotId };
    
    if (status) {
      query.status = status;
    }
    
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.serviceDate = { $gte: searchDate, $lt: nextDay };
    }

    const trips = await Trip.find(query)
      .populate('routeId')
      .populate('busId')
      .populate('driverId', 'name phone')
      .populate('conductorId', 'name phone')
      .sort({ serviceDate: 1, startTime: 1 })
      .lean();

    res.json({
      success: true,
      data: { trips },
      message: `Found ${trips.length} trips`
    });

  } catch (error) {
    console.error('Fetch trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trips'
    });
  }
});

// POST /api/depot/crew - Assign crew to trip
router.post('/crew', async (req, res) => {
  try {
    const { tripId, driverId, conductorId } = req.body;
    const depotId = req.user.depotId;

    if (!tripId || !driverId || !conductorId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID, driver ID, and conductor ID are required'
      });
    }

    // Verify trip belongs to depot
    const trip = await Trip.findOne({ _id: tripId, 'routeId.depotId': depotId })
      .populate('routeId');
    
    if (!trip) {
      return res.status(400).json({
        success: false,
        message: 'Trip not found or not accessible'
      });
    }

    // Verify crew members belong to depot
    const [driver, conductor] = await Promise.all([
      User.findOne({ _id: driverId, depotId, role: 'driver' }),
      User.findOne({ _id: conductorId, depotId, role: 'conductor' })
    ]);

    if (!driver || !conductor) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver or conductor for this depot'
      });
    }

    // Update trip with crew
    trip.driverId = driverId;
    trip.conductorId = conductorId;
    await trip.save();

    // Create duty assignment
    const duty = new Duty({
      tripId,
      driverId,
      conductorId,
      depotId,
      date: trip.serviceDate,
      status: 'assigned',
      assignedBy: req.user._id
    });

    await duty.save();

    res.json({
      success: true,
      data: { trip, duty },
      message: 'Crew assigned successfully'
    });

  } catch (error) {
    console.error('Crew assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign crew'
    });
  }
});

// GET /api/depot/live-map - Live map data for depot
router.get('/live-map', async (req, res) => {
  try {
    const depotId = req.user.depotId;
    
    // Get running trips with mock GPS data
    const runningTrips = await Trip.find({
      'routeId.depotId': depotId,
      status: { $in: ['running', 'boarding'] }
    })
    .populate('routeId')
    .populate('driverId', 'name')
    .populate('conductorId', 'name')
    .lean();

    // Add mock GPS coordinates for Phase-0
    const liveMapData = runningTrips.map(trip => ({
      ...trip,
      currentLocation: {
        lat: 10.8505 + (Math.random() - 0.5) * 0.1, // Mock Kerala coordinates
        lng: 76.2711 + (Math.random() - 0.5) * 0.1,
        timestamp: new Date(),
        speed: Math.floor(Math.random() * 60) + 40, // 40-100 km/h
        heading: Math.floor(Math.random() * 360) // 0-360 degrees
      }
    }));

    res.json({
      success: true,
      data: { trips: liveMapData },
      message: `Tracking ${liveMapData.length} active trips`
    });

  } catch (error) {
    console.error('Live map error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live map data'
    });
  }
});

// POST /api/depot/concessions - Approve concession requests
router.post('/concessions', async (req, res) => {
  try {
    const { bookingId, concessionType, discountPercentage, reason } = req.body;
    const depotId = req.user.depotId;

    if (!bookingId || !concessionType || !discountPercentage) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID, concession type, and discount percentage are required'
      });
    }

    // Verify booking belongs to depot
    const booking = await Booking.findById(bookingId)
      .populate('tripId')
      .populate('routeId');

    if (!booking || booking.routeId.depotId.toString() !== depotId) {
      return res.status(400).json({
        success: false,
        message: 'Booking not found or not accessible'
      });
    }

    // Apply concession
    const discountAmount = (booking.fareAmount * discountPercentage) / 100;
    booking.concession = {
      type: concessionType,
      discountPercentage,
      discountAmount,
      reason,
      approvedBy: req.user._id,
      approvedAt: new Date()
    };

    booking.finalFare = booking.fareAmount - discountAmount;
    await booking.save();

    res.json({
      success: true,
      data: { booking },
      message: 'Concession approved successfully'
    });

  } catch (error) {
    console.error('Concession approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve concession'
    });
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
    const fuelLog = {
      busId,
      fuelType,
      quantity,
      cost,
      odometerReading,
      notes,
      recordedBy: req.user._id,
      recordedAt: new Date()
    };

    // Store in bus document for Phase-0
    if (!bus.fuelLogs) bus.fuelLogs = [];
    bus.fuelLogs.push(fuelLog);
    bus.lastFuelReading = odometerReading;
    bus.lastFuelDate = new Date();
    
    await bus.save();

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

module.exports = router;
