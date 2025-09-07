const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const NotificationService = require('../services/notificationService');
const Notification = require('../models/Notification');

// Apply authentication to all routes
router.use(auth);

// GET /api/notifications - Get user notifications
router.get('/', async (req, res) => {
  try {
    const { status, type, limit = 50, page = 1 } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;
    const depotId = req.user.depotId;

    const options = {
      status,
      type,
      limit: parseInt(limit),
      page: parseInt(page)
    };

    const notifications = await NotificationService.getUserNotifications(
      userId, 
      userRole, 
      depotId, 
      options
    );

    // Get total count for pagination
    const totalCount = await NotificationService.getNotificationCount(
      userId, 
      userRole, 
      depotId
    );

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// GET /api/notifications/count - Get notification count
router.get('/count', async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const depotId = req.user.depotId;

    const count = await NotificationService.getNotificationCount(
      userId, 
      userRole, 
      depotId
    );

    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification count',
      error: error.message
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await NotificationService.markAsRead(id, userId);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await NotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount }
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// PUT /api/notifications/:id/archive - Archive notification
router.put('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await NotificationService.archiveNotification(id, userId);

    res.json({
      success: true,
      message: 'Notification archived',
      data: notification
    });

  } catch (error) {
    console.error('Archive notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive notification',
      error: error.message
    });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipientId: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// GET /api/notifications/types - Get notification types
router.get('/types', (req, res) => {
  const types = [
    { value: 'trip_assigned', label: 'Trip Assigned', icon: 'bus' },
    { value: 'trip_updated', label: 'Trip Updated', icon: 'edit' },
    { value: 'trip_cancelled', label: 'Trip Cancelled', icon: 'x-circle' },
    { value: 'bus_assigned', label: 'Bus Assigned', icon: 'truck' },
    { value: 'bus_maintenance', label: 'Bus Maintenance', icon: 'wrench' },
    { value: 'route_created', label: 'Route Created', icon: 'map' },
    { value: 'route_updated', label: 'Route Updated', icon: 'map-pin' },
    { value: 'driver_assigned', label: 'Driver Assigned', icon: 'user' },
    { value: 'conductor_assigned', label: 'Conductor Assigned', icon: 'users' },
    { value: 'booking_created', label: 'Booking Created', icon: 'calendar' },
    { value: 'booking_cancelled', label: 'Booking Cancelled', icon: 'calendar-x' },
    { value: 'payment_received', label: 'Payment Received', icon: 'credit-card' },
    { value: 'system_alert', label: 'System Alert', icon: 'alert-triangle' },
    { value: 'maintenance_due', label: 'Maintenance Due', icon: 'clock' },
    { value: 'fuel_low', label: 'Fuel Low', icon: 'droplet' },
    { value: 'schedule_change', label: 'Schedule Change', icon: 'calendar-clock' },
    { value: 'emergency', label: 'Emergency', icon: 'alert-circle' },
    { value: 'general', label: 'General', icon: 'info' }
  ];

  res.json({
    success: true,
    data: types
  });
});

// POST /api/notifications/test - Test notification (admin only)
router.post('/test', requireRole(['admin']), async (req, res) => {
  try {
    const { depotId, type = 'general', message } = req.body;

    if (!depotId) {
      return res.status(400).json({
        success: false,
        message: 'Depot ID is required'
      });
    }

    const notifications = await NotificationService.createDepotNotification(depotId, {
      title: 'Test Notification',
      message: message || 'This is a test notification',
      type: type,
          priority: 'medium',
      senderId: req.user._id,
      senderRole: req.user.role
    });

    res.json({
      success: true,
      message: 'Test notification sent',
      data: { count: notifications.length }
    });

  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
});

// POST /api/notifications/send-trip-assignment - Send trip assignment notification (admin only)
router.post('/send-trip-assignment', requireRole(['admin']), async (req, res) => {
  try {
    const { depotId, tripId, routeName } = req.body;

    if (!depotId || !tripId) {
      return res.status(400).json({
        success: false,
        message: 'Depot ID and Trip ID are required'
      });
    }

    const notifications = await NotificationService.createDepotNotification(depotId, {
      title: 'New Trip Assigned',
      message: `A new trip has been assigned to your depot. Route: ${routeName || 'Unknown Route'}`,
      type: 'trip_assigned',
      priority: 'high',
      relatedEntity: {
        type: 'trip',
        id: tripId
      },
      actionData: {
        action: 'view',
        url: `/depot/trips/${tripId}`,
        buttonText: 'View Trip'
      },
      senderId: req.user._id,
      senderRole: req.user.role
    });

    res.json({
      success: true,
      message: 'Trip assignment notification sent',
      data: { count: notifications.length }
    });

  } catch (error) {
    console.error('Trip assignment notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send trip assignment notification',
      error: error.message
    });
  }
});

module.exports = router;