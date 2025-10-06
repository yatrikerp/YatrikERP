const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Depot = require('../models/Depot');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

/**
 * Comprehensive Bulk Trip Scheduler
 * Generates 6000 trips across all depots (20 trips per depot per day)
 * Integrates with StreamlinedBusManagement and StreamlinedRouteManagement
 */

// GET /api/bulk-scheduler/status - Get scheduling status and statistics
router.get('/status', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get current trip statistics
    const totalTrips = await Trip.countDocuments();
    const todayTrips = await Trip.countDocuments({
      serviceDate: { $gte: today, $lt: tomorrow }
    });

    // Get depot statistics
    const totalDepots = await Depot.countDocuments({ isActive: true });
    const depotsWithBuses = await Depot.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'buses',
          localField: '_id',
          foreignField: 'depotId',
          as: 'buses'
        }
      },
      { $match: { 'buses.0': { $exists: true } } },
      { $count: 'count' }
    ]);

    // Get route statistics
    const totalRoutes = await Route.countDocuments({ status: 'active' });
    const routesWithStops = await Route.countDocuments({
      status: 'active',
      intermediateStops: { $exists: true, $ne: [] }
    });

    // Get bus statistics
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: 'active' });
    const assignedBuses = await Bus.countDocuments({ status: 'assigned' });

    // Calculate target trips (20 per depot per day for 30 days)
    const targetTripsPerDepotPerDay = 20;
    const daysToSchedule = 30;
    const targetTotalTrips = totalDepots * targetTripsPerDepotPerDay * daysToSchedule;

    res.json({
      success: true,
      data: {
        current: {
          totalTrips,
          todayTrips,
          totalDepots,
          depotsWithBuses: depotsWithBuses[0]?.count || 0,
          totalRoutes,
          routesWithStops,
          totalBuses,
          activeBuses,
          assignedBuses
        },
        target: {
          tripsPerDepotPerDay: targetTripsPerDepotPerDay,
          daysToSchedule,
          totalTrips: targetTotalTrips,
          completionPercentage: Math.round((totalTrips / targetTotalTrips) * 100)
        },
        readiness: {
          hasDepots: totalDepots > 0,
          hasRoutes: totalRoutes > 0,
          hasBuses: totalBuses > 0,
          hasDrivers: await User.countDocuments({ role: 'driver', isActive: true }) > 0,
          hasConductors: await User.countDocuments({ role: 'conductor', isActive: true }) > 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduler status',
      error: error.message
    });
  }
});

