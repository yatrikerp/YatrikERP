const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');

// Get available seats for a trip
router.get('/trip/:tripId', auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { date } = req.query;

    if (!tripId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID and date are required'
      });
    }

    // Mock seat data - in real implementation, fetch from database
    const seats = generateSeatMap(tripId, date);

    res.json({
      success: true,
      tripId,
      date,
      totalSeats: 45,
      availableSeats: seats.filter(s => s.status === 'available').length,
      seats: seats
    });

  } catch (error) {
    console.error('Seat fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seat information'
    });
  }
});

// Check seat availability
router.post('/check-availability', auth, async (req, res) => {
  try {
    const { tripId, seatNumbers, date } = req.body;

    if (!tripId || !seatNumbers || !Array.isArray(seatNumbers) || !date) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID, seat numbers array, and date are required'
      });
    }

    // Check if seats are available
    const seats = generateSeatMap(tripId, date);
    const requestedSeats = seats.filter(seat => seatNumbers.includes(seat.seatNumber));
    
    const unavailableSeats = requestedSeats.filter(seat => seat.status !== 'available');
    
    if (unavailableSeats.length > 0) {
      return res.json({
        success: false,
        message: 'Some seats are not available',
        unavailableSeats: unavailableSeats.map(s => s.seatNumber)
      });
    }

    res.json({
      success: true,
      message: 'All requested seats are available',
      availableSeats: requestedSeats
    });

  } catch (error) {
    console.error('Seat availability check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check seat availability'
    });
  }
});

// Reserve seats temporarily
router.post('/reserve', auth, async (req, res) => {
  try {
    const { tripId, seatNumbers, date, passengerId } = req.body;

    if (!tripId || !seatNumbers || !Array.isArray(seatNumbers) || !date || !passengerId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID, seat numbers, date, and passenger ID are required'
      });
    }

    // In real implementation, this would:
    // 1. Check seat availability
    // 2. Create temporary reservation
    // 3. Set expiration time (e.g., 15 minutes)
    // 4. Update seat status to 'reserved'

    const reservationId = `RES_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    res.json({
      success: true,
      reservationId,
      expiresAt,
      message: 'Seats reserved successfully',
      reservedSeats: seatNumbers
    });

  } catch (error) {
    console.error('Seat reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reserve seats'
    });
  }
});

// Confirm seat booking
router.post('/confirm', auth, async (req, res) => {
  try {
    const { reservationId, tripId, seatNumbers, passengerDetails, paymentId } = req.body;

    if (!reservationId || !tripId || !seatNumbers || !passengerDetails || !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'All required fields are needed'
      });
    }

    // In real implementation, this would:
    // 1. Verify reservation is still valid
    // 2. Update seat status to 'booked'
    // 3. Create booking record
    // 4. Generate ticket
    // 5. Send confirmation

    const bookingId = `BK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      bookingId,
      message: 'Seat booking confirmed successfully',
      ticketDetails: {
        tripId,
        seatNumbers,
        passengerDetails,
        bookingId,
        status: 'confirmed'
      }
    });

  } catch (error) {
    console.error('Seat confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm seat booking'
    });
  }
});

// Cancel seat reservation
router.post('/cancel-reservation', auth, async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: 'Reservation ID is required'
      });
    }

    // In real implementation, this would:
    // 1. Find the reservation
    // 2. Update seat status back to 'available'
    // 3. Remove temporary reservation

    res.json({
      success: true,
      message: 'Seat reservation cancelled successfully'
    });

  } catch (error) {
    console.error('Reservation cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel reservation'
    });
  }
});

// Get seat layout for a bus type
router.get('/layout/:busType', auth, async (req, res) => {
  try {
    const { busType } = req.params;

    const layout = getBusLayout(busType);

    res.json({
      success: true,
      busType,
      layout
    });

  } catch (error) {
    console.error('Layout fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seat layout'
    });
  }
});

// Helper function to generate seat map
function generateSeatMap(tripId, date) {
  const seats = [];
  const totalSeats = 45;
  
  // Generate 45 seats (5 rows × 9 columns)
  for (let row = 1; row <= 5; row++) {
    for (let col = 1; col <= 9; col++) {
      const seatNumber = `${row}${col.toString().padStart(2, '0')}`;
      
      // Randomly assign some seats as booked/reserved for demo
      let status = 'available';
      if (Math.random() < 0.3) {
        status = Math.random() < 0.7 ? 'booked' : 'reserved';
      }
      
      seats.push({
        seatNumber,
        row,
        column: col,
        status,
        price: 500, // Base price
        features: getSeatFeatures(row, col)
      });
    }
  }
  
  return seats;
}

// Helper function to get seat features
function getSeatFeatures(row, col) {
  const features = [];
  
  // Window seats
  if (col === 1 || col === 9) {
    features.push('window');
  }
  
  // Aisle seats
  if (col === 4 || col === 6) {
    features.push('aisle');
  }
  
  // Front row (more legroom)
  if (row === 1) {
    features.push('extra_legroom');
  }
  
  // Back row (near washroom)
  if (row === 5) {
    features.push('near_washroom');
  }
  
  return features;
}

// Helper function to get bus layout
function getBusLayout(busType) {
  const layouts = {
    'ac_sleeper': {
      rows: 8,
      columns: 4,
      totalSeats: 32,
      seatType: 'sleeper',
      features: ['ac', 'sleeper', 'curtains']
    },
    'ac_seater': {
      rows: 12,
      columns: 4,
      totalSeats: 48,
      seatType: 'seater',
      features: ['ac', 'recliner', 'footrest']
    },
    'non_ac_seater': {
      rows: 15,
      columns: 3,
      totalSeats: 45,
      seatType: 'seater',
      features: ['fan', 'basic']
    }
  };
  
  return layouts[busType] || layouts['non_ac_seater'];
}

module.exports = router;
