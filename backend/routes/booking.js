const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const FarePolicy = require('../models/FarePolicy');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');

function generatePNR() {
	const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
	return 'YTK' + rnd;
}

// POST /api/booking {tripId, stopId, seatNo?}
router.post('/', auth(['PASSENGER','ADMIN']), async (req, res) => {
  try {
    const { tripId, stopId, seatNo } = req.body || {};
    const trip = await Trip.findById(tripId).lean();
    if (!trip) return res.status(404).json({ ok: false, code: 'TRIP_NOT_FOUND', message: 'Trip not found' });
    const route = await Route.findById(trip.routeId).lean();
    const policy = await FarePolicy.findOne({ active: true }).lean();
    const fare = Math.round((policy?.baseFare ?? 50) + (route?.distanceKm ?? 100) * (policy?.perKm ?? 2));
    const booking = await Booking.create({ passengerId: req.user._id, tripId, boardingStopId: stopId, seatNo, fareAmount: fare, status: 'initiated' });
    res.json({ ok: true, data: { bookingId: booking._id, fare } });
  } catch (err) {
    res.status(500).json({ ok: false, code: 'BOOKING_ERROR', message: 'Failed to create booking' });
  }
});

// POST /api/booking/confirm {bookingId}
router.post('/confirm', auth(['PASSENGER','ADMIN']), async (req, res) => {
  try {
    const { bookingId } = req.body || {};
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ ok: false, code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    booking.status = 'issued';
    await booking.save();
    const pnr = generatePNR();
    const expiresAt = new Date(new Date().getTime() + 2 * 60 * 60 * 1000);
    const ticket = await Ticket.create({ bookingId: booking._id, pnr, qrPayload: `GoBus|PNR:${pnr}`, expiresAt, state: 'active' });
    res.json({ ok: true, data: { ticket } });
  } catch (err) {
    res.status(500).json({ ok: false, code: 'CONFIRM_ERROR', message: 'Failed to confirm booking' });
  }
});

// GET /api/tickets/active
router.get('/tickets/active', auth(['PASSENGER','ADMIN']), async (req, res) => {
  try {
    const bookings = await Booking.find({ passengerId: req.user._id }).lean();
    const ids = bookings.map(b => b._id);
    const tickets = await Ticket.find({ bookingId: { $in: ids }, state: { $in: ['issued','active'] } }).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, data: { tickets } });
  } catch (err) {
    res.status(500).json({ ok: false, code: 'TICKETS_ERROR', message: 'Failed to fetch tickets' });
  }
});

module.exports = router;


