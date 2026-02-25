const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  // Policy identification
  policyCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  policyName: {
    type: String,
    required: true,
    trim: true
  },
  policyType: {
    type: String,
    enum: ['fare', 'concession', 'booking', 'validation', 'qr', 'route', 'depot'],
    required: true,
    index: true
  },
  // Policy description
  description: {
    type: String,
    required: true
  },
  // Policy rules (stored as JSON for flexibility)
  rules: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // Example rules structure:
  // {
  //   condition: { field: 'user.role', operator: 'equals', value: 'student' },
  //   action: { type: 'apply_concession', value: 50 },
  //   priority: 1
  // }
  
  // Scope
  scope: {
    type: String,
    enum: ['statewide', 'route', 'depot', 'trip', 'user'],
    default: 'statewide'
  },
  scopeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'scopeRef'
  }],
  scopeRef: {
    type: String,
    enum: ['Route', 'Depot', 'Trip', 'User', null]
  },
  // Activation
  isActive: {
    type: Boolean,
    default: false,
    index: true
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    index: true
  },
  // Priority (higher priority policies override lower ones)
  priority: {
    type: Number,
    default: 0,
    index: true
  },
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'active', 'suspended', 'expired', 'archived'],
    default: 'draft',
    index: true
  },
  // Approval workflow
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  // Metadata
  version: {
    type: Number,
    default: 1
  },
  parentPolicy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy'
  },
  tags: [String],
  notes: String
}, {
  timestamps: true
});

// Indexes
policySchema.index({ isActive: 1, startDate: 1, endDate: 1 });
policySchema.index({ policyType: 1, status: 1 });
policySchema.index({ status: 1, priority: -1 });
policySchema.index({ createdAt: -1 });

// Method to check if policy is currently active
policySchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && 
         this.status === 'active' && 
         this.startDate <= now && 
         (!this.endDate || this.endDate >= now);
};

// Method to evaluate policy against context
policySchema.methods.evaluate = function(context) {
  // This is a placeholder - actual evaluation logic would be more complex
  // Context would contain: user, route, trip, booking, etc.
  if (!this.isCurrentlyActive()) {
    return null;
  }
  
  // Check scope
  if (this.scope !== 'statewide') {
    // Validate scope match
    // Implementation depends on context structure
  }
  
  // Evaluate rules against context
  // This would use a rules engine in production
  return {
    applicable: true,
    result: this.rules
  };
};

module.exports = mongoose.model('Policy', policySchema);
