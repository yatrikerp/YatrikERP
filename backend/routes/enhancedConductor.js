const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const Ticket = require('../models/Ticket');
const Trip = require('../models/Trip');
const User = require('../models/User');
const TicketQRManager = require('../utils/ticketQRManager');

// Get conductor's assigned trips
router.get('/trips', auth, requireRole(['conductor', 'admin', 'depot_manager']), async (req, res) => {
  try {
    const { date } = req.query;
    const query = { conductorId: req.user._id };
    
    if (date) {
      query.serviceDate = new Date(date);
    }
    
    const trips = await Trip.find(query)
      .populate('busId', 'busNumber busType')
      .populate('driverId', 'name phone')
      .populate('routeId', 'routeName routeNumber')
      .populate('depotId', 'depotName')
      .sort({ serviceDate: 1, startTime: 1 });
    
    res.json({
      success: true,
      data: trips.map(trip => ({
        id: trip._id,
        serviceDate: trip.serviceDate,
        startTime: trip.startTime,
        endTime: trip.endTime,
        status: trip.status,
        bus: trip.busId ? {
          busNumber: trip.busId.busNumber,
          busType: trip.busId.busType
        } : null,
        driver: trip.driverId ? {
          name: trip.driverId.name,
          phone: trip.driverId.phone
        } : null,
        route: trip.routeId ? {
          name: trip.routeId.routeName,
          number: trip.routeId.routeNumber
        } : null,
        depot: trip.depotId ? {
          name: trip.depotId.depotName
        } : null
      }))
    });
  } catch (error) {
    console.error('Get conductor trips error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching trips', 
      error: error.message 
    });
  }
});

// Enhanced scan and validate ticket QR code
router.post('/scan-ticket', auth, requireRole(['conductor', 'admin', 'depot_manager']), async (req, res) => {
  try {
    const { qrPayload, currentStop, deviceId, appVersion, latitude, longitude } = req.body;
    
    if (!qrPayload) {
      return res.status(400).json({ 
        success: false, 
        message: 'QR code payload is required' 
      });
    }
    
    // Use TicketQRManager for validation
    const validation = TicketQRManager.validateQRCode(qrPayload);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.error 
      });
    }
    
    const ticketData = validation.data;
    
    // Find ticket in database
    const ticket = await Ticket.findOne({ pnr: ticketData.pnr })
      .populate('bookingId')
      .populate('scannedBy', 'name email');
    
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
            validatedBy: ticket.scannedBy?.name || 'Unknown'
          }
        }
      });
    }
    
    // Get trip and bus information
    const trip = await Trip.findById(ticket.tripDetails.tripId)
      .populate('busId', 'busNumber busType')
      .populate('driverId', 'name email phone')
      .populate('conductorId', 'name email phone')
      .populate('routeId', 'routeName routeNumber');
    
    if (!trip) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trip not found' 
      });
    }
    
    // Validate conductor is assigned to this trip
    if (trip.conductorId && trip.conductorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to validate tickets for this trip' 
      });
    }
    
    // Check if ticket is for the correct trip
    if (trip._id.toString() !== ticket.tripDetails.tripId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ticket is not valid for this trip' 
      });
    }
    
    // Validate ticket and mark as scanned
    ticket.state = 'validated';
    ticket.scannedAt = new Date();
    ticket.scannedBy = req.user._id;
    ticket.scannedLocation = currentStop || 'Unknown';
    
    // Add to validation history
    ticket.validationHistory.push({
      conductorId: req.user._id,
      validatedAt: new Date(),
      location: {
        stopName: currentStop || 'Unknown',
        latitude: latitude || null,
        longitude: longitude || null
      },
      deviceInfo: {
        deviceId: deviceId || 'Unknown',
        appVersion: appVersion || '1.0.0'
      }
    });
    
    await ticket.save();
    
    // Get conductor info
    const conductor = await User.findById(req.user._id).select('name email phone');
    
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
          validatedAt: ticket.scannedAt,
          validatedBy: conductor?.name || 'Unknown'
        },
        trip: {
          tripId: trip._id,
          serviceDate: trip.serviceDate,
          startTime: trip.startTime,
          endTime: trip.endTime,
          bus: trip.busId ? {
            busNumber: trip.busId.busNumber,
            busType: trip.busId.busType
          } : null,
          route: trip.routeId ? {
            name: trip.routeId.routeName,
            number: trip.routeId.routeNumber
          } : null,
          driver: trip.driverId ? {
            name: trip.driverId.name,
            phone: trip.driverId.phone
          } : null,
          conductor: trip.conductorId ? {
            name: trip.conductorId.name,
            phone: trip.conductorId.phone
          } : null
        },
        validation: {
          location: currentStop || 'Unknown',
          timestamp: new Date().toISOString(),
          conductor: conductor?.name || 'Unknown'
        }
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

// Get conductor's trip passengers (for boarding management)
router.get('/trip/:tripId/passengers', auth, requireRole(['conductor', 'admin', 'depot_manager']), async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Verify conductor is assigned to this trip
    const trip = await Trip.findById(tripId).populate('conductorId');
    if (!trip) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trip not found' 
      });
    }
    
    if (trip.conductorId && trip.conductorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to view passengers for this trip' 
      });
    }
    
    // Get all tickets for this trip
    const tickets = await Ticket.find({ 
      'tripDetails.tripId': tripId,
      state: { $in: ['active', 'validated'] }
    })
    .populate('bookingId', 'customer journey')
    .sort({ seatNumber: 1 });
    
    const passengers = tickets.map(ticket => ({
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
    }));
    
    res.json({
      success: true,
      data: {
        trip: {
          id: trip._id,
          serviceDate: trip.serviceDate,
          startTime: trip.startTime,
          endTime: trip.endTime
        },
        passengers,
        summary: {
          totalPassengers: passengers.length,
          validatedPassengers: passengers.filter(p => p.state === 'validated').length,
          pendingPassengers: passengers.filter(p => p.state === 'active').length
        }
      }
    });
    
  } catch (error) {
    console.error('Get trip passengers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching trip passengers', 
      error: error.message 
    });
  }
});

// Get conductor dashboard data
router.get('/dashboard', auth, requireRole(['conductor', 'admin', 'depot_manager']), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's trips
    const todaysTrips = await Trip.find({
      conductorId: req.user._id,
      serviceDate: today
    })
    .populate('busId', 'busNumber busType')
    .populate('routeId', 'routeName routeNumber')
    .sort({ startTime: 1 });
    
    // Get validation statistics
    const validationStats = await Ticket.aggregate([
      {
        $match: {
          'validationHistory.conductorId': req.user._id,
          'validationHistory.validatedAt': {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalValidated: { $sum: 1 },
          totalRevenue: { $sum: '$fareAmount' }
        }
      }
    ]);
    
    const stats = validationStats[0] || { totalValidated: 0, totalRevenue: 0 };
    
    res.json({
      success: true,
      data: {
        conductor: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone
        },
        todaysTrips: todaysTrips.map(trip => ({
          id: trip._id,
          startTime: trip.startTime,
          endTime: trip.endTime,
          status: trip.status,
          bus: trip.busId ? {
            busNumber: trip.busId.busNumber,
            busType: trip.busId.busType
          } : null,
          route: trip.routeId ? {
            name: trip.routeId.routeName,
            number: trip.routeId.routeNumber
          } : null
        })),
        stats: {
          ticketsValidatedToday: stats.totalValidated,
          revenueToday: stats.totalRevenue
        }
      }
    });
    
  } catch (error) {
    console.error('Get conductor dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard data', 
      error: error.message 
    });
  }
});

module.exports = router;



