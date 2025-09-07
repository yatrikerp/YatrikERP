const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const BusSchedule = require('../models/BusSchedule');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const Depot = require('../models/Depot');
const NotificationService = require('../services/notificationService');

// Helper function to create role-based auth middleware
const authRole = (roles) => [auth, requireRole(roles)];

// Allow both admin and depot roles to access bus scheduling
const scheduleAuth = authRole(['admin', 'depot_manager', 'depot_supervisor', 'depot_operator', 'manager', 'supervisor', 'operator']);

// Apply auth to all routes
router.use(scheduleAuth);

// GET /api/bus-schedule - Get all bus schedules
router.get('/', async (req, res) => {
  try {
    const { 
      depotId, 
      status = 'active', 
      date, 
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    const query = {};

    // Filter by depot if user is depot role
    if (req.user.role !== 'admin' && req.user.depotId) {
      query.depotId = req.user.depotId;
    } else if (depotId) {
      query.depotId = depotId;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Filter by date
    if (date) {
      const targetDate = new Date(date);
      query.$or = [
        { isRecurring: true, daysOfWeek: { $in: [getDayName(targetDate)] } },
        { customDates: { $in: [targetDate] } }
      ];
    }

    // Search functionality
    if (search) {
      query.$or = [
        { scheduleName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const schedules = await BusSchedule.find(query)
      .populate('busId', 'busNumber busType registrationNumber capacity')
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('driverId', 'name phone licenseNumber')
      .populate('conductorId', 'name phone employeeId')
      .populate('depotId', 'depotName location')
      .populate('createdBy', 'name email')
      .sort({ departureTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BusSchedule.countDocuments(query);

    res.json({
      success: true,
      data: {
        schedules,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get bus schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bus schedules',
      error: error.message
    });
  }
});

// GET /api/bus-schedule/:id - Get specific bus schedule
router.get('/:id', async (req, res) => {
  try {
    const schedule = await BusSchedule.findById(req.params.id)
      .populate('busId', 'busNumber busType registrationNumber capacity')
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('driverId', 'name phone licenseNumber')
      .populate('conductorId', 'name phone employeeId')
      .populate('depotId', 'depotName location')
      .populate('createdBy', 'name email');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Bus schedule not found'
      });
    }

    // Check if user has access to this schedule
    if (req.user.role !== 'admin' && schedule.depotId.toString() !== req.user.depotId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this schedule.'
      });
    }

    res.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('Get bus schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bus schedule',
      error: error.message
    });
  }
});

// POST /api/bus-schedule - Create new bus schedule
router.post('/', async (req, res) => {
  try {
    const {
      scheduleName,
      description,
      busId,
      routeId,
      departureTime,
      arrivalTime,
      duration,
      frequency,
      daysOfWeek,
      customDates,
      driverId,
      conductorId,
      baseFare,
      maxCapacity,
      validFrom,
      validUntil,
      isRecurring,
      recurrencePattern,
      recurrenceInterval,
      specialInstructions,
      weatherDependent,
      holidaySchedule
    } = req.body;

    // Validate required fields
    if (!scheduleName || !busId || !routeId || !departureTime || !arrivalTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: scheduleName, busId, routeId, departureTime, arrivalTime'
      });
    }

    // Get depot ID
    let depotId = req.user.depotId;
    if (req.user.role === 'admin' && req.body.depotId) {
      depotId = req.body.depotId;
    }

    if (!depotId) {
      return res.status(400).json({
        success: false,
        message: 'Depot ID is required'
      });
    }

    // Verify bus belongs to depot
    const bus = await Bus.findById(busId);
    if (!bus || bus.depotId.toString() !== depotId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bus does not belong to the specified depot'
      });
    }

    // Verify route belongs to depot
    const route = await Route.findById(routeId);
    if (!route || route.depot.depotId.toString() !== depotId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Route does not belong to the specified depot'
      });
    }

    // Create schedule
    const schedule = new BusSchedule({
      scheduleName,
      description,
      busId,
      routeId,
      depotId,
      departureTime,
      arrivalTime,
      duration: duration || calculateDuration(departureTime, arrivalTime),
      frequency: frequency || 'daily',
      daysOfWeek: daysOfWeek || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      customDates,
      driverId,
      conductorId,
      baseFare: baseFare || 0,
      maxCapacity: maxCapacity || bus.capacity,
      availableSeats: maxCapacity || bus.capacity,
      validFrom: validFrom || new Date(),
      validUntil,
      isRecurring: isRecurring || false,
      recurrencePattern: recurrencePattern || 'daily',
      recurrenceInterval: recurrenceInterval || 1,
      specialInstructions,
      weatherDependent: weatherDependent || false,
      holidaySchedule: holidaySchedule || false,
      createdBy: req.user._id
    });

    await schedule.save();

    // Populate the response
    const populatedSchedule = await BusSchedule.findById(schedule._id)
      .populate('busId', 'busNumber busType registrationNumber capacity')
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('driverId', 'name phone licenseNumber')
      .populate('conductorId', 'name phone employeeId')
      .populate('depotId', 'depotName location');

    // Send notification to depot users
    try {
      await NotificationService.createDepotNotification(depotId, {
        title: 'New Bus Schedule Created',
        message: `A new bus schedule "${scheduleName}" has been created for ${populatedSchedule.routeId?.routeName || 'Unknown Route'}`,
        type: 'schedule_change',
        priority: 'medium',
        relatedEntity: {
          type: 'schedule',
          id: schedule._id
        },
        actionData: {
          action: 'view',
          url: `/bus-schedule/${schedule._id}`,
          buttonText: 'View Schedule'
        },
        senderId: req.user._id,
        senderRole: req.user.role
      });
    } catch (notificationError) {
      console.error('Failed to send schedule notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Bus schedule created successfully',
      data: populatedSchedule
    });

  } catch (error) {
    console.error('Create bus schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bus schedule',
      error: error.message
    });
  }
});

