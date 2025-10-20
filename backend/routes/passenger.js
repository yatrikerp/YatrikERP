const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Depot = require('../models/Depot');
const { createResponseGuard, safeObjectId, extractUserId, asyncHandler } = require('../middleware/responseGuard');

// Apply response guard middleware to all routes
router.use(createResponseGuard);

// Public endpoint: search trips for landing page and redbus results
// Placed BEFORE auth middleware to allow unauthenticated access
router.get('/trips/search', async (req, res) => {
  try {
    const { from, to, date } = req.query;

    const searchDate = date ? new Date(date) : new Date();
    searchDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const trips = await Trip.find({
      serviceDate: { $gte: searchDate, $lt: nextDay },
      status: { $in: ['scheduled', 'running'] }
    })
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint totalDistance baseFare')
    .populate('busId', 'busNumber busType capacity')
    .sort({ startTime: 1 })
    .lean();

    // Optional city filter when from/to provided
    const filterByCity = (trip) => {
      if (!from && !to) return true;
      const fromCity = typeof trip.routeId?.startingPoint === 'object' ? (trip.routeId.startingPoint.city || trip.routeId.startingPoint.location) : trip.routeId?.startingPoint;
      const toCity = typeof trip.routeId?.endingPoint === 'object' ? (trip.routeId.endingPoint.city || trip.routeId.endingPoint.location) : trip.routeId?.endingPoint;
      const matchFrom = from ? new RegExp(from, 'i').test(fromCity || '') : true;
      const matchTo = to ? new RegExp(to, 'i').test(toCity || '') : true;
      return matchFrom && matchTo;
    };

    const filtered = trips.filter(filterByCity);

    const items = filtered.map(t => ({
      _id: t._id,
      routeName: t.routeId?.routeName || 'Route',
      routeNumber: t.routeId?.routeNumber || '',
      startTime: t.startTime,
      endTime: t.endTime,
      serviceDate: t.serviceDate,
      status: t.status,
      fare: t.fare || t.routeId?.baseFare || 100,
      capacity: t.capacity,
      availableSeats: t.availableSeats,
      bookedSeats: t.bookedSeats,
      busType: t.busId?.busType || 'ac_seater'
    }));

    return res.json({ ok: true, data: { trips: items } });
  } catch (error) {
    console.error('Public trips search error:', error);
    return res.status(500).json({ ok: false, message: 'Failed to fetch trips' });
  }
});

// Apply authentication to all routes
router.use(auth);

