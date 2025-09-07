const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const QRCodeGenerator = require('../utils/qrCodeGenerator');
const PaymentService = require('../utils/paymentService');
const fs = require('fs');

// Helper function to create role-based auth middleware
const authRole = (roles) => [auth, requireRole(roles)];

// Generate PNR
function generatePNR() {
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return 'YTK' + rnd;
}



// Search trips endpoint
router.get('/search', async (req, res) => {
  try {
    const { from, to, date, tripType, returnDate } = req.query;

    console.log('Search request:', { from, to, date, tripType, returnDate });

    // Search for actual trips in database - no mock data, live data only
    const searchQuery = {
      $or: [
        {
          'startingPoint.city': { $regex: from, $options: 'i' },
          'endingPoint.city': { $regex: to, $options: 'i' }
        },
        {
          'startingPoint.city': { $regex: to, $options: 'i' },
          'endingPoint.city': { $regex: from, $options: 'i' }
        }
      ]
    };

    const routes = await Route.find(searchQuery);
    console.log(`Found ${routes.length} matching routes`);

    if (routes.length === 0) {
      return res.json({
        ok: true,
        data: {
          trips: [],
          message: 'No routes found for the specified cities'
        }
      });
    }

    // Get all route IDs
    const routeIds = routes.map(route => route._id);

    // Find trips for these routes on the specified date
    const searchDate = new Date(date);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const trips = await Trip.find({
      routeId: { $in: routeIds },
      serviceDate: {
        $gte: searchDate,
        $lt: nextDay
      },
      status: 'scheduled'
    }).populate('routeId busId');

    console.log(`Found ${trips.length} matching trips`);

    // Transform trips to match frontend expectations
    const transformedTrips = trips.map(trip => {
      const route = trip.routeId;
      const bus = trip.busId;
      
      return {
        id: trip._id,
        tripId: trip.tripId,
        routeId: trip.routeId._id,
        routeName: route.routeName,
        routeNumber: route.routeNumber,
        from: route.startingPoint.city,
        to: route.endingPoint.city,
        departure: trip.startTime,
        arrival: trip.startTime, // We'll calculate this based on route duration
        departureDate: trip.serviceDate,
        fare: route.baseFare,
        busNumber: bus ? bus.busNumber : 'KL-BUS-001',
        busType: bus ? bus.busType : 'ac_sleeper',
        availableSeats: trip.availableSeats || 45,
        totalSeats: bus ? bus.capacity.total : 45,
        status: trip.status,
        operator: 'Kerala State Road Transport Corporation (KSRTC)',
        distance: route.totalDistance,
        duration: route.estimatedDuration,
        features: route.features || ['AC', 'WiFi', 'USB_Charging'],
        rating: 4.5,
        reviews: 150,
        amenities: ['WiFi', 'USB Charging', 'AC', 'Water Bottle'],
        cancellationPolicy: 'Free cancellation up to 2 hours before departure',
        boardingPoints: [`${route.startingPoint.city} Central Bus Terminal`],
        droppingPoints: [`${route.endingPoint.city} Central Bus Terminal`]
      };
    });

    res.json({
      ok: true,
      data: {
        trips: transformedTrips,
        total: transformedTrips.length,
        message: `${transformedTrips.length} trips found`
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to search trips. Please try again.',
      error: error.message
    });
  }
});

// GET /api/booking/routes - Get all Kerala routes
router.get('/routes', async (req, res) => {
  try {
    const routes = await Route.find({ 
      isActive: true,
      routeNumber: { $regex: '^KL', $options: 'i' }
    })
    .populate('depot.depotId', 'depotName depotCode')
    .populate('assignedBuses.busId', 'busNumber capacity busType')
    .lean();

    console.log('Found routes:', routes.length);
    console.log('Sample route:', routes[0]);
    
    const formattedRoutes = routes.map(route => ({
      id: route._id,
      routeNumber: route.routeNumber,
      routeName: route.routeName,
      from: route.startingPoint.city,
      to: route.endingPoint.city,
      fromLocation: route.startingPoint.location,
      toLocation: route.endingPoint.location,
      distance: route.totalDistance,
      duration: route.estimatedDuration,
      baseFare: route.baseFare,
      features: route.features,
      intermediateStops: route.intermediateStops,
      depot: route.depot?.depotId?.depotName || 'Kerala Central Depot',
      buses: (route.assignedBuses || []).map(bus => ({
        id: bus.busId?._id,
        busNumber: bus.busNumber,
        capacity: bus.capacity,
        busType: bus.busType
      }))
    }));

    res.json({
      ok: true,
      data: formattedRoutes,
      message: `Found ${formattedRoutes.length} Kerala routes`
    });

  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch routes'
    });
  }
});

module.exports = router;
