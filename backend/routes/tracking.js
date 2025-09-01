const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');

// Store live tracking data in memory (in production, use Redis or database)
const liveTrackingData = new Map();

// Update bus location in real-time
router.post('/update-location', auth, requireRole(['driver', 'conductor']), async (req, res) => {
  try {
    const { tripId, busId, latitude, longitude, speed, heading, timestamp, status } = req.body;
    const driverId = req.user._id;

    if (!tripId || !busId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID, bus ID, latitude, and longitude are required'
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    const trackingData = {
      tripId,
      busId,
      driverId,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: req.body.accuracy || 10, // GPS accuracy in meters
        timestamp: timestamp || new Date().toISOString()
      },
      speed: speed ? parseFloat(speed) : null, // Speed in km/h
      heading: heading ? parseFloat(heading) : null, // Direction in degrees
      status: status || 'running',
      lastUpdated: new Date().toISOString(),
      battery: req.body.battery || null,
      fuel: req.body.fuel || null
    };

    // Store tracking data
    liveTrackingData.set(tripId, trackingData);

    // In production, you would:
    // 1. Store in database for historical tracking
    // 2. Broadcast to connected clients via WebSocket
    // 3. Update trip status
    // 4. Send notifications for delays/arrivals

    res.json({
      success: true,
      message: 'Location updated successfully',
      trackingData
    });

  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
});

// Get live location for a specific trip
router.get('/trip/:tripId', auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    
    const trackingData = liveTrackingData.get(tripId);
    
    if (!trackingData) {
      return res.status(404).json({
        success: false,
        message: 'No tracking data found for this trip'
      });
    }

    res.json({
      success: true,
      trackingData
    });

  } catch (error) {
    console.error('Location fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location data'
    });
  }
});

// Get live locations for all active trips
router.get('/active', auth, async (req, res) => {
  try {
    const { depotId } = req.query;
    
    let activeTrips = Array.from(liveTrackingData.values());
    
    // Filter by depot if specified
    if (depotId) {
      // In production, you would filter based on depot information
      // For now, returning all active trips
    }

    res.json({
      success: true,
      activeTrips: activeTrips.length,
      trips: activeTrips
    });

  } catch (error) {
    console.error('Active trips fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active trips'
    });
  }
});

// Get trip route and current progress
router.get('/trip/:tripId/route', auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Mock route data - in production, fetch from database
    const routeData = {
      tripId,
      route: {
        startingPoint: { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
        endingPoint: { lat: 18.5204, lng: 73.8567, name: 'Pune' },
        waypoints: [
          { lat: 19.2183, lng: 72.9781, name: 'Thane' },
          { lat: 19.1550, lng: 72.9962, name: 'Kalyan' },
          { lat: 19.2183, lng: 73.0859, name: 'Karjat' }
        ]
      },
      currentLocation: liveTrackingData.get(tripId)?.location || null,
      progress: calculateProgress(tripId),
      estimatedArrival: calculateETA(tripId)
    };

    res.json({
      success: true,
      routeData
    });

  } catch (error) {
    console.error('Route fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route information'
    });
  }
});

// Get tracking history for a trip
router.get('/trip/:tripId/history', auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { startTime, endTime } = req.query;
    
    // Mock historical data - in production, fetch from database
    const history = generateTrackingHistory(tripId, startTime, endTime);

    res.json({
      success: true,
      tripId,
      history,
      totalPoints: history.length
    });

  } catch (error) {
    console.error('Tracking history fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tracking history'
    });
  }
});

// Emergency location update (for SOS situations)
router.post('/emergency', auth, requireRole(['driver', 'conductor']), async (req, res) => {
  try {
    const { tripId, busId, latitude, longitude, emergencyType, description } = req.body;
    const driverId = req.user._id;

    if (!tripId || !busId || !latitude || !longitude || !emergencyType) {
      return res.status(400).json({
        success: false,
        message: 'All emergency fields are required'
      });
    }

    const emergencyData = {
      tripId,
      busId,
      driverId,
      location: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
      emergencyType, // 'accident', 'breakdown', 'medical', 'security'
      description,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    // In production, you would:
    // 1. Store emergency record
    // 2. Send immediate notifications to depot/emergency contacts
    // 3. Update trip status
    // 4. Log emergency for response team

    res.json({
      success: true,
      message: 'Emergency alert sent successfully',
      emergencyId: `EMG_${Date.now()}`,
      emergencyData
    });

  } catch (error) {
    console.error('Emergency alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emergency alert'
    });
  }
});

// Get nearby buses for a location
router.get('/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query; // radius in km
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const nearbyBuses = [];
    const userLocation = { lat: parseFloat(latitude), lng: parseFloat(longitude) };

    // Check all active trips for nearby buses
    for (const [tripId, trackingData] of liveTrackingData) {
      const distance = calculateDistance(
        userLocation.lat, userLocation.lng,
        trackingData.location.latitude, trackingData.location.longitude
      );

      if (distance <= radius) {
        nearbyBuses.push({
          tripId,
          busId: trackingData.busId,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          location: trackingData.location,
          status: trackingData.status,
          estimatedArrival: calculateETA(tripId)
        });
      }
    }

    // Sort by distance
    nearbyBuses.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      userLocation,
      radius: parseFloat(radius),
      nearbyBuses: nearbyBuses.length,
      buses: nearbyBuses
    });

  } catch (error) {
    console.error('Nearby buses fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby buses'
    });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to calculate trip progress
function calculateProgress(tripId) {
  // Mock progress calculation - in production, calculate based on actual route
  return Math.floor(Math.random() * 100);
}

// Helper function to calculate estimated time of arrival
function calculateETA(tripId) {
  // Mock ETA calculation - in production, calculate based on current location and route
  const now = new Date();
  const eta = new Date(now.getTime() + Math.random() * 2 * 60 * 60 * 1000); // 0-2 hours
  return eta.toISOString();
}

// Helper function to generate tracking history
function generateTrackingHistory(tripId, startTime, endTime) {
  const history = [];
  const start = startTime ? new Date(startTime) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const end = endTime ? new Date(endTime) : new Date();
  
  // Generate mock tracking points every 5 minutes
  for (let time = start; time <= end; time.setMinutes(time.getMinutes() + 5)) {
    history.push({
      timestamp: time.toISOString(),
      location: {
        latitude: 19.0760 + (Math.random() - 0.5) * 0.1,
        longitude: 72.8777 + (Math.random() - 0.5) * 0.1
      },
      speed: Math.random() * 80 + 20, // 20-100 km/h
      heading: Math.random() * 360
    });
  }
  
  return history;
}

module.exports = router;
