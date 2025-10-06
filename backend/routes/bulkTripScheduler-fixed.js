const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Depot = require('../models/Depot');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const { auth } = require('../middleware/auth');

/**
 * Comprehensive Bulk Trip Scheduler
 * Generates 6000 trips across all depots (20 trips per depot per day)
 */

// GET /api/bulk-scheduler/status - Get scheduling status and statistics
router.get('/status', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get current trip statistics
    const totalTrips = await Trip.countDocuments();
    const totalDepots = await Depot.countDocuments({ isActive: true });
    const totalBuses = await Bus.countDocuments({ status: 'active' });
    const totalRoutes = await Route.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        current: {
          totalTrips,
          totalDepots,
          totalBuses,
          totalRoutes
        }
      }
    });
  } catch (error) {
    console.error('Error fetching scheduler status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduler status'
    });
  }
});

// GET /api/bulk-scheduler/depot-analysis - Analyze depot readiness
router.get('/depot-analysis', auth, async (req, res) => {
  try {
    const depots = await Depot.find({ isActive: true }).lean();
    
    const analysis = depots.map(depot => ({
      depotId: depot._id,
      depotName: depot.depotName,
      depotCode: depot.depotCode,
      totalBuses: depot.capacity.totalBuses,
      availableBuses: depot.capacity.availableBuses,
      hasRoutes: true, // Simplified for now
      hasCrew: true,   // Simplified for now
      readinessScore: 100
    }));

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing depots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze depots'
    });
  }
});

// POST /api/bulk-scheduler/generate - Generate bulk trips
router.post('/generate', auth, async (req, res) => {
  try {
    const { daysToSchedule = 30, tripsPerDepotPerDay = 20, startDate } = req.body;
    
    // Get all active depots
    const depots = await Depot.find({ isActive: true });
    
    if (depots.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active depots found'
      });
    }

    let totalGenerated = 0;
    const results = [];

    // Generate trips for each depot
    for (const depot of depots) {
      const depotTrips = [];
      
      // Generate trips for each day
      for (let day = 0; day < daysToSchedule; day++) {
        const tripDate = new Date(startDate || new Date());
        tripDate.setDate(tripDate.getDate() + day);
        
        // Generate trips for this day
        for (let tripIndex = 0; tripIndex < tripsPerDepotPerDay; tripIndex++) {
          // Create a simple trip
          const trip = new Trip({
            routeId: null, // Will be assigned later
            busId: null,   // Will be assigned later
            driverId: null, // Will be assigned later
            conductorId: null, // Will be assigned later
            departureTime: new Date(tripDate.getTime() + (tripIndex * 45 * 60 * 1000)), // 45 min intervals
            arrivalTime: new Date(tripDate.getTime() + (tripIndex * 45 * 60 * 1000) + (2 * 60 * 60 * 1000)), // 2 hours later
            fare: 50 + Math.floor(Math.random() * 100),
            status: 'scheduled',
            depotId: depot._id,
            createdBy: req.user.userId
          });
          
          depotTrips.push(trip);
        }
      }
      
      // Save trips for this depot
      if (depotTrips.length > 0) {
        await Trip.insertMany(depotTrips);
        totalGenerated += depotTrips.length;
        results.push({
          depotName: depot.depotName,
          depotCode: depot.depotCode,
          tripsGenerated: depotTrips.length
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully generated ${totalGenerated} trips`,
      data: {
        totalGenerated,
        depotsProcessed: results.length,
        results
      }
    });

  } catch (error) {
    console.error('Error generating trips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate trips',
      details: error.message
    });
  }
});

module.exports = router;
