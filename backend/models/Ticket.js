const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true 
  },
  pnr: { 
    type: String, 
    unique: true, 
    required: true 
  },
  qrPayload: { 
    type: String, 
    required: true 
  },
  qrImage: String, // Base64 or URL to QR image
  expiresAt: { 
    type: Date, 
    required: true 
  },
  state: { 
    type: String, 
    enum: ['issued', 'active', 'validated', 'expired', 'cancelled'], 
    default: 'active' 
  },
  // Ticket details
  passengerName: {
    type: String,
    required: true
  },
  seatNumber: {
    type: String,
    required: true
  },
  boardingStop: {
    type: String,
    required: true
  },
  destinationStop: {
    type: String,
    required: true
  },
  fareAmount: {
    type: Number,
    required: true
  },
  // Scan status (fast lookup for latest scan)
  scannedAt: Date,
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scannedLocation: String,
  // Validation tracking
  validationHistory: [{
    conductorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    validatedAt: {
      type: Date,
      default: Date.now
    },
    location: {
      latitude: Number,
      longitude: Number,
      stopName: String
    },
    deviceInfo: {
      deviceId: String,
      appVersion: String
    }
  }],
  // Trip information
  tripDetails: {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    },
    busNumber: String,
    departureTime: Date,
    arrivalTime: Date,
    routeName: String
  },
  // Concession details
  concessionApplied: {
    type: String,
    enum: ['none', 'student', 'senior_citizen', 'disabled', 'women'],
    default: 'none'
  },
  concessionAmount: {
    type: Number,
    default: 0
  },
  // Status tracking
  issuedAt: {
    type: Date,
    default: Date.now
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String,
  // For compliance and reporting
  ticketNumber: {
    type: String,
    unique: true,
    required: true
  },
  source: {
    type: String,
    enum: ['web', 'mobile_app', 'counter', 'agent'],
    default: 'web'
  }
}, { 
  timestamps: true 
});

// Indexes for performance
ticketSchema.index({ bookingId: 1 });
ticketSchema.index({ state: 1 });
ticketSchema.index({ expiresAt: 1 });
ticketSchema.index({ 'tripDetails.tripId': 1 });
ticketSchema.index({ 'validationHistory.conductorId': 1 });
ticketSchema.index({ createdAt: -1 });

// Generate ticket number before saving
ticketSchema.pre('save', function(next) {
  if (!this.ticketNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.ticketNumber = `TKT${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);