// PUT /api/bus-schedule/:id - Update bus schedule
router.put('/:id', async (req, res) => {
  try {
    const schedule = await BusSchedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Bus schedule not found'
      });
    }

    // Check if user has access to this schedule
    if (req.user.role !== 'admin' && schedule.depotId.toString() !== req.user.depotId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to update this schedule.'
      });
    }

    // Update schedule
    const updatedSchedule = await BusSchedule.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        lastModifiedBy: req.user._id
      },
      { new: true, runValidators: true }
    )
      .populate('busId', 'busNumber busType registrationNumber capacity')
      .populate('routeId', 'routeName routeNumber startingPoint endingPoint')
      .populate('driverId', 'name phone licenseNumber')
      .populate('conductorId', 'name phone employeeId')
      .populate('depotId', 'depotName location');

    res.json({
      success: true,
      message: 'Bus schedule updated successfully',
      data: updatedSchedule
    });

  } catch (error) {
    console.error('Update bus schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bus schedule',
      error: error.message
    });
  }
});

// DELETE /api/bus-schedule/:id - Delete bus schedule
router.delete('/:id', async (req, res) => {
  try {
    const schedule = await BusSchedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Bus schedule not found'
      });
    }

    // Check if user has access to this schedule
    if (req.user.role !== 'admin' && schedule.depotId.toString() !== req.user.depotId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to delete this schedule.'
      });
    }

    await BusSchedule.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Bus schedule deleted successfully'
    });

  } catch (error) {
    console.error('Delete bus schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bus schedule',
      error: error.message
    });
  }
});

// GET /api/bus-schedule/date/:date - Get schedules for specific date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const schedules = await BusSchedule.getSchedulesForDate(date, req.user.depotId);

    res.json({
      success: true,
      data: schedules
    });

  } catch (error) {
    console.error('Get schedules for date error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedules for date',
      error: error.message
    });
  }
});

// Helper function to get day name
function getDayName(date) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayNames[date.getDay()];
}

// Helper function to calculate duration
function calculateDuration(departureTime, arrivalTime) {
  const [depHour, depMin] = departureTime.split(':').map(Number);
  const [arrHour, arrMin] = arrivalTime.split(':').map(Number);
  
  const depMinutes = depHour * 60 + depMin;
  const arrMinutes = arrHour * 60 + arrMin;
  
  return arrMinutes - depMinutes;
}

module.exports = router;
