const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Booking identification
  bookingId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  bookingReference: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  // Customer information
  customer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      min: 0,
      max: 120
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    idProof: {
      type: {
        type: String,
        enum: ['aadhar', 'pan', 'passport', 'driving_license', 'voter_id']
      },
      number: String
    }
  },

  // Trip information
  tripId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Trip', 
    required: true,
    index: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true 
  },
  depotId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Depot',
    required: true 
  },

  // Journey details
  journey: {
    from: {
      type: String,
      required: true,
      trim: true
    },
    to: {
      type: String,
      required: true,
      trim: true
    },
    departureDate: {
      type: Date,
      required: true
    },
    departureTime: {
      type: String,
      required: true
    },
    arrivalDate: {
      type: Date,
      required: true
    },
    arrivalTime: {
      type: String,
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: true
    }
  },

  // Seat information
  seats: [{
  seatNumber: { 
    type: String, 
    required: true 
  },
    seatType: {
      type: String,
      enum: ['seater', 'sleeper', 'semi_sleeper'],
      required: true
    },
    seatPosition: {
      type: String,
      enum: ['window', 'aisle', 'middle'],
      required: true
    },
    floor: {
      type: String,
      enum: ['lower', 'upper'],
      default: 'lower'
    },
    berth: {
      type: String,
      enum: ['side_lower', 'side_upper', 'side_middle', 'normal_lower', 'normal_upper', 'normal_middle']
    },
    price: {
      type: Number,
      required: true
    },
    passengerName: {
      type: String,
      required: true
    },
    passengerAge: Number,
    passengerGender: {
      type: String,
      enum: ['male', 'female', 'other']
    }
  }],

  // Pricing
  pricing: {
    baseFare: {
      type: Number,
      required: true
    },
    seatFare: {
      type: Number,
      required: true
    },
    taxes: {
      gst: {
        type: Number,
        default: 0
      },
      serviceTax: {
        type: Number,
        default: 0
      },
      other: {
        type: Number,
        default: 0
      }
    },
    discounts: {
      earlyBird: {
        type: Number,
        default: 0
      },
      loyalty: {
        type: Number,
        default: 0
      },
      promo: {
        type: Number,
        default: 0
      },
      other: {
    type: Number, 
        default: 0
      }
  },
  totalAmount: { 
    type: Number, 
      required: true
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    refundAmount: {
      type: Number,
      default: 0
    }
  },

  // Payment information
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'netbanking', 'wallet', 'emi'],
      required: true
    },
    transactionId: String,
    paymentGateway: String,
  paymentStatus: { 
    type: String, 
      enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending' 
  },
    paidAt: Date,
    refundedAt: Date
  },

  // Booking status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'refunded'],
    default: 'pending',
    index: true
  },

  // Cancellation information
  cancellation: {
    cancelledBy: {
    type: String, 
      enum: ['customer', 'admin', 'system', 'operator']
    },
    cancelledAt: Date,
    reason: String,
    refundEligible: {
      type: Boolean,
      default: true
    },
    refundAmount: Number,
    cancellationCharges: Number
  },
  
  // Special requirements
  specialRequests: {
    wheelchair: {
      type: Boolean,
      default: false
    },
    meal: {
      type: Boolean,
      default: false
    },
    blanket: {
      type: Boolean,
      default: false
    },
    pillow: {
      type: Boolean,
      default: false
    },
    other: String
  },

  // Check-in information
  checkIn: {
    checkedIn: {
      type: Boolean,
      default: false
    },
    checkedInAt: Date,
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    boardingPoint: String,
    seatAllocated: String
  },

  // Notifications
  notifications: {
    emailSent: {
      type: Boolean,
      default: false
    },
    smsSent: {
      type: Boolean,
      default: false
    },
    whatsappSent: {
      type: Boolean,
      default: false
    },
    reminderSent: {
      type: Boolean,
      default: false
    }
  },

  // Metadata
  source: {
    type: String,
    enum: ['web', 'mobile', 'counter', 'agent', 'api'],
    default: 'web'
  },
  userAgent: String,
  ipAddress: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Timestamps
  expiresAt: {
    type: Date,
    default: function() {
      // Bookings expire after 15 minutes if not paid
      return new Date(Date.now() + 15 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ 'customer.email': 1 });
bookingSchema.index({ 'customer.phone': 1 });
bookingSchema.index({ tripId: 1, status: 1 });
bookingSchema.index({ routeId: 1, 'journey.departureDate': 1 });
bookingSchema.index({ busId: 1, 'journey.departureDate': 1 });
bookingSchema.index({ depotId: 1, status: 1 });
bookingSchema.index({ 'payment.paymentStatus': 1 });
bookingSchema.index({ 'journey.departureDate': 1, status: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for total seats
bookingSchema.virtual('totalSeats').get(function() {
  return this.seats.length;
});

// Virtual for journey duration in hours
bookingSchema.virtual('journeyDurationHours').get(function() {
  return Math.round(this.journey.duration / 60 * 100) / 100;
});

// Virtual for booking age in minutes
bookingSchema.virtual('bookingAgeMinutes').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60));
});

