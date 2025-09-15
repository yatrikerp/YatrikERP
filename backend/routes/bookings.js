const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const Trip = require('../models/Trip');

function generatePNR() {
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return 'YTK' + rnd;
}

// POST /api/bookings/create - Phase-0 alias to create a booking (pending payment)
router.post('/create', auth, async (req, res) => {
  try {
    const { tripId, seatNo, boardingStopId, destinationStopId, passengerDetails } = req.body || {};
    if (!tripId || !seatNo || !boardingStopId || !destinationStopId) {
      return res.status(400).json({ success: false, message: 'tripId, seatNo, boardingStopId, destinationStopId are required' });
    }

    const trip = await Trip.findById(tripId).populate('routeId').lean();
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Check seat availability (simple)
    const seatTaken = await Booking.findOne({ tripId, seatNo, status: { $in: ['confirmed', 'issued', 'paid'] } });
    if (seatTaken) {
      return res.status(400).json({ success: false, message: 'Seat already booked' });
    }

    const distanceKm = (trip.routeId && trip.routeId.totalDistance) || 100;
    const fare = Math.round(100 + distanceKm * 2);

    const booking = await Booking.create({
      createdBy: req.user._id,
      tripId,
      seatNo,
      fareAmount: fare,
      concessionAmount: 0,
      totalAmount: fare,
      status: 'pending_payment',
      paymentStatus: 'pending',
      paymentMethod: 'razorpay',
      boardingStopId,
      destinationStopId,
      passengerDetails: passengerDetails || {},
      bookingTime: new Date(),
      expiryTime: new Date(Date.now() + 15 * 60 * 1000)
    });

    return res.json({ success: true, data: { bookingId: booking._id, amount: booking.totalAmount, status: booking.status } });
  } catch (err) {
    console.error('bookings/create error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

// GET /api/bookings/:userId - Phase-0 wallet/history
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these bookings' });
    }

    const bookings = await Booking.find({ createdBy: userId }).sort({ createdAt: -1 }).lean();
    const bookingIds = bookings.map(b => b._id);
    const tickets = await Ticket.find({ bookingId: { $in: bookingIds } }).sort({ createdAt: -1 }).lean();

    return res.json({ success: true, data: { bookings, tickets } });
  } catch (err) {
    console.error('bookings/:userId error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

module.exports = router;
