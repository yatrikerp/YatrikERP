const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

// Middleware to ensure user is a support agent
const requireSupport = (req, res, next) => {
  if (req.user.role !== 'support_agent') {
    return res.status(403).json({ message: 'Access denied. Support agent role required.' });
  }
  next();
};

// Lookup booking by PNR
router.get('/booking/pnr/:pnr', auth, requireSupport, async (req, res) => {
  try {
    const { pnr } = req.params;
    
    const ticket = await Ticket.findOne({ pnr })
      .populate('bookingId')
      .populate('tripDetails.tripId', 'routeId departureTime arrivalTime')
      .populate('tripDetails.routeId', 'name origin destination');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Booking not found with this PNR' });
    }
    
    res.json({
      success: true,
      data: {
        pnr: ticket.pnr,
        ticketNumber: ticket.ticketNumber,
        passengerName: ticket.passengerName,
        seatNumber: ticket.seatNumber,
        boardingStop: ticket.boardingStop,
        destinationStop: ticket.destinationStop,
        fareAmount: ticket.fareAmount,
        status: ticket.state,
        bookingStatus: ticket.bookingId.status,
        tripDetails: ticket.tripDetails,
        validationHistory: ticket.validationHistory,
        createdAt: ticket.createdAt,
        expiresAt: ticket.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error looking up booking', error: error.message });
  }
});

// Lookup booking by phone number
router.get('/booking/phone/:phone', auth, requireSupport, async (req, res) => {
  try {
    const { phone } = req.params;
    
    const bookings = await Booking.find({
      'passengerDetails.phone': phone
    })
    .populate('tripId', 'routeId departureTime arrivalTime')
    .populate('routeId', 'name origin destination')
    .sort({ createdAt: -1 })
    .limit(10);
    
    if (bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found with this phone number' });
    }
    
    res.json({
      success: true,
      data: bookings.map(booking => ({
        bookingId: booking._id,
        passengerName: booking.passengerDetails.name,
        phone: booking.passengerDetails.phone,
        seatNumber: booking.seatNo,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        fareAmount: booking.totalAmount,
        tripDetails: booking.tripId,
        routeDetails: booking.routeId,
        createdAt: booking.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error looking up booking', error: error.message });
  }
});

// Lookup booking by email
router.get('/booking/email/:email', auth, requireSupport, async (req, res) => {
  try {
    const { email } = req.params;
    
    const bookings = await Booking.find({
      'passengerDetails.email': email
    })
    .populate('tripId', 'routeId departureTime arrivalTime')
    .populate('routeId', 'name origin destination')
    .sort({ createdAt: -1 })
    .limit(10);
    
    if (bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found with this email' });
    }
    
    res.json({
      success: true,
      data: bookings.map(booking => ({
        bookingId: booking._id,
        passengerName: booking.passengerDetails.name,
        email: booking.passengerDetails.email,
        seatNumber: booking.seatNo,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        fareAmount: booking.totalAmount,
        tripDetails: booking.tripId,
        routeDetails: booking.routeId,
        createdAt: booking.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error looking up booking', error: error.message });
  }
});

// Initiate refund for a booking
router.post('/refund/initiate', auth, requireSupport, async (req, res) => {
  try {
    const { bookingId, reason, refundAmount, notes } = req.body;
    
    if (!bookingId || !reason) {
      return res.status(400).json({ message: 'Booking ID and reason are required' });
    }
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.status !== 'paid') {
      return res.status(400).json({ message: 'Only paid bookings can be refunded' });
    }
    
    const refundAmountToProcess = refundAmount || booking.totalAmount;
    
    // Create refund transaction
    const refundTransaction = await Transaction.create({
      userId: booking.passengerId,
      type: 'refund',
      amount: refundAmountToProcess,
      currency: 'INR',
      description: `Refund initiated by support: ${reason}`,
      reference: `SUPPORT_REFUND_${Date.now()}`,
      status: 'pending',
      paymentMethod: 'support',
      metadata: {
        bookingId: booking._id,
        tripId: booking.tripId,
        seatNumber: booking.seatNo
      },
      balanceAfter: 0, // Will be updated when processed
      notes: notes
    });
    
    // Update booking status
    booking.status = 'refunded';
    booking.refundAmount = refundAmountToProcess;
    booking.refundStatus = 'pending';
    booking.cancellationReason = `Refund initiated by support: ${reason}`;
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
    await booking.save();
    
    // Update ticket status
    await Ticket.findOneAndUpdate(
      { bookingId: booking._id },
      { 
        state: 'cancelled',
        cancelledBy: req.user._id,
        cancelledAt: new Date(),
        cancellationReason: `Refund initiated by support: ${reason}`
      }
    );
    
    // Log audit
    await AuditLog.create({
      userId: req.user._id,
      action: 'refund_initiated',
      resource: 'booking',
      resourceId: booking._id,
      details: { 
        reason: reason,
        amount: refundAmountToProcess,
        refundTransactionId: refundTransaction._id,
        notes: notes
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Refund initiated successfully',
      data: {
        refundTransactionId: refundTransaction._id,
        amount: refundAmountToProcess,
        status: 'pending_processing'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error initiating refund', error: error.message });
  }
});

// Get refund status
router.get('/refund/status/:refundId', auth, requireSupport, async (req, res) => {
  try {
    const { refundId } = req.params;
    
    const refundTransaction = await Transaction.findById(refundId);
    if (!refundTransaction) {
      return res.status(404).json({ message: 'Refund transaction not found' });
    }
    
    res.json({
      success: true,
      data: {
        refundId: refundTransaction._id,
        amount: refundTransaction.amount,
        status: refundTransaction.status,
        reason: refundTransaction.description,
        createdAt: refundTransaction.createdAt,
        processedAt: refundTransaction.processedAt,
        notes: refundTransaction.notes
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching refund status', error: error.message });
  }
});

// Get support dashboard statistics
router.get('/dashboard/stats', auth, requireSupport, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Today's statistics
    const todayBookings = await Booking.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    const todayRefunds = await Transaction.countDocuments({
      type: 'refund',
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    const todayRevenue = await Transaction.aggregate([
      {
        $match: {
          type: 'payment',
          status: 'completed',
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // Pending refunds
    const pendingRefunds = await Transaction.countDocuments({
      type: 'refund',
      status: 'pending'
    });
    
    // Recent issues
    const recentIssues = await AuditLog.find({
      action: { $in: ['issue_reported', 'refund_initiated'] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .limit(10);
    
    res.json({
      success: true,
      data: {
        today: {
          bookings: todayBookings,
          refunds: todayRefunds,
          revenue: todayRevenue[0]?.total || 0
        },
        pendingRefunds,
        recentIssues: recentIssues.map(issue => ({
          id: issue._id,
          action: issue.action,
          userId: issue.userId?.name || 'Unknown',
          details: issue.details,
          createdAt: issue.createdAt,
          severity: issue.severity
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard statistics', error: error.message });
  }
});

// Search bookings with filters
router.get('/bookings/search', auth, requireSupport, async (req, res) => {
  try {
    const { 
      query, 
      status, 
      paymentStatus, 
      startDate, 
      endDate,
      page = 1,
      limit = 20
    } = req.query;
    
    const searchQuery = {};
    
    // Text search
    if (query) {
      searchQuery.$or = [
        { 'passengerDetails.name': { $regex: query, $options: 'i' } },
        { 'passengerDetails.phone': { $regex: query, $options: 'i' } },
        { 'passengerDetails.email': { $regex: query, $options: 'i' } }
      ];
    }
    
    // Status filters
    if (status) {
      searchQuery.status = status;
    }
    
    if (paymentStatus) {
      searchQuery.paymentStatus = paymentStatus;
    }
    
    // Date range
    if (startDate && endDate) {
      searchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const bookings = await Booking.find(searchQuery)
      .populate('tripId', 'routeId departureTime arrivalTime')
      .populate('routeId', 'name origin destination')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Booking.countDocuments(searchQuery);
    
    res.json({
      success: true,
      data: {
        bookings: bookings.map(booking => ({
          bookingId: booking._id,
          passengerName: booking.passengerDetails.name,
          phone: booking.passengerDetails.phone,
          email: booking.passengerDetails.email,
          seatNumber: booking.seatNo,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          fareAmount: booking.totalAmount,
          tripDetails: booking.tripId,
          routeDetails: booking.routeId,
          createdAt: booking.createdAt
        })),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching bookings', error: error.message });
  }
});

// Create support ticket
router.post('/ticket/create', auth, requireSupport, async (req, res) => {
  try {
    const { 
      passengerId, 
      bookingId, 
      issueType, 
      description, 
      priority = 'medium',
      assignedTo 
    } = req.body;
    
    if (!passengerId || !issueType || !description) {
      return res.status(400).json({ message: 'Passenger ID, issue type, and description are required' });
    }
    
    // Create support ticket (you can create a SupportTicket model if needed)
    const supportTicket = {
      id: `SUP${Date.now()}`,
      passengerId,
      bookingId,
      issueType,
      description,
      priority,
      status: 'open',
      assignedTo: assignedTo || req.user._id,
      createdBy: req.user._id,
      createdAt: new Date()
    };
    
    // Log audit
    await AuditLog.create({
      userId: req.user._id,
      action: 'support_ticket_created',
      resource: 'support',
      resourceId: supportTicket.id,
      details: { 
        issueType,
        description,
        priority,
        passengerId
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Support ticket created successfully',
      data: supportTicket
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating support ticket', error: error.message });
  }
});

module.exports = router;

