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

// POST /api/booking - Create new booking - Auth required
router.post('/', auth, async (req, res) => {
  try {
    const bookingData = req.body;
    const userId = req.user._id;
    console.log('📝 Received booking data:', JSON.stringify(bookingData, null, 2));

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

    // Get trip details to extract proper references
    const trip = await Trip.findById(bookingData.tripId)
      .populate('routeId', '_id routeName routeNumber startingPoint endingPoint')
      .populate('busId', '_id busNumber busType')
      .populate('depotId', '_id depotName')
      .lean();
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Create a simple booking with all required fields
    const bookingId = `BK${Date.now().toString().slice(-8)}`;
    const bookingReference = `REF${Date.now().toString().slice(-8)}`;
    
    const booking = new Booking({
      ...bookingData,
      bookingId: bookingId,
      bookingReference: bookingReference,
      createdBy: userId, // Link booking to the authenticated user
      status: 'pending',
      paymentStatus: 'pending',
      tripId: bookingData.tripId,
      depotId: trip.depotId?._id || trip.depotId,
      busId: trip.busId?._id || trip.busId,
      routeId: trip.routeId?._id || trip.routeId,
      journey: {
        ...bookingData.journey,
        arrivalDate: bookingData.journey.departureDate, // Use same date
        duration: 240 // 4 hours in minutes
      },
      seats: bookingData.seats.map(seat => ({
        ...seat,
        passengerName: bookingData.customer.name,
        seatPosition: 'window', // Valid enum value
        seatType: 'seater'
      })),
      pricing: {
        baseFare: 200,
        seatFare: bookingData.seats.reduce((total, seat) => total + (seat.price || 0), 0),
        totalAmount: bookingData.seats.reduce((total, seat) => total + (seat.price || 0), 0) + 200
      },
      payment: {
        method: 'upi', // Valid enum value
        paymentStatus: 'pending'
      },
      createdAt: new Date()
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: booking.bookingId,
        _id: booking._id,
        status: booking.status,
        fare: booking.pricing?.totalAmount || 500
      }
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

// POST /api/booking/confirm - Confirm booking (after payment) - No auth required
router.post('/confirm', async (req, res) => {
  try {
    const { bookingId, paymentId, orderId, paymentStatus = 'completed' } = req.body;
    
    console.log('🔍 Booking confirmation request:', { bookingId, paymentId, orderId, paymentStatus });

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Find and update booking - try both ObjectId and string
    let booking = null;
    
    // First try to find by bookingId field (string)
    if (bookingId && typeof bookingId === 'string') {
      console.log('🔍 Searching by bookingId field:', bookingId);
      booking = await Booking.findOne({ bookingId: bookingId });
      console.log('🔍 Found by bookingId:', !!booking);
    }
    
    // If not found and it looks like an ObjectId, try by _id
    if (!booking && bookingId && bookingId.length === 24) {
      try {
        booking = await Booking.findById(bookingId);
      } catch (error) {
        // Ignore ObjectId casting errors
      }
    }
    
    // If still not found, try to find by any field that might match
    if (!booking) {
      const searchConditions = [
        { bookingId: bookingId },
        { bookingReference: bookingId }
      ];
      
      // Only add _id search if it looks like a valid ObjectId
      if (bookingId && bookingId.length === 24 && /^[0-9a-fA-F]{24}$/.test(bookingId)) {
        searchConditions.push({ _id: bookingId });
      }
      
      booking = await Booking.findOne({
        $or: searchConditions
      });
    }
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        searchedId: bookingId
      });
    }

    // Update booking status
    booking.status = 'confirmed';
    booking.paymentStatus = paymentStatus;
    if (paymentId) {
      booking.payment = {
        ...booking.payment,
        transactionId: paymentId,
        paymentStatus: 'completed',
        paidAt: new Date()
      };
    }
    if (orderId) booking.orderId = orderId;
    booking.confirmedAt = new Date();

    await booking.save();

    // Generate PNR
    const pnr = `PNR${Date.now().toString().slice(-8)}`;

    // Generate QR code data for the ticket
    const qrData = {
      pnr: pnr,
      bookingId: booking.bookingId,
      passengerName: booking.customer.name,
      from: booking.journey.from,
      to: booking.journey.to,
      departureDate: booking.journey.departureDate,
      departureTime: booking.journey.departureTime,
      seatNumbers: booking.seats.map(seat => seat.seatNumber).join(', '),
      amount: booking.pricing.totalAmount
    };

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: {
        booking,
        ticket: {
          pnr,
          bookingId: booking.bookingId,
          status: 'confirmed',
          qrData: JSON.stringify(qrData),
          passengerName: booking.customer.name,
          from: booking.journey.from,
          to: booking.journey.to,
          departureDate: booking.journey.departureDate,
          departureTime: booking.journey.departureTime,
          seatNumbers: booking.seats.map(seat => seat.seatNumber).join(', '),
          amount: booking.pricing.totalAmount
        }
      }
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

// Apply auth to all routes
router.use(bookingAuth);

// Test endpoint to create sample bookings (for development only)
router.post('/create-sample', async (req, res) => {
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

// POST /api/booking/search - Search trips for booking
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


// PUT /api/booking/:id/confirm - Confirm booking (after payment) - legacy endpoint
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
    
    // Try to find booking by different ID types
    let booking = null;
    if (id && typeof id === 'string') {
      booking = await Booking.findOne({ bookingId: id });
    }
    if (!booking && id && id.length === 24) {
      try {
        booking = await Booking.findById(id);
      } catch (error) {
        // Ignore ObjectId casting errors
      }
    }
    if (!booking) {
      const searchConditions = [
        { bookingId: id },
        { bookingReference: id }
      ];
      
      // Only add _id search if it looks like a valid ObjectId
      if (id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
        searchConditions.push({ _id: id });
      }
      
      booking = await Booking.findOne({
        $or: searchConditions
      });
    }

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

// GET /api/booking/test - Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Booking routes are working!' });
});

// POST /api/booking/create-sample - Create sample booking for testing
router.post('/create-sample', async (req, res) => {
  try {
    const sampleBooking = {
      bookingId: 'PNR69154187',
      customer: {
        name: 'Guest Passenger',
        email: 'guest@example.com',
        phone: '+91-9876543210',
        age: 30,
        gender: 'male'
      },
      journey: {
        from: 'Kochi',
        to: 'Thiruvananthapuram',
        departureDate: new Date('2025-09-14'),
        departureTime: '08:00',
        arrivalTime: '14:00'
      },
      seats: [
        { seatNumber: 'U1', seatType: 'seater', price: 225 },
        { seatNumber: 'U2', seatType: 'seater', price: 225 }
      ],
      pricing: {
        baseFare: 400,
        seatCharges: 50,
        total: 450
      },
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'upi',
      createdAt: new Date()
    };

    // Check if booking already exists
    const existingBooking = await Booking.findOne({ bookingId: sampleBooking.bookingId });
    if (existingBooking) {
      return res.json({
        success: true,
        message: 'Sample booking already exists',
        data: existingBooking
      });
    }

    const booking = new Booking(sampleBooking);
    await booking.save();

    res.json({
      success: true,
      message: 'Sample booking created successfully',
      data: booking
    });

  } catch (error) {
    console.error('Create sample booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sample booking',
      error: error.message
    });
  }
});

// GET /api/booking/pnr/:pnr - Get booking by PNR (temporarily without auth for debugging)
router.get('/pnr/:pnr', async (req, res) => {
  try {
    const { pnr } = req.params;
    
    if (!pnr) {
      return res.status(400).json({
        success: false,
        message: 'PNR is required'
      });
    }

    // Search for booking by PNR
    const booking = await Booking.findOne({ bookingId: pnr })
      .populate('tripId', 'serviceDate startTime endTime fare capacity')
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('busId', 'busNumber busType')
      .populate('depotId', 'depotName')
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has access to this booking (temporarily disabled for debugging)
    // if (req.user.role === 'passenger' && booking.createdBy.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Access denied'
    //   });
    // }

    // Debug logging
    console.log('🔍 Debug - Booking found:', booking.bookingId);
    console.log('🔍 Debug - Customer data:', JSON.stringify(booking.customer, null, 2));

    // Format the response data
    const ticketData = {
      pnr: booking.bookingId,
      bookingId: booking.bookingId,
      status: booking.status,
      customer: booking.customer,
      journey: {
        from: booking.journey?.from || booking.routeId?.startingPoint?.city || 'Origin',
        to: booking.journey?.to || booking.routeId?.endingPoint?.city || 'Destination',
        departureDate: booking.journey?.departureDate || booking.tripId?.serviceDate,
        departureTime: booking.journey?.departureTime || booking.tripId?.startTime,
        arrivalTime: booking.journey?.arrivalTime || booking.tripId?.endTime,
        boardingPoint: booking.journey?.boardingPoint || 'Central Bus Stand',
        droppingPoint: booking.journey?.droppingPoint || 'Central Bus Stand'
      },
      seats: booking.seats,
      bus: {
        busNumber: booking.busId?.busNumber || 'N/A',
        busType: booking.busId?.busType || 'Standard'
      },
      pricing: booking.pricing,
      payment: booking.payment,
      createdAt: booking.createdAt
    };

    res.json({
      success: true,
      data: ticketData
    });

  } catch (error) {
    console.error('Get booking by PNR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      error: error.message
    });
  }
});

// POST /api/booking/check-in/:id - Check in passenger
router.post('/check-in/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { boardingPoint, seatAllocated } = req.body;

    // Try to find booking by different ID types
    let booking = null;
    if (id && typeof id === 'string') {
      booking = await Booking.findOne({ bookingId: id });
    }
    if (!booking && id && id.length === 24) {
      try {
        booking = await Booking.findById(id);
      } catch (error) {
        // Ignore ObjectId casting errors
      }
    }
    if (!booking) {
      const searchConditions = [
        { bookingId: id },
        { bookingReference: id }
      ];
      
      // Only add _id search if it looks like a valid ObjectId
      if (id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
        searchConditions.push({ _id: id });
      }
      
      booking = await Booking.findOne({
        $or: searchConditions
      });
    }

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