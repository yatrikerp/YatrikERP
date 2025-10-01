const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'trip_assigned',
      'trip_cancelled',
      'trip_delayed',
      'trip_completed',
      'maintenance_due',
      'route_changed',
      'schedule_updated',
      'system_announcement'
    ],
    required: true
  },
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
  data: {
    // Additional data for the notification
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip'
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    },
    busId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus'
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    conductorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conductor'
    },
    routeName: String,
    busNumber: String,
    serviceDate: Date,
    startTime: String,
    endTime: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Notifications expire after 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create trip assignment notification
notificationSchema.statics.createTripAssignmentNotification = async function(userId, tripData) {
  const notification = new this({
    userId: userId,
    type: 'trip_assigned',
    title: 'New Trip Assignment',
    message: `You have been assigned to trip ${tripData.routeName} on ${new Date(tripData.serviceDate).toLocaleDateString()} at ${tripData.startTime}`,
    priority: 'high',
    data: {
      tripId: tripData.tripId,
      routeId: tripData.routeId,
      busId: tripData.busId,
      driverId: tripData.driverId,
      conductorId: tripData.conductorId,
      routeName: tripData.routeName,
      busNumber: tripData.busNumber,
      serviceDate: tripData.serviceDate,
      startTime: tripData.startTime,
      endTime: tripData.endTime
    }
  });
  
  return await notification.save();
};

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to archive
notificationSchema.methods.archive = function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);