const mongoose = require('mongoose');

const depotScoreSchema = new mongoose.Schema({
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  // Overall score (0-100)
  overallScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  // Performance metrics
  performance: {
    onTimeRate: { type: Number, default: 0 },
    tripCompletionRate: { type: Number, default: 0 },
    busUtilization: { type: Number, default: 0 },
    crewEfficiency: { type: Number, default: 0 }
  },
  // Financial metrics
  financial: {
    revenue: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 },
    revenuePerTrip: { type: Number, default: 0 }
  },
  // Operational metrics
  operational: {
    totalTrips: { type: Number, default: 0 },
    activeBuses: { type: Number, default: 0 },
    maintenanceBuses: { type: Number, default: 0 },
    breakdownCount: { type: Number, default: 0 },
    averageBreakdownTime: { type: Number, default: 0 } // hours
  },
  // Compliance metrics
  compliance: {
    safetyScore: { type: Number, default: 100 },
    maintenanceCompliance: { type: Number, default: 100 },
    crewCompliance: { type: Number, default: 100 }
  },
  // Issues and alerts
  issues: [{
    type: {
      type: String,
      enum: ['breakdown', 'delay', 'revenue', 'maintenance', 'crew', 'safety']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    description: String,
    count: { type: Number, default: 0 },
    lastOccurrence: Date
  }],
  // Status
  status: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'critical'],
    default: 'good'
  },
  // Rankings
  ranking: {
    stateRank: Number,
    totalDepots: Number
  }
}, {
  timestamps: true
});

// Indexes
depotScoreSchema.index({ depotId: 1, date: -1 });
depotScoreSchema.index({ overallScore: -1 });
depotScoreSchema.index({ status: 1 });
depotScoreSchema.index({ 'financial.profit': -1 });

module.exports = mongoose.model('DepotScore', depotScoreSchema);
