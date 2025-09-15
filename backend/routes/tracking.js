const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');

// GET /api/tracking/running-trips - Get all currently running trips
router.get('/running-trips', async (req, res) => {
  try {
    console.log('🚌 Fetching currently running trips...');
    
    // Find trips with status 'running' for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const runningTrips = await Trip.find({
      status: 'running',
      serviceDate: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
    .populate('busId', 'busNumber busType registrationNumber capacity')
    .populate('driverId', 'name phone licenseNumber')
    .populate('conductorId', 'name phone employeeId')
    .populate('depotId', 'name location')
    .lean();

    console.log(`🚌 Found ${runningTrips.length} running trips`);

    // Transform trips to include tracking information
    const transformedTrips = runningTrips.map(trip => {
      // Generate realistic tracking data
      const currentTime = new Date();
      const startTime = new Date(trip.serviceDate);
      const [hours, minutes] = trip.startTime.split(':');
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const elapsedMinutes = Math.floor((currentTime - startTime) / (1000 * 60));
      
      // Calculate estimated progress (simplified)
      const routeProgress = Math.min(elapsedMinutes / 180, 0.9); // Assume 3-hour journey max
      
      // Generate coordinates based on route and progress
      const startCoords = trip.routeId?.startingPoint?.coordinates || { lat: 9.9312, lng: 76.2673 }; // Kochi default
      const endCoords = trip.routeId?.endingPoint?.coordinates || { lat: 8.5241, lng: 76.9366 }; // TVM default
      
      const currentLat = startCoords.lat + (endCoords.lat - startCoords.lat) * routeProgress;
      const currentLng = startCoords.lng + (endCoords.lng - startCoords.lng) * routeProgress;
      
      // Generate realistic speed (30-80 km/h)
      const currentSpeed = Math.floor(Math.random() * 50) + 30;
      
      // Calculate estimated arrival
      const remainingMinutes = Math.max(0, 180 - elapsedMinutes);
      const estimatedArrival = new Date(currentTime.getTime() + remainingMinutes * 60000);
      
      // Get current location name (simplified)
      const locations = ['Kochi', 'Alappuzha', 'Kollam', 'Thiruvananthapuram'];
      const currentLocationIndex = Math.floor(routeProgress * locations.length);
      const currentLocation = locations[Math.min(currentLocationIndex, locations.length - 1)] + ', Kerala';

      return {
        _id: trip._id,
        tripId: `TRP${trip._id.toString().slice(-6).toUpperCase()}`,
        routeId: {
          routeName: trip.routeId?.routeName || 'Unknown Route',
          routeNumber: trip.routeId?.routeNumber || 'N/A',
          startingPoint: trip.routeId?.startingPoint || { city: 'Kochi', location: 'KSRTC Bus Station' },
          endingPoint: trip.routeId?.endingPoint || { city: 'Thiruvananthapuram', location: 'Central Bus Station' }
        },
        busId: {
          busNumber: trip.busId?.busNumber || 'N/A',
          busType: trip.busId?.busType || 'Standard',
          capacity: trip.busId?.capacity || { total: 35, available: 0 }
        },
        driverId: {
          name: trip.driverId?.name || 'Driver Not Assigned',
          phone: trip.driverId?.phone || '+91-0000000000'
        },
        conductorId: {
          name: trip.conductorId?.name || 'Conductor Not Assigned',
          phone: trip.conductorId?.phone || '+91-0000000000'
        },
        serviceDate: trip.serviceDate,
        startTime: trip.startTime,
        endTime: trip.endTime,
        status: trip.status,
        fare: trip.fare || 0,
        depotId: trip.depotId,
        // Tracking specific data
        currentLocation: currentLocation,
        coordinates: {
          lat: currentLat,
          lng: currentLng
        },
        currentSpeed: `${currentSpeed} km/h`,
        estimatedArrival: estimatedArrival.toTimeString().slice(0, 5),
        lastUpdate: '1 minute ago',
        passengers: Math.floor(Math.random() * (trip.busId?.capacity?.total || 35)) + 1,
        routeProgress: Math.round(routeProgress * 100)
      };
    });

    res.json({
      success: true,
      data: {
        trips: transformedTrips,
        count: transformedTrips.length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching running trips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch running trips',
      error: error.message
    });
  }
});

// GET /api/tracking/trip/:tripId - Get specific trip tracking details
router.get('/trip/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    console.log(`🚌 Fetching tracking details for trip: ${tripId}`);

    const trip = await Trip.findById(tripId)
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('busId', 'busNumber busType registrationNumber capacity')
      .populate('driverId', 'name phone licenseNumber')
      .populate('conductorId', 'name phone employeeId')
      .populate('depotId', 'name location')
      .lean();

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Generate tracking data similar to running trips
    const currentTime = new Date();
    const startTime = new Date(trip.serviceDate);
    const [hours, minutes] = trip.startTime.split(':');
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const elapsedMinutes = Math.floor((currentTime - startTime) / (1000 * 60));
    const routeProgress = Math.min(elapsedMinutes / 180, 0.9);
    
    const startCoords = trip.routeId?.startingPoint?.coordinates || { lat: 9.9312, lng: 76.2673 };
    const endCoords = trip.routeId?.endingPoint?.coordinates || { lat: 8.5241, lng: 76.9366 };
    
    const currentLat = startCoords.lat + (endCoords.lat - startCoords.lat) * routeProgress;
    const currentLng = startCoords.lng + (endCoords.lng - startCoords.lng) * routeProgress;
    
    const currentSpeed = Math.floor(Math.random() * 50) + 30;
    const remainingMinutes = Math.max(0, 180 - elapsedMinutes);
    const estimatedArrival = new Date(currentTime.getTime() + remainingMinutes * 60000);
    
    const locations = ['Kochi', 'Alappuzha', 'Kollam', 'Thiruvananthapuram'];
    const currentLocationIndex = Math.floor(routeProgress * locations.length);
    const currentLocation = locations[Math.min(currentLocationIndex, locations.length - 1)] + ', Kerala';

    const trackingData = {
      _id: trip._id,
      tripId: `TRP${trip._id.toString().slice(-6).toUpperCase()}`,
      routeId: {
        routeName: trip.routeId?.routeName || 'Unknown Route',
        routeNumber: trip.routeId?.routeNumber || 'N/A',
        startingPoint: trip.routeId?.startingPoint || { city: 'Kochi', location: 'KSRTC Bus Station' },
        endingPoint: trip.routeId?.endingPoint || { city: 'Thiruvananthapuram', location: 'Central Bus Station' }
      },
      busId: {
        busNumber: trip.busId?.busNumber || 'N/A',
        busType: trip.busId?.busType || 'Standard',
        capacity: trip.busId?.capacity || { total: 35, available: 0 }
      },
      driverId: {
        name: trip.driverId?.name || 'Driver Not Assigned',
        phone: trip.driverId?.phone || '+91-0000000000'
      },
      conductorId: {
        name: trip.conductorId?.name || 'Conductor Not Assigned',
        phone: trip.conductorId?.phone || '+91-0000000000'
      },
      serviceDate: trip.serviceDate,
      startTime: trip.startTime,
      endTime: trip.endTime,
      status: trip.status,
      fare: trip.fare || 0,
      depotId: trip.depotId,
      // Tracking specific data
      currentLocation: currentLocation,
      coordinates: {
        lat: currentLat,
        lng: currentLng
      },
      currentSpeed: `${currentSpeed} km/h`,
      estimatedArrival: estimatedArrival.toTimeString().slice(0, 5),
      lastUpdate: '1 minute ago',
      passengers: Math.floor(Math.random() * (trip.busId?.capacity?.total || 35)) + 1,
      routeProgress: Math.round(routeProgress * 100)
    };

    res.json({
      success: true,
      data: trackingData
    });

  } catch (error) {
    console.error('❌ Error fetching trip tracking details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip tracking details',
      error: error.message
    });
  }
});

module.exports = router;