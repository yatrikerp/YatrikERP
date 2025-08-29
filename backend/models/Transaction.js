const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit', 'refund', 'payment'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  description: {
    type: String,
    required: true
  },
  reference: {
    type: String, // PNR, booking ID, or external payment reference
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['wallet', 'razorpay', 'upi', 'card', 'cash'],
    required: true
  },
  paymentDetails: {
    razorpayPaymentId: String,
    razorpayOrderId: String,
    upiTransactionId: String,
    cardLast4: String,
    bankName: String
  },
  metadata: {
    bookingId: mongoose.Schema.Types.ObjectId,
    tripId: mongoose.Schema.Types.ObjectId,
    routeId: mongoose.Schema.Types.ObjectId,
    seatNumber: String,
    boardingStop: String,
    destinationStop: String
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  processedAt: Date,
  failureReason: String
}, {
  timestamps: true
});

// Indexes for performance
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ reference: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ 'metadata.bookingId': 1 });

module.exports = mongoose.model('Transaction', transactionSchema);

