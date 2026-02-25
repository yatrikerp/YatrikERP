const mongoose = require('mongoose');

const routeHealthSchema = new mongoose.Schema({
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  // Performance metrics
  performance: {
    onTimeRate: { type: Number, default: 0 }, // percentage
    averageDelay: { type: Number, default: 0 }, // minutes
    completionRate: { type: Number, default: 0 }, // percentage
    cancellationRate: { type: Number, default: 0 } // percentage
  },
  // Revenue metrics
  revenue: {
    today: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    averagePerTrip: { type: Number, default: 0 },
    leakage: { type: Number, default: 0 } // estimated revenue leakage
  },
  // Occupancy metrics
  occupancy: {
    averageOccupancy: { type: Number, default: 0 }, // percentage
    peakOccupancy: { type: Number, default: 0 },
    lowOccupancy: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['overcrowded', 'optimal', 'underutilized'],
      default: 'optimal'
    }
  },
  // Operational issues
  issues: [{
    type: {
      type: String,
      enum: ['delay', 'breakdown', 'cancellation', 'overcrowding', 'underutilization', 'revenue_leakage']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    count: { type: Number, default: 0 },
    lastOccurrence: Date
  }],
  // Health score (0-100)
  healthScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  // Status
  status: {
    type: String,
    enum: ['healthy', 'warning', 'critical'],
    default: 'healthy'
  }
}, {
  timestamps: true
});

// Indexes
routeHealthSchema.index({ routeId: 1, date: -1 });
routeHealthSchema.index({ healthScore: 1 });
routeHealthSchema.index({ status: 1 });
routeHealthSchema.index({ 'occupancy.status': 1 });

module.exports = mongoose.model('RouteHealth', routeHealthSchema);
