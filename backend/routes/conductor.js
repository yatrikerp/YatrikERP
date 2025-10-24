const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const Duty = require('../models/Duty');
const { verifySignature } = require('../utils/qrSignature');

/**
 * @route   GET /api/conductor/duties/current
 * @desc    Get conductor's current active duty
 * @access  Private (Conductor only)
 */
router.get('/duties/current', auth, requireRole(['conductor', 'admin']), async (req, res) => {
  try {
    const conductorId = req.user._id;
    
    // Find current active duty for this conductor
    const duty = await Duty.findOne({
      conductorId,
      status: { $in: ['assigned', 'started', 'in-progress', 'on-break'] }
    })
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('busId', 'busNumber registrationNumber busType')
      .populate('tripId', 'tripCode serviceDate startTime endTime')
      .populate('depotId', 'depotName depotCode')
      .populate('driverId', 'name email phone')
      .sort({ scheduledStartTime: -1 })
      .lean();
    
    if (!duty) {
      return res.json({
        success: true,
        message: 'No active duty assigned',
        data: null
      });
    }
    
    res.json({
      success: true,
      data: duty
    });
    
  } catch (error) {
    console.error('Get current duty error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching current duty', 
      error: error.message 
    });
  }
});

// Scan and validate ticket QR code
router.post('/scan-ticket', auth, requireRole(['conductor', 'admin', 'depot_manager']), async (req, res) => {
  try {
    const { qrPayload } = req.body;
    
    if (!qrPayload) {
      return res.status(400).json({ 
        success: false, 
        message: 'QR code payload is required' 
      });
    }
    
    // Parse QR payload
    let ticketData;
    try {
      ticketData = JSON.parse(qrPayload);
    } catch (parseError) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid QR code format' 
      });
    }
    
    // Verify signature
    const isValidSignature = verifySignature(ticketData);
    if (!isValidSignature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid QR code signature - possible tampering detected' 
      });
    }
    
    // Check expiration
    if (ticketData.exp && Date.now() > ticketData.exp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ticket has expired' 
      });
    }
    
    // Find ticket in database
    const ticket = await Ticket.findOne({ pnr: ticketData.pnr })
      .populate('bookingId');
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found in system' 
      });
    }
    
    // Check ticket state
    if (ticket.state === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'This ticket has been cancelled' 
      });
    }
    
    if (ticket.state === 'expired') {
      return res.status(400).json({ 
        success: false, 
        message: 'This ticket has expired' 
      });
    }
    
    if (ticket.state === 'validated') {
      return res.json({ 
        success: true,
        alreadyValidated: true,
        message: 'Ticket already validated',
        data: {
          ticket: {
            pnr: ticket.pnr,
            ticketNumber: ticket.ticketNumber,
            passengerName: ticket.passengerName,
            seatNumber: ticket.seatNumber,
            boardingStop: ticket.boardingStop,
            destinationStop: ticket.destinationStop,
            fareAmount: ticket.fareAmount,
            state: ticket.state,
            validatedAt: ticket.scannedAt,
            validatedBy: ticket.scannedBy
          }
        }
      });
    }
    
    // Get trip and bus information
    const trip = await Trip.findById(ticket.tripDetails.tripId)
      .populate('busId', 'busNumber busType')
      .populate('driverId', 'name email phone')
      .populate('conductorId', 'name email phone');
    
    // Validate ticket and mark as scanned
    ticket.state = 'validated';
    ticket.scannedAt = new Date();
    ticket.scannedBy = req.user._id;
    
    // Add to validation history
    ticket.validationHistory.push({
      conductorId: req.user._id,
      validatedAt: new Date(),
      location: {
        stopName: req.body.currentStop || 'Unknown'
      },
      deviceInfo: {
        deviceId: req.body.deviceId || 'Unknown',
        appVersion: req.body.appVersion || '1.0.0'
      }
    });
    
    await ticket.save();
    
    res.json({
      success: true,
      message: 'Ticket validated successfully',
      data: {
        ticket: {
          pnr: ticket.pnr,
          ticketNumber: ticket.ticketNumber,
          passengerName: ticket.passengerName,
          seatNumber: ticket.seatNumber,
          boardingStop: ticket.boardingStop,
          destinationStop: ticket.destinationStop,
          fareAmount: ticket.fareAmount,
          state: ticket.state,
          validatedAt: ticket.scannedAt
        },
        trip: trip ? {
          tripId: trip._id,
          serviceDate: trip.serviceDate,
          startTime: trip.startTime,
          endTime: trip.endTime,
          bus: trip.busId ? {
            busNumber: trip.busId.busNumber,
            busType: trip.busId.busType
          } : null,
          driver: trip.driverId ? {
            name: trip.driverId.name,
            phone: trip.driverId.phone
          } : null,
          conductor: trip.conductorId ? {
            name: trip.conductorId.name,
            phone: trip.conductorId.phone
          } : null
        } : null
      }
    });
    
  } catch (error) {
    console.error('Ticket scan error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error scanning ticket', 
      error: error.message 
    });
  }
});

