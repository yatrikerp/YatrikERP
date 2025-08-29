const express = require('express');
const router = express.Router();
const Duty = require('../models/Duty');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const Bus = require('../models/Bus');
const Trip = require('../models/Trip');
const Route = require('../models/Route');
const { auth, requireRole } = require('../middleware/auth');
const { validateDutyData } = require('../middleware/validation');

// Get all duties (admin/depot manager only)
router.get('/', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { 
      depotId, 
      status, 
      driverId, 
      conductorId, 
      busId, 
      date,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20
    } = req.query;

    let query = {};
    
    // Filter by depot (depot managers can only see their depot)
    if (req.user.role === 'depot_manager') {
      query.depotId = req.user.depotId;
    } else if (depotId) {
      query.depotId = depotId;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by driver
    if (driverId) {
      query.driverId = driverId;
    }
    
    // Filter by conductor
    if (conductorId) {
      query.conductorId = conductorId;
    }
    
    // Filter by bus
    if (busId) {
      query.busId = busId;
    }
    
    // Filter by specific date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.scheduledStartTime = { $gte: startOfDay, $lte: endOfDay };
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.scheduledStartTime = { $gte: start, $lte: end };
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { dutyCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const duties = await Duty.find(query)
      .populate('driverId', 'name driverId employeeCode phone')
      .populate('conductorId', 'name conductorId employeeCode phone')
      .populate('busId', 'busNumber registrationNumber capacity')
      .populate('tripId', 'tripCode departureTime arrivalTime')
      .populate('routeId', 'name routeCode origin destination')
      .populate('assignedBy', 'name username role')
      .sort({ scheduledStartTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Duty.countDocuments(query);

    res.json({
      success: true,
      data: duties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get duties error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get duty by ID
router.get('/:id', auth, requireRole(['admin', 'depot_manager', 'driver', 'conductor']), async (req, res) => {
  try {
    const duty = await Duty.findById(req.params.id)
      .populate('driverId', 'name driverId employeeCode phone')
      .populate('conductorId', 'name conductorId employeeCode phone')
      .populate('busId', 'busNumber registrationNumber capacity')
      .populate('tripId', 'tripCode departureTime arrivalTime')
      .populate('routeId', 'name routeCode origin destination stops')
      .populate('assignedBy', 'name username role');

    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found'
      });
    }

    // Check if user has access to this duty
    if (req.user.role === 'driver' && duty.driverId._id.toString() !== req.user.driverId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'conductor' && duty.conductorId._id.toString() !== req.user.conductorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: duty
    });

  } catch (error) {
    console.error('Get duty error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new duty (admin/depot manager only)
router.post('/', auth, requireRole(['admin', 'depot_manager']), validateDutyData, async (req, res) => {
  try {
    const dutyData = req.body;
    
    // Set assigned by
    dutyData.assignedBy = req.user.id;
    
    // Generate duty code
    const depotCode = req.user.role === 'depot_manager' ? req.user.depotCode : 'ADMIN';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    dutyData.dutyCode = `${depotCode}-${date}-${random}`;
    
    // Validate driver availability
    const driver = await Driver.findById(dutyData.driverId);
    if (!driver) {
      return res.status(400).json({
        success: false,
        message: 'Driver not found'
      });
    }
    
    if (driver.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Driver is not active'
      });
    }
    
    // Validate conductor availability (if assigned)
    if (dutyData.conductorId) {
      const conductor = await Conductor.findById(dutyData.conductorId);
      if (!conductor) {
        return res.status(400).json({
          success: false,
          message: 'Conductor not found'
        });
      }
      
      if (conductor.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Conductor is not active'
        });
      }
    }
    
    // Validate bus availability
    const bus = await Bus.findById(dutyData.busId);
    if (!bus) {
      return res.status(400).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    if (bus.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Bus is not active'
      });
    }
    
    // Check for scheduling conflicts
    const conflictQuery = {
      $or: [
        { driverId: dutyData.driverId },
        { conductorId: dutyData.conductorId },
        { busId: dutyData.busId }
      ],
      status: { $in: ['assigned', 'started', 'in-progress', 'on-break'] },
      $or: [
        {
          scheduledStartTime: { $lt: dutyData.scheduledEndTime },
          scheduledEndTime: { $gt: dutyData.scheduledStartTime }
        }
      ]
    };
    
    const conflicts = await Duty.find(conflictQuery);
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Scheduling conflict detected',
        conflicts: conflicts.map(c => ({
          type: c.driverId.toString() === dutyData.driverId ? 'Driver' : 
                c.conductorId.toString() === dutyData.conductorId ? 'Conductor' : 'Bus',
          dutyCode: c.dutyCode,
          scheduledTime: `${c.scheduledStartTime} - ${c.scheduledEndTime}`
        }))
      });
    }
    
    const duty = new Duty(dutyData);
    await duty.save();
    
    // Update driver and conductor current duty
    await Driver.findByIdAndUpdate(dutyData.driverId, {
      currentDuty: duty._id
    });
    
    if (dutyData.conductorId) {
      await Conductor.findByIdAndUpdate(dutyData.conductorId, {
        currentDuty: duty._id
      });
    }
    
    // Update bus status
    await Bus.findByIdAndUpdate(dutyData.busId, {
      assignedDuty: duty._id,
      status: 'assigned'
    });

    res.status(201).json({
      success: true,
      message: 'Duty created successfully',
      data: duty
    });

  } catch (error) {
    console.error('Create duty error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update duty (admin/depot manager only)
router.put('/:id', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const duty = await Duty.findById(id);
    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found'
      });
    }
    
    // Check depot access for depot managers
    if (req.user.role === 'depot_manager' && duty.depotId.toString() !== req.user.depotId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this duty'
      });
    }
    
    // Don't allow updates if duty is already started
    if (duty.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update duty that has already started'
      });
    }
    
    // Remove fields that shouldn't be updated
    delete updateData.dutyCode;
    delete updateData.assignedBy;
    delete updateData.createdAt;
    
    updateData.updatedBy = req.user.id;
    
    const updatedDuty = await Duty.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('driverId', 'name driverId employeeCode phone')
    .populate('conductorId', 'name conductorId employeeCode phone')
    .populate('busId', 'busNumber registrationNumber capacity')
    .populate('tripId', 'tripCode departureTime arrivalTime')
    .populate('routeId', 'name routeCode origin destination');

    res.json({
      success: true,
      message: 'Duty updated successfully',
      data: updatedDuty
    });

  } catch (error) {
    console.error('Update duty error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete duty (admin/depot manager only)
router.delete('/:id', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const duty = await Duty.findById(id);
    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found'
      });
    }
    
    // Check depot access for depot managers
    if (req.user.role === 'depot_manager' && duty.depotId.toString() !== req.user.depotId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this duty'
      });
    }
    
    // Don't allow deletion if duty is already started
    if (duty.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete duty that has already started'
      });
    }
    
    // Remove duty references from driver, conductor, and bus
    if (duty.driverId) {
      await Driver.findByIdAndUpdate(duty.driverId, {
        $unset: { currentDuty: 1 }
      });
    }
    
    if (duty.conductorId) {
      await Conductor.findByIdAndUpdate(duty.conductorId, {
        $unset: { currentDuty: 1 }
      });
    }
    
    if (duty.busId) {
      await Bus.findByIdAndUpdate(duty.busId, {
        $unset: { assignedDuty: 1 },
        status: 'active'
      });
    }
    
    await Duty.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Duty deleted successfully'
    });

  } catch (error) {
    console.error('Delete duty error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get duty statistics (admin/depot manager only)
router.get('/stats/overview', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { depotId, startDate, endDate } = req.query;
    
    let query = {};
    
    // Filter by depot
    if (req.user.role === 'depot_manager') {
      query.depotId = req.user.depotId;
    } else if (depotId) {
      query.depotId = depotId;
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.scheduledStartTime = { $gte: start, $lte: end };
    }
    
    const stats = await Duty.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          assigned: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } },
          started: { $sum: { $cond: [{ $eq: ['$status', 'started'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          onBreak: { $sum: { $cond: [{ $eq: ['$status', 'on-break'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          totalRevenue: { $sum: '$financial.revenue' },
          totalCost: { $sum: '$financial.totalCost' },
          totalDistance: { $sum: '$performance.distance' },
          totalDelays: { $sum: '$performance.delays.total' }
        }
      }
    ]);
    
    // Get today's duties
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayQuery = { ...query, scheduledStartTime: { $gte: today, $lt: tomorrow } };
    const todayDuties = await Duty.countDocuments(todayQuery);
    
    // Get active duties
    const activeQuery = { ...query, status: { $in: ['started', 'in-progress', 'on-break'] } };
    const activeDuties = await Duty.countDocuments(activeQuery);
    
    const result = {
      overview: stats[0] || {
        total: 0,
        assigned: 0,
        started: 0,
        inProgress: 0,
        onBreak: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalDistance: 0,
        totalDelays: 0
      },
      today: todayDuties,
      active: activeDuties,
      profit: (stats[0]?.totalRevenue || 0) - (stats[0]?.totalCost || 0)
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get duty stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get duty performance metrics (admin/depot manager only)
router.get('/stats/performance', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { depotId, startDate, endDate, groupBy = 'day' } = req.query;
    
    let query = {};
    
    // Filter by depot
    if (req.user.role === 'depot_manager') {
      query.depotId = req.user.depotId;
    } else if (depotId) {
      query.depotId = depotId;
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.scheduledStartTime = { $gte: start, $lte: end };
    }
    
    let groupStage;
    if (groupBy === 'day') {
      groupStage = {
        $dateToString: { format: '%Y-%m-%d', date: '$scheduledStartTime' }
      };
    } else if (groupBy === 'week') {
      groupStage = {
        $dateToString: { format: '%Y-W%U', date: '$scheduledStartTime' }
      };
    } else if (groupBy === 'month') {
      groupStage = {
        $dateToString: { format: '%Y-%m', date: '$scheduledStartTime' }
      };
    }
    
    const performance = await Duty.aggregate([
      { $match: query },
      {
        $group: {
          _id: groupStage,
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          onTime: { $sum: { $cond: [{ $lte: ['$performance.delays.total', 0] }, 1, 0] } },
          delayed: { $sum: { $cond: [{ $gt: ['$performance.delays.total', 0] }, 1, 0] } },
          totalRevenue: { $sum: '$financial.revenue' },
          totalCost: { $sum: '$financial.totalCost' },
          totalDistance: { $sum: '$performance.distance' },
          totalDelays: { $sum: '$performance.delays.total' },
          avgDelay: { $avg: '$performance.delays.total' },
          avgRevenue: { $avg: '$financial.revenue' },
          avgCost: { $avg: '$financial.totalCost' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: performance
    });

  } catch (error) {
    console.error('Get performance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get driver duty history (admin/depot manager only)
router.get('/driver/:driverId/history', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { driverId } = req.params;
    const { startDate, endDate, status, limit = 50 } = req.query;
    
    let query = { driverId };
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.scheduledStartTime = { $gte: start, $lte: end };
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    const duties = await Duty.find(query)
      .populate('conductorId', 'name conductorId')
      .populate('busId', 'busNumber registrationNumber')
      .populate('tripId', 'tripCode')
      .populate('routeId', 'name routeCode')
      .sort({ scheduledStartTime: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: duties
    });

  } catch (error) {
    console.error('Get driver duty history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get conductor duty history (admin/depot manager only)
router.get('/conductor/:conductorId/history', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { conductorId } = req.params;
    const { startDate, endDate, status, limit = 50 } = req.query;
    
    let query = { conductorId };
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.scheduledStartTime = { $gte: start, $lte: end };
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    const duties = await Duty.find(query)
      .populate('driverId', 'name driverId')
      .populate('busId', 'busNumber registrationNumber')
      .populate('tripId', 'tripCode')
      .populate('routeId', 'name routeCode')
      .sort({ scheduledStartTime: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: duties
    });

  } catch (error) {
    console.error('Get conductor duty history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update duty location (driver/conductor only)
router.post('/:id/location', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy, timestamp } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    const duty = await Duty.findById(id);
    if (!duty) {
      return res.status(404).json({
        success: false,
        message: 'Duty not found'
      });
    }
    
    // Check if user has access to this duty
    if (req.user.role === 'driver' && duty.driverId.toString() !== req.user.driverId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (req.user.role === 'conductor' && duty.conductorId.toString() !== req.user.conductorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Update current location
    duty.currentLocation = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy || 0,
      lastUpdated: new Date(timestamp || Date.now())
    };
    
    // Add to location history
    duty.locationHistory.push({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy || 0,
      timestamp: new Date(timestamp || Date.now()),
      updatedBy: req.user.role === 'driver' ? req.user.driverId : req.user.conductorId
    });
    
    // Keep only last 100 location updates
    if (duty.locationHistory.length > 100) {
      duty.locationHistory = duty.locationHistory.slice(-100);
    }
    
    await duty.save();
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      data: duty.currentLocation
    });
    
  } catch (error) {
    console.error('Update duty location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Bulk duty assignment (admin/depot manager only)
router.post('/bulk-assign', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { duties } = req.body;
    
    if (!Array.isArray(duties) || duties.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Duties array is required and must not be empty'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const dutyData of duties) {
      try {
        // Validate duty data
        if (!dutyData.driverId || !dutyData.busId || !dutyData.tripId || !dutyData.routeId) {
          errors.push({
            duty: dutyData,
            error: 'Missing required fields'
          });
          continue;
        }
        
        // Set assigned by
        dutyData.assignedBy = req.user.id;
        
        // Generate duty code
        const depotCode = req.user.role === 'depot_manager' ? req.user.depotCode : 'ADMIN';
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        dutyData.dutyCode = `${depotCode}-${date}-${random}`;
        
        // Check for conflicts
        const conflictQuery = {
          $or: [
            { driverId: dutyData.driverId },
            { conductorId: dutyData.conductorId },
            { busId: dutyData.busId }
          ],
          status: { $in: ['assigned', 'started', 'in-progress', 'on-break'] },
          $or: [
            {
              scheduledStartTime: { $lt: dutyData.scheduledEndTime },
              scheduledEndTime: { $gt: dutyData.scheduledStartTime }
            }
          ]
        };
        
        const conflicts = await Duty.find(conflictQuery);
        if (conflicts.length > 0) {
          errors.push({
            duty: dutyData,
            error: 'Scheduling conflict detected'
          });
          continue;
        }
        
        const duty = new Duty(dutyData);
        await duty.save();
        
        // Update references
        await Driver.findByIdAndUpdate(dutyData.driverId, {
          currentDuty: duty._id
        });
        
        if (dutyData.conductorId) {
          await Conductor.findByIdAndUpdate(dutyData.conductorId, {
            currentDuty: duty._id
          });
        }
        
        await Bus.findByIdAndUpdate(dutyData.busId, {
          assignedDuty: duty._id,
          status: 'assigned'
        });
        
        results.push({
          duty: duty,
          success: true
        });
        
      } catch (error) {
        errors.push({
          duty: dutyData,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Bulk assignment completed. ${results.length} successful, ${errors.length} failed.`,
      data: {
        successful: results,
        failed: errors
      }
    });

  } catch (error) {
    console.error('Bulk duty assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
