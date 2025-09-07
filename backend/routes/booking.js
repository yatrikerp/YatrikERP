const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const BookingService = require('../services/bookingService');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

// Helper function to create role-based auth middleware
const authRole = (roles) => [auth, requireRole(roles)];

// Allow both admin and depot users to access booking routes
const bookingAuth = authRole(['admin', 'depot_manager', 'depot_supervisor', 'depot_operator', 'MANAGER', 'SUPERVISOR', 'OPERATOR', 'passenger']);

// ===== PUBLIC ROUTES (NO AUTH REQUIRED) =====
router.get('/cities', async (req, res) => {
  try {
    const routes = await Route.find({ status: 'active' })
      .select('startingPoint.city endingPoint.city')
      .lean();

    const cities = new Set();
    
    routes.forEach(route => {
      if (route.startingPoint?.city) {
        cities.add(route.startingPoint.city);
      }
      if (route.endingPoint?.city) {
        cities.add(route.endingPoint.city);
      }
    });

    const citiesList = Array.from(cities).sort();

    res.json({
      success: true,
      data: {
        cities: citiesList,
        count: citiesList.length
      }
    });

  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
});

// Public search endpoint (no auth required)
router.post('/search', async (req, res) => {
  try {
    const { from, to, departureDate, passengers = 1 } = req.body;

    if (!from || !to || !departureDate) {
      return res.status(400).json({
        success: false,
        message: 'From, to, and departure date are required'
      });
    }

    const trips = await BookingService.searchTrips({
      from,
      to,
      departureDate,
      passengers
    });

    res.json({
      success: true,
      data: {
        trips,
        searchCriteria: {
          from,
          to,
          departureDate,
          passengers
        }
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

// ===== AUTHENTICATED ROUTES (AUTH REQUIRED) =====

// Test endpoint to create sample bookings (for development only)
router.post('/create-sample', bookingAuth, async (req, res) => {
  try {
    const { depotId } = req.body;
    
    if (!depotId) {
      return res.status(400).json({
        success: false,
        message: 'Depot ID is required'
      });
    }

    // Find existing trip, route, bus, and user
    const trip = await Trip.findOne({ depotId }).populate('routeId busId');
    const user = await User.findOne({ role: 'passenger' });
    
    if (!trip) {
      return res.status(400).json({
        success: false,
        message: 'No trips found for this depot. Please create a trip first.'
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'No passenger user found. Please create a passenger user first.'
      });
    }

    // Create sample bookings
    const sampleBookings = [
      {
        bookingId: `BK${Date.now()}-001`,
        tripId: trip._id,
        routeId: trip.routeId._id,
        busId: trip.busId._id,
        depotId: depotId,
        createdBy: user._id,
        passenger: {
          name: 'John Passenger',
          email: 'john.passenger@example.com',
          phone: '+91-9876543210',
          age: 35,
          gender: 'male'
        },
        journey: {
          departureDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          departureTime: trip.startTime,
          arrivalTime: trip.endTime,
          from: trip.routeId.startingPoint.name,
          to: trip.routeId.endingPoint.name
        },
        seats: [
          { seatNumber: 'A1', seatType: 'seater', price: 550 }
        ],
        pricing: {
          baseFare: 500,
          seatCharges: 50,
          taxes: 25,
          total: 575
        },
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentMethod: 'online',
        specialRequests: 'Window seat preferred'
      },
      {
        bookingId: `BK${Date.now()}-002`,
        tripId: trip._id,
        routeId: trip.routeId._id,
        busId: trip.busId._id,
        depotId: depotId,
        createdBy: user._id,
        passenger: {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+91-9876543211',
          age: 28,
          gender: 'female'
        },
        journey: {
          departureDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
          departureTime: trip.startTime,
          arrivalTime: trip.endTime,
          from: trip.routeId.startingPoint.name,
          to: trip.routeId.endingPoint.name
        },
        seats: [
          { seatNumber: 'B1', seatType: 'seater', price: 550 }
        ],
        pricing: {
          baseFare: 500,
          seatCharges: 50,
          taxes: 25,
          total: 575
        },
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'online',
        specialRequests: 'Lower berth'
      }
    ];

    const createdBookings = [];
    for (const bookingData of sampleBookings) {
      const booking = new Booking(bookingData);
    await booking.save();
      createdBookings.push(booking);
    }

    res.json({
      success: true,
      message: 'Sample bookings created successfully',
      data: {
        bookings: createdBookings,
        count: createdBookings.length
      }
    });

  } catch (error) {
    console.error('Create sample bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sample bookings',
      error: error.message
    });
  }
});


// GET /api/booking/seats/:tripId - Get available seats for a trip
router.get('/seats/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { departureDate } = req.query;

    if (!departureDate) {
      return res.status(400).json({
        success: false,
        message: 'Departure date is required'
      });
    }

    const availableSeats = await BookingService.getAvailableSeats(tripId, departureDate);

    res.json({
      success: true,
      data: {
        availableSeats,
        totalSeats: availableSeats.length
      }
    });

  } catch (error) {
    console.error('Get available seats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available seats',
      error: error.message
    });
  }
});

// POST /api/booking - Create new booking
router.post('/', async (req, res) => {
  try {
    const bookingData = req.body;
    const userId = req.user._id;

    // Validate required fields
    const requiredFields = ['tripId', 'customer', 'journey', 'seats'];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }

    const booking = await BookingService.createBooking(bookingData, userId);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
});

// GET /api/booking/:id - Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await BookingService.getBookingById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has access to this booking
    if (req.user.role === 'passenger' && booking.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking',
      error: error.message
    });
  }
});