// GET /api/passenger/dashboard - Get passenger dashboard data
router.get('/dashboard', requireRole(['passenger']), async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('🔍 Dashboard API called for user:', userId);
    console.log('📅 Today date:', today.toISOString());

    // Get upcoming trips (all bookings for future dates, including pending)
    const upcomingBookings = await Booking.find({
      createdBy: userId,
      status: { $in: ['pending', 'confirmed', 'issued', 'paid'] },
      'journey.departureDate': { $gte: today }
    })
    .populate('tripId', 'routeId busId startTime endTime fare capacity')
    .populate('tripId.routeId', 'routeName routeNumber startingPoint endingPoint')
    .populate('tripId.busId', 'busNumber busType')
    .sort({ 'journey.departureDate': 1 })
    .limit(5)
    .lean();

    console.log('📊 Found upcoming bookings:', upcomingBookings.length);

    // Get recent activity (all bookings sorted by creation date)
    const recentBookings = await Booking.find({
      createdBy: userId
    })
    .populate('tripId', 'routeId busId startTime endTime fare')
    .populate('tripId.routeId', 'routeName routeNumber startingPoint endingPoint')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    console.log('📋 Found recent bookings:', recentBookings.length);

    // Calculate wallet balance (mock for now - would need wallet system)
    const walletBalance = 0; // TODO: Implement wallet system

    // Transform upcoming trips data
    console.log('🔄 Transforming upcoming trips...');
    const upcomingTrips = upcomingBookings.map(booking => {
      const trip = booking.tripId;
      const route = trip?.routeId;
      
      return {
        id: booking._id,
        bookingId: booking.bookingId || booking._id.toString().slice(-8).toUpperCase(),
        routeName: route?.routeName || 'Unknown Route',
        from: route?.startingPoint?.city || route?.startingPoint || 'Unknown',
        to: route?.endingPoint?.city || route?.endingPoint || 'Unknown',
        departureDate: booking.journey?.departureDate ? new Date(booking.journey.departureDate).toLocaleDateString() : 'N/A',
        departureTime: trip?.startTime || 'N/A',
        status: booking.status,
        fare: booking.pricing?.totalAmount || trip?.fare || 0,
        busType: trip?.busId?.busType || 'Standard',
        busNumber: trip?.busId?.busNumber || 'N/A',
        routeNumber: route?.routeNumber || 'N/A',
        seatNo: booking.seats?.[0]?.seatNumber || 'N/A'
      };
    });

    console.log('✅ Transformed upcoming trips:', upcomingTrips.length);
    if (upcomingTrips.length > 0) {
      console.log('📅 Sample upcoming trip:', JSON.stringify(upcomingTrips[0], null, 2));
    }

    // Transform recent activity data
    const recentActivity = recentBookings.map(booking => {
      const trip = booking.tripId;
      const route = trip?.routeId;
      
      return {
        id: booking._id,
        routeName: route?.routeName || 'Unknown Route',
        from: route?.startingPoint?.city || route?.startingPoint || 'Unknown',
        to: route?.endingPoint?.city || route?.endingPoint || 'Unknown',
        date: new Date(booking.createdAt).toLocaleDateString(),
        fare: booking.pricing?.totalAmount || trip?.fare || 0,
        status: booking.status,
        type: 'booking',
        bookingId: booking.bookingId || booking._id.toString().slice(-8).toUpperCase(),
        seatNo: booking.seats?.[0]?.seatNumber || 'N/A',
        busType: trip?.busId?.busType || 'Standard'
      };
    });

    // Get booking statistics
    const totalBookings = await Booking.countDocuments({ createdBy: userId });
    const confirmedBookings = await Booking.countDocuments({ 
      createdBy: userId, 
      status: { $in: ['pending', 'confirmed', 'issued', 'paid'] } 
    });
    const cancelledBookings = await Booking.countDocuments({ 
      createdBy: userId, 
      status: 'cancelled' 
    });

    res.json({
      success: true,
      data: {
        upcomingTrips,
        recentActivity,
        walletBalance,
        statistics: {
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          upcomingTripsCount: upcomingTrips.length
        }
      }
    });

  } catch (error) {
    console.error('Passenger dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// GET /api/passenger/bookings - Get all passenger bookings
router.get('/bookings', requireRole(['passenger']), async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, limit = 20, page = 1 } = req.query;

    const query = { createdBy: userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate('tripId', 'routeId busId startTime endTime fare capacity serviceDate')
        .populate('tripId.routeId', 'routeName routeNumber startingPoint endingPoint')
        .populate('tripId.busId', 'busNumber busType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Booking.countDocuments(query)
    ]);

    const transformedBookings = bookings.map(booking => {
      const trip = booking.tripId;
      const route = trip?.routeId;
      
      return {
        id: booking._id,
        bookingId: booking.bookingId || booking._id.toString().slice(-8).toUpperCase(),
        routeName: route?.routeName || 'Unknown Route',
        from: route?.startingPoint?.city || route?.startingPoint || 'Unknown',
        to: route?.endingPoint?.city || route?.endingPoint || 'Unknown',
        routeNumber: route?.routeNumber || 'N/A',
        seatNo: booking.seats?.[0]?.seatNumber || 'N/A',
        date: booking.journey?.departureDate ? new Date(booking.journey.departureDate).toLocaleDateString() : 'N/A',
        departureTime: trip?.startTime || 'N/A',
        status: booking.status,
        fare: booking.pricing?.totalAmount || trip?.fare || 0,
        busType: trip?.busId?.busType || 'Standard',
        busNumber: trip?.busId?.busNumber || 'N/A',
        createdAt: booking.createdAt,
        paymentStatus: booking.payment?.paymentStatus || 'pending',
        passengerDetails: booking.customer || {}
      };
    });

    res.json({
      success: true,
      data: {
        bookings: transformedBookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get passenger bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
});

// GET /api/passenger/stats - Get current statistics (public endpoint)
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get comprehensive statistics
    const [
      totalTrips,
      upcomingTrips,
      totalRoutes,
      totalBuses,
      totalDepots,
      totalBookings
    ] = await Promise.all([
      Trip.countDocuments(),
      Trip.countDocuments({
        serviceDate: { $gte: today },
        status: { $in: ['scheduled', 'running'] },
        bookingOpen: true
      }),
      Route.countDocuments(),
      Bus.countDocuments(),
      Depot.countDocuments(),
      Booking.countDocuments()
    ]);

    // Get route details
    const routes = await Route.find({})
      .populate('depot', 'depotName')
      .select('routeNumber routeName startingPoint endingPoint totalDistance baseFare status')
      .lean();

    // Get upcoming trip details
    const upcomingTripDetails = await Trip.find({
      serviceDate: { $gte: today },
      status: { $in: ['scheduled', 'running'] },
      bookingOpen: true
    })
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
    .populate('busId', 'busNumber busType')
    .populate('depotId', 'depotName')
    .sort({ serviceDate: 1, startTime: 1 })
    .limit(10)
    .lean();

    res.json({
      success: true,
      data: {
        summary: {
          totalTrips,
          upcomingTrips,
          totalRoutes,
          totalBuses,
          totalDepots,
          totalBookings
        },
        routes: routes.map(route => ({
          id: route._id,
          routeNumber: route.routeNumber,
          routeName: route.routeName,
          from: route.startingPoint?.city || route.startingPoint,
          to: route.endingPoint?.city || route.endingPoint,
          distance: route.totalDistance,
          baseFare: route.baseFare,
          status: route.status,
          depot: route.depot?.depotName
        })),
        upcomingTrips: upcomingTripDetails.map(trip => ({
          id: trip._id,
          routeName: trip.routeId?.routeName || 'Unknown Route',
          routeNumber: trip.routeId?.routeNumber || 'N/A',
          from: trip.routeId?.startingPoint?.city || trip.routeId?.startingPoint || 'Unknown',
          to: trip.routeId?.endingPoint?.city || trip.routeId?.endingPoint || 'Unknown',
          serviceDate: trip.serviceDate,
          startTime: trip.startTime,
          endTime: trip.endTime,
          fare: trip.fare,
          availableSeats: trip.availableSeats,
          totalSeats: trip.capacity,
          busNumber: trip.busId?.busNumber || 'N/A',
          busType: trip.busId?.busType || 'Unknown',
          depotName: trip.depotId?.depotName || 'Unknown',
          status: trip.status,
          bookingOpen: trip.bookingOpen
        })),
        debug: {
          today: today.toISOString(),
          searchCriteria: {
            serviceDate: { $gte: today },
            status: { $in: ['scheduled', 'running'] },
            bookingOpen: true
          }
        }
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// GET /api/passenger/trips/all - Get all available trips (for debugging)
router.get('/trips/all', requireRole(['passenger']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all trips that are available for booking
    const trips = await Trip.find({
      serviceDate: { $gte: today },
      status: { $in: ['scheduled', 'running'] },
      bookingOpen: true
    })
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
    .populate('busId', 'busNumber busType capacity')
    .populate('depotId', 'depotName')
    .sort({ serviceDate: 1, startTime: 1 })
    .lean();

    console.log('Found trips:', trips.length);

    const transformedTrips = trips.map(trip => {
      const route = trip.routeId;
      const bus = trip.busId;
      const depot = trip.depotId;
      
      return {
        id: trip._id,
        routeName: route?.routeName || 'Unknown Route',
        routeNumber: route?.routeNumber || 'N/A',
        from: route?.startingPoint?.city || route?.startingPoint || 'Unknown',
        to: route?.endingPoint?.city || route?.endingPoint || 'Unknown',
        departureTime: trip.startTime,
        arrivalTime: trip.endTime,
        fare: trip.fare || 0,
        availableSeats: trip.availableSeats || trip.capacity || 0,
        totalSeats: trip.capacity || 0,
        busType: bus?.busType || 'Standard',
        busNumber: bus?.busNumber || 'N/A',
        status: trip.status,
        serviceDate: trip.serviceDate,
        depotName: depot?.depotName || 'Unknown Depot',
        bookingOpen: trip.bookingOpen
      };
    });

    res.json({
      success: true,
      data: {
        trips: transformedTrips,
        totalFound: transformedTrips.length,
        debug: {
          totalTripsInDB: trips.length,
          today: today.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Get all trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trips',
      error: error.message
    });
  }
});

// GET /api/passenger/trips/search - Search available trips (public endpoint for landing page)
router.get('/trips/search', async (req, res) => {
  try {
    const { from, to, date } = req.query;

    // If no date provided, use today's date
    const searchDate = date ? new Date(date) : new Date();
    searchDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    console.log('🔍 Passenger trip search:', { from, to, date: searchDate.toDateString() });

    // Get ALL scheduled trips for the specified date (or today if no date)
    const trips = await Trip.find({
      serviceDate: { $gte: searchDate, $lt: nextDay },
      status: { $in: ['scheduled', 'running'] },
      bookingOpen: true
    })
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
    .populate('busId', 'busNumber busType capacity')
    .populate('driverId', 'name phone')
    .populate('conductorId', 'name phone')
    .populate('depotId', 'depotName')
    .sort({ startTime: 1 }) // Sort by departure time
    .lean();

    console.log(`📅 Found ${trips.length} scheduled trips for ${searchDate.toDateString()}`);

    // If from/to parameters are provided, filter trips; otherwise show all
    let filteredTrips = trips;
    let fallbackUsed = false;
    
    if (from && to) {
      console.log(`🔍 Filtering trips from "${from}" to "${to}"`);
      filteredTrips = trips.filter(trip => {
        const route = trip.routeId;
        if (!route) return false;
        
        const startCity = route.startingPoint?.city || route.startingPoint || '';
        const endCity = route.endingPoint?.city || route.endingPoint || '';
        const routeName = route.routeName || '';
        
        // More flexible matching - check if search terms appear anywhere in the route
        const fromMatch = startCity.toLowerCase().includes(from.toLowerCase()) || 
                         routeName.toLowerCase().includes(from.toLowerCase());
        const toMatch = endCity.toLowerCase().includes(to.toLowerCase()) || 
                       routeName.toLowerCase().includes(to.toLowerCase());
        
        return fromMatch && toMatch;
      });
      console.log(`✅ Filtered to ${filteredTrips.length} matching trips`);

      // Fallback: show all trips for the date when there are no matches
      if (filteredTrips.length === 0) {
        filteredTrips = trips;
        fallbackUsed = true;
        console.log('ℹ️ No matching trips found. Falling back to showing all scheduled trips for the date.');
      }
    } else {
      console.log(`📋 Showing all ${trips.length} scheduled trips (no from/to filter)`);
    }

    // Always show available routes for Kerala destinations
    let availableRoutes = [];
    
    // Search for matching routes
    const routes = await Route.find({
      status: 'active',
      $or: [
        { 'startingPoint.city': { $regex: from, $options: 'i' } },
        { 'endingPoint.city': { $regex: to, $options: 'i' } },
        { routeName: { $regex: `${from}.*${to}|${to}.*${from}`, $options: 'i' } }
      ]
    })
    .populate('depot', 'depotName')
    .lean();

    availableRoutes = routes.map(route => ({
      id: route._id,
      routeName: route.routeName,
      routeNumber: route.routeNumber,
      from: route.startingPoint?.city || route.startingPoint,
      to: route.endingPoint?.city || route.endingPoint,
      distance: route.totalDistance,
      baseFare: route.baseFare,
      depot: route.depot?.depotName,
      status: filteredTrips.length === 0 ? 'route_available' : 'route_with_trips',
      message: filteredTrips.length === 0 ? 'Route available - Contact depot to schedule trips' : 'Route available with trips'
    }));

    console.log(`Search: ${from} → ${to} on ${date}`);
    console.log(`Found ${trips.length} total trips, ${filteredTrips.length} to return (fallback=${fallbackUsed})`);
    console.log(`Found ${availableRoutes.length} matching routes without trips`);

    const transformedTrips = filteredTrips.map(trip => {
      const route = trip.routeId;
      const bus = trip.busId;
      const driver = trip.driverId;
      const conductor = trip.conductorId;
      const depot = trip.depotId;
      
      return {
        id: trip._id,
        tripNumber: `TRP${trip._id.toString().slice(-6).toUpperCase()}`,
        routeName: route?.routeName || 'Unknown Route',
        routeNumber: route?.routeNumber || 'N/A',
        from: route?.startingPoint?.city || route?.startingPoint || 'Unknown',
        to: route?.endingPoint?.city || route?.endingPoint || 'Unknown',
        departureTime: trip.startTime,
        arrivalTime: trip.endTime,
        fare: trip.fare || 0,
        availableSeats: trip.availableSeats || trip.capacity || 0,
        totalSeats: trip.capacity || 0,
        bookedSeats: trip.bookedSeats || 0,
        busType: bus?.busType || 'Standard',
        busNumber: bus?.busNumber || 'N/A',
        driver: driver ? `${driver.name} (${driver.phone})` : 'Not Assigned',
        conductor: conductor ? `${conductor.name} (${conductor.phone})` : 'Not Assigned',
        depot: depot?.depotName || 'Unknown Depot',
        status: trip.status,
        serviceDate: trip.serviceDate,
        bookingOpen: trip.bookingOpen,
        // Additional useful information
        duration: trip.endTime && trip.startTime ? 
          calculateDuration(trip.startTime, trip.endTime) : 'N/A',
        occupancyRate: trip.capacity > 0 ? 
          Math.round((trip.bookedSeats || 0) / trip.capacity * 100) : 0
      };
    });

    // Helper function to calculate duration
    function calculateDuration(startTime, endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const durationMinutes = endMinutes - startMinutes;
      
      if (durationMinutes < 0) return 'N/A'; // Handle overnight trips
      
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return `${hours}h ${minutes}m`;
    }

    res.json({
      success: true,
      data: {
        trips: transformedTrips,
        availableRoutes: availableRoutes,
        searchParams: { from, to, date: searchDate.toDateString() },
        totalFound: transformedTrips.length,
        routesFound: availableRoutes.length,
        searchType: from && to ? (fallbackUsed ? 'all_on_no_match' : 'filtered') : 'all_scheduled',
        message: (from && to)
          ? (fallbackUsed 
              ? `No trips matched "${from}" → "${to}". Showing all scheduled trips for ${searchDate.toDateString()}.`
              : `Found ${transformedTrips.length} trip(s) from "${from}" to "${to}".`)
          : `Showing all ${transformedTrips.length} scheduled trips for ${searchDate.toDateString()}.`
      }
    });

  } catch (error) {
    console.error('Search trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search trips',
      error: error.message
    });
  }
});

// GET /api/passenger/trips/all - Get all scheduled trips (no search filters)
router.get('/trips/all', async (req, res) => {
  try {
    const { date } = req.query;
    
    // If no date provided, use today's date
    const searchDate = date ? new Date(date) : new Date();
    searchDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    console.log(`📋 Getting all scheduled trips for ${searchDate.toDateString()}`);

    // Get ALL scheduled trips for the specified date
    const trips = await Trip.find({
      serviceDate: { $gte: searchDate, $lt: nextDay },
      status: { $in: ['scheduled', 'running'] },
      bookingOpen: true
    })
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
    .populate('busId', 'busNumber busType capacity')
    .populate('driverId', 'name phone')
    .populate('conductorId', 'name phone')
    .populate('depotId', 'depotName')
    .sort({ startTime: 1 }) // Sort by departure time
    .lean();

    console.log(`📅 Found ${trips.length} scheduled trips for ${searchDate.toDateString()}`);

    const transformedTrips = trips.map(trip => {
      const route = trip.routeId;
      const bus = trip.busId;
      const driver = trip.driverId;
      const conductor = trip.conductorId;
      const depot = trip.depotId;
      
      return {
        id: trip._id,
        tripNumber: `TRP${trip._id.toString().slice(-6).toUpperCase()}`,
        routeName: route?.routeName || 'Unknown Route',
        routeNumber: route?.routeNumber || 'N/A',
        from: route?.startingPoint?.city || route?.startingPoint || 'Unknown',
        to: route?.endingPoint?.city || route?.endingPoint || 'Unknown',
        departureTime: trip.startTime,
        arrivalTime: trip.endTime,
        fare: trip.fare || 0,
        availableSeats: trip.availableSeats || trip.capacity || 0,
        totalSeats: trip.capacity || 0,
        bookedSeats: trip.bookedSeats || 0,
        busType: bus?.busType || 'Standard',
        busNumber: bus?.busNumber || 'N/A',
        driver: driver ? `${driver.name} (${driver.phone})` : 'Not Assigned',
        conductor: conductor ? `${conductor.name} (${conductor.phone})` : 'Not Assigned',
        depot: depot?.depotName || 'Unknown Depot',
        status: trip.status,
        serviceDate: trip.serviceDate,
        bookingOpen: trip.bookingOpen,
        duration: trip.endTime && trip.startTime ? 
          calculateDuration(trip.startTime, trip.endTime) : 'N/A',
        occupancyRate: trip.capacity > 0 ? 
          Math.round((trip.bookedSeats || 0) / trip.capacity * 100) : 0
      };
    });

    // Helper function to calculate duration
    function calculateDuration(startTime, endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const durationMinutes = endMinutes - startMinutes;
      
      if (durationMinutes < 0) return 'N/A'; // Handle overnight trips
      
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return `${hours}h ${minutes}m`;
    }

    res.json({
      success: true,
      data: {
        trips: transformedTrips,
        totalTrips: trips.length,
        searchDate: searchDate.toDateString(),
        message: `Showing all ${trips.length} scheduled trips for ${searchDate.toDateString()}`
      }
    });

  } catch (error) {
    console.error('Get all trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get all trips',
      error: error.message
    });
  }
});

module.exports = router;
