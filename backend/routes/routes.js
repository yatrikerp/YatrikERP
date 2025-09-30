const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const Depot = require('../models/Depot');
const { auth, requireRole } = require('../middleware/auth');

// Helper function to create role-based auth middleware
const authRole = (roles) => [auth, requireRole(roles)];

// Get all routes (public - visible to all users)
router.get('/', async (req, res) => {
  try {
    const { 
      fromCity, 
      toCity, 
      depotId, 
      status, 
      page = 1, 
      limit = 20,
      sortBy = 'routeNumber',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (fromCity) {
      filter['startingPoint.city'] = { $regex: fromCity, $options: 'i' };
    }
    
    if (toCity) {
      filter['endingPoint.city'] = { $regex: toCity, $options: 'i' };
    }
    
    if (depotId) {
      filter['depot.depotId'] = depotId;
    }
    
    if (status) {
      filter.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const routes = await Route.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('depot.depotId', 'depotName depotCode location.city')
      .populate('assignedBuses.busId', 'busNumber capacity busType')
      .lean();

    // Get total count for pagination
    const total = await Route.countDocuments(filter);

    res.json({
      success: true,
      data: routes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes',
      error: error.message
    });
  }
});

// Public: Get popular routes based on live scheduling activity
// GET /api/routes/popular?limit=5
router.get('/popular', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '5', 10), 5);

    // Only include today's scheduled or running trips, grouped by route
    const Trip = require('../models/Trip');
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);

    const popularByTrips = await Trip.aggregate([
      { $match: {
          serviceDate: { $gte: start, $lte: end },
          status: { $in: ['scheduled', 'running'] }
        }
      },
      // Compute next departure time per trip as a sortable Date for today
      { $addFields: {
          departureDateTime: {
            $dateFromParts: {
              'year': { $year: '$serviceDate' },
              'month': { $month: '$serviceDate' },
              'day': { $dayOfMonth: '$serviceDate' },
              'hour': { $toInt: { $arrayElemAt: [ { $split: ['$startTime', ':'] }, 0 ] } },
              'minute': { $toInt: { $arrayElemAt: [ { $split: ['$startTime', ':'] }, 1 ] } }
            }
          }
        }
      },
      { $group: {
          _id: '$routeId',
          tripCount: { $sum: 1 },
          minFare: { $min: '$fare' },
          nextDeparture: { $min: '$departureDateTime' }
        }
      },
      { $sort: { tripCount: -1, nextDeparture: 1 } },
      { $limit: limit },
      { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'route' } },
      { $unwind: '$route' },
      { $project: {
          routeId: '$_id',
          tripCount: 1,
          minFare: 1,
          nextDeparture: 1,
          routeName: '$route.routeName',
          routeNumber: '$route.routeNumber',
          startingPoint: '$route.startingPoint',
          endingPoint: '$route.endingPoint'
        }
      }
    ]);

    const mapTripFrequency = (tripCount, scheduleCount) => {
      if (tripCount >= 24) return 'Every 1 hour';
      if (tripCount >= 12) return 'Every 2 hours';
      if (tripCount >= 6) return 'Every 4 hours';
      if (tripCount >= 2) return 'Multiple times today';
      // fallback to schedule hint
      if (scheduleCount >= 24) return 'Every 1 hour';
      if (scheduleCount >= 12) return 'Every 2 hours';
      if (scheduleCount >= 6) return 'Every 4 hours';
      if (scheduleCount >= 2) return 'Every 12 hours';
      return 'Daily';
    };

    const data = popularByTrips.map(r => {
      const fromCity = r.startingPoint?.city || r.startingPoint?.location || r.startingPoint || '';
      const toCity = r.endingPoint?.city || r.endingPoint?.location || r.endingPoint || '';
      const tripsLabel = r.tripCount >= 1 ? `${r.tripCount} trips today` : 'Scheduled today';
      const fareLabel = typeof r.minFare === 'number' ? `₹${r.minFare}` : '—';
      return {
        from: fromCity,
        to: toCity,
        frequency: tripsLabel,
        fare: fareLabel,
        routeId: r.routeId,
        routeName: r.routeName || r.routeNumber || ''
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching popular routes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch popular routes', error: error.message });
  }
});

