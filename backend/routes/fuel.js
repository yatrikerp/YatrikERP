const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const FuelLog = require('../models/FuelLog');
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

// Create fuel log entry
router.post('/log', auth, requireDepotAccess, async (req, res) => {
  try {
    const {
      busId,
      tripId,
      fuelType,
      quantity,
      unit,
      cost,
      odometerReading,
      previousOdometer,
      fuelStation,
      receiptNumber,
      notes
    } = req.body;
    
    if (!busId || !fuelType || !quantity || !cost || !odometerReading) {
      return res.status(400).json({ message: 'Bus ID, fuel type, quantity, cost, and odometer reading are required' });
    }
    
    // Verify bus exists and belongs to user's depot
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    
    if (req.user.role === 'depot_manager' && bus.depotId.toString() !== req.user.depotId.toString()) {
      return res.status(403).json({ message: 'Not authorized to log fuel for this bus' });
    }
    
    // Calculate distance covered
    const distanceCovered = previousOdometer ? odometerReading - previousOdometer : 0;
    
    // Create fuel log
    const fuelLog = await FuelLog.create({
      busId,
      tripId,
      driverId: req.user._id,
      depotId: bus.depotId,
      fuelType,
      quantity,
      unit,
      cost,
      odometerReading,
      previousOdometer: previousOdometer || odometerReading,
      distanceCovered,
      fuelStation,
      receiptNumber,
      notes,
      loggedBy: req.user._id
    });
    
    // Update bus fuel information
    await Bus.findByIdAndUpdate(busId, {
      'fuel.currentLevel': 100, // Assuming full tank after refuel
      'fuel.lastRefuel': new Date(),
      'fuel.averageConsumption': fuelLog.mileage || 0,
      'maintenance.totalDistance': odometerReading
    });
    
    // Log audit
    await AuditLog.create({
      userId: req.user._id,
      action: 'fuel_logged',
      resource: 'fuel',
      resourceId: fuelLog._id,
      details: { 
        busId,
        fuelType,
        quantity,
        cost,
        odometerReading
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Fuel log created successfully',
      data: fuelLog
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating fuel log', error: error.message });
  }
});

// Get fuel logs for a bus
router.get('/bus/:busId', auth, requireDepotAccess, async (req, res) => {
  try {
    const { busId } = req.params;
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    
    // Verify bus exists and user has access
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    
    if (req.user.role === 'depot_manager' && bus.depotId.toString() !== req.user.depotId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view fuel logs for this bus' });
    }
    
    const query = { busId };
    
    // Date range filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const fuelLogs = await FuelLog.find(query)
      .populate('driverId', 'name')
      .populate('tripId', 'routeId departureTime')
      .populate('routeId', 'name origin destination')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await FuelLog.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        fuelLogs,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fuel logs', error: error.message });
  }
});

// Get fuel logs for a depot
router.get('/depot/:depotId', auth, requireDepotAccess, async (req, res) => {
  try {
    const { depotId } = req.params;
    const { page = 1, limit = 20, startDate, endDate, fuelType } = req.query;
    
    // Verify user has access to this depot
    if (req.user.role === 'depot_manager' && req.user.depotId.toString() !== depotId) {
      return res.status(403).json({ message: 'Not authorized to view fuel logs for this depot' });
    }
    
    const query = { depotId };
    
    // Date range filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Fuel type filter
    if (fuelType) {
      query.fuelType = fuelType;
    }
    
    const fuelLogs = await FuelLog.find(query)
      .populate('busId', 'busNumber registrationNumber')
      .populate('driverId', 'name')
      .populate('tripId', 'routeId departureTime')
      .populate('routeId', 'name origin destination')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await FuelLog.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        fuelLogs,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching depot fuel logs', error: error.message });
  }
});

// Get fuel consumption analytics
router.get('/analytics/:depotId', auth, requireDepotAccess, async (req, res) => {
  try {
    const { depotId } = req.params;
    const { period = 'month' } = req.query;
    
    // Verify user has access to this depot
    if (req.user.role === 'depot_manager' && req.user.depotId.toString() !== depotId) {
      return res.status(403).json({ message: 'Not authorized to view analytics for this depot' });
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
    
    // Get fuel consumption data
    const fuelData = await FuelLog.aggregate([
      {
        $match: {
          depotId: require('mongoose').Types.ObjectId(depotId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            fuelType: '$fuelType',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          totalQuantity: { $sum: '$quantity' },
          totalCost: { $sum: '$cost' },
          totalDistance: { $sum: '$distanceCovered' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);
    
    // Get total statistics
    const totalStats = await FuelLog.aggregate([
      {
        $match: {
          depotId: require('mongoose').Types.ObjectId(depotId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalFuelCost: { $sum: '$cost' },
          totalFuelQuantity: { $sum: '$quantity' },
          totalDistance: { $sum: '$distanceCovered' },
          averageMileage: { $avg: '$mileage' }
        }
      }
    ]);
    
    // Get fuel consumption by bus
    const busStats = await FuelLog.aggregate([
      {
        $match: {
          depotId: require('mongoose').Types.ObjectId(depotId),
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$busId',
          totalFuelCost: { $sum: '$cost' },
          totalFuelQuantity: { $sum: '$quantity' },
          totalDistance: { $sum: '$distanceCovered' },
          averageMileage: { $avg: '$mileage' },
          refuelCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'buses',
          localField: '_id',
          foreignField: '_id',
          as: 'busDetails'
        }
      },
      {
        $unwind: '$busDetails'
      },
      {
        $project: {
          busNumber: '$busDetails.busNumber',
          registrationNumber: '$busDetails.registrationNumber',
          totalFuelCost: 1,
          totalFuelQuantity: 1,
          totalDistance: 1,
          averageMileage: 1,
          refuelCount: 1
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        period,
        startDate,
        endDate,
        fuelData,
        totalStats: totalStats[0] || {},
        busStats
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fuel analytics', error: error.message });
  }
});

// Update fuel log
router.put('/log/:logId', auth, requireDepotAccess, async (req, res) => {
  try {
    const { logId } = req.params;
    const updateData = req.body;
    
    const fuelLog = await FuelLog.findById(logId);
    if (!fuelLog) {
      return res.status(404).json({ message: 'Fuel log not found' });
    }
    
    // Verify user has access
    if (req.user.role === 'depot_manager' && fuelLog.depotId.toString() !== req.user.depotId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this fuel log' });
    }
    
    // Store original data for audit
    const originalData = fuelLog.toObject();
    
    // Update fuel log
    Object.assign(fuelLog, updateData);
    
    // Recalculate mileage if distance or quantity changed
    if (updateData.distanceCovered || updateData.quantity) {
      if (fuelLog.distanceCovered > 0 && fuelLog.quantity > 0) {
        fuelLog.mileage = fuelLog.distanceCovered / fuelLog.quantity;
      }
    }
    
    await fuelLog.save();
    
    // Log audit
    await AuditLog.create({
      userId: req.user._id,
      action: 'fuel_log_updated',
      resource: 'fuel',
      resourceId: fuelLog._id,
      details: { 
        before: originalData,
        after: fuelLog.toObject(),
        changes: Object.keys(updateData)
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Fuel log updated successfully',
      data: fuelLog
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating fuel log', error: error.message });
  }
});

// Delete fuel log
router.delete('/log/:logId', auth, requireDepotAccess, async (req, res) => {
  try {
    const { logId } = req.params;
    
    const fuelLog = await FuelLog.findById(logId);
    if (!fuelLog) {
      return res.status(404).json({ message: 'Fuel log not found' });
    }
    
    // Verify user has access
    if (req.user.role === 'depot_manager' && fuelLog.depotId.toString() !== req.user.depotId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this fuel log' });
    }
    
    // Store data for audit
    const deletedData = fuelLog.toObject();
    
    await FuelLog.findByIdAndDelete(logId);
    
    // Log audit
    await AuditLog.create({
      userId: req.user._id,
      action: 'fuel_log_deleted',
      resource: 'fuel',
      resourceId: logId,
      details: { 
        deletedData
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Fuel log deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting fuel log', error: error.message });
  }
});

// Verify fuel log
router.post('/log/:logId/verify', auth, requireDepotAccess, async (req, res) => {
  try {
    const { logId } = req.params;
    const { verificationStatus, verificationNotes } = req.body;
    
    if (!verificationStatus) {
      return res.status(400).json({ message: 'Verification status is required' });
    }
    
    const fuelLog = await FuelLog.findById(logId);
    if (!fuelLog) {
      return res.status(404).json({ message: 'Fuel log not found' });
    }
    
    // Verify user has access
    if (req.user.role === 'depot_manager' && fuelLog.depotId.toString() !== req.user.depotId.toString()) {
      return res.status(403).json({ message: 'Not authorized to verify this fuel log' });
    }
    
    // Update verification status
    fuelLog.verificationStatus = verificationStatus;
    fuelLog.verificationNotes = verificationNotes;
    fuelLog.verifiedBy = req.user._id;
    
    await fuelLog.save();
    
    // Log audit
    await AuditLog.create({
      userId: req.user._id,
      action: 'fuel_log_verified',
      resource: 'fuel',
      resourceId: fuelLog._id,
      details: { 
        verificationStatus,
        verificationNotes
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Fuel log verification updated successfully',
      data: fuelLog
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating fuel log verification', error: error.message });
  }
});

module.exports = router;

