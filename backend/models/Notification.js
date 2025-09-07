const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient information
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientRole: {
    type: String,
    enum: ['admin', 'depot_manager', 'depot_supervisor', 'depot_operator', 'driver', 'conductor', 'passenger'],
    required: true
  },
  depotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Depot',
    required: function() {
      return ['depot_manager', 'depot_supervisor', 'depot_operator', 'driver', 'conductor'].includes(this.recipientRole);
    }
  },

  // Notification content
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: [
      'trip_assigned',
      'trip_updated', 
      'trip_cancelled',
      'bus_assigned',
      'bus_maintenance',
      'route_created',
      'route_updated',
      'driver_assigned',
      'conductor_assigned',
      'booking_created',
      'booking_cancelled',
      'payment_received',
      'system_alert',
      'maintenance_due',
      'fuel_low',
      'schedule_change',
      'emergency',
      'general'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Related entities
  relatedEntity: {
    type: {
      type: String,
      enum: ['trip', 'bus', 'route', 'booking', 'driver', 'conductor', 'depot', 'user']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },

  // Action data
  actionData: {
    action: String, // 'view', 'edit', 'approve', 'reject', 'assign'
    url: String,    // Deep link to relevant page
    buttonText: String
  },

  // Status
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  readAt: Date,
  archivedAt: Date,

  // Sender information
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  senderRole: String,

  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // Expiration
  expiresAt: {
    type: Date,
    default: function() {
      // Notifications expire after 30 days by default
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
notificationSchema.index({ recipientId: 1, status: 1 });
notificationSchema.index({ recipientRole: 1, depotId: 1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
});

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  return this.create({
    recipientId: data.recipientId,
    recipientRole: data.recipientRole,
    depotId: data.depotId,
    title: data.title,
    message: data.message,
    type: data.type,
    priority: data.priority || 'medium',
    relatedEntity: data.relatedEntity,
    actionData: data.actionData,
    senderId: data.senderId,
    senderRole: data.senderRole,
    metadata: data.metadata
  });
};

// Static method to get notifications for user
notificationSchema.statics.getUserNotifications = function(userId, role, depotId, options = {}) {
  const query = { recipientId: userId };
  
  // Add depot filter for depot roles
  if (['depot_manager', 'depot_supervisor', 'depot_operator'].includes(role) && depotId) {
    query.$or = [
      { depotId: depotId },
      { recipientRole: role, depotId: { $exists: false } }
    ];
  }

  // Add status filter
  if (options.status) {
    query.status = options.status;
  }

  // Add type filter
  if (options.type) {
    query.type = options.type;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .populate('senderId', 'name email')
    .populate('relatedEntity.id');
};

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Method to archive
notificationSchema.methods.archive = function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
