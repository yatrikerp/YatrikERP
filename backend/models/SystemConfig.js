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
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
