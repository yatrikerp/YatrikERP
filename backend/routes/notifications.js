const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const mockNotifications = generateMockNotifications(userRole, userId);

    res.json({
      success: true,
      notifications: mockNotifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

function generateMockNotifications(userRole, userId) {
  const baseNotifications = [
    {
      id: '1',
      type: 'info',
      title: 'System Update',
      message: 'Yatrik ERP v2.1.0 deployed',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      priority: 'low',
      read: false
    }
  ];

  switch (userRole) {
    case 'admin':
      return [
        ...baseNotifications,
        {
          id: '2',
          type: 'warning',
          title: 'Depot Alert',
          message: 'Mumbai Central performance below target',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          priority: 'medium',
          read: false
        },
        {
          id: '3',
          type: 'success',
          title: 'Revenue Target',
          message: 'Monthly target exceeded by 15%',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          priority: 'low',
          read: true
        }
      ];

    case 'depot_manager':
      return [
        ...baseNotifications,
        {
          id: '2',
          type: 'warning',
          title: 'Maintenance Due',
          message: 'Bus MH-12-AB-1234 needs service',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          priority: 'medium',
          read: false
        },
        {
          id: '3',
          type: 'info',
          title: 'New Route',
          message: 'Route MPE-001 assigned to depot',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          priority: 'low',
          read: true
        }
      ];

    case 'driver':
      return [
        ...baseNotifications,
        {
          id: '2',
          type: 'schedule',
          title: 'Duty Update',
          message: 'Tomorrow\'s schedule updated',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          priority: 'medium',
          read: false
        },
        {
          id: '3',
          type: 'info',
          title: 'Route Change',
          message: 'Route MPE-001 modified',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          priority: 'high',
          read: true
        }
      ];

    case 'conductor':
      return [
        ...baseNotifications,
        {
          id: '2',
          type: 'schedule',
          title: 'Duty Assignment',
          message: 'Assigned to Trip T001 tomorrow',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          priority: 'medium',
          read: false
        },
        {
          id: '3',
          type: 'info',
          title: 'Ticket System',
          message: 'New validation features available',
          timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000),
          priority: 'low',
          read: true
        }
      ];

    case 'passenger':
      return [
        ...baseNotifications,
        {
          id: '2',
          type: 'delay',
          title: 'Trip Delay',
          message: 'Trip T001 delayed by 15 minutes',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          priority: 'medium',
          read: false
        },
        {
          id: '3',
          type: 'success',
          title: 'Booking Confirmed',
          message: 'Mumbai-Pune route confirmed',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          priority: 'low',
          read: true
        }
      ];

    default:
      return baseNotifications;
  }
}

module.exports = router;
