const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  passengerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tripId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Trip', 
    required: true 
  },
  boardingStopId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Stop', 
    required: true 
  },
  destinationStopId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Stop', 
    required: true 
  },
  seatNo: { 
    type: String,
    required: true
  },
  fareAmount: { 
    type: Number, 
    required: true 
  },
  concessionAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: { 
    type: String, 
    enum: ['initiated', 'pending_payment', 'paid', 'confirmed', 'issued', 'cancelled', 'refunded', 'expired'], 
    default: 'initiated' 
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'upi', 'wallet', 'card', 'cash'],
    required: true
  },
  paymentReference: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    upiTransactionId: String,
    transactionId: String
  },
  passengerDetails: {
    name: String,
    age: Number,
    gender: String,
    phone: String,
    email: String,
    concessionType: {
      type: String,
      enum: ['none', 'student', 'senior_citizen', 'disabled', 'women'],
      default: 'none'
    }
  },
  bookingTime: {
    type: Date,
    default: Date.now
  },
  expiryTime: {
    type: Date,
    required: true
  },
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  refundAmount: Number,
  refundStatus: {
    type: String,
    enum: ['not_applicable', 'pending', 'processed', 'completed'],
    default: 'not_applicable'
  },
  refundProcessedAt: Date,
  notes: String,
  // For tracking and analytics
  source: {
    type: String,
    enum: ['web', 'mobile_app', 'counter', 'agent'],
    default: 'web'
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    platform: String
  }
}, { 
  timestamps: true 
});

// Indexes for performance
bookingSchema.index({ passengerId: 1, createdAt: -1 });
bookingSchema.index({ tripId: 1, status: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ bookingTime: -1 });
bookingSchema.index({ expiryTime: 1 });
bookingSchema.index({ 'passengerDetails.phone': 1 });
bookingSchema.index({ 'passengerDetails.email': 1 });

// Calculate total amount before saving
bookingSchema.pre('save', function(next) {
  if (this.fareAmount && this.concessionAmount !== undefined) {
    this.totalAmount = this.fareAmount - this.concessionAmount;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
