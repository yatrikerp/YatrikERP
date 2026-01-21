const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  jwtExpiryMinutes: {
    type: Number,
    default: 30,
    min: 5,
    max: 1440
  },
  corsOrigins: {
    type: [String],
    default: []
  },
  features: {
    pax: {
      type: Boolean,
      default: true
    },
    etm: {
      type: Boolean,
      default: true
    },
    driver: {
      type: Boolean,
      default: true
    },
    occ: {
      type: Boolean,
      default: true
    }
  },
  maintenance: {
    enabled: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: 'System is under maintenance. Please try again later.'
    }
  },
  // Admin Dashboard Configuration Fields
  concessionRules: {
    schoolDiscount: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    collegeDiscount: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    seniorCitizenDiscount: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    distanceCap: {
      type: Number,
      default: 100
    },
    validityPeriod: {
      type: Number,
      default: 365
    }
  },
  schedulingConstraints: {
    maxDriverHours: {
      type: Number,
      default: 10
    },
    minRestHours: {
      type: Number,
      default: 8
    },
    maxConsecutiveDays: {
      type: Number,
      default: 6
    }
  },
  auctionRules: {
    minBidAmount: {
      type: Number,
      default: 100
    },
    biddingDuration: {
      type: Number,
      default: 24
    },
    autoApproveThreshold: {
      type: Number,
      default: 10000
    }
  },
  paymentThresholds: {
    autoApprovalLimit: {
      type: Number,
      default: 10000
    },
    manualApprovalLimit: {
      type: Number,
      default: 50000
    }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one config document exists
systemConfigSchema.index({}, { unique: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