// POST /api/bulk-scheduler/generate - Generate comprehensive trip schedule
router.post('/generate', auth, async (req, res) => {
  try {
    const {
      daysToSchedule = 30,
      tripsPerDepotPerDay = 20,
      startDate,
      autoAssignCrew = true,
      autoAssignBuses = true,
      generateReports = true,
      depotIds = [],
      routeIds = [],
      busIds = []
    } = req.body;

    console.log('🚀 Starting bulk trip generation:', {
      daysToSchedule,
      tripsPerDepotPerDay,
      startDate,
      autoAssignCrew,
      autoAssignBuses,
      depotIds: depotIds.length,
      routeIds: routeIds.length,
      busIds: busIds.length
    });

    // Validate inputs
    if (daysToSchedule > 365) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule more than 365 days in advance'
      });
    }

    // Set start date
    const scheduleStartDate = startDate ? new Date(startDate) : new Date();
    scheduleStartDate.setHours(0, 0, 0, 0);

    // Get all active depots
    let depots;
    if (depotIds.length > 0) {
      depots = await Depot.find({ _id: { $in: depotIds }, isActive: true }).lean();
    } else {
      depots = await Depot.find({ isActive: true }).lean();
    }

    if (depots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active depots found for scheduling'
      });
    }

    // Get buses for each depot
    const depotBuses = {};
    for (const depot of depots) {
      let depotBusQuery = { depotId: depot._id, status: { $in: ['active', 'assigned'] } };
      if (busIds.length > 0) {
        depotBusQuery._id = { $in: busIds };
      }
      
      const buses = await Bus.find(depotBusQuery).lean();
      depotBuses[depot._id.toString()] = buses;
      
      if (buses.length === 0) {
        console.warn(`⚠️ No buses found for depot: ${depot.depotName}`);
      }
    }

    // Get routes for each depot
    const depotRoutes = {};
    for (const depot of depots) {
      let depotRouteQuery = { 
        'depot.depotId': depot._id, 
        status: 'active' 
      };
      if (routeIds.length > 0) {
        depotRouteQuery._id = { $in: routeIds };
      }
      
      const routes = await Route.find(depotRouteQuery).lean();
      depotRoutes[depot._id.toString()] = routes;
      
      if (routes.length === 0) {
        console.warn(`⚠️ No routes found for depot: ${depot.depotName}`);
      }
    }

    // Get drivers and conductors
    const drivers = await User.find({ role: 'driver', isActive: true }).lean();
    const conductors = await User.find({ role: 'conductor', isActive: true }).lean();

    console.log(`📊 Resources available:`, {
      depots: depots.length,
      drivers: drivers.length,
      conductors: conductors.length,
      totalBuses: Object.values(depotBuses).flat().length,
      totalRoutes: Object.values(depotRoutes).flat().length
    });

    // Generate trips
    const allTrips = [];
    const generationStats = {
      totalGenerated: 0,
      depotStats: {},
      errors: [],
      warnings: []
    };

    // Time slots for daily scheduling (6 AM to 10 PM)
    const timeSlots = [
      '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
      '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
      '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
      '22:00'
    ];

    for (let day = 0; day < daysToSchedule; day++) {
      const currentDate = new Date(scheduleStartDate);
      currentDate.setDate(currentDate.getDate() + day);

      console.log(`📅 Generating trips for: ${currentDate.toDateString()}`);

      for (const depot of depots) {
        const depotId = depot._id.toString();
        const depotBusesList = depotBuses[depotId] || [];
        const depotRoutesList = depotRoutes[depotId] || [];

        if (depotBusesList.length === 0 || depotRoutesList.length === 0) {
          generationStats.warnings.push(
            `Skipping depot ${depot.depotName}: No buses (${depotBusesList.length}) or routes (${depotRoutesList.length})`
          );
          continue;
        }

        // Initialize depot stats
        if (!generationStats.depotStats[depotId]) {
          generationStats.depotStats[depotId] = {
            depotName: depot.depotName,
            totalGenerated: 0,
            errors: 0
          };
        }

        // Generate trips for this depot and day
        const depotTrips = await generateDepotTripsForDay(
          depot,
          depotBusesList,
          depotRoutesList,
          currentDate,
          timeSlots.slice(0, tripsPerDepotPerDay),
          drivers,
          conductors,
          autoAssignCrew,
          autoAssignBuses
        );

        allTrips.push(...depotTrips);
        generationStats.depotStats[depotId].totalGenerated += depotTrips.length;
        generationStats.totalGenerated += depotTrips.length;

        console.log(`✅ Generated ${depotTrips.length} trips for ${depot.depotName}`);
      }
    }

    // Batch insert trips
    if (allTrips.length > 0) {
      console.log(`💾 Inserting ${allTrips.length} trips in batches...`);
      
      const batchSize = 100;
      let insertedCount = 0;
      
      for (let i = 0; i < allTrips.length; i += batchSize) {
        const batch = allTrips.slice(i, i + batchSize);
        try {
          await Trip.insertMany(batch, { ordered: false });
          insertedCount += batch.length;
          console.log(`📦 Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} trips`);
        } catch (error) {
          console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
          generationStats.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        }
      }

      console.log(`🎉 Successfully inserted ${insertedCount} trips`);
    }

    // Generate summary report
    const summary = {
      totalGenerated: generationStats.totalGenerated,
      daysScheduled: daysToSchedule,
      depotsProcessed: depots.length,
      successRate: Math.round((generationStats.totalGenerated / (depots.length * daysToSchedule * tripsPerDepotPerDay)) * 100),
      depotBreakdown: Object.values(generationStats.depotStats),
      errors: generationStats.errors,
      warnings: generationStats.warnings
    };

    res.json({
      success: true,
      message: `Successfully generated ${generationStats.totalGenerated} trips across ${depots.length} depots`,
      data: summary
    });

  } catch (error) {
    console.error('Error in bulk trip generation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bulk trips',
      error: error.message
    });
  }
});

