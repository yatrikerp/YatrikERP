const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const { auth, requireRole } = require('../middleware/auth');
const crypto = require('crypto');

// Initialize Razorpay (only if credentials are provided)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.warn('⚠️ Razorpay credentials not provided. Payment features will be disabled.');
}

// Create payment order
router.post('/create-order', auth, async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is not configured. Please contact support.'
      });
    }

    const { amount, currency = 'INR', bookingId, passengerId } = req.body;

    if (!amount || !bookingId || !passengerId) {
      return res.status(400).json({
        success: false,
        message: 'Amount, booking ID, and passenger ID are required'
      });
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `booking_${bookingId}_${Date.now()}`,
      notes: {
        bookingId,
        passengerId,
        purpose: 'Bus ticket booking'
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
});

// Verify payment signature
router.post('/verify-payment', auth, async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service is not configured. Please contact support.'
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification parameters are required'
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Payment verified successfully
      // Here you would typically:
      // 1. Update booking status to confirmed
      // 2. Generate ticket
      // 3. Send confirmation email/SMS
      // 4. Update payment records

      res.json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// Get payment status
router.get('/status/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await razorpay.payments.fetch(paymentId);
    
    res.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        created_at: payment.created_at
      }
    });

  } catch (error) {
    console.error('Payment status fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status'
    });
  }
});

// Refund payment
router.post('/refund', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    if (!paymentId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and amount are required'
      });
    }

    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100, // Convert to paise
      speed: 'normal',
      notes: {
        reason: reason || 'Customer request'
      }
    });

    res.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status
    });

  } catch (error) {
    console.error('Payment refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
});

// Get payment history for user
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    // This would typically fetch from your database
    // For now, returning mock data
    const payments = [
      {
        id: 'pay_1234567890',
        amount: 500,
        currency: 'INR',
        status: 'captured',
        method: 'card',
        created_at: new Date().toISOString(),
        bookingId: 'BK001'
      }
    ];

    res.json({
      success: true,
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: payments.length
      }
    });

  } catch (error) {
    console.error('Payment history fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

module.exports = router;
