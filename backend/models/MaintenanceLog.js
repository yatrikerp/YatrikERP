const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
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
  issueType: {
    type: String,
    required: true,
    enum: ['fuel', 'tyre', 'engine', 'electrical', 'body', 'transmission', 'brakes', 'other']
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved'],
    default: 'open'
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  // Additional fields for better tracking
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  parts: [{
    name: String,
    quantity: Number,
    cost: Number
  }],
  notes: [{
    text: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
maintenanceLogSchema.index({ busId: 1, status: 1 });
maintenanceLogSchema.index({ depotId: 1, reportedAt: -1 });
maintenanceLogSchema.index({ status: 1, priority: 1 });
maintenanceLogSchema.index({ issueType: 1 });

// Virtual for duration (if resolved)
maintenanceLogSchema.virtual('duration').get(function() {
  if (this.resolvedAt && this.reportedAt) {
    return Math.ceil((this.resolvedAt - this.reportedAt) / (1000 * 60 * 60 * 24)); // days
  }
  return null;
});

// Instance method to resolve the maintenance log
maintenanceLogSchema.methods.resolve = function(resolvedBy) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.notes.push({
    text: `Maintenance resolved by ${resolvedBy}`,
    createdBy: resolvedBy,
    createdAt: new Date()
  });
  return this.save();
};

// Static method to get maintenance stats
maintenanceLogSchema.statics.getStats = async function(depotId = null) {
  const matchStage = depotId ? { depotId } : {};

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalLogs: { $sum: 1 },
        openLogs: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        resolvedLogs: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        totalCost: { $sum: '$cost' },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $and: ['$resolvedAt', '$reportedAt'] },
              { $divide: [{ $subtract: ['$resolvedAt', '$reportedAt'] }, 1000 * 60 * 60 * 24] },
              null
            ]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