// Get cities from routes (public)
router.get('/cities', async (req, res) => {
  try {
    const cities = await Route.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, cities: { $addToSet: '$startingPoint.city' } } },
      { $unwind: '$cities' },
      { $group: { _id: null, cities: { $addToSet: '$cities' } } },
      { $project: { _id: 0, cities: 1 } }
    ]);

    const cityList = cities.length > 0 ? cities[0].cities : [];
    res.json({ success: true, data: { cities: cityList } });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cities' });
  }
});

// Get route by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { Types } = require('mongoose');
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid route id' });
    }
    const route = await Route.findById(id)
      .populate('depot.depotId', 'depotName depotCode location.city')
      .populate('assignedBuses.busId', 'busNumber capacity busType')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route',
      error: error.message
    });
  }
});

// Search routes by cities (public)
router.get('/search/cities', async (req, res) => {
  try {
    const { fromCity, toCity } = req.query;

    if (!fromCity || !toCity) {
      return res.status(400).json({
        success: false,
        message: 'Both fromCity and toCity are required'
      });
    }

    const routes = await Route.findByCities(fromCity, toCity)
      .populate('depot.depotId', 'depotName depotCode location.city')
      .populate('assignedBuses.busId', 'busNumber capacity busType')
      .lean();

    res.json({
      success: true,
      data: routes,
      count: routes.length
    });
  } catch (error) {
    console.error('Error searching routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search routes',
      error: error.message
    });
  }
});

// Get routes by depot (public)
router.get('/depot/:depotId', async (req, res) => {
  try {
    const routes = await Route.findByDepot(req.params.depotId)
      .populate('depot.depotId', 'depotName depotCode location.city')
      .populate('assignedBuses.busId', 'busNumber capacity busType')
      .lean();

    res.json({
      success: true,
      data: routes,
      count: routes.length
    });
  } catch (error) {
    console.error('Error fetching depot routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depot routes',
      error: error.message
    });
  }
});


// Create new route (admin only)
router.post('/', authRole(['admin', 'manager']), async (req, res) => {
  try {
    const routeData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Validate depot exists
    if (routeData.depot?.depotId) {
      const depot = await Depot.findById(routeData.depot.depotId);
      if (!depot) {
        return res.status(400).json({
          success: false,
          message: 'Depot not found'
        });
      }
      
      // Update depot info
      routeData.depot.depotName = depot.depotName;
      routeData.depot.depotLocation = depot.location.city;
    }

    const route = new Route(routeData);
    await route.save();

    const populatedRoute = await Route.findById(route._id)
      .populate('depot.depotId', 'depotName depotCode location.city')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: populatedRoute
    });
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create route',
      error: error.message
    });
  }
});

// Update route (admin only)
router.put('/:id', authRole(['admin', 'manager']), async (req, res) => {
  try {
    const routeData = {
      ...req.body,
      updatedBy: req.user.id
    };

    // Validate depot exists if updating
    if (routeData.depot?.depotId) {
      const depot = await Depot.findById(routeData.depot.depotId);
      if (!depot) {
        return res.status(400).json({
          success: false,
          message: 'Depot not found'
        });
      }
      
      routeData.depot.depotName = depot.depotName;
      routeData.depot.depotLocation = depot.location.city;
    }

    const route = await Route.findByIdAndUpdate(
      req.params.id,
      routeData,
      { new: true, runValidators: true }
    ).populate('depot.depotId', 'depotName depotCode location.city')
     .populate('updatedBy', 'name email');

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
    console.error('Error updating route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update route',
      error: error.message
    });
  }
});

// Delete route (admin only)
router.delete('/:id', authRole(['admin']), async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.user.id },
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
    console.error('Error deleting route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete route',
      error: error.message
    });
  }
});

// Add schedule to route (admin/manager only)
router.post('/:id/schedules', authRole(['admin', 'manager']), async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    const scheduleData = {
      ...req.body,
      createdBy: req.user.id
    };

    await route.addSchedule(scheduleData);

    res.json({
      success: true,
      message: 'Schedule added successfully',
      data: route.schedules[route.schedules.length - 1]
    });
  } catch (error) {
    console.error('Error adding schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add schedule',
      error: error.message
    });
  }
});

