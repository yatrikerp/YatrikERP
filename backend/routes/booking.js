const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const FarePolicy = require('../models/FarePolicy');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Depot = require('../models/Depot');

function generatePNR() {
	const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
	return 'YTK' + rnd;
}

// Helper function to create role-based auth middleware
const authRole = (roles) => [auth, requireRole(roles)];

// GET /api/booking/existing-trips - Show existing trips (for debugging)
router.get('/existing-trips', async (req, res) => {
  try {
    const trips = await Trip.find({ 
      status: { $in: ['scheduled', 'boarding', 'running'] },
      serviceDate: { $gte: new Date() }
    }).populate('routeId').lean();

    const formattedTrips = trips.map(trip => ({
      id: trip._id,
      date: trip.serviceDate,
      time: trip.startTime,
      status: trip.status,
      route: trip.routeId ? {
        name: trip.routeId.routeName,
        from: trip.routeId.startingPoint?.city,
        to: trip.routeId.endingPoint?.city,
        distance: trip.routeId.totalDistance
      } : null,
      depot: trip.depotId?.name || 'Unknown'
    }));

    res.json({
      ok: true,
      data: { 
        trips: formattedTrips,
        total: formattedTrips.length
      },
      message: `Found ${formattedTrips.length} existing trips`
    });

  } catch (err) {
    console.error('Existing trips error:', err);
    res.status(500).json({
      ok: false,
      code: 'EXISTING_TRIPS_ERROR',
      message: 'Failed to fetch existing trips'
    });
  }
});

// GET /api/booking/search - Public trip search (No auth required)
router.get('/search', async (req, res) => {
  try {
    const { from, to, date, tripType = 'oneWay', returnDate } = req.query;
    
    if (!from || !to || !date) {
      return res.status(400).json({ 
        ok: false, 
        code: 'MISSING_PARAMS', 
        message: 'From, to, and date are required' 
      });
    }

    console.log('Search request:', { from, to, date, tripType, returnDate });

    // First, try to find trips directly (since admin already has trips)
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find trips for the specified date - Fixed date comparison
    const trips = await Trip.find({
      $expr: {
        $and: [
          { $gte: [{ $dateToString: { format: "%Y-%m-%d", date: "$serviceDate" } }, date] },
          { $lt: [{ $dateToString: { format: "%Y-%m-%d", date: "$serviceDate" } }, nextDay.toISOString().split('T')[0]] }
        ]
      },
      status: { $in: ['scheduled', 'boarding', 'running'] }
    }).populate('routeId').populate('driverId', 'name').populate('conductorId', 'name').lean();

    console.log('Found trips:', trips.length);

    // Filter trips that match the from/to cities
    const matchingTrips = trips.filter(trip => {
      if (!trip.routeId) return false;
      
      const route = trip.routeId;
      
      // Check if route has the required cities
      const hasFrom = 
        (route.startingPoint?.city && route.startingPoint.city.toLowerCase().includes(from.toLowerCase())) ||
        (route.endingPoint?.city && route.endingPoint.city.toLowerCase().includes(from.toLowerCase())) ||
        (route.intermediateStops && route.intermediateStops.some(stop => 
          stop.city && stop.city.toLowerCase().includes(from.toLowerCase())
        ));
      
      const hasTo = 
        (route.startingPoint?.city && route.startingPoint.city.toLowerCase().includes(to.toLowerCase())) ||
        (route.endingPoint?.city && route.endingPoint.city.toLowerCase().includes(to.toLowerCase())) ||
        (route.intermediateStops && route.intermediateStops.some(stop => 
          stop.city && stop.city.toLowerCase().includes(to.toLowerCase())
        ));
      
      return hasFrom && hasTo;
    });

    console.log('Matching trips:', matchingTrips.length);

    if (matchingTrips.length === 0) {
      // If no trips found, try to find any routes that match
      const routes = await Route.find({
        $or: [
          { 'startingPoint.city': { $regex: from, $options: 'i' } },
          { 'endingPoint.city': { $regex: from, $options: 'i' } },
          { 'intermediateStops.city': { $regex: from, $options: 'i' } }
        ],
        $or: [
          { 'startingPoint.city': { $regex: to, $options: 'i' } },
          { 'endingPoint.city': { $regex: to, $options: 'i' } },
          { 'intermediateStops.city': { $regex: to, $options: 'i' } }
        ],
        status: 'active'
      }).populate('depot').lean();

      console.log('Found routes:', routes.length);

      if (routes.length === 0) {
        return res.json({ 
          ok: true, 
          data: { trips: [] },
          message: 'No routes or trips found for the specified cities' 
        });
      }

      // Return route suggestions even if no trips exist
      const routeSuggestions = routes.map(route => ({
        type: 'route_suggestion',
        from: route.startingPoint?.city || 'Unknown',
        to: route.endingPoint?.city || 'Unknown',
        routeName: route.routeName,
        distance: route.totalDistance,
        message: 'Route exists but no trips scheduled for this date'
      }));

      return res.json({ 
        ok: true, 
        data: { 
          trips: [],
          suggestions: routeSuggestions,
          message: 'Routes found but no trips scheduled for this date' 
        } 
      });
    }

    // Enhance trip data with route information and calculate fares
    const enhancedTrips = matchingTrips.map(trip => {
      const route = trip.routeId;
      
      // Find the correct from and to cities based on search criteria
      let fromCity = from;
      let toCity = to;
      
      // If route has intermediate stops, find the closest matches
      if (route.intermediateStops && route.intermediateStops.length > 0) {
        const fromStop = route.intermediateStops.find(stop => 
          stop.city && stop.city.toLowerCase().includes(from.toLowerCase())
        ) || route.startingPoint;
        
        const toStop = route.intermediateStops.find(stop => 
          stop.city && stop.city.toLowerCase().includes(to.toLowerCase())
        ) || route.endingPoint;
        
        fromCity = fromStop?.city || from;
        toCity = toStop?.city || to;
      } else {
        fromCity = route.startingPoint?.city || from;
        toCity = route.endingPoint?.city || to;
      }
      
      // Calculate fare based on distance
      const fare = calculateFare(route.totalDistance || 100);
      
      // Calculate arrival time
      const arrivalTime = calculateArrivalTime(trip.startTime, route.totalDistance || 100);
      
      // Mock seat availability for Phase-0
      const totalSeats = 35;
      const availableSeats = Math.floor(Math.random() * 20) + 5; // 5-25 seats available
      
      return {
        ...trip,
        from: fromCity,
        to: toCity,
        departure: trip.startTime,
        arrival: arrivalTime,
        fare: fare,
        availableSeats: availableSeats,
        totalSeats: totalSeats,
        depot: route.depot?.depotName || 'Central Depot',
        busType: route.busType || 'AC Sleeper',
        amenities: ['WiFi', 'USB Charging', 'AC'],
        routeName: route.routeName || `${fromCity} → ${toCity}`,
        distance: route.totalDistance || 100,
        duration: calculateDuration(route.totalDistance || 100)
      };
    });

    // Sort trips by departure time
    enhancedTrips.sort((a, b) => a.departure.localeCompare(b.departure));

    res.json({ 
      ok: true, 
      data: { 
        trips: enhancedTrips,
        searchCriteria: { from, to, date, tripType, returnDate },
        totalFound: enhancedTrips.length
      },
      message: `Found ${enhancedTrips.length} trips` 
    });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ 
      ok: false, 
      code: 'SEARCH_ERROR', 
      message: 'Failed to search trips' 
    });
  }
});

