const mongoose = require('mongoose');

/**
 * Attendance Audit Log Model
 * Immutable record of all attendance actions
 * Matches Kerala RTC audit requirements
 */
const attendanceAuditLogSchema = new mongoose.Schema({
  attendanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver.attendance',
    required: false, // Optional - may not be available for new attendance records
    index: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  staffType: {
    type: String,
    enum: ['driver', 'conductor'],
    required: true
  },
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  actionType: {
    type: String,
    enum: ['MARK_PRESENT', 'MARK_ABSENT', 'CONVERT_TO_LEAVE', 'UPDATE'],
    required: true
  },
  oldStatus: {
    type: String,
    enum: ['not_marked', 'present', 'absent', 'leave', 'late', 'half-day', 'overtime'],
    default: null
  },
  newStatus: {
    type: String,
    enum: ['present', 'absent', 'leave', 'late', 'half-day', 'overtime'],
    required: true
  },
  reason: {
    type: String,
    default: null // Required for CONVERT_TO_LEAVE
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedRole: {
    type: String,
    required: true
  },
  performedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  deviceInfo: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
attendanceAuditLogSchema.index({ depotId: 1, date: -1 });
attendanceAuditLogSchema.index({ staffId: 1, date: -1 });
attendanceAuditLogSchema.index({ actionType: 1, performedAt: -1 });
attendanceAuditLogSchema.index({ performedBy: 1, performedAt: -1 });

// Prevent updates and deletes (immutable)
attendanceAuditLogSchema.pre('save', function(next) {
  if (this.isNew) {
    return next();
  }
  // Prevent updates to existing audit logs
  return next(new Error('Audit logs are immutable and cannot be modified'));
});

attendanceAuditLogSchema.pre('remove', function(next) {
  return next(new Error('Audit logs cannot be deleted'));
});

module.exports = mongoose.model('AttendanceAuditLog', attendanceAuditLogSchema);
