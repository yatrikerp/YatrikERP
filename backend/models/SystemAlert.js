const mongoose = require('mongoose');

const systemAlertSchema = new mongoose.Schema({
  // Alert identification
  alertId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  alertType: {
    type: String,
    enum: ['breakdown', 'route_failure', 'depot_underperformance', 'financial_anomaly', 'safety', 'system', 'revenue_leakage', 'overcrowding', 'underutilization'],
    required: true,
    index: true
  },
  // Alert details
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  // Severity
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    required: true,
    index: true
  },
  // Scope
  scope: {
    type: String,
    enum: ['statewide', 'route', 'depot', 'bus', 'trip', 'system'],
    default: 'statewide'
  },
  scopeId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'scopeRef'
  },
  scopeRef: {
    type: String,
    enum: ['Route', 'Depot', 'Bus', 'Trip', null]
  },
  // Alert data
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
    default: 'active',
    index: true
  },
  // Timestamps
  detectedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  acknowledgedAt: Date,
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Recurrence
  recurrenceCount: {
    type: Number,
    default: 0
  },
  lastOccurrence: Date,
  // Priority (calculated based on severity and recurrence)
  priority: {
    type: Number,
    default: 0,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
systemAlertSchema.index({ status: 1, severity: 1, detectedAt: -1 });
systemAlertSchema.index({ alertType: 1, status: 1 });
systemAlertSchema.index({ priority: -1 });
systemAlertSchema.index({ scope: 1, scopeId: 1 });

// Method to calculate priority
systemAlertSchema.methods.calculatePriority = function() {
  const severityWeight = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'critical': 4
  };
  
  const basePriority = severityWeight[this.severity] || 1;
  const recurrenceBonus = Math.min(this.recurrenceCount * 0.5, 2);
  
  this.priority = basePriority + recurrenceBonus;
  return this.priority;
};

module.exports = mongoose.model('SystemAlert', systemAlertSchema);