// Get conductor's trip information
router.get('/my-trip', auth, requireRole(['conductor']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find today's trip assigned to this conductor
    const trip = await Trip.findOne({
      conductorId: req.user._id,
      serviceDate: {
        $gte: today,
        $lt: tomorrow
      }
    })
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('busId', 'busNumber busType capacity')
      .populate('driverId', 'name email phone')
      .populate('depotId', 'depotName');
    
    if (!trip) {
      return res.json({
        success: true,
        message: 'No trip assigned for today',
        data: null
      });
    }
    
    // Get bookings for this trip
    const bookings = await Booking.find({
      tripId: trip._id,
      status: { $in: ['paid', 'confirmed'] }
    }).select('customer seats pricing');
    
    // Get validated tickets for this trip
    const validatedTickets = await Ticket.find({
      'tripDetails.tripId': trip._id,
      state: 'validated'
    }).select('pnr passengerName seatNumber scannedAt');
    
    res.json({
      success: true,
      data: {
        trip: {
          tripId: trip._id,
          serviceDate: trip.serviceDate,
          startTime: trip.startTime,
          endTime: trip.endTime,
          status: trip.status,
          route: trip.routeId,
          bus: trip.busId,
          driver: trip.driverId,
          depot: trip.depotId,
          capacity: trip.capacity,
          bookedSeats: trip.bookedSeats,
          availableSeats: trip.availableSeats
        },
        bookings: bookings.length,
        validatedTickets: validatedTickets.length,
        tickets: validatedTickets
      }
    });
    
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching trip information', 
      error: error.message 
    });
  }
});

// Get all tickets for conductor's current trip
router.get('/trip-tickets/:tripId', auth, requireRole(['conductor', 'admin', 'depot_manager']), async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Verify conductor is assigned to this trip (unless admin)
    if (req.user.role === 'conductor') {
      const trip = await Trip.findById(tripId);
      if (!trip || trip.conductorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned to this trip'
        });
      }
    }
    
    // Get all tickets for this trip
    const tickets = await Ticket.find({
      'tripDetails.tripId': tripId
    })
      .populate('bookingId', 'customer')
      .sort({ createdAt: -1 });
    
    const summary = {
      total: tickets.length,
      validated: tickets.filter(t => t.state === 'validated').length,
      active: tickets.filter(t => t.state === 'active').length,
      cancelled: tickets.filter(t => t.state === 'cancelled').length,
      expired: tickets.filter(t => t.state === 'expired').length
    };
    
    res.json({
      success: true,
      data: {
        tickets,
        summary
      }
    });
    
  } catch (error) {
    console.error('Get trip tickets error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tickets', 
      error: error.message 
    });
  }
});

module.exports = router;
