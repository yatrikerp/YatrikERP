const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Razorpay = require('razorpay');
const QRCode = require('qrcode');
const Ticket = require('../models/Ticket');

// Initialize Razorpay (use test credentials for development)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_example',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret'
});

// Create payment order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { bookingId, amount, currency = 'INR' } = req.body;
    
    if (!bookingId || !amount) {
      return res.status(400).json({ message: 'Booking ID and amount are required' });
    }
    
    // Verify booking belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.passengerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to pay for this booking' });
    }
    
    if (booking.status !== 'pending_payment') {
      return res.status(400).json({ message: 'Booking is not in payment pending status' });
    }
    
    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: currency,
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId: bookingId,
        passengerName: req.user.name,
        tripId: booking.tripId.toString()
      }
    };
    
    const order = await razorpay.orders.create(orderOptions);
    
    // Create transaction record
    const transaction = await Transaction.create({
      userId: req.user._id,
      type: 'payment',
      amount: amount,
      currency: currency,
      description: `Payment for booking ${bookingId}`,
      reference: order.id,
      status: 'pending',
      paymentMethod: 'razorpay',
      paymentDetails: {
        razorpayOrderId: order.id
      },
      metadata: {
        bookingId: booking._id,
        tripId: booking.tripId,
        seatNumber: booking.seatNo
      },
      balanceAfter: req.user.wallet.balance
    });
    
    // Update booking payment reference
    await Booking.findByIdAndUpdate(bookingId, {
      'paymentReference.razorpayOrderId': order.id
    });
    
    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        transactionId: transaction._id
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating payment order', error: error.message });
  }
});

// Verify payment and complete booking
router.post('/verify', auth, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      transactionId 
    } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification parameters missing' });
    }
    
    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret')
      .update(text)
      .digest('hex');
    
    if (signature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }
    
    // Get transaction details
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to verify this transaction' });
    }
    
    // Update transaction status
    transaction.status = 'completed';
    transaction.paymentDetails.razorpayPaymentId = razorpay_payment_id;
    transaction.processedAt = new Date();
    await transaction.save();
    
    // Update booking status
    const booking = await Booking.findById(transaction.metadata.bookingId);
    if (booking) {
      booking.status = 'paid';
      booking.paymentStatus = 'completed';
      booking.paymentReference.razorpayPaymentId = razorpay_payment_id;
      await booking.save();
    }
    
    // Log audit
    await AuditLog.create({
      userId: req.user._id,
      action: 'payment_processed',
      resource: 'payment',
      resourceId: transaction._id,
      details: { 
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: transaction.amount
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        transactionId: transaction._id,
        bookingId: transaction.metadata.bookingId,
        amount: transaction.amount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
});

// Process refund
router.post('/refund', auth, async (req, res) => {
  try {
    const { bookingId, reason, amount } = req.body;
    
    if (!bookingId || !reason) {
      return res.status(400).json({ message: 'Booking ID and reason are required' });
    }
    
    // Verify booking belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.passengerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to refund this booking' });
    }
    
    if (booking.status !== 'paid') {
      return res.status(400).json({ message: 'Only paid bookings can be refunded' });
    }
    
    const refundAmount = amount || booking.totalAmount;
    
    // Create refund transaction
    const refundTransaction = await Transaction.create({
      userId: req.user._id,
      type: 'refund',
      amount: refundAmount,
      currency: 'INR',
      description: `Refund for booking ${bookingId}: ${reason}`,
      reference: `REFUND_${Date.now()}`,
      status: 'pending',
      paymentMethod: 'razorpay',
      metadata: {
        bookingId: booking._id,
        tripId: booking.tripId,
        seatNumber: booking.seatNo
      },
      balanceAfter: req.user.wallet.balance + refundAmount
    });
    
    // Update booking status
    booking.status = 'refunded';
    booking.refundAmount = refundAmount;
    booking.refundStatus = 'pending';
    await booking.save();
    
    // Process Razorpay refund if payment was made via Razorpay
    if (booking.paymentReference.razorpayPaymentId) {
      try {
        const refund = await razorpay.payments.refund(
          booking.paymentReference.razorpayPaymentId,
          {
            amount: Math.round(refundAmount * 100),
            notes: {
              reason: reason,
              bookingId: bookingId
            }
          }
        );
        
        // Update refund transaction with Razorpay details
        refundTransaction.paymentDetails.razorpayRefundId = refund.id;
        refundTransaction.status = 'completed';
        refundTransaction.processedAt = new Date();
        await refundTransaction.save();
        
        // Update booking refund status
        booking.refundStatus = 'completed';
        booking.refundProcessedAt = new Date();
        await booking.save();
        
        // Update user wallet balance
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { 'wallet.balance': refundAmount }
        });
        
      } catch (refundError) {
        console.error('Razorpay refund error:', refundError);
        // Continue with local refund processing
      }
    }
    
    // Log audit
    await AuditLog.create({
      userId: req.user._id,
      action: 'refund_initiated',
      resource: 'booking',
      resourceId: booking._id,
      details: { 
        reason: reason,
        amount: refundAmount,
        refundTransactionId: refundTransaction._id
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundTransactionId: refundTransaction._id,
        amount: refundAmount,
        status: refundTransaction.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing refund', error: error.message });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    
    const query = { userId: req.user._id };
    if (type) {
      query.type = type;
    }
    
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('metadata.bookingId', 'tripId seatNo')
      .populate('metadata.tripId', 'routeId departureTime');
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment history', error: error.message });
  }
});

// Get payment status
router.get('/status/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment status', error: error.message });
  }
});

module.exports = router;

// POST /api/payment/mock - Phase-0 mock payment that marks booking paid and creates ticket with QR image
router.post('/mock', auth, async (req, res) => {
  try {
    const { bookingId } = req.body || {};
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    const booking = await Booking.findById(bookingId).populate('tripId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.passengerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
    }

    booking.status = 'paid';
    booking.paymentStatus = 'completed';
    booking.paymentReference = booking.paymentReference || {};
    booking.paymentReference.mockPaymentId = `mock_${Date.now()}`;
    await booking.save();

    const pnr = 'YTK' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const seatNumber = booking.seatNo;
    const payload = `YATRIK|PNR:${pnr}|Trip:${booking.tripId?._id || booking.tripId}|Seat:${seatNumber}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const ticketNumber = `TKT${Date.now()}${Math.random().toString(36).substr(2,5).toUpperCase()}`;
    const ticket = await Ticket.create({
      bookingId: booking._id,
      pnr,
      qrPayload: payload,
      expiresAt,
      state: 'active',
      ticketNumber,
      passengerName: booking.passengerDetails?.name || 'Passenger',
      seatNumber: seatNumber,
      boardingStop: booking.boardingStopId?.toString() || '',
      destinationStop: booking.destinationStopId?.toString() || '',
      fareAmount: booking.totalAmount,
      tripDetails: {
        tripId: booking.tripId?._id || booking.tripId,
        busNumber: booking.tripId?.busNumber || '',
        departureTime: booking.tripId?.startTime ? new Date(`2000-01-01T${booking.tripId.startTime}:00Z`) : undefined,
        arrivalTime: undefined,
        routeName: ''
      },
      source: 'web'
    });

    // Generate QR image (data URL)
    let qrImage = null;
    try {
      qrImage = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M' });
      await Ticket.findByIdAndUpdate(ticket._id, { qrImage });
    } catch (e) {
      // Non-fatal
    }

    return res.json({ success: true, data: { ticket, pnr, qrPayload: payload, qrImage } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Mock payment failed', error: error.message });
  }
});

