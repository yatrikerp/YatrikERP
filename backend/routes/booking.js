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

// GET /api/booking/search - Enhanced trip search with autocomplete
router.get('/search', async (req, res) => {
  try {
    const { from, to, date, tripType = 'oneWay', returnDate, partial = false } = req.query;
    
    // If partial search (autocomplete), return suggestions
    if (partial === 'true') {
      return await handlePartialSearch(req, res);
    }
    
    if (!from || !to || !date) {
      return res.status(400).json({ 
        ok: false, 
        code: 'MISSING_PARAMS', 
        message: 'From, to, and date are required' 
      });
    }

    console.log('Search request:', { from, to, date, tripType, returnDate });

    // Enhanced search with multiple matching strategies
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate);
    endOfDay.setDate(endOfDay.getDate() + 1);
    endOfDay.setHours(0, 0, 0, 0);

    // Find all active trips for the date
    const trips = await Trip.find({
      serviceDate: { $gte: startOfDay, $lt: endOfDay },
      status: { $ne: 'cancelled' }
    }).populate('routeId').populate('driverId', 'name').populate('conductorId', 'name').populate('busId', 'busNumber busType capacity').lean();

    console.log('Found trips:', trips.length);

    // Enhanced matching with fuzzy search and multiple criteria
    const matchingTrips = trips.filter(trip => {
      if (!trip.routeId) return false;
      const route = trip.routeId;
      
      const fromTerm = String(from || '').toLowerCase();
      const toTerm = String(to || '').toLowerCase();

      // Enhanced place matching function
      const matchPlace = (term, place) => {
        if (!term || !place) return false;
        
        const city = (place.city || '').toLowerCase();
        const location = (place.location || '').toLowerCase();
        
        // Exact match
        if (city === term || location === term) return true;
        
        // Contains match
        if (city.includes(term) || location.includes(term)) return true;
        
        // Partial word match (for autocomplete-like behavior)
        const cityWords = city.split(' ');
        const locationWords = location.split(' ');
        
        return cityWords.some(word => word.startsWith(term)) || 
               locationWords.some(word => word.startsWith(term));
      };

      // Check starting point
      const fromMatch = matchPlace(fromTerm, route.startingPoint);
      
      // Check ending point
      const toMatch = matchPlace(toTerm, route.endingPoint);
      
      // Check intermediate stops
      const intermediateMatch = route.intermediateStops?.some(stop => 
        matchPlace(fromTerm, stop) || matchPlace(toTerm, stop)
      ) || false;
      
      // Check route name
      const routeNameMatch = route.routeName?.toLowerCase().includes(fromTerm) || 
                            route.routeName?.toLowerCase().includes(toTerm);
      
      return (fromMatch || intermediateMatch || routeNameMatch) && 
             (toMatch || intermediateMatch || routeNameMatch);
    });

    console.log('Matching trips:', matchingTrips.length);

    if (matchingTrips.length === 0) {
      // Return route suggestions for future reference
      const routeSuggestions = await getRouteSuggestions(from, to);
      
      return res.json({ 
        ok: true, 
        data: { 
          trips: [],
          suggestions: routeSuggestions,
          message: 'No trips found for the specified criteria. Here are some route suggestions.' 
        } 
      });
    }

    // Enhance trip data with comprehensive information
    const enhancedTrips = matchingTrips.map(trip => {
      const route = trip.routeId;
      const bus = trip.busId;
      
      // Find the best matching from and to locations
      const { fromLocation, toLocation } = findBestLocations(route, from, to);
      
      // Calculate fare with dynamic pricing
      const baseFare = route.baseFare || calculateFare(route.totalDistance || 100);
      const dynamicFare = calculateDynamicFare(baseFare, trip.serviceDate, trip.status);
      
      // Calculate arrival time
      const arrivalTime = calculateArrivalTime(trip.startTime, route.totalDistance || 100);
      
      // Get seat availability
      const seatAvailability = getSeatAvailability(trip, bus);
      
      return {
        id: trip._id,
        tripNumber: `TRP${trip._id.toString().slice(-6).toUpperCase()}`,
        from: fromLocation,
        to: toLocation,
        departure: trip.startTime,
        arrival: arrivalTime,
        date: trip.serviceDate,
        duration: calculateDuration(route.totalDistance || 100),
        distance: route.totalDistance || 100,
        fare: {
          base: baseFare,
          current: dynamicFare,
          currency: 'INR',
          discount: baseFare - dynamicFare
        },
        bus: {
          number: bus?.busNumber || 'N/A',
          type: bus?.busType || 'Standard',
          capacity: bus?.capacity?.total || 35,
          amenities: getBusAmenities(bus?.busType || 'standard')
        },
        route: {
          name: route.routeName || `${fromLocation} → ${toLocation}`,
          number: route.routeNumber || 'N/A',
          stops: route.intermediateStops?.length || 0
        },
        crew: {
          driver: trip.driverId?.name || 'To be assigned',
          conductor: trip.conductorId?.name || 'To be assigned'
        },
        status: trip.status,
        seatAvailability,
        bookingOptions: {
          canBook: seatAvailability.available > 0,
          maxSeats: Math.min(seatAvailability.available, 4), // Limit to 4 seats per booking
          requiresAdvance: isAdvanceBookingRequired(trip.serviceDate)
        },
        depot: route.depot?.depotName || 'Central Depot',
        lastUpdated: trip.updatedAt || trip.createdAt
      };
    });

    // Sort trips by departure time and fare
    enhancedTrips.sort((a, b) => {
      // First by departure time
      const timeComparison = a.departure.localeCompare(b.departure);
      if (timeComparison !== 0) return timeComparison;
      
      // Then by fare (cheapest first)
      return a.fare.current - b.fare.current;
    });

    res.json({ 
      ok: true, 
      data: { 
        trips: enhancedTrips,
        searchCriteria: { from, to, date, tripType, returnDate },
        totalFound: enhancedTrips.length,
        searchSummary: {
          date: date,
          from: from,
          to: to,
          totalTrips: enhancedTrips.length,
          priceRange: {
            min: Math.min(...enhancedTrips.map(t => t.fare.current)),
            max: Math.max(...enhancedTrips.map(t => t.fare.current))
          },
          timeRange: {
            earliest: enhancedTrips[0]?.departure,
            latest: enhancedTrips[enhancedTrips.length - 1]?.departure
          }
        }
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

// GET /api/booking/autocomplete - Enhanced autocomplete for places
router.get('/autocomplete', async (req, res) => {
  try {
    const { query, type = 'all' } = req.query;
    
    if (!query || query.length < 1) {
      return res.json({
        ok: true,
        data: { suggestions: [] },
        message: 'Query too short'
      });
    }

    const searchTerm = query.toLowerCase();
    const suggestions = [];

    // Get all active routes
    const routes = await Route.find({ status: 'active' })
      .populate('depot', 'depotName location')
      .lean();

    // Get all active trips for additional context
    const trips = await Trip.find({ 
      status: { $in: ['scheduled', 'running'] },
      serviceDate: { $gte: new Date() }
    }).populate('routeId').lean();

    const placeMap = new Map();

    // Process routes
    routes.forEach(route => {
      // Starting point
      if (route.startingPoint) {
        const key = `${route.startingPoint.city}-${route.startingPoint.location}`;
        if (!placeMap.has(key)) {
          placeMap.set(key, {
            city: route.startingPoint.city,
            location: route.startingPoint.location,
            type: 'starting_point',
            routes: [],
            popularity: 0
          });
        }
        const place = placeMap.get(key);
        place.routes.push(route.routeName);
        place.popularity += 1;
      }

      // Ending point
      if (route.endingPoint) {
        const key = `${route.endingPoint.city}-${route.endingPoint.location}`;
        if (!placeMap.has(key)) {
          placeMap.set(key, {
            city: route.endingPoint.city,
            location: route.endingPoint.location,
            type: 'ending_point',
            routes: [],
            popularity: 0
          });
        }
        const place = placeMap.get(key);
        place.routes.push(route.routeName);
        place.popularity += 1;
      }

      // Intermediate stops
      if (route.intermediateStops) {
        route.intermediateStops.forEach(stop => {
          const key = `${stop.city}-${stop.location}`;
          if (!placeMap.has(key)) {
            placeMap.set(key, {
              city: stop.city,
              location: stop.location,
              type: 'intermediate_stop',
              routes: [],
              popularity: 0
            });
          }
          const place = placeMap.get(key);
          place.routes.push(route.routeName);
          place.popularity += 0.5; // Intermediate stops get lower popularity
        });
      }
    });

    // Process trips for additional context
    trips.forEach(trip => {
      if (trip.routeId) {
        const route = trip.routeId;
        // Add popularity based on active trips
        if (route.startingPoint) {
          const key = `${route.startingPoint.city}-${route.startingPoint.location}`;
          if (placeMap.has(key)) {
            placeMap.get(key).popularity += 0.3;
          }
        }
        if (route.endingPoint) {
          const key = `${route.endingPoint.city}-${route.endingPoint.location}`;
          if (placeMap.has(key)) {
            placeMap.get(key).popularity += 0.3;
          }
        }
      }
    });

    // Convert to array and filter by search term
    const places = Array.from(placeMap.values())
      .filter(place => {
        const cityMatch = place.city.toLowerCase().includes(searchTerm);
        const locationMatch = place.location.toLowerCase().includes(searchTerm);
        const partialCityMatch = place.city.toLowerCase().split(' ').some(word => word.startsWith(searchTerm));
        const partialLocationMatch = place.location.toLowerCase().split(' ').some(word => word.startsWith(searchTerm));
        
        return cityMatch || locationMatch || partialCityMatch || partialLocationMatch;
      })
      .sort((a, b) => {
        // Sort by relevance and popularity
        const aRelevance = getRelevanceScore(a, searchTerm);
        const bRelevance = getRelevanceScore(b, searchTerm);
        
        if (aRelevance !== bRelevance) {
          return bRelevance - aRelevance;
        }
        
        return b.popularity - a.popularity;
      })
      .slice(0, 10); // Limit to top 10 suggestions

    // Format suggestions
    const formattedSuggestions = places.map(place => ({
      city: place.city,
      location: place.location,
      fullName: `${place.city}, ${place.location}`,
      type: place.type,
      routes: place.routes.slice(0, 3), // Show max 3 routes
      totalRoutes: place.routes.length,
      popularity: place.popularity,
      searchHint: `${place.city} → ${place.routes[0] || 'Multiple routes'}`
    }));

    res.json({
      ok: true,
      data: { 
        suggestions: formattedSuggestions,
        query: searchTerm,
        totalFound: formattedSuggestions.length
      },
      message: `Found ${formattedSuggestions.length} place suggestions`
    });

  } catch (err) {
    console.error('Autocomplete error:', err);
    res.status(500).json({
      ok: false,
      code: 'AUTOCOMPLETE_ERROR',
      message: 'Failed to get autocomplete suggestions'
    });
  }
});

// GET /api/booking/popular-routes - Enhanced popular routes
router.get('/popular-routes', async (req, res) => {
  try {
    const { limit = 10, from, to } = req.query;

    // Get popular routes based on bookings and searches
    const popularRoutes = await Route.aggregate([
      { $match: { status: 'active' } },
      {
        $lookup: {
          from: 'trips',
          localField: '_id',
          foreignField: 'routeId',
          as: 'trips'
        }
      },
      {
        $lookup: {
          from: 'bookings',
          localField: 'trips._id',
          foreignField: 'tripId',
          as: 'bookings'
        }
      },
      {
        $addFields: {
          tripCount: { $size: '$trips' },
          bookingCount: { $size: '$bookings' },
          popularity: {
            $add: [
              { $multiply: [{ $size: '$trips' }, 2] },
              { $size: '$bookings' },
              { $ifNull: ['$popularity', 0] }
            ]
          }
        }
      },
      { $sort: { popularity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Get additional context from active trips
    const activeTrips = await Trip.find({ 
      status: { $in: ['scheduled', 'running'] },
      serviceDate: { $gte: new Date() }
    }).populate('routeId').lean();

    const routeMap = new Map();

    // Add routes from aggregation
    popularRoutes.forEach(route => {
      routeMap.set(route._id.toString(), {
        id: route._id,
        routeNumber: route.routeNumber,
        routeName: route.routeName,
        from: route.startingPoint?.city || 'Unknown',
        to: route.endingPoint?.city || 'Unknown',
        distance: route.totalDistance,
        baseFare: route.baseFare,
        busType: route.busType,
        popularity: route.popularity,
        tripCount: route.tripCount,
        bookingCount: route.bookingCount,
        source: 'aggregation'
      });
    });

    // Add routes from active trips
    activeTrips.forEach(trip => {
      if (trip.routeId) {
        const route = trip.routeId;
        const key = route._id.toString();
        
        if (!routeMap.has(key)) {
          routeMap.set(key, {
            id: route._id,
            routeNumber: route.routeNumber,
            routeName: route.routeName,
            from: route.startingPoint?.city || 'Unknown',
            to: route.endingPoint?.city || 'Unknown',
            distance: route.totalDistance,
            baseFare: route.baseFare,
            busType: route.busType,
            popularity: 1,
            tripCount: 1,
            bookingCount: 0,
            source: 'active_trip'
          });
        } else {
          const existing = routeMap.get(key);
          existing.tripCount += 1;
          existing.popularity += 1;
        }
      }
    });

    // Filter by from/to if specified
    let filteredRoutes = Array.from(routeMap.values());
    if (from) {
      filteredRoutes = filteredRoutes.filter(route => 
        route.from.toLowerCase().includes(from.toLowerCase()) ||
        route.to.toLowerCase().includes(from.toLowerCase())
      );
    }
    if (to) {
      filteredRoutes = filteredRoutes.filter(route => 
        route.from.toLowerCase().includes(to.toLowerCase()) ||
        route.to.toLowerCase().includes(to.toLowerCase())
      );
    }

    // Sort by popularity and add additional info
    const finalRoutes = filteredRoutes
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, parseInt(limit))
      .map(route => ({
        ...route,
        fare: route.baseFare || calculateFare(route.distance || 100),
        duration: calculateDuration(route.distance || 100),
        amenities: getRouteAmenities(route.busType),
        nextTrip: getNextTripTime(route.id),
        availability: getRouteAvailability(route.id)
      }));

    res.json({
      ok: true,
      data: { 
        routes: finalRoutes,
        total: finalRoutes.length,
        filters: { from, to, limit }
      },
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
    const {
      tripId,
      seatNo,
      boardingStopId,
      destinationStopId,
      passengerDetails,
      paymentMethod = 'razorpay'
    } = req.body || {};
    
    if (!tripId || !seatNo || !boardingStopId || !destinationStopId) {
      return res.status(400).json({ 
        ok: false, 
        code: 'MISSING_PARAMS', 
        message: 'tripId, seatNo, boardingStopId, and destinationStopId are required' 
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
    const concessionAmount = 0;
    const totalAmount = fare - concessionAmount;

    // Expiry time (lock seat for 15 minutes)
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000);

    // Create booking
    const booking = await Booking.create({ 
      passengerId: req.user._id, 
      tripId, 
      seatNo, 
      fareAmount: fare,
      concessionAmount,
      totalAmount,
      status: 'pending_payment',
      paymentStatus: 'pending',
      paymentMethod,
      boardingStopId,
      destinationStopId,
      passengerDetails: passengerDetails || {},
      bookingTime: new Date(),
      expiryTime
    });

    res.json({ 
      ok: true, 
      data: { 
        bookingId: booking._id,
        fare: booking.fareAmount,
        totalAmount: booking.totalAmount,
        status: booking.status,
        expiryTime: booking.expiryTime,
        message: 'Booking created successfully. Proceed to payment.' 
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

// POST /api/booking/confirm - Confirm booking (after payment) and generate ticket
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

    const booking = await Booking.findById(bookingId).populate('tripId');
    if (!booking) {
      return res.status(404).json({ 
        ok: false, 
        code: 'BOOKING_NOT_FOUND', 
        message: 'Booking not found' 
      });
    }

    if (booking.status !== 'paid' && booking.paymentStatus !== 'completed') {
      return res.status(400).json({ 
        ok: false, 
        code: 'INVALID_STATUS', 
        message: 'Booking cannot be confirmed until payment is completed' 
      });
    }

    // Update booking status
    booking.status = 'confirmed';
    await booking.save();

    // Generate PNR and ticket
    const pnr = generatePNR();
    const expiresAt = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24 hours

    // Compose passenger and trip details for ticket
    const passengerName = booking.passengerDetails?.name || 'Passenger';
    const fareAmount = booking.totalAmount;
    const seatNumber = booking.seatNo;

    const ticket = await Ticket.create({ 
      bookingId: booking._id, 
      pnr, 
      qrPayload: `YATRIK|PNR:${pnr}|Trip:${booking.tripId}|Seat:${seatNumber}`,
      expiresAt, 
      state: 'active',
      passengerName,
      seatNumber,
      boardingStop: booking.boardingStopId?.toString() || '',
      destinationStop: booking.destinationStopId?.toString() || '',
      fareAmount,
      tripDetails: {
        tripId: booking.tripId?._id || booking.tripId,
        busNumber: booking.tripId?.busNumber || '',
        departureTime: booking.tripId?.startTime ? new Date(`2000-01-01T${booking.tripId.startTime}:00Z`) : undefined,
        arrivalTime: undefined,
        routeName: ''
      }
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
      state: 'active'
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

// Helper functions
async function handlePartialSearch(req, res) {
  const { from, to } = req.query;
  
  if (!from && !to) {
    return res.json({
      ok: true,
      data: { suggestions: [] },
      message: 'No search terms provided'
    });
  }

  // Get autocomplete suggestions for partial search
  const suggestions = await getAutocompleteSuggestions(from, to);
  
  res.json({
    ok: true,
    data: { suggestions },
    message: 'Partial search suggestions'
  });
}

async function getRouteSuggestions(from, to) {
  const routes = await Route.find({
    $or: [
      { 'startingPoint.city': { $regex: from, $options: 'i' } },
      { 'endingPoint.city': { $regex: to, $options: 'i' } },
      { 'intermediateStops.city': { $regex: from, $options: 'i' } },
      { 'intermediateStops.city': { $regex: to, $options: 'i' } }
    ],
    status: 'active'
  }).populate('depot').lean();

  return routes.map(route => ({
    type: 'route_suggestion',
    from: route.startingPoint?.city || 'Unknown',
    to: route.endingPoint?.city || 'Unknown',
    routeName: route.routeName,
    routeNumber: route.routeNumber,
    distance: route.totalDistance,
    baseFare: route.baseFare,
    depot: route.depot?.depotName || 'Unknown',
    message: 'Route exists but no trips scheduled for this date'
  }));
}

function findBestLocations(route, fromQuery, toQuery) {
  const fromTerm = fromQuery.toLowerCase();
  const toTerm = toQuery.toLowerCase();
  
  let fromLocation = route.startingPoint?.city || 'Unknown';
  let toLocation = route.endingPoint?.city || 'Unknown';
  
  // Check intermediate stops for better matches
  if (route.intermediateStops) {
    route.intermediateStops.forEach(stop => {
      if (stop.city.toLowerCase().includes(fromTerm)) {
        fromLocation = stop.city;
      }
      if (stop.city.toLowerCase().includes(toTerm)) {
        toLocation = stop.city;
      }
    });
  }
  
  return { fromLocation, toLocation };
}

function calculateDynamicFare(baseFare, serviceDate, status) {
  const daysUntilTrip = Math.ceil((new Date(serviceDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  let multiplier = 1.0;
  
  // Early booking discount
  if (daysUntilTrip > 7) {
    multiplier = 0.9; // 10% discount
  } else if (daysUntilTrip > 3) {
    multiplier = 0.95; // 5% discount
  }
  
  // Last minute premium
  if (daysUntilTrip <= 1) {
    multiplier = 1.2; // 20% premium
  }
  
  return Math.round(baseFare * multiplier);
}

function getSeatAvailability(trip, bus) {
  // Mock seat availability for now - in real system, this would query actual bookings
  const totalSeats = bus?.capacity?.total || 35;
  const bookedSeats = Math.floor(Math.random() * Math.min(totalSeats * 0.7, 20)); // Max 70% booked
  const availableSeats = totalSeats - bookedSeats;
  
  return {
    total: totalSeats,
    available: availableSeats,
    booked: bookedSeats,
    percentage: Math.round((availableSeats / totalSeats) * 100)
  };
}

function getBusAmenities(busType) {
  const amenities = {
    'ac_sleeper': ['AC', 'Sleeper Berths', 'USB Charging', 'WiFi', 'Refreshments'],
    'ac_seater': ['AC', 'Reclining Seats', 'USB Charging', 'WiFi'],
    'non_ac_sleeper': ['Sleeper Berths', 'USB Charging', 'Refreshments'],
    'non_ac_seater': ['Reclining Seats', 'USB Charging'],
    'volvo': ['AC', 'Premium Seats', 'USB Charging', 'WiFi', 'Entertainment', 'Refreshments'],
    'mini': ['AC', 'Compact Seats', 'USB Charging']
  };
  
  return amenities[busType] || ['Standard Seats', 'USB Charging'];
}

function getRouteAmenities(busType) {
  return getBusAmenities(busType);
}

function isAdvanceBookingRequired(serviceDate) {
  const daysUntilTrip = Math.ceil((new Date(serviceDate) - new Date()) / (1000 * 60 * 60 * 24));
  return daysUntilTrip <= 1; // Same day or next day trips
}

function getRelevanceScore(place, searchTerm) {
  let score = 0;
  
  // Exact matches get highest score
  if (place.city.toLowerCase() === searchTerm) score += 100;
  if (place.location.toLowerCase() === searchTerm) score += 100;
  
  // Starts with gets high score
  if (place.city.toLowerCase().startsWith(searchTerm)) score += 50;
  if (place.location.toLowerCase().startsWith(searchTerm)) score += 50;
  
  // Contains gets medium score
  if (place.city.toLowerCase().includes(searchTerm)) score += 25;
  if (place.location.toLowerCase().includes(searchTerm)) score += 25;
  
  // Partial word matches get lower score
  const cityWords = place.city.toLowerCase().split(' ');
  const locationWords = place.location.toLowerCase().split(' ');
  
  cityWords.forEach(word => {
    if (word.startsWith(searchTerm)) score += 10;
  });
  
  locationWords.forEach(word => {
    if (word.startsWith(searchTerm)) score += 10;
  });
  
  return score;
}

async function getAutocompleteSuggestions(from, to) {
  // This would implement the same logic as the autocomplete endpoint
  // but for internal use
  return [];
}

function getNextTripTime(routeId) {
  // Mock function - in real system, this would query actual trips
  return 'Tomorrow 06:00 AM';
}

function getRouteAvailability(routeId) {
  // Mock function - in real system, this would check actual availability
  return {
    status: 'available',
    nextTrip: 'Tomorrow',
    frequency: 'Daily'
  };
}

module.exports = router;


