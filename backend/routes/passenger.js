const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Depot = require('../models/Depot');

// Apply authentication to all routes
router.use(auth);

// GET /api/passenger/dashboard - Get passenger dashboard data
router.get('/dashboard', requireRole(['passenger']), async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get upcoming trips (confirmed bookings for future dates)
    const upcomingBookings = await Booking.find({
      passengerId: userId,
      status: { $in: ['confirmed', 'issued', 'paid'] },
      'journey.departureDate': { $gte: today }
    })
    .populate('tripId', 'routeId busId startTime endTime fare capacity')
    .populate('tripId.routeId', 'routeName routeNumber startingPoint endingPoint')
    .populate('tripId.busId', 'busNumber busType')
    .sort({ 'journey.departureDate': 1 })
    .limit(5)
    .lean();

    // Get recent activity (all bookings sorted by creation date)
    const recentBookings = await Booking.find({
      passengerId: userId
    })
    .populate('tripId', 'routeId busId startTime endTime fare')
    .populate('tripId.routeId', 'routeName routeNumber startingPoint endingPoint')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    // Calculate wallet balance (mock for now - would need wallet system)
    const walletBalance = 0; // TODO: Implement wallet system

    // Transform upcoming trips data
    const upcomingTrips = upcomingBookings.map(booking => {
      const trip = booking.tripId;
      const route = trip?.routeId;
      
      return {
        id: booking._id,
        bookingId: booking.bookingId || booking._id.toString().slice(-8).toUpperCase(),
        route: route ? `${route.startingPoint?.city || route.startingPoint} → ${route.endingPoint?.city || route.endingPoint}` : 'Unknown Route',
        seatNo: booking.seatNo || 'N/A',
        date: booking.journey?.departureDate ? new Date(booking.journey.departureDate).toLocaleDateString() : 'N/A',
        departureTime: trip?.startTime || 'N/A',
        status: booking.status,
        fare: booking.totalAmount || trip?.fare || 0,
        busType: trip?.busId?.busType || 'Standard',
        busNumber: trip?.busId?.busNumber || 'N/A',
        routeName: route?.routeName || 'Unknown Route',
        routeNumber: route?.routeNumber || 'N/A'
      };
    });

    // Transform recent activity data
    const recentActivity = recentBookings.map(booking => {
      const trip = booking.tripId;
      const route = trip?.routeId;
      
      return {
        id: booking._id,
        route: route ? `${route.startingPoint?.city || route.startingPoint} → ${route.endingPoint?.city || route.endingPoint}` : 'Unknown Route',
        date: new Date(booking.createdAt).toLocaleDateString(),
        fare: booking.totalAmount || trip?.fare || 0,
        status: booking.status,
        type: 'booking',
        bookingId: booking.bookingId || booking._id.toString().slice(-8).toUpperCase(),
        seatNo: booking.seatNo || 'N/A',
        busType: trip?.busId?.busType || 'Standard'
      };
    });

    // Get booking statistics
    const totalBookings = await Booking.countDocuments({ passengerId: userId });
    const confirmedBookings = await Booking.countDocuments({ 
      passengerId: userId, 
      status: { $in: ['confirmed', 'issued', 'paid'] } 
    });
    const cancelledBookings = await Booking.countDocuments({ 
      passengerId: userId, 
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

    const query = { passengerId: userId };
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
        route: route ? `${route.startingPoint?.city || route.startingPoint} → ${route.endingPoint?.city || route.endingPoint}` : 'Unknown Route',
        routeName: route?.routeName || 'Unknown Route',
        routeNumber: route?.routeNumber || 'N/A',
        seatNo: booking.seatNo || 'N/A',
        date: booking.journey?.departureDate ? new Date(booking.journey.departureDate).toLocaleDateString() : 'N/A',
        departureTime: trip?.startTime || 'N/A',
        status: booking.status,
        fare: booking.totalAmount || trip?.fare || 0,
        busType: trip?.busId?.busType || 'Standard',
        busNumber: trip?.busId?.busNumber || 'N/A',
        createdAt: booking.createdAt,
        paymentStatus: booking.paymentStatus || 'pending',
        passengerDetails: booking.passengerDetails || {}
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

    if (!from || !to || !date) {
      return res.status(400).json({
        success: false,
        message: 'From, to, and date are required'
      });
    }

    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // First, search for trips on the specified date
    const trips = await Trip.find({
      serviceDate: { $gte: searchDate, $lt: nextDay },
      status: { $in: ['scheduled', 'running'] },
      bookingOpen: true
    })
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
    .populate('busId', 'busNumber busType capacity')
    .lean();

    // Filter trips by route (more flexible matching)
    const filteredTrips = trips.filter(trip => {
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
    console.log(`Found ${trips.length} total trips, ${filteredTrips.length} matching trips`);
    console.log(`Found ${availableRoutes.length} matching routes without trips`);

    const transformedTrips = filteredTrips.map(trip => {
      const route = trip.routeId;
      const bus = trip.busId;
      
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
        bookingOpen: trip.bookingOpen
      };
    });

    res.json({
      success: true,
      data: {
        trips: transformedTrips,
        availableRoutes: availableRoutes,
        searchParams: { from, to, date },
        totalFound: transformedTrips.length,
        routesFound: availableRoutes.length,
        message: filteredTrips.length === 0 && availableRoutes.length > 0 
          ? `No trips scheduled for ${date}, but ${availableRoutes.length} route(s) available. Contact depot to schedule trips.`
          : filteredTrips.length === 0 
          ? 'No trips or routes found for your search criteria.'
          : `Found ${filteredTrips.length} trip(s) available for booking.`
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

module.exports = router;