// Helper function to generate trips for a specific depot and day
async function generateDepotTripsForDay(depot, buses, routes, date, timeSlots, drivers, conductors, autoAssignCrew, autoAssignBuses) {
  const trips = [];
  
  // Shuffle arrays to ensure variety
  const shuffledBuses = [...buses].sort(() => Math.random() - 0.5);
  const shuffledRoutes = [...routes].sort(() => Math.random() - 0.5);
  const shuffledDrivers = [...drivers].sort(() => Math.random() - 0.5);
  const shuffledConductors = [...conductors].sort(() => Math.random() - 0.5);

  let busIndex = 0;
  let driverIndex = 0;
  let conductorIndex = 0;

  for (let i = 0; i < timeSlots.length; i++) {
    const timeSlot = timeSlots[i];
    const route = shuffledRoutes[i % shuffledRoutes.length];
    const bus = shuffledBuses[busIndex % shuffledBuses.length];
    
    // Calculate end time based on route duration
    const endTime = calculateEndTime(timeSlot, route.estimatedDuration || 180); // Default 3 hours
    
    // Calculate fare based on route
    const fare = calculateTripFare(route, bus);

    // Create trip object
    const trip = {
      routeId: route._id,
      busId: bus._id,
      serviceDate: new Date(date),
      startTime: timeSlot,
      endTime: endTime,
      fare: fare,
      capacity: bus.capacity?.total || 50,
      availableSeats: bus.capacity?.total || 50,
      bookedSeats: 0,
      status: 'scheduled',
      depotId: depot._id,
      createdBy: null, // Will be set by middleware
      notes: `Auto-generated trip for ${depot.depotName}`,
      bookingOpen: true,
      cancellationPolicy: {
        allowed: true,
        hoursBeforeDeparture: 2,
        refundPercentage: 80
      }
    };

    // Auto-assign crew if requested
    if (autoAssignCrew && drivers.length > 0) {
      trip.driverId = shuffledDrivers[driverIndex % shuffledDrivers.length]._id;
      driverIndex++;
    }

    if (autoAssignCrew && conductors.length > 0) {
      trip.conductorId = shuffledConductors[conductorIndex % shuffledConductors.length]._id;
      conductorIndex++;
    }

    trips.push(trip);
    busIndex++;
  }

  return trips;
}

// Helper function to calculate end time
function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

// Helper function to calculate trip fare
function calculateTripFare(route, bus) {
  // Use route base fare if available
  if (route.baseFare && route.baseFare > 0) {
    return route.baseFare;
  }
  
  // Calculate based on distance and fare per km
  if (route.totalDistance && route.farePerKm) {
    return Math.round(route.totalDistance * route.farePerKm);
  }
  
  // Default fare based on bus type
  const defaultFares = {
    'ac_sleeper': 500,
    'ac_seater': 300,
    'non_ac_sleeper': 400,
    'non_ac_seater': 200,
    'volvo': 600,
    'mini': 150
  };
  
  return defaultFares[bus.busType] || 250;
}

// GET /api/bulk-scheduler/depot-analysis - Analyze depot readiness for scheduling
router.get('/depot-analysis', auth, async (req, res) => {
  try {
    const depots = await Depot.find({ isActive: true }).lean();
    const analysis = [];

    for (const depot of depots) {
      const buses = await Bus.countDocuments({ depotId: depot._id, status: { $in: ['active', 'assigned'] } });
      const routes = await Route.countDocuments({ 'depot.depotId': depot._id, status: 'active' });
      const drivers = await User.countDocuments({ role: 'driver', depotId: depot._id, isActive: true });
      const conductors = await User.countDocuments({ role: 'conductor', depotId: depot._id, isActive: true });

      const readiness = {
        depotId: depot._id,
        depotName: depot.depotName,
        depotCode: depot.depotCode,
        buses,
        routes,
        drivers,
        conductors,
        readinessScore: Math.min(buses, routes, drivers, conductors),
        canSchedule: buses > 0 && routes > 0 && drivers > 0 && conductors > 0,
        maxTripsPerDay: Math.min(buses * 2, routes * 3, drivers * 2, conductors * 2) // Conservative estimate
      };

      analysis.push(readiness);
    }

    // Sort by readiness score
    analysis.sort((a, b) => b.readinessScore - a.readinessScore);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing depot readiness:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze depot readiness',
      error: error.message
    });
  }
});

// POST /api/bulk-scheduler/cleanup - Clean up existing trips (optional)
router.post('/cleanup', auth, async (req, res) => {
  try {
    const { 
      deleteAll = false, 
      deleteFutureOnly = true, 
      deleteFromDate,
      confirmCleanup = false 
    } = req.body;

    if (!confirmCleanup) {
      return res.status(400).json({
        success: false,
        message: 'Cleanup requires confirmation. Set confirmCleanup: true'
      });
    }

    let query = {};
    
    if (deleteAll) {
      query = {};
    } else if (deleteFutureOnly) {
      query = { serviceDate: { $gte: new Date() } };
    } else if (deleteFromDate) {
      query = { serviceDate: { $gte: new Date(deleteFromDate) } };
    }

    const result = await Trip.deleteMany(query);
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} trips`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up trips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup trips',
      error: error.message
    });
  }
});

module.exports = router;
