const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const QRCode = require('qrcode');
const TicketQRManager = require('../utils/ticketQRManager');
const enhancedEmailTemplates = require('../config/enhancedEmailTemplates');
const { sendEmail } = require('../config/email');

// Enhanced payment verification with improved ticket generation
router.post('/verify', auth, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      transactionId 
    } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        message: 'Payment verification parameters missing' 
      });
    }
    
    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret')
      .update(text)
      .digest('hex');
    
    if (signature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid payment signature' 
      });
    }
    
    // Get transaction details
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        message: 'Transaction not found' 
      });
    }
    
    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to verify this transaction' 
      });
    }
    
    // Update transaction status
    transaction.status = 'completed';
    transaction.paymentDetails.razorpayPaymentId = razorpay_payment_id;
    transaction.processedAt = new Date();
    await transaction.save();
    
    // Update booking status and populate all necessary details
    const booking = await Booking.findById(transaction.metadata.bookingId)
      .populate('tripId')
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('busId', 'busNumber busType')
      .populate('depotId', 'depotName');
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }
    
    // Update booking status
    booking.status = 'paid';
    booking.paymentStatus = 'completed';
    booking.paymentReference = booking.paymentReference || {};
    booking.paymentReference.razorpayPaymentId = razorpay_payment_id;
    await booking.save();
    
    // Get trip with driver and conductor information
    const trip = await Trip.findById(booking.tripId)
      .populate('driverId', 'name email phone')
      .populate('conductorId', 'name email phone')
      .populate('busId', 'busNumber busType')
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint');
    
    if (!trip) {
      return res.status(404).json({ 
        success: false,
        message: 'Trip not found' 
      });
    }
    
    // Generate tickets with enhanced QR codes for each seat
    const seats = Array.isArray(booking.seats) ? booking.seats : [{ 
      seatNumber: booking.seatNo || 'N/A',
      passengerName: booking.customer?.name,
      price: booking.pricing?.totalAmount 
    }];
    
    const ticketsCreated = [];
    
    for (const seat of seats) {
      const seatNumber = seat.seatNumber || booking.seatNo || 'N/A';
      const passengerName = seat.passengerName || booking.customer?.name || 'Passenger';
      
      // Generate unique PNR and ticket number
      const pnr = 'YTK' + Math.random().toString(36).slice(2, 7).toUpperCase();
      const ticketNumber = `TKT${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Create ticket in database
      const ticket = await Ticket.create({
        bookingId: booking._id,
        pnr,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        state: 'active',
        ticketNumber,
        passengerName,
        seatNumber: seatNumber,
        boardingStop: booking.journey?.from || '',
        destinationStop: booking.journey?.to || '',
        fareAmount: seat.price || booking.pricing?.totalAmount || 0,
        tripDetails: {
          tripId: trip._id,
          busNumber: trip.busId?.busNumber || '',
          departureTime: new Date(`${trip.serviceDate.toISOString().split('T')[0]}T${trip.startTime}:00Z`),
          arrivalTime: trip.endTime ? new Date(`${trip.serviceDate.toISOString().split('T')[0]}T${trip.endTime}:00Z`) : undefined,
          routeName: trip.routeId?.routeName || ''
        },
        source: 'web'
      });
      
      // Generate enhanced QR payload using TicketQRManager
      const ticketData = TicketQRManager.generateTicketData(booking, ticket, trip, trip.busId, trip.routeId);
      const qrPayload = TicketQRManager.generateQRPayload(ticketData);
      
      // Generate QR code image
      let qrImage = '';
      try {
        qrImage = await TicketQRManager.generateQRImage(qrPayload);
        await Ticket.findByIdAndUpdate(ticket._id, { 
          qrPayload,
          qrImage 
        });
      } catch (qrError) {
        console.error('QR code generation error:', qrError);
      }
      
      // Prepare complete ticket data for email
      const emailTicketData = {
        ...ticketData,
        qrPayload,
        qrImage,
        driver: {
          name: trip.driverId?.name || 'To be assigned',
          phone: trip.driverId?.phone || 'N/A'
        },
        conductor: {
          name: trip.conductorId?.name || 'To be assigned',
          phone: trip.conductorId?.phone || 'N/A'
        }
      };
      
      ticketsCreated.push({
        ticket,
        ticketData: emailTicketData
      });
    }
    
    // Send confirmation email with enhanced template
    try {
      if (booking.customer?.email) {
        for (const { ticketData } of ticketsCreated) {
          const emailContent = await enhancedEmailTemplates.ticketConfirmationWithQR(ticketData);
          await sendEmail(booking.customer.email, 'ticketConfirmationWithQR', ticketData);
        }
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the payment verification if email fails
    }
    
    // Return success response with ticket details
    res.json({
      success: true,
      message: 'Payment verified and tickets generated successfully',
      data: {
        transaction: {
          id: transaction._id,
          status: transaction.status,
          amount: transaction.amount,
          paymentId: razorpay_payment_id
        },
        booking: {
          id: booking._id,
          bookingId: booking.bookingId,
          status: booking.status,
          paymentStatus: booking.status
        },
        tickets: ticketsCreated.map(({ ticket }) => ({
          id: ticket._id,
          pnr: ticket.pnr,
          ticketNumber: ticket.ticketNumber,
          passengerName: ticket.passengerName,
          seatNumber: ticket.seatNumber,
          boardingStop: ticket.boardingStop,
          destinationStop: ticket.destinationStop,
          fareAmount: ticket.fareAmount,
          state: ticket.state
        })),
        trip: {
          id: trip._id,
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
        }
      }
    });
    
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying payment', 
      error: error.message 
    });
  }
});

// Mock payment for testing (enhanced version)
router.post('/mock', auth, async (req, res) => {
  try {
    const { transactionId } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({ 
        success: false,
        message: 'Transaction ID is required' 
      });
    }
    
    // Get transaction details
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ 
        success: false,
        message: 'Transaction not found' 
      });
    }
    
    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to verify this transaction' 
      });
    }
    
    // Update transaction status
    transaction.status = 'completed';
    transaction.paymentDetails.razorpayPaymentId = 'mock_payment_' + Date.now();
    transaction.processedAt = new Date();
    await transaction.save();
    
    // Update booking status and populate all necessary details
    const booking = await Booking.findById(transaction.metadata.bookingId)
      .populate('tripId')
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('busId', 'busNumber busType')
      .populate('depotId', 'depotName');
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }
    
    // Update booking status
    booking.status = 'paid';
    booking.paymentStatus = 'completed';
    booking.paymentReference = booking.paymentReference || {};
    booking.paymentReference.razorpayPaymentId = transaction.paymentDetails.razorpayPaymentId;
    await booking.save();
    
    // Get trip with driver and conductor information
    const trip = await Trip.findById(booking.tripId)
      .populate('driverId', 'name email phone')
      .populate('conductorId', 'name email phone')
      .populate('busId', 'busNumber busType')
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint');
    
    if (!trip) {
      return res.status(404).json({ 
        success: false,
        message: 'Trip not found' 
      });
    }
    
    // Generate tickets with enhanced QR codes for each seat
    const seats = Array.isArray(booking.seats) ? booking.seats : [{ 
      seatNumber: booking.seatNo || 'N/A',
      passengerName: booking.customer?.name,
      price: booking.pricing?.totalAmount 
    }];
    
    const ticketsCreated = [];
    
    for (const seat of seats) {
      const seatNumber = seat.seatNumber || booking.seatNo || 'N/A';
      const passengerName = seat.passengerName || booking.customer?.name || 'Passenger';
      
      // Generate unique PNR and ticket number
      const pnr = 'YTK' + Math.random().toString(36).slice(2, 7).toUpperCase();
      const ticketNumber = `TKT${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Create ticket in database
      const ticket = await Ticket.create({
        bookingId: booking._id,
        pnr,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        state: 'active',
        ticketNumber,
        passengerName,
        seatNumber: seatNumber,
        boardingStop: booking.journey?.from || '',
        destinationStop: booking.journey?.to || '',
        fareAmount: seat.price || booking.pricing?.totalAmount || 0,
        tripDetails: {
          tripId: trip._id,
          busNumber: trip.busId?.busNumber || '',
          departureTime: new Date(`${trip.serviceDate.toISOString().split('T')[0]}T${trip.startTime}:00Z`),
          arrivalTime: trip.endTime ? new Date(`${trip.serviceDate.toISOString().split('T')[0]}T${trip.endTime}:00Z`) : undefined,
          routeName: trip.routeId?.routeName || ''
        },
        source: 'web'
      });
      
      // Generate enhanced QR payload using TicketQRManager
      const ticketData = TicketQRManager.generateTicketData(booking, ticket, trip, trip.busId, trip.routeId);
      const qrPayload = TicketQRManager.generateQRPayload(ticketData);
      
      // Generate QR code image
      let qrImage = '';
      try {
        qrImage = await TicketQRManager.generateQRImage(qrPayload);
        await Ticket.findByIdAndUpdate(ticket._id, { 
          qrPayload,
          qrImage 
        });
      } catch (qrError) {
        console.error('QR code generation error:', qrError);
      }
      
      // Prepare complete ticket data for email
      const emailTicketData = {
        ...ticketData,
        qrPayload,
        qrImage,
        driver: {
          name: trip.driverId?.name || 'To be assigned',
          phone: trip.driverId?.phone || 'N/A'
        },
        conductor: {
          name: trip.conductorId?.name || 'To be assigned',
          phone: trip.conductorId?.phone || 'N/A'
        }
      };
      
      ticketsCreated.push({
        ticket,
        ticketData: emailTicketData
      });
    }
    
    // Send confirmation email with enhanced template
    try {
      if (booking.customer?.email) {
        for (const { ticketData } of ticketsCreated) {
          const emailContent = await enhancedEmailTemplates.ticketConfirmationWithQR(ticketData);
          await sendEmail(booking.customer.email, 'ticketConfirmationWithQR', ticketData);
        }
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the payment verification if email fails
    }
    
    // Return success response with ticket details
    res.json({
      success: true,
      message: 'Mock payment verified and tickets generated successfully',
      data: {
        transaction: {
          id: transaction._id,
          status: transaction.status,
          amount: transaction.amount,
          paymentId: transaction.paymentDetails.razorpayPaymentId
        },
        booking: {
          id: booking._id,
          bookingId: booking.bookingId,
          status: booking.status,
          paymentStatus: booking.status
        },
        tickets: ticketsCreated.map(({ ticket }) => ({
          id: ticket._id,
          pnr: ticket.pnr,
          ticketNumber: ticket.ticketNumber,
          passengerName: ticket.passengerName,
          seatNumber: ticket.seatNumber,
          boardingStop: ticket.boardingStop,
          destinationStop: ticket.destinationStop,
          fareAmount: ticket.fareAmount,
          state: ticket.state
        })),
        trip: {
          id: trip._id,
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
        }
      }
    });
    
  } catch (error) {
    console.error('Mock payment verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying mock payment', 
      error: error.message 
    });
  }
});

module.exports = router;




