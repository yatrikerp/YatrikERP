const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { auth, requireRole } = require('../middleware/auth');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const Bus = require('../models/Bus');
const Depot = require('../models/Depot');
const { createKeralaStaffWithAssignment, generateKeralaName, generateKeralaPhone, generateKeralaEmail, sendCredentialsEmail } = require('../scripts/create-kerala-staff-with-assignment');

// GET /api/staff/depot/:depotId - Get all staff for a depot
router.get('/depot/:depotId', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { depotId } = req.params;
    const { role, status, search } = req.query;
    
    // Verify depot access for depot managers
    if (req.user.role === 'depot_manager' && req.user.depotId.toString() !== depotId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this depot'
      });
    }
    
    let query = { depotId };
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [drivers, conductors] = await Promise.all([
      Driver.find(query).select('-password -loginAttempts -lockUntil').populate('depotId', 'depotName depotCode'),
      Conductor.find(query).select('-password -loginAttempts -lockUntil').populate('depotId', 'depotName depotCode')
    ]);
    
    // Add role information
    const staffWithRoles = [
      ...drivers.map(driver => ({ ...driver.toObject(), role: 'driver' })),
      ...conductors.map(conductor => ({ ...conductor.toObject(), role: 'conductor' }))
    ];
    
    res.json({
      success: true,
      data: staffWithRoles,
      summary: {
        total: staffWithRoles.length,
        drivers: drivers.length,
        conductors: conductors.length,
        active: staffWithRoles.filter(s => s.status === 'active').length,
        onDuty: staffWithRoles.filter(s => s.currentDuty && s.currentDuty.status === 'in-progress').length
      }
    });
    
  } catch (error) {
    console.error('Get depot staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/staff/available/:depotId - Get available staff for assignment
router.get('/available/:depotId', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { depotId } = req.params;
    const { role } = req.query;
    
    // Verify depot access for depot managers
    if (req.user.role === 'depot_manager' && req.user.depotId.toString() !== depotId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this depot'
      });
    }
    
    let availableStaff = [];
    
    if (!role || role === 'driver') {
      const availableDrivers = await Driver.findAvailable(depotId)
        .select('name employeeCode phone email drivingLicense currentDuty')
        .populate('depotId', 'depotName depotCode');
      
      availableStaff = availableStaff.concat(
        availableDrivers.map(driver => ({ ...driver.toObject(), role: 'driver' }))
      );
    }
    
    if (!role || role === 'conductor') {
      const availableConductors = await Conductor.findAvailable(depotId)
        .select('name employeeCode phone email currentDuty')
        .populate('depotId', 'depotName depotCode');
      
      availableStaff = availableStaff.concat(
        availableConductors.map(conductor => ({ ...conductor.toObject(), role: 'conductor' }))
      );
    }
    
    res.json({
      success: true,
      data: availableStaff,
      summary: {
        total: availableStaff.length,
        drivers: availableStaff.filter(s => s.role === 'driver').length,
        conductors: availableStaff.filter(s => s.role === 'conductor').length
      }
    });
    
  } catch (error) {
    console.error('Get available staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/staff/auto-assign/:depotId - Auto-assign staff to buses
router.post('/auto-assign/:depotId', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { depotId } = req.params;
    const { busIds, forceReassign } = req.body;
    
    // Verify depot access for depot managers
    if (req.user.role === 'depot_manager' && req.user.depotId.toString() !== depotId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this depot'
      });
    }
    
    // Get depot
    const depot = await Depot.findById(depotId);
    if (!depot) {
      return res.status(404).json({
        success: false,
        message: 'Depot not found'
      });
    }
    
    // Get buses to assign
    let buses;
    if (busIds && busIds.length > 0) {
      buses = await Bus.find({ _id: { $in: busIds }, depotId });
    } else {
      buses = await Bus.find({ depotId, status: { $in: ['active', 'idle'] } });
    }
    
    if (buses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No buses found for assignment'
      });
    }
    
    // Get available staff
    const [availableDrivers, availableConductors] = await Promise.all([
      Driver.findAvailable(depotId),
      Conductor.findAvailable(depotId)
    ]);
    
    if (availableDrivers.length === 0 || availableConductors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient available staff for assignment'
      });
    }
    
    const assignmentResults = [];
    let assignedCount = 0;
    
    for (const bus of buses) {
      try {
        // Skip if already assigned and not forcing reassignment
        if (bus.assignedDriver && bus.assignedConductor && !forceReassign) {
          assignmentResults.push({
            busId: bus._id,
            busNumber: bus.busNumber,
            status: 'skipped',
            reason: 'Already assigned'
          });
          continue;
        }
        
        // Find available driver
        const availableDriver = availableDrivers.find(driver => 
          !driver.currentDuty || driver.currentDuty.status !== 'in-progress'
        );
        
        // Find available conductor
        const availableConductor = availableConductors.find(conductor => 
          !conductor.currentDuty || conductor.currentDuty.status !== 'in-progress'
        );
        
        if (availableDriver && availableConductor) {
          // Unassign existing staff if any
          if (bus.assignedDriver) {
            const existingDriver = await Driver.findById(bus.assignedDriver);
            if (existingDriver) {
              existingDriver.currentDuty = null;
              await existingDriver.save();
            }
          }
          
          if (bus.assignedConductor) {
            const existingConductor = await Conductor.findById(bus.assignedConductor);
            if (existingConductor) {
              existingConductor.currentDuty = null;
              await existingConductor.save();
            }
          }
          
          // Assign new staff
          bus.assignedDriver = availableDriver._id;
          bus.assignedConductor = availableConductor._id;
          bus.status = 'assigned';
          
          await bus.save();
          
          // Update staff current duty
          availableDriver.currentDuty = {
            busId: bus._id,
            status: 'assigned',
            startTime: new Date()
          };
          
          availableConductor.currentDuty = {
            busId: bus._id,
            status: 'assigned',
            startTime: new Date()
          };
          
          await Promise.all([availableDriver.save(), availableConductor.save()]);
          
          assignedCount++;
          assignmentResults.push({
            busId: bus._id,
            busNumber: bus.busNumber,
            status: 'assigned',
            driver: {
              id: availableDriver._id,
              name: availableDriver.name,
              employeeCode: availableDriver.employeeCode
            },
            conductor: {
              id: availableConductor._id,
              name: availableConductor.name,
              employeeCode: availableConductor.employeeCode
            }
          });
          
          // Remove assigned staff from available list
          const driverIndex = availableDrivers.indexOf(availableDriver);
          const conductorIndex = availableConductors.indexOf(availableConductor);
          if (driverIndex > -1) availableDrivers.splice(driverIndex, 1);
          if (conductorIndex > -1) availableConductors.splice(conductorIndex, 1);
          
        } else {
          assignmentResults.push({
            busId: bus._id,
            busNumber: bus.busNumber,
            status: 'failed',
            reason: 'No available staff'
          });
        }
        
      } catch (error) {
        console.error(`Failed to assign staff to Bus ${bus.busNumber}:`, error);
        assignmentResults.push({
          busId: bus._id,
          busNumber: bus.busNumber,
          status: 'error',
          reason: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Successfully assigned staff to ${assignedCount} buses`,
      data: {
        totalBuses: buses.length,
        assignedCount,
        assignmentResults
      }
    });
    
  } catch (error) {
    console.error('Auto-assign staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/staff/unassign/:busId - Unassign staff from bus
router.post('/unassign/:busId', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { busId } = req.params;
    
    const bus = await Bus.findById(busId).populate('depotId', 'depotName depotCode');
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    // Verify depot access for depot managers
    if (req.user.role === 'depot_manager' && req.user.depotId.toString() !== bus.depotId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this depot'
      });
    }
    
    if (!bus.assignedDriver && !bus.assignedConductor) {
      return res.status(400).json({
        success: false,
        message: 'No staff assigned to this bus'
      });
    }
    
    // Unassign driver
    if (bus.assignedDriver) {
      const driver = await Driver.findById(bus.assignedDriver);
      if (driver) {
        driver.currentDuty = null;
        await driver.save();
      }
      bus.assignedDriver = null;
    }
    
    // Unassign conductor
    if (bus.assignedConductor) {
      const conductor = await Conductor.findById(bus.assignedConductor);
      if (conductor) {
        conductor.currentDuty = null;
        await conductor.save();
      }
      bus.assignedConductor = null;
    }
    
    bus.status = 'idle';
    await bus.save();
    
    res.json({
      success: true,
      message: 'Staff unassigned successfully',
      data: {
        busId: bus._id,
        busNumber: bus.busNumber,
        depot: bus.depotId
      }
    });
    
  } catch (error) {
    console.error('Unassign staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/staff/create-kerala-staff - Create Kerala staff with Malayali names
router.post('/create-kerala-staff', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { depotId, staffCount } = req.body;
    
    if (!depotId) {
      return res.status(400).json({
        success: false,
        message: 'Depot ID is required'
      });
    }
    
    const depot = await Depot.findById(depotId);
    if (!depot) {
      return res.status(404).json({
        success: false,
        message: 'Depot not found'
      });
    }
    
    const count = staffCount || { drivers: 5, conductors: 5 };
    
    // Create staff for the depot
    const createdStaff = await createStaffForDepot(depot, count);
    
    // Auto-assign staff to buses
    await autoAssignStaffToBuses(depot);
    
    res.json({
      success: true,
      message: `Successfully created ${createdStaff.drivers.length} drivers and ${createdStaff.conductors.length} conductors for ${depot.depotName}`,
      data: {
        depot: depot,
        createdStaff: {
          drivers: createdStaff.drivers.map(d => ({
            id: d._id,
            name: d.name,
            employeeCode: d.employeeCode,
            email: d.email
          })),
          conductors: createdStaff.conductors.map(c => ({
            id: c._id,
            name: c.name,
            employeeCode: c.employeeCode,
            email: c.email
          }))
        }
      }
    });
    
  } catch (error) {
    console.error('Create Kerala staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/staff/dashboard/:depotId - Get staff dashboard data
router.get('/dashboard/:depotId', auth, requireRole(['admin', 'depot_manager']), async (req, res) => {
  try {
    const { depotId } = req.params;
    
    // Verify depot access for depot managers
    if (req.user.role === 'depot_manager' && req.user.depotId.toString() !== depotId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this depot'
      });
    }
    
    const [
      totalDrivers,
      totalConductors,
      activeDrivers,
      activeConductors,
      onDutyDrivers,
      onDutyConductors,
      busesWithStaff,
      busesWithoutStaff
    ] = await Promise.all([
      Driver.countDocuments({ depotId }),
      Conductor.countDocuments({ depotId }),
      Driver.countDocuments({ depotId, status: 'active' }),
      Conductor.countDocuments({ depotId, status: 'active' }),
      Driver.countDocuments({ depotId, 'currentDuty.status': 'in-progress' }),
      Conductor.countDocuments({ depotId, 'currentDuty.status': 'in-progress' }),
      Bus.countDocuments({ depotId, assignedDriver: { $exists: true }, assignedConductor: { $exists: true } }),
      Bus.countDocuments({ depotId, $or: [{ assignedDriver: { $exists: false } }, { assignedConductor: { $exists: false } }] })
    ]);
    
    // Get recent staff activities
    const recentDrivers = await Driver.find({ depotId })
      .select('name employeeCode currentDuty status lastLogin')
      .sort({ lastLogin: -1 })
      .limit(5);
    
    const recentConductors = await Conductor.find({ depotId })
      .select('name employeeCode currentDuty status lastLogin')
      .sort({ lastLogin: -1 })
      .limit(5);
    
    const dashboardData = {
      summary: {
        totalStaff: totalDrivers + totalConductors,
        totalDrivers,
        totalConductors,
        activeStaff: activeDrivers + activeConductors,
        activeDrivers,
        activeConductors,
        onDutyStaff: onDutyDrivers + onDutyConductors,
        onDutyDrivers,
        onDutyConductors,
        busesWithStaff,
        busesWithoutStaff,
        assignmentRate: busesWithStaff / (busesWithStaff + busesWithoutStaff) * 100
      },
      recentActivity: {
        drivers: recentDrivers,
        conductors: recentConductors
      }
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('Get staff dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/staff/bus/:busId - Get staff assigned to a bus
router.get('/bus/:busId', auth, requireRole(['admin', 'depot_manager', 'driver', 'conductor']), async (req, res) => {
  try {
    const { busId } = req.params;
    
    const bus = await Bus.findById(busId)
      .populate('assignedDriver', 'name employeeCode phone email currentDuty')
      .populate('assignedConductor', 'name employeeCode phone email currentDuty')
      .populate('depotId', 'depotName depotCode');
    
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }
    
    // Verify depot access for depot managers
    if (req.user.role === 'depot_manager' && req.user.depotId.toString() !== bus.depotId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this depot'
      });
    }
    
    res.json({
      success: true,
      data: {
        bus: {
          id: bus._id,
          busNumber: bus.busNumber,
          registrationNumber: bus.registrationNumber,
          status: bus.status,
          depot: bus.depotId
        },
        assignedStaff: {
          driver: bus.assignedDriver ? {
            ...bus.assignedDriver.toObject(),
            role: 'driver'
          } : null,
          conductor: bus.assignedConductor ? {
            ...bus.assignedConductor.toObject(),
            role: 'conductor'
          } : null
        }
      }
    });
    
  } catch (error) {
    console.error('Get bus staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