// GET /api/booking/popular-routes - Get popular routes for suggestions
router.get('/popular-routes', async (req, res) => {
  try {
    // Get routes from active routes
    const routes = await Route.find({ status: 'active' })
      .sort({ popularity: -1 })
      .limit(10)
      .select('startingPoint endingPoint totalDistance baseFare routeName')
      .lean();

    // Get routes from existing trips (since admin already has trips)
    const trips = await Trip.find({ 
      status: { $in: ['scheduled', 'boarding', 'running'] },
      serviceDate: { $gte: new Date() } // Only future trips
    }).populate('routeId').lean();

    const routeMap = new Map();

    // Add routes from routes collection
    routes.forEach(route => {
      const key = `${route.startingPoint?.city}-${route.endingPoint?.city}`;
      if (!routeMap.has(key)) {
        routeMap.set(key, {
          from: route.startingPoint?.city || 'Unknown',
          to: route.endingPoint?.city || 'Unknown',
          distance: route.totalDistance,
          fare: route.baseFare || calculateFare(route.totalDistance || 100),
          name: route.routeName,
          source: 'route'
        });
      }
    });

    // Add routes from existing trips
    trips.forEach(trip => {
      if (trip.routeId) {
        const route = trip.routeId;
        const key = `${route.startingPoint?.city}-${route.endingPoint?.city}`;
        
        if (!routeMap.has(key)) {
          routeMap.set(key, {
            from: route.startingPoint?.city || 'Unknown',
            to: route.endingPoint?.city || 'Unknown',
            distance: route.totalDistance || 100,
            fare: route.baseFare || calculateFare(route.totalDistance || 100),
            name: route.routeName || `${route.startingPoint?.city} → ${route.endingPoint?.city}`,
            source: 'trip'
          });
        }
      }
    });

    const formattedRoutes = Array.from(routeMap.values()).slice(0, 10);

    res.json({
      ok: true,
      data: { routes: formattedRoutes },
      message: 'Popular routes fetched successfully'
    });

  } catch (err) {
    console.error('Popular routes error:', err);
    res.status(500).json({
      ok: false,
      code: 'POPULAR_ROUTES_ERROR',
      message: 'Failed to fetch popular routes'
    });
  }
});

