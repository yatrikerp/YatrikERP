const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

class PaymentService {
  // Create payment order
  static async createOrder(amount, bookingId, passengerId, currency = 'INR') {
    try {
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

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID
      };
    } catch (error) {
      console.error('Payment order creation error:', error);
      throw new Error('Failed to create payment order');
    }
  }

  // Verify payment signature
  static async verifyPayment(paymentResponse, bookingId) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentResponse;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new Error('Payment verification parameters are required');
      }

      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature === razorpay_signature) {
        return {
          success: true,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id
        };
      } else {
        throw new Error('Invalid payment signature');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  // Get payment status
  static async getPaymentStatus(paymentId) {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        captured: payment.captured,
        description: payment.description,
        email: payment.email,
        contact: payment.contact,
        created_at: payment.created_at
      };
    } catch (error) {
      console.error('Error fetching payment status:', error);
      throw new Error('Failed to fetch payment status');
    }
  }

  // Process refund
  static async processRefund(paymentId, amount, reason = 'Customer request') {
    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: amount * 100, // Convert to paise
        notes: {
          reason: reason
        }
      });

      return {
        id: refund.id,
        payment_id: refund.payment_id,
        amount: refund.amount,
        status: refund.status,
        created_at: refund.created_at
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error('Failed to process refund');
    }
  }
}

module.exports = PaymentService;
