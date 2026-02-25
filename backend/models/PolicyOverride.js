const mongoose = require('mongoose');

const policyOverrideSchema = new mongoose.Schema({
  // Policy identification
  policyName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  policyType: {
    type: String,
    enum: ['fare_override', 'student_concession', 'festival_free_travel', 'emergency_override', 'route_override', 'depot_override'],
    required: true
  },
  // Policy details
  description: {
    type: String,
    required: true
  },
  // Scope
  scope: {
    type: String,
    enum: ['statewide', 'route', 'depot', 'trip'],
    default: 'statewide'
  },
  scopeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'scopeRef'
  }],
  scopeRef: {
    type: String,
    enum: ['Route', 'Depot', 'Trip', null]
  },
  // Policy parameters
  parameters: {
    // For fare override
    fareOverride: {
      type: {
        type: String,
        enum: ['percentage', 'flat']
      },
      value: Number
    },
    // For student concession
    studentConcession: {
      enabled: { type: Boolean, default: true },
      percentage: { type: Number, default: 0, min: 0, max: 100 }
    },
    // For festival free travel
    festivalFreeTravel: {
      enabled: { type: Boolean, default: false },
      routes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }]
    },
    // For emergency override
    emergencyMode: {
      enabled: { type: Boolean, default: false },
      reason: String
    }
  },
  // Activation
  isActive: {
    type: Boolean,
    default: false,
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true,
    index: true
  },
  // Approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedAt: {
    type: Date,
    default: Date.now
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'expired', 'cancelled'],
    default: 'draft',
    index: true
  },
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String
}, {
  timestamps: true
});

// Indexes
policyOverrideSchema.index({ isActive: 1, startTime: 1, endTime: 1 });
policyOverrideSchema.index({ policyType: 1, status: 1 });
policyOverrideSchema.index({ status: 1 });
policyOverrideSchema.index({ createdAt: -1 });

// Method to check if policy is currently active
policyOverrideSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && 
         this.status === 'active' && 
         this.startTime <= now && 
         this.endTime >= now;
};

module.exports = mongoose.model('PolicyOverride', policyOverrideSchema);