// GET /api/booking/cities - Get all available cities for autocomplete
router.get('/cities', async (req, res) => {
  try {
    // Get cities from routes
    const routes = await Route.find({ status: 'active' })
      .select('startingPoint endingPoint intermediateStops')
      .lean();

    // Get cities from existing trips (since admin already has trips)
    const trips = await Trip.find({ 
      status: { $in: ['scheduled', 'boarding', 'running'] },
      serviceDate: { $gte: new Date() } // Only future trips
    }).populate('routeId').lean();

    const cities = new Set();
    
    // Add cities from routes
    routes.forEach(route => {
      // Add starting point city
      if (route.startingPoint?.city) {
        cities.add(route.startingPoint.city);
      }
      
      // Add ending point city
      if (route.endingPoint?.city) {
        cities.add(route.endingPoint.city);
      }
      
      // Add intermediate stop cities
      if (route.intermediateStops) {
        route.intermediateStops.forEach(stop => {
          if (stop.city) {
            cities.add(stop.city);
          }
        });
      }
    });

    // Add cities from existing trips
    trips.forEach(trip => {
      if (trip.routeId) {
        const route = trip.routeId;
        
        // Add starting point city
        if (route.startingPoint?.city) {
          cities.add(route.startingPoint.city);
        }
        
        // Add ending point city
        if (route.endingPoint?.city) {
          cities.add(route.endingPoint.city);
        }
        
        // Add intermediate stop cities
        if (route.intermediateStops) {
          route.intermediateStops.forEach(stop => {
            if (stop.city) {
              cities.add(stop.city);
            }
          });
        }
      }
    });

    const cityList = Array.from(cities).sort();

    res.json({
      ok: true,
      data: { cities: cityList },
      message: 'Cities fetched successfully'
    });

  } catch (err) {
    console.error('Cities error:', err);
    res.status(500).json({
      ok: false,
      code: 'CITIES_ERROR',
      message: 'Failed to fetch cities'
    });
  }
});

// Helper function to calculate arrival time
function calculateArrivalTime(startTime, distanceKm) {
  const avgSpeed = 60; // km/h
  const travelHours = distanceKm / avgSpeed;
  const startDate = new Date(`2000-01-01 ${startTime}`);
  const arrivalDate = new Date(startDate.getTime() + travelHours * 60 * 60 * 1000);
  return arrivalDate.toTimeString().slice(0, 5);
}

// Helper function to calculate fare
function calculateFare(distanceKm) {
  const baseFare = 100;
  const perKmRate = 2;
  return Math.round(baseFare + (distanceKm * perKmRate));
}

// Helper function to calculate duration
function calculateDuration(distanceKm) {
  const avgSpeed = 60; // km/h
  const hours = Math.floor(distanceKm / avgSpeed);
  const minutes = Math.round((distanceKm % avgSpeed) / avgSpeed * 60);
  return `${hours}h ${minutes}m`;
}

// POST /api/booking - Create booking (Passenger)
router.post('/', authRole(['PASSENGER','ADMIN']), async (req, res) => {
  try {
    const { tripId, seatNo, from, to } = req.body || {};
    
    if (!tripId || !seatNo) {
      return res.status(400).json({ 
        ok: false, 
        code: 'MISSING_PARAMS', 
        message: 'Trip ID and seat number are required' 
      });
    }

    const trip = await Trip.findById(tripId).populate('routeId').lean();
    if (!trip) {
      return res.status(404).json({ 
        ok: false, 
        code: 'TRIP_NOT_FOUND', 
        message: 'Trip not found' 
      });
    }

    // Check if seat is available
    const existingBooking = await Booking.findOne({ 
      tripId, 
      seatNo, 
      status: { $in: ['confirmed', 'issued'] } 
    });

    if (existingBooking) {
      return res.status(400).json({ 
        ok: false, 
        code: 'SEAT_OCCUPIED', 
        message: 'Selected seat is already occupied' 
      });
    }

    // Calculate fare
    const route = trip.routeId;
    const fare = calculateFare(route.totalDistance || 100);

    // Create booking
    const booking = await Booking.create({ 
      passengerId: req.user._id, 
      tripId, 
      seatNo, 
      fareAmount: fare, 
      status: 'initiated',
      from,
      to,
      bookingDate: new Date()
    });

    res.json({ 
      ok: true, 
      data: { 
        bookingId: booking._id, 
        fare,
        message: 'Booking created successfully' 
      } 
    });

  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(500).json({ 
      ok: false, 
      code: 'BOOKING_ERROR', 
      message: 'Failed to create booking' 
    });
  }
});

