const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');

/**
 * GET /api/booking/pnr/:pnr
 * Public endpoint to fetch booking details by PNR for ticket display
 * Includes conductor and driver details
 */
router.get('/pnr/:pnr', async (req, res) => {
  try {
    const { pnr } = req.params;
    
    if (!pnr) {
      return res.status(400).json({
        success: false,
        message: 'PNR is required'
      });
    }

    console.log(`🔍 Fetching booking for PNR: ${pnr}`);

    // Search for booking by PNR with populated trip details including conductor and driver
    const booking = await Booking.findOne({ bookingId: pnr })
      .populate({
        path: 'tripId',
        select: 'serviceDate startTime endTime fare capacity driverId conductorId',
        populate: [
          { path: 'driverId', select: 'name email phone' },
          { path: 'conductorId', select: 'name email phone' }
        ]
      })
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('busId', 'busNumber busType')
      .populate('depotId', 'depotName')
      .lean();

    if (!booking) {
      console.log(`❌ Booking not found for PNR: ${pnr}`);
      
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        suggestions: [
          'Check if the PNR is correct',
          'PNR format should match your booking confirmation',
          'Contact support if you believe this is an error'
        ]
      });
    }

    console.log(`✅ Found booking for PNR: ${pnr}`);
    console.log(`   Customer: ${booking.customer?.name}`);
    console.log(`   Route: ${booking.journey?.from} → ${booking.journey?.to}`);
    console.log(`   Conductor: ${booking.tripId?.conductorId?.name || 'Not assigned'}`);
    console.log(`   Driver: ${booking.tripId?.driverId?.name || 'Not assigned'}`);

    // Format the response data with complete details including conductor and driver info
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
        arrivalDate: booking.journey?.arrivalDate,
        duration: booking.journey?.duration,
        boardingPoint: booking.journey?.boardingPoint || 'Central Bus Stand',
        droppingPoint: booking.journey?.droppingPoint || 'Central Bus Stand'
      },
      seats: booking.seats,
      bus: {
        busNumber: booking.busId?.busNumber || 'N/A',
        busType: booking.busId?.busType || 'Standard'
      },
      trip: booking.tripId,
      route: booking.routeId,
      depot: booking.depotId,
      pricing: booking.pricing,
      payment: booking.payment,
      // Add conductor and driver details
      conductor: booking.tripId?.conductorId ? {
        name: booking.tripId.conductorId.name,
        email: booking.tripId.conductorId.email,
        phone: booking.tripId.conductorId.phone
      } : null,
      driver: booking.tripId?.driverId ? {
        name: booking.tripId.driverId.name,
        email: booking.tripId.driverId.email,
        phone: booking.tripId.driverId.phone
      } : null,
      createdAt: booking.createdAt
    };

    res.json({
      success: true,
      data: ticketData
    });

  } catch (error) {
    console.error('❌ Get booking by PNR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
