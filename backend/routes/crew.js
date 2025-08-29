const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Crew = require('../models/Crew');
const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Middleware to ensure user has depot access
const requireDepotAccess = (req, res, next) => {
  if (!['depot_manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Depot access required.' });
  }
  next();
};

// Assign crew to a trip
router.post('/assign', auth, requireDepotAccess, async (req, res) => {
  try {
    const {
      tripId,
      driverId,
      conductorId,
      busId,
      dutyStartTime,
      dutyEndTime,
      notes
    } = req.body;
    
    if (!tripId || !driverId || !conductorId || !busId || !dutyStartTime) {
      return res.status(400).json({ message: 'Trip ID, driver ID, conductor ID, bus ID, and duty start time are required' });
    }
    
    // Verify trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    
    // Verify driver and conductor exist and have correct roles
    const driver = await User.findById(driverId);
    const conductor = await User.findById(conductorId);
    
    if (!driver || driver.role !== 'driver') {
      return res.status(400).json({ message: 'Invalid driver ID or user is not a driver' });
    }
    
    if (!conductor || conductor.role !== 'conductor') {
      return res.status(400).json({ message: 'Invalid conductor ID or user is not a conductor' });
    }
    
    // Verify bus exists and belongs to user's depot
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    
    if (req.user.role === 'depot_manager' && bus.depotId.toString() !== req.user.depotId.toString()) {
      return res.status(403).json({ message: 'Not authorized to assign crew for this bus' });
    }
    
    // Check if driver or conductor already has duty at this time
    const existingDriverDuty = await Crew.findOne({
      driverId,
      dutyStartTime: { $lt: dutyEndTime },
      dutyEndTime: { $gt: dutyStartTime },
      status: { $in: ['assigned', 'started', 'in_progress'] }
    });
    
    if (existingDriverDuty) {
      return res.status(400).json({ message: 'Driver already has duty during this time period' });
    }
    
    const existingConductorDuty = await Crew.findOne({
      conductorId,
      dutyStartTime: { $lt: dutyEndTime },
      dutyEndTime: { $gt: dutyStartTime },
      status: { $in: ['assigned', 'started', 'in_progress'] }
    });
    
    if (existingConductorDuty) {
      return res.status(400).json({ message: 'Conductor already has duty during this time period' });
    }
    
    // Check if bus is available
    const existingBusDuty = await Crew.findOne({
      busId,
      dutyStartTime: { $lt: dutyEndTime },
      dutyEndTime: { $gt: dutyStartTime },
      status: { $in: ['assigned', 'started', 'in_progress'] }
    });
    
    if (existingBusDuty) {
      return res.status(400).json({ message: 'Bus already assigned to duty during this time period' });
    }
    
    // Create crew assignment
    const crew = await Crew.create({
      tripId,
      driverId,
      conductorId,
      depotId: bus.depotId,
      busId,
      dutyStartTime,
      dutyEndTime,
      notes,
      assignedBy: req.user._id
    });
    
    // Update bus assignment
    await Bus.findByIdAndUpdate(busId, {
      assignedDriver: driverId,
      assignedConductor: conductorId,
      currentTrip: tripId
    });
    
    // Log audit
    await AuditLog.create({
      userId: req.user._id,
      action: 'crew_assigned',
      resource: 'crew',
      resourceId: crew._id,
      details: { 
        tripId,
        driverId,
        conductorId,
        busId,
        dutyStartTime,
        dutyEndTime
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Crew assigned successfully',
      data: crew
    });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning crew', error: error.message });
  }
});

// Get crew assignments for a depot
router.get('/depot/:depotId', auth, requireDepotAccess, async (req, res) => {
  try {
    const { depotId } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    
    // Verify user has access to this depot
    if (req.user.role === 'depot_manager' && req.user.depotId.toString() !== depotId) {
      return res.status(403).json({ message: 'Not authorized to view crew assignments for this depot' });
    }
    
    const query = { depotId };
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Date range filter
    if (startDate && endDate) {
      query.dutyStartTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const crews = await Crew.find(query)
      .populate('tripId', 'routeId departureTime arrivalTime')
      .populate('routeId', 'name origin destination')
      .populate('busId', 'busNumber registrationNumber')
      .populate('driverId', 'name phone')
      .populate('conductorId', 'name phone')
      .populate('assignedBy', 'name')
      .sort({ dutyStartTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Crew.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        crews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching crew assignments', error: error.message });
  }
});

// Get crew assignments for a specific trip
router.get('/trip/:tripId', auth, requireDepotAccess, async (req, res) => {
  try {
    const { tripId } = req.params;
    
    const crews = await Crew.find({ tripId })
      .populate('driverId', 'name phone')
      .populate('conductorId', 'name phone')
      .populate('busId', 'busNumber registrationNumber')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: crews
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching crew assignments for trip', error: error.message });
  }
});

// Update crew assignment
router.put('/:crewId', auth, requireDepotAccess, async (req, res) => {
  try {
    const { crewId } = req.params;
    const updateData = req.body;
    
    const crew = await Crew.findById(crewId);
    if (!crew) {
      return res.status(404).json({ message: 'Crew assignment not found' });
    }
    
    // Verify user has access
    if (req.user.role === 'depot_manager' && crew.depotId.toString() !== req.user.depotId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this crew assignment' });
    }
    
    // Store original data for audit
    const originalData = crew.toObject();
    
    // Update crew assignment
    Object.assign(crew, updateData);
    await crew.save();
    
    // Log audit
    await AuditLog.create({
      userId: req.user._id,
      action: 'crew_assignment_updated',
      resource: 'crew',
      resourceId: crew._id,
      details: { 
        before: originalData,
        after: crew.toObject(),
        changes: Object.keys(updateData)
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Crew assignment updated successfully',
      data: crew
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating crew assignment', error: error.message });
  }
});

// Cancel crew assignment
router.post('/:crewId/cancel', auth, requireDepotAccess, async (req, res) => {
  try {
    const { crewId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Cancellation reason is required' });
    }
    
    const crew = await Crew.findById(crewId);
    if (!crew) {
      return res.status(404).json({ message: 'Crew assignment not found' });
    }
    
    // Verify user has access
    if (req.user.role === 'depot_manager' && crew.depotId.toString() !== req.user.depotId.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this crew assignment' });
    }
    
    if (crew.status !== 'assigned') {
      return res.status(400).json({ message: 'Only assigned duties can be cancelled' });
    }
    
    // Update crew status
    crew.status = 'cancelled';
    crew.notes = reason;
    await crew.save();
    
    // Update bus assignment
    await Bus.findByIdAndUpdate(crew.busId, {
      assignedDriver: null,
      assignedConductor: null,
      currentTrip: null
    });
    
    // Log audit
    await AuditLog.create({
      userId: req.user._id,
      action: 'crew_assignment_cancelled',
      resource: 'crew',
      resourceId: crew._id,
      details: { 
        reason: reason
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Crew assignment cancelled successfully',
      data: crew
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling crew assignment', error: error.message });
  }
});

// Get available drivers for a time period
router.get('/available/drivers', auth, requireDepotAccess, async (req, res) => {
  try {
    const { depotId, startTime, endTime } = req.query;
    
    if (!depotId || !startTime || !endTime) {
      return res.status(400).json({ message: 'Depot ID, start time, and end time are required' });
    }
    
    // Verify user has access to this depot
    if (req.user.role === 'depot_manager' && req.user.depotId.toString() !== depotId) {
      return res.status(403).json({ message: 'Not authorized to view drivers for this depot' });
    }
    
    // Get all drivers in the depot
    const drivers = await User.find({
      role: 'driver',
      depotId,
      status: 'active'
    });
    
    // Filter out drivers who have duty during this time
    const availableDrivers = [];
    
    for (const driver of drivers) {
      const existingDuty = await Crew.findOne({
        driverId: driver._id,
        dutyStartTime: { $lt: new Date(endTime) },
        dutyEndTime: { $gt: new Date(startTime) },
        status: { $in: ['assigned', 'started', 'in_progress'] }
      });
      
      if (!existingDuty) {
        availableDrivers.push({
          _id: driver._id,
          name: driver.name,
          phone: driver.phone,
          employeeId: driver.staffDetails?.employeeId
        });
      }
    }
    
    res.json({
      success: true,
      data: availableDrivers
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available drivers', error: error.message });
  }
});

// Get available conductors for a time period
router.get('/available/conductors', auth, requireDepotAccess, async (req, res) => {
  try {
    const { depotId, startTime, endTime } = req.query;
    
    if (!depotId || !startTime || !endTime) {
      return res.status(400).json({ message: 'Depot ID, start time, and end time are required' });
    }
    
    // Verify user has access to this depot
    if (req.user.role === 'depot_manager' && req.user.depotId.toString() !== depotId) {
      return res.status(403).json({ message: 'Not authorized to view conductors for this depot' });
    }
    
    // Get all conductors in the depot
    const conductors = await User.find({
      role: 'conductor',
      depotId,
      status: 'active'
    });
    
    // Filter out conductors who have duty during this time
    const availableConductors = [];
    
    for (const conductor of conductors) {
      const existingDuty = await Crew.findOne({
        conductorId: conductor._id,
        dutyStartTime: { $lt: new Date(endTime) },
        dutyEndTime: { $gt: new Date(startTime) },
        status: { $in: ['assigned', 'started', 'in_progress'] }
      });
      
      if (!existingDuty) {
        availableConductors.push({
          _id: conductor._id,
          name: conductor.name,
          phone: conductor.phone,
          employeeId: conductor.staffDetails?.employeeId
        });
      }
    }
    
    res.json({
      success: true,
      data: availableConductors
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available conductors', error: error.message });
  }
});

// Get available buses for a time period
router.get('/available/buses', auth, requireDepotAccess, async (req, res) => {
  try {
    const { depotId, startTime, endTime } = req.query;
    
    if (!depotId || !startTime || !endTime) {
      return res.status(400).json({ message: 'Depot ID, start time, and end time are required' });
    }
    
    // Verify user has access to this depot
    if (req.user.role === 'depot_manager' && req.user.depotId.toString() !== depotId) {
      return res.status(403).json({ message: 'Not authorized to view buses for this depot' });
    }
    
    // Get all buses in the depot
    const buses = await Bus.find({
      depotId,
      status: 'active'
    });
    
    // Filter out buses that are assigned during this time
    const availableBuses = [];
    
    for (const bus of buses) {
      const existingDuty = await Crew.findOne({
        busId: bus._id,
        dutyStartTime: { $lt: new Date(endTime) },
        dutyEndTime: { $gt: new Date(startTime) },
        status: { $in: ['assigned', 'started', 'in_progress'] }
      });
      
      if (!existingDuty) {
        availableBuses.push({
          _id: bus._id,
          busNumber: bus.busNumber,
          registrationNumber: bus.registrationNumber,
          busType: bus.busType,
          capacity: bus.capacity.total
        });
      }
    }
    
    res.json({
      success: true,
      data: availableBuses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available buses', error: error.message });
  }
});

// Get crew performance statistics
router.get('/performance/:depotId', auth, requireDepotAccess, async (req, res) => {
  try {
    const { depotId } = req.params;
    const { period = 'month' } = req.query;
    
    // Verify user has access to this depot
    if (req.user.role === 'depot_manager' && req.user.depotId.toString() !== depotId) {
      return res.status(403).json({ message: 'Not authorized to view performance for this depot' });
    }
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get crew performance data
    const performanceData = await Crew.aggregate([
      {
        $match: {
          depotId: require('mongoose').Types.ObjectId(depotId),
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            driverId: '$driverId',
            conductorId: '$conductorId'
          },
          totalDuties: { $sum: 1 },
          onTimeDepartures: { $sum: { $cond: ['$performance.onTimeDeparture', 1, 0] } },
          onTimeArrivals: { $sum: { $cond: ['$performance.onTimeArrival', 1, 0] } },
          totalPassengers: { $sum: '$performance.passengerCount' },
          totalRevenue: { $sum: '$performance.revenueCollected' },
          totalFuelConsumed: { $sum: '$performance.fuelConsumed' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.driverId',
          foreignField: '_id',
          as: 'driverDetails'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.conductorId',
          foreignField: '_id',
          as: 'conductorDetails'
        }
      },
      {
        $project: {
          driverName: { $arrayElemAt: ['$driverDetails.name', 0] },
          conductorName: { $arrayElemAt: ['$conductorDetails.name', 0] },
          totalDuties: 1,
          onTimeDepartures: 1,
          onTimeArrivals: 1,
          totalPassengers: 1,
          totalRevenue: 1,
          totalFuelConsumed: 1,
          onTimeDepartureRate: { $divide: ['$onTimeDepartures', '$totalDuties'] },
          onTimeArrivalRate: { $divide: ['$onTimeArrivals', '$totalDuties'] }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        period,
        startDate,
        endDate,
        performanceData
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching crew performance', error: error.message });
  }
});

module.exports = router;