// PUT /api/booking/:id/confirm - Confirm booking (after payment)
router.put('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;

    const booking = await BookingService.confirmBooking(id, paymentData);

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking
    });

  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({
        success: false,
      message: 'Failed to confirm booking',
      error: error.message
    });
  }
});

// PUT /api/booking/:id/cancel - Cancel booking
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const cancelledBy = req.user.role;

    const booking = await BookingService.cancelBooking(id, cancelledBy, reason);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
});

// GET /api/booking/user/:userId - Get bookings by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 20, page = 1 } = req.query;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has access
    if (req.user.role === 'passenger' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await BookingService.getBookingsByUser(userId, {
      status,
      limit: parseInt(limit),
      page: parseInt(page)
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user bookings',
      error: error.message
    });
  }
});

// GET /api/booking/depot/:depotId - Get bookings by depot
router.get('/depot/:depotId', async (req, res) => {
  try {
    const { depotId } = req.params;
    const { 
      status, 
      startDate, 
      endDate, 
      limit = 50, 
      page = 1 
    } = req.query;

    // Check if user has access to this depot
    if (req.user.role === 'passenger') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role !== 'admin' && req.user.depotId && req.user.depotId.toString() !== depotId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this depot'
      });
    }

    const result = await BookingService.getBookingsByDepot(depotId, {
      status,
      startDate,
      endDate,
      limit: parseInt(limit),
      page: parseInt(page)
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get depot bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get depot bookings',
      error: error.message
    });
  }
});

// GET /api/booking/stats - Get booking statistics
router.get('/stats', async (req, res) => {
  try {
    const { depotId, startDate, endDate } = req.query;

    // Check if user has access
    if (req.user.role === 'passenger') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const stats = await BookingService.getBookingStats(depotId, startDate, endDate);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking statistics',
      error: error.message
    });
  }
});

// GET /api/booking/refund/:id - Calculate refund for booking
router.get('/refund/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has access
    if (req.user.role === 'passenger' && booking.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const refundInfo = booking.calculateRefund();

    res.json({
      success: true,
      data: refundInfo
    });

  } catch (error) {
    console.error('Calculate refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate refund',
      error: error.message
    });
  }
});

// POST /api/booking/check-in/:id - Check in passenger
router.post('/check-in/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { boardingPoint, seatAllocated } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed bookings can be checked in'
      });
    }

    // Update check-in information
    booking.checkIn = {
      checkedIn: true,
      checkedInAt: new Date(),
      checkedInBy: req.user._id,
      boardingPoint,
      seatAllocated
    };

    await booking.save();

    res.json({
      success: true,
      message: 'Passenger checked in successfully',
      data: booking
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in passenger',
      error: error.message
    });
  }
});

// GET /api/booking/search/:reference - Search booking by reference
router.get('/search/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    const booking = await Booking.findOne({
      $or: [
        { bookingReference: reference },
        { bookingId: reference }
      ]
    })
    .populate('tripId', 'tripNumber startTime endTime')
    .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
    .populate('busId', 'busNumber busType')
    .populate('depotId', 'depotName');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Search booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search booking',
      error: error.message
    });
  }
});

module.exports = router;