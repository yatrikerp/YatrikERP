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
    
    // Find trips that should be running now (both 'running' and 'scheduled' trips that should have started)
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all trips for today
    const allTrips = await Trip.find({
      serviceDate: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $in: ['scheduled', 'running', 'boarding'] }
    })
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
    .populate('busId', 'busNumber busType registrationNumber capacity')
    .populate('driverId', 'name phone licenseNumber')
    .populate('conductorId', 'name phone employeeId')
    .populate('depotId', 'name location')
    .lean();

    console.log(`🚌 Found ${allTrips.length} total trips for today`);

    // Filter trips that should be running now
    const runningTrips = allTrips.filter(trip => {
      // If status is already 'running' or 'boarding', include it
      if (trip.status === 'running' || trip.status === 'boarding') {
        return true;
      }
      
      // If status is 'scheduled', check if it should have started by now
      if (trip.status === 'scheduled') {
        const tripStartTime = new Date(trip.serviceDate);
        const [hours, minutes] = trip.startTime.split(':');
        tripStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Include trips that should have started within the last 12 hours
        // This covers trips from early morning (6 AM) to current time
        const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        return tripStartTime >= twelveHoursAgo && tripStartTime <= now;
      }
      
      return false;
    });

    console.log(`🚌 Found ${runningTrips.length} trips that should be running now`);

    // Transform trips to include tracking information
    const transformedTrips = runningTrips.map(trip => {
      // Generate realistic tracking data
      const currentTime = new Date();
      const startTime = new Date(trip.serviceDate);
      const [hours, minutes] = trip.startTime.split(':');
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const elapsedMinutes = Math.floor((currentTime - startTime) / (1000 * 60));
      
      // Calculate estimated progress based on actual trip status
      let routeProgress = 0;
      let currentStatus = trip.status;
      
      if (trip.status === 'running' || trip.status === 'boarding') {
        // For actually running trips, calculate progress
        routeProgress = Math.min(Math.max(elapsedMinutes / 180, 0.1), 0.9); // 10% to 90% progress
      } else if (trip.status === 'scheduled') {
        // For scheduled trips that should be running, simulate as just started
        routeProgress = Math.min(Math.max(elapsedMinutes / 180, 0.05), 0.3); // 5% to 30% progress
        currentStatus = 'running'; // Show as running in the UI
      }
      
      // Generate realistic coordinates based on Kerala geography and route progress
      const keralaCities = {
        'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
        'Kollam': { lat: 8.8932, lng: 76.6141 },
        'Alappuzha': { lat: 9.4981, lng: 76.3388 },
        'Kottayam': { lat: 9.5916, lng: 76.5222 },
        'Kochi': { lat: 9.9312, lng: 76.2673 },
        'Ernakulam': { lat: 9.9816, lng: 76.2999 },
        'Thrissur': { lat: 10.5276, lng: 76.2144 },
        'Guruvayur': { lat: 10.5949, lng: 76.0400 },
        'Palakkad': { lat: 10.7867, lng: 76.6548 },
        'Malappuram': { lat: 11.0510, lng: 76.0711 },
        'Kozhikode': { lat: 11.2588, lng: 75.7804 },
        'Wayanad': { lat: 11.6854, lng: 76.1320 },
        'Kannur': { lat: 11.8745, lng: 75.3704 },
        'Kasaragod': { lat: 12.4996, lng: 74.9869 }
      };

      // Get route coordinates
      const routeName = trip.routeId?.routeName || '';
      let startCoords, endCoords, startCity, endCity;
      
      // Extract cities from route name or use defaults
      for (const city of Object.keys(keralaCities)) {
        if (routeName.toLowerCase().includes(city.toLowerCase())) {
          if (!startCity) {
            startCity = city;
            startCoords = keralaCities[city];
          } else if (city !== startCity) {
            endCity = city;
            endCoords = keralaCities[city];
            break;
          }
        }
      }
      
      // Fallback to default coordinates if not found
      if (!startCoords) {
        startCoords = { lat: 9.9312, lng: 76.2673 }; // Kochi
        startCity = 'Kochi';
      }
      if (!endCoords) {
        endCoords = { lat: 8.5241, lng: 76.9366 }; // TVM
        endCity = 'Thiruvananthapuram';
      }

      // Calculate current position with realistic road curves
      const distance = Math.sqrt(
        Math.pow(endCoords.lat - startCoords.lat, 2) + 
        Math.pow(endCoords.lng - startCoords.lng, 2)
      );
      
      // Add realistic road curves (Kerala roads are winding)
      const curveOffset = distance * 0.1 * Math.sin(routeProgress * Math.PI * 2);
      const currentLat = startCoords.lat + (endCoords.lat - startCoords.lat) * routeProgress + curveOffset;
      const currentLng = startCoords.lng + (endCoords.lng - startCoords.lng) * routeProgress;
      
      
      // Generate realistic speed based on bus type and progress
      let baseSpeed = 45; // Base speed in km/h
      if (trip.busId?.busType === 'garuda') baseSpeed = 65;
      else if (trip.busId?.busType === 'super_fast') baseSpeed = 55;
      else if (trip.busId?.busType === 'ac') baseSpeed = 50;
      
      // Speed varies based on route progress (slower in cities, faster on highways)
      const speedVariation = Math.sin(routeProgress * Math.PI) * 15; // -15 to +15 km/h variation
      const currentSpeed = Math.floor(baseSpeed + speedVariation + (Math.random() - 0.5) * 10);
      
      // Calculate estimated arrival
      const remainingMinutes = Math.max(0, 180 - elapsedMinutes);
      const estimatedArrival = new Date(currentTime.getTime() + remainingMinutes * 60000);
      
      // Get realistic current location based on progress and route
      const routeLocations = [
        `${startCity}, Kerala`,
        'Near Alappuzha, Kerala',
        'Near Kollam, Kerala', 
        'Near Thrissur, Kerala',
        'Near Palakkad, Kerala',
        'Near Kozhikode, Kerala',
        `${endCity}, Kerala`
      ];
      const locationIndex = Math.floor(routeProgress * (routeLocations.length - 1));
      const currentLocation = routeLocations[Math.min(locationIndex, routeLocations.length - 1)];

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
        status: currentStatus,
        fare: trip.fare || 0,
        depotId: trip.depotId,
        // Tracking specific data
        currentLocation: currentLocation,
        coordinates: {
          lat: parseFloat(currentLat?.toFixed(6) || 10.5276),
          lng: parseFloat(currentLng?.toFixed(6) || 76.2144)
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
    
    // Use the same realistic coordinate generation logic
    const keralaCities = {
      'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
      'Kollam': { lat: 8.8932, lng: 76.6141 },
      'Alappuzha': { lat: 9.4981, lng: 76.3388 },
      'Kottayam': { lat: 9.5916, lng: 76.5222 },
      'Kochi': { lat: 9.9312, lng: 76.2673 },
      'Ernakulam': { lat: 9.9816, lng: 76.2999 },
      'Thrissur': { lat: 10.5276, lng: 76.2144 },
      'Guruvayur': { lat: 10.5949, lng: 76.0400 },
      'Palakkad': { lat: 10.7867, lng: 76.6548 },
      'Malappuram': { lat: 11.0510, lng: 76.0711 },
      'Kozhikode': { lat: 11.2588, lng: 75.7804 },
      'Wayanad': { lat: 11.6854, lng: 76.1320 },
      'Kannur': { lat: 11.8745, lng: 75.3704 },
      'Kasaragod': { lat: 12.4996, lng: 74.9869 }
    };

    const routeName = trip.routeId?.routeName || '';
    let startCoords, endCoords, startCity, endCity;
    
    for (const city of Object.keys(keralaCities)) {
      if (routeName.toLowerCase().includes(city.toLowerCase())) {
        if (!startCity) {
          startCity = city;
          startCoords = keralaCities[city];
        } else if (city !== startCity) {
          endCity = city;
          endCoords = keralaCities[city];
          break;
        }
      }
    }
    
    if (!startCoords) {
      startCoords = { lat: 9.9312, lng: 76.2673 };
      startCity = 'Kochi';
    }
    if (!endCoords) {
      endCoords = { lat: 8.5241, lng: 76.9366 };
      endCity = 'Thiruvananthapuram';
    }

    const distance = Math.sqrt(
      Math.pow(endCoords.lat - startCoords.lat, 2) + 
      Math.pow(endCoords.lng - startCoords.lng, 2)
    );
    
    const curveOffset = distance * 0.1 * Math.sin(routeProgress * Math.PI * 2);
    const currentLat = startCoords.lat + (endCoords.lat - startCoords.lat) * routeProgress + curveOffset;
    const currentLng = startCoords.lng + (endCoords.lng - startCoords.lng) * routeProgress;
    
    let baseSpeed = 45;
    if (trip.busId?.busType === 'garuda') baseSpeed = 65;
    else if (trip.busId?.busType === 'super_fast') baseSpeed = 55;
    else if (trip.busId?.busType === 'ac') baseSpeed = 50;
    
    const speedVariation = Math.sin(routeProgress * Math.PI) * 15;
    const currentSpeed = Math.floor(baseSpeed + speedVariation + (Math.random() - 0.5) * 10);
    
    const remainingMinutes = Math.max(0, 180 - elapsedMinutes);
    const estimatedArrival = new Date(currentTime.getTime() + remainingMinutes * 60000);
    
    const routeLocations = [
      `${startCity}, Kerala`,
      'Near Alappuzha, Kerala',
      'Near Kollam, Kerala', 
      'Near Thrissur, Kerala',
      'Near Palakkad, Kerala',
      'Near Kozhikode, Kerala',
      `${endCity}, Kerala`
    ];
    const locationIndex = Math.floor(routeProgress * (routeLocations.length - 1));
    const currentLocation = routeLocations[Math.min(locationIndex, routeLocations.length - 1)];

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
        lat: parseFloat(currentLat?.toFixed(6) || 10.5276),
        lng: parseFloat(currentLng?.toFixed(6) || 76.2144)
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