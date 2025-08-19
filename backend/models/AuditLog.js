const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actorRole: {
    type: String,
    required: true,
    enum: ['ADMIN', 'DEPOT_MANAGER', 'CONDUCTOR', 'DRIVER', 'PASSENGER']
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE', 'SUSPEND',
      'ROLE_CHANGE', 'PASSWORD_RESET', 'FORCE_LOGOUT', 'ASSIGN_CREW',
      'REASSIGN_DRIVER', 'FORCE_CLOSE_DUTY', 'CANCEL_TICKET', 'RELEASE_LOCK',
      'TOGGLE_MAINTENANCE', 'UPDATE_CONFIG', 'UPDATE_FARE_POLICY'
    ]
  },
  target: {
    collection: {
      type: String,
      required: true
    },
    id: {
      type: String,
      required: true
    }
  },
  before: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  after: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ip: {
    type: String,
    required: true
  },
  ua: {
    type: String,
    required: true
  },
  at: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient querying
auditLogSchema.index({ at: -1 });
auditLogSchema.index({ actorId: 1, at: -1 });
auditLogSchema.index({ 'target.collection': 1, 'target.id': 1 });
auditLogSchema.index({ action: 1, at: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