// Pre-save middleware to generate booking IDs
bookingSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate booking ID
    if (!this.bookingId) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.random().toString(36).substr(2, 4).toUpperCase();
      this.bookingId = `BK${year}${month}${day}${random}`;
    }

    // Generate booking reference
    if (!this.bookingReference) {
      const random = Math.random().toString(36).substr(2, 8).toUpperCase();
      this.bookingReference = `REF${random}`;
    }
  }
  next();
});

// Static method to find bookings by date range
bookingSchema.statics.findByDateRange = function(startDate, endDate, depotId = null) {
  const query = {
    'journey.departureDate': {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  if (depotId) {
    query.depotId = depotId;
  }

  return this.find(query)
    .populate('tripId', 'tripNumber startTime endTime')
    .populate('routeId', 'routeName routeNumber')
    .populate('busId', 'busNumber busType')
    .populate('depotId', 'depotName')
    .sort({ 'journey.departureDate': 1, 'journey.departureTime': 1 });
};

// Static method to get booking statistics
bookingSchema.statics.getBookingStats = function(depotId = null, startDate = null, endDate = null) {
  const matchQuery = {};

  if (depotId) {
    matchQuery.depotId = depotId;
  }

  if (startDate && endDate) {
    matchQuery['journey.departureDate'] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$pricing.totalAmount' },
        paidAmount: { $sum: '$pricing.paidAmount' }
      }
    }
  ]);
};

// Method to calculate refund amount
bookingSchema.methods.calculateRefund = function() {
  const hoursBeforeDeparture = Math.floor((this.journey.departureDate - new Date()) / (1000 * 60 * 60));
  
  let refundPercentage = 0;
  
  if (hoursBeforeDeparture > 24) {
    refundPercentage = 100; // Full refund
  } else if (hoursBeforeDeparture > 12) {
    refundPercentage = 75; // 75% refund
  } else if (hoursBeforeDeparture > 6) {
    refundPercentage = 50; // 50% refund
  } else if (hoursBeforeDeparture > 2) {
    refundPercentage = 25; // 25% refund
  } else {
    refundPercentage = 0; // No refund
  }

  const refundAmount = (this.pricing.totalAmount * refundPercentage) / 100;
  const cancellationCharges = this.pricing.totalAmount - refundAmount;

  return {
    refundAmount,
    cancellationCharges,
    refundPercentage,
    hoursBeforeDeparture
  };
};

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const hoursBeforeDeparture = Math.floor((this.journey.departureDate - new Date()) / (1000 * 60 * 60));
  return this.status === 'confirmed' && hoursBeforeDeparture > 1;
};

module.exports = mongoose.model('Booking', bookingSchema);