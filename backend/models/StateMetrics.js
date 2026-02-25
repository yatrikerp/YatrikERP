const mongoose = require('mongoose');

const stateMetricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  // Revenue metrics
  revenue: {
    today: { type: Number, default: 0 },
    yesterday: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    lastMonth: { type: Number, default: 0 },
    hourWise: [{
      hour: Number,
      amount: Number
    }]
  },
  // Operational metrics
  operations: {
    totalTrips: { type: Number, default: 0 },
    runningTrips: { type: Number, default: 0 },
    completedTrips: { type: Number, default: 0 },
    cancelledTrips: { type: Number, default: 0 },
    onTimeTrips: { type: Number, default: 0 },
    delayedTrips: { type: Number, default: 0 },
    averageDelay: { type: Number, default: 0 } // in minutes
  },
  // Fleet metrics
  fleet: {
    totalBuses: { type: Number, default: 0 },
    activeBuses: { type: Number, default: 0 },
    onRouteBuses: { type: Number, default: 0 },
    maintenanceBuses: { type: Number, default: 0 },
    breakdownBuses: { type: Number, default: 0 }
  },
  // Route metrics
  routes: {
    totalRoutes: { type: Number, default: 0 },
    activeRoutes: { type: Number, default: 0 },
    overcrowdedRoutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }],
    underutilizedRoutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }]
  },
  // Depot metrics
  depots: {
    totalDepots: { type: Number, default: 0 },
    activeDepots: { type: Number, default: 0 },
    depotPerformance: [{
      depotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot' },
      score: Number,
      revenue: Number,
      trips: Number,
      onTimeRate: Number
    }]
  },
  // Citizen metrics
  citizens: {
    totalBookings: { type: Number, default: 0 },
    todayBookings: { type: Number, default: 0 },
    totalComplaints: { type: Number, default: 0 },
    pendingComplaints: { type: Number, default: 0 },
    resolvedComplaints: { type: Number, default: 0 },
    painIndex: { type: Number, default: 0 } // 0-100 scale
  },
  // System health
  systemHealth: {
    apiUptime: { type: Number, default: 100 },
    databaseStatus: { type: String, enum: ['healthy', 'degraded', 'down'], default: 'healthy' },
    activeConnections: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for performance
stateMetricsSchema.index({ date: -1 });
stateMetricsSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StateMetrics', stateMetricsSchema);