// POST /api/booking/confirm - Confirm booking and generate ticket
router.post('/confirm', authRole(['PASSENGER','ADMIN']), async (req, res) => {
  try {
    const { bookingId } = req.body || {};
    
    if (!bookingId) {
      return res.status(400).json({ 
        ok: false, 
        code: 'MISSING_BOOKING_ID', 
        message: 'Booking ID is required' 
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        ok: false, 
        code: 'BOOKING_NOT_FOUND', 
        message: 'Booking not found' 
      });
    }

    if (booking.status !== 'initiated') {
      return res.status(400).json({ 
        ok: false, 
        code: 'INVALID_STATUS', 
        message: 'Booking cannot be confirmed in current status' 
      });
    }

    // Update booking status
    booking.status = 'confirmed';
    await booking.save();

    // Generate PNR and ticket
    const pnr = generatePNR();
    const expiresAt = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24 hours
    
    const ticket = await Ticket.create({ 
      bookingId: booking._id, 
      pnr, 
      qrPayload: `YATRIK|PNR:${pnr}|Trip:${booking.tripId}|Seat:${booking.seatNo}`,
      expiresAt, 
      state: 'active',
      status: 'issued'
    });

    res.json({ 
      ok: true, 
      data: { 
        ticket,
        pnr,
        qrCode: `QR${Date.now()}`,
        message: 'Booking confirmed and ticket generated' 
      } 
    });

  } catch (err) {
    console.error('Booking confirmation error:', err);
    res.status(500).json({ 
      ok: false, 
      code: 'CONFIRM_ERROR', 
      message: 'Failed to confirm booking' 
    });
  }
});

// GET /api/booking/passenger - Get passenger's bookings
router.get('/passenger', authRole(['PASSENGER','ADMIN']), async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      passengerId: req.user._id 
    })
    .populate('tripId')
    .populate('routeId')
    .sort({ createdAt: -1 })
    .lean();

    res.json({ 
      ok: true, 
      data: { bookings },
      message: `Found ${bookings.length} bookings` 
    });

  } catch (err) {
    console.error('Fetch bookings error:', err);
    res.status(500).json({ 
      ok: false, 
      code: 'FETCH_ERROR', 
      message: 'Failed to fetch bookings' 
    });
  }
});

// GET /api/tickets/active - Get active tickets
router.get('/tickets/active', authRole(['PASSENGER','ADMIN']), async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      passengerId: req.user._id,
      status: { $in: ['confirmed', 'issued'] }
    }).lean();
    
    const bookingIds = bookings.map(b => b._id);
    const tickets = await Ticket.find({ 
      bookingId: { $in: bookingIds }, 
      state: 'active',
      status: 'issued'
    }).sort({ createdAt: -1 }).lean();

    res.json({ 
      ok: true, 
      data: { tickets },
      message: `Found ${tickets.length} active tickets` 
    });

  } catch (err) {
    console.error('Fetch tickets error:', err);
    res.status(500).json({ 
      ok: false, 
      code: 'TICKETS_ERROR', 
      message: 'Failed to fetch tickets' 
    });
  }
});

// POST /api/booking/cancel - Cancel booking
router.post('/cancel', authRole(['PASSENGER','ADMIN']), async (req, res) => {
  try {
    const { bookingId } = req.body || {};
    
    if (!bookingId) {
      return res.status(400).json({ 
        ok: false, 
        code: 'MISSING_BOOKING_ID', 
        message: 'Booking ID is required' 
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ 
        ok: false, 
        code: 'BOOKING_NOT_FOUND', 
        message: 'Booking not found' 
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ 
        ok: false, 
        code: 'ALREADY_CANCELLED', 
        message: 'Booking is already cancelled' 
      });
    }

    // Cancel booking
    booking.status = 'cancelled';
    await booking.save();

    // Cancel associated ticket if exists
    await Ticket.updateMany(
      { bookingId: booking._id },
      { state: 'cancelled', status: 'cancelled' }
    );

    res.json({ 
      ok: true, 
      data: { 
        message: 'Booking cancelled successfully',
        refundAmount: booking.fareAmount * 0.8 // 80% refund
      } 
    });

  } catch (err) {
    console.error('Booking cancellation error:', err);
    res.status(500).json({ 
      ok: false, 
      code: 'CANCEL_ERROR', 
      message: 'Failed to cancel booking' 
    });
  }
});

module.exports = router;