// Update schedule (admin/manager only)
router.put('/:id/schedules/:scheduleId', authRole(['admin', 'manager']), async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    await route.updateSchedule(req.params.scheduleId, req.body);

    res.json({
      success: true,
      message: 'Schedule updated successfully'
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule',
      error: error.message
    });
  }
});

// Remove schedule (admin/manager only)
router.delete('/:id/schedules/:scheduleId', authRole(['admin', 'manager']), async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    await route.removeSchedule(req.params.scheduleId);

    res.json({
      success: true,
      message: 'Schedule removed successfully'
    });
  } catch (error) {
    console.error('Error removing schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove schedule',
      error: error.message
    });
  }
});

// Get route statistics (admin only)
router.get('/stats/overview', authRole(['admin', 'manager']), async (req, res) => {
  try {
    const totalRoutes = await Route.countDocuments({ isActive: true });
    const activeRoutes = await Route.countDocuments({ isActive: true, status: 'active' });
    const inactiveRoutes = await Route.countDocuments({ isActive: true, status: 'inactive' });
    const maintenanceRoutes = await Route.countDocuments({ isActive: true, status: 'maintenance' });

    // Get routes by depot
    const routesByDepot = await Route.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$depot.depotId', count: { $sum: 1 } } },
      { $lookup: { from: 'depots', localField: '_id', foreignField: '_id', as: 'depot' } },
      { $unwind: '$depot' },
      { $project: { depotName: '$depot.depotName', count: 1 } }
    ]);

    // Get popular routes
    const popularRoutes = await Route.aggregate([
      { $match: { isActive: true } },
      { $project: { 
        routeNumber: 1, 
        routeName: 1, 
        startingPoint: 1, 
        endingPoint: 1,
        scheduleCount: { $size: '$schedules' }
      }},
      { $sort: { scheduleCount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        totalRoutes,
        activeRoutes,
        inactiveRoutes,
        maintenanceRoutes,
        routesByDepot,
        popularRoutes
      }
    });
  } catch (error) {
    console.error('Error fetching route statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route statistics',
      error: error.message
    });
  }
});

// GET /api/routes/:routeId/stops - Get stops for a route
router.get('/:routeId/stops', async (req, res) => {
  try {
    const { routeId } = req.params;
    
    // Mock stops data - in real implementation, fetch from database
    const mockStops = [
      { _id: '1', stopName: 'Central Bus Station', address: 'Main Road, City Center', sequence: 1, arrivalTime: '08:00', departureTime: '08:05' },
      { _id: '2', stopName: 'Railway Station', address: 'Railway Road', sequence: 2, arrivalTime: '08:15', departureTime: '08:20' },
      { _id: '3', stopName: 'Airport Junction', address: 'Airport Road', sequence: 3, arrivalTime: '08:30', departureTime: '08:35' },
      { _id: '4', stopName: 'University Gate', address: 'Education District', sequence: 4, arrivalTime: '08:45', departureTime: '08:50' },
      { _id: '5', stopName: 'Shopping Mall', address: 'Commercial Area', sequence: 5, arrivalTime: '09:00', departureTime: '09:05' },
      { _id: '6', stopName: 'Hospital Stop', address: 'Medical District', sequence: 6, arrivalTime: '09:15', departureTime: '09:20' },
      { _id: '7', stopName: 'IT Park', address: 'Technology Hub', sequence: 7, arrivalTime: '09:30', departureTime: '09:35' },
      { _id: '8', stopName: 'Residential Area', address: 'Suburb District', sequence: 8, arrivalTime: '09:45', departureTime: '09:50' },
      { _id: '9', stopName: 'Final Destination', address: 'Terminal Point', sequence: 9, arrivalTime: '10:00', departureTime: '10:00' }
    ];
    
    res.json({
      success: true,
      data: mockStops
    });
    
  } catch (error) {
    console.error('Route stops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route stops',
      error: error.message
    });
  }
});

module.exports = router;
