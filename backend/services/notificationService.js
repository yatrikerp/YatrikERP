const Notification = require('../models/Notification');
const User = require('../models/User');
const Depot = require('../models/Depot');

class NotificationService {
  // Create notification for specific user
  static async createUserNotification(data) {
    try {
      const notification = await Notification.createNotification(data);
      return notification;
    } catch (error) {
      console.error('Error creating user notification:', error);
      throw error;
    }
  }

  // Create notification for all users in a depot
  static async createDepotNotification(depotId, data) {
    try {
      // Get all users in the depot
      const depotUsers = await User.find({
        depotId: depotId,
        role: { $in: ['depot_manager', 'depot_supervisor', 'depot_operator'] }
      });

      const notifications = [];
      for (const user of depotUsers) {
        const notification = await Notification.createNotification({
          ...data,
          recipientId: user._id,
          recipientRole: user.role,
          depotId: depotId
        });
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating depot notification:', error);
      throw error;
    }
  }

  // Create notification for all admins
  static async createAdminNotification(data) {
    try {
      const admins = await User.find({ role: 'admin' });
      const notifications = [];

      for (const admin of admins) {
        const notification = await Notification.createNotification({
          ...data,
          recipientId: admin._id,
          recipientRole: 'admin'
        });
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating admin notification:', error);
      throw error;
    }
  }

  // Create system-wide notification (for admins and system events)
  static async createSystemNotification(data) {
    try {
      // Create notification for all admins
      const admins = await User.find({ role: 'admin' });
      const notifications = [];

      for (const admin of admins) {
        const notification = await Notification.createNotification({
          ...data,
          recipientId: admin._id,
          recipientRole: 'admin',
          type: data.type || 'system_announcement',
          priority: data.priority || 'medium'
        });
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating system notification:', error);
      throw error;
    }
  }

  // Trip assignment notification
  static async notifyTripAssignment(trip, depotId, assignedBy) {
    const depot = await Depot.findById(depotId);
    
    return await this.createDepotNotification(depotId, {
      title: 'New Trip Assigned',
      message: `A new trip has been assigned to ${depot?.depotName || 'your depot'}. Route: ${trip.routeId?.routeName || 'Unknown Route'}`,
      type: 'trip_assigned',
      priority: 'high',
      relatedEntity: {
        type: 'trip',
        id: trip._id
      },
      actionData: {
        action: 'view',
        url: `/depot/trips/${trip._id}`,
        buttonText: 'View Trip'
      },
      senderId: assignedBy._id,
      senderRole: assignedBy.role,
      metadata: {
        tripId: trip._id,
        routeName: trip.routeId?.routeName,
        departureTime: trip.startTime,
        serviceDate: trip.serviceDate
      }
    });
  }

  // Trip update notification
  static async notifyTripUpdate(trip, depotId, updatedBy, changes) {
    const depot = await Depot.findById(depotId);
    
    return await this.createDepotNotification(depotId, {
      title: 'Trip Updated',
      message: `Trip ${trip.routeId?.routeName || 'Unknown Route'} has been updated. Changes: ${changes.join(', ')}`,
      type: 'trip_updated',
      priority: 'medium',
      relatedEntity: {
        type: 'trip',
        id: trip._id
      },
      actionData: {
        action: 'view',
        url: `/depot/trips/${trip._id}`,
        buttonText: 'View Trip'
      },
      senderId: updatedBy._id,
      senderRole: updatedBy.role,
      metadata: {
        tripId: trip._id,
        changes: changes
      }
    });
  }

  // Bus assignment notification
  static async notifyBusAssignment(bus, depotId, assignedBy) {
    const depot = await Depot.findById(depotId);
    
    return await this.createDepotNotification(depotId, {
      title: 'New Bus Assigned',
      message: `A new bus ${bus.busNumber} has been assigned to ${depot?.depotName || 'your depot'}`,
      type: 'bus_assigned',
      priority: 'medium',
      relatedEntity: {
        type: 'bus',
        id: bus._id
      },
      actionData: {
        action: 'view',
        url: `/depot/fleet/${bus._id}`,
        buttonText: 'View Bus'
      },
      senderId: assignedBy._id,
      senderRole: assignedBy.role,
      metadata: {
        busId: bus._id,
        busNumber: bus.busNumber,
        busType: bus.busType
      }
    });
  }

  // Route assignment notification
  static async notifyRouteAssignment(bus, route, depotId, assignedBy) {
    const depot = await Depot.findById(depotId);
    
    return await this.createDepotNotification(depotId, {
      title: 'Route Assigned to Bus',
      message: `Route ${route.routeName} (${route.routeNumber}) has been assigned to bus ${bus.busNumber}`,
      type: 'route_assigned',
      priority: 'medium',
      relatedEntity: {
        type: 'bus',
        id: bus._id
      },
      actionData: {
        action: 'view',
        url: `/depot/fleet/${bus._id}`,
        buttonText: 'View Bus'
      },
      senderId: assignedBy._id,
      senderRole: assignedBy.role,
      metadata: {
        busId: bus._id,
        busNumber: bus.busNumber,
        routeId: route._id,
        routeName: route.routeName,
        routeNumber: route.routeNumber
      }
    });
  }

  // Route creation notification
  static async notifyRouteCreation(route, depotId, createdBy) {
    const depot = await Depot.findById(depotId);
    
    return await this.createDepotNotification(depotId, {
      title: 'New Route Created',
      message: `A new route ${route.routeName} has been created for ${depot?.depotName || 'your depot'}`,
      type: 'route_created',
      priority: 'medium',
      relatedEntity: {
        type: 'route',
        id: route._id
      },
      actionData: {
        action: 'view',
        url: `/depot/routes/${route._id}`,
        buttonText: 'View Route'
      },
      senderId: createdBy._id,
      senderRole: createdBy.role,
      metadata: {
        routeId: route._id,
        routeName: route.routeName,
        startingPoint: route.startingPoint?.city,
        endingPoint: route.endingPoint?.city
      }
    });
  }

  // Maintenance due notification
  static async notifyMaintenanceDue(bus, depotId) {
    const depot = await Depot.findById(depotId);
    
    return await this.createDepotNotification(depotId, {
      title: 'Maintenance Due',
      message: `Bus ${bus.busNumber} is due for maintenance`,
      type: 'maintenance_due',
      priority: 'high',
      relatedEntity: {
        type: 'bus',
        id: bus._id
      },
      actionData: {
        action: 'view',
        url: `/depot/fleet/${bus._id}`,
        buttonText: 'Schedule Maintenance'
      },
      metadata: {
        busId: bus._id,
        busNumber: bus.busNumber,
        lastService: bus.maintenance?.lastService
      }
    });
  }

  // Driver assignment notification
  static async notifyDriverAssignment(driver, trip, depotId, assignedBy) {
    const depot = await Depot.findById(depotId);
    
    return await this.createDepotNotification(depotId, {
      title: 'Driver Assigned to Trip',
      message: `${driver.name} has been assigned to trip ${trip.routeId?.routeName || 'Unknown Route'}`,
      type: 'driver_assigned',
      priority: 'medium',
      relatedEntity: {
        type: 'trip',
        id: trip._id
      },
      actionData: {
        action: 'view',
        url: `/depot/trips/${trip._id}`,
        buttonText: 'View Trip'
      },
      senderId: assignedBy._id,
      senderRole: assignedBy.role,
      metadata: {
        driverId: driver._id,
        driverName: driver.name,
        tripId: trip._id
      }
    });
  }

  // Get notifications for user
  static async getUserNotifications(userId, role, depotId, options = {}) {
    try {
      return await Notification.getUserNotifications(userId, role, depotId, options);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipientId: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      return await notification.markAsRead();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for user
  static async markAllAsRead(userId) {
    try {
      return await Notification.updateMany(
        { recipientId: userId, status: 'unread' },
        { status: 'read', readAt: new Date() }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get notification count for user
  static async getNotificationCount(userId, role, depotId) {
    try {
      const query = { recipientId: userId, status: 'unread' };
      
      if (['depot_manager', 'depot_supervisor', 'depot_operator'].includes(role) && depotId) {
        query.$or = [
          { depotId: depotId },
          { recipientRole: role, depotId: { $exists: false } }
        ];
      }

      return await Notification.countDocuments(query);
    } catch (error) {
      console.error('Error getting notification count:', error);
      throw error;
    }
  }

  // Archive notification
  static async archiveNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipientId: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      return await notification.archive();
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
