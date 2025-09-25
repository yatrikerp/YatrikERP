const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Route = require('../models/Route');
const Depot = require('../models/Depot');
const auth = require('../middleware/auth');

// Bulk assign staff to routes
router.post('/bulk-assign-staff', auth, async (req, res) => {
  try {
    const { staffType, staffIds, depotId, routeId } = req.body;

    // Validate input
    if (!staffType || !staffIds || !Array.isArray(staffIds) || !depotId || !routeId) {
      return res.status(400).json({ 
        error: 'Missing required fields: staffType, staffIds, depotId, routeId' 
      });
    }

    if (staffType !== 'drivers' && staffType !== 'conductors') {
      return res.status(400).json({ 
        error: 'Invalid staffType. Must be "drivers" or "conductors"' 
      });
    }

    // Verify depot exists
    const depot = await Depot.findById(depotId);
    if (!depot) {
      return res.status(404).json({ error: 'Depot not found' });
    }

    // Verify route exists and belongs to depot
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    if (route.depotId && route.depotId.toString() !== depotId) {
      return res.status(400).json({ 
        error: 'Route does not belong to the selected depot' 
      });
    }

    // Get staff members
    const staff = await User.find({
      _id: { $in: staffIds },
      role: staffType === 'drivers' ? 'driver' : 'conductor'
    });

    if (staff.length !== staffIds.length) {
      return res.status(400).json({ 
        error: 'Some staff members not found or invalid role' 
      });
    }

    // Update staff assignments
    const updatePromises = staff.map(staffMember => {
      return User.findByIdAndUpdate(
        staffMember._id,
        { 
          $set: { 
            depotId: depotId,
            assignedRoute: routeId,
            lastAssigned: new Date()
          }
        },
        { new: true }
      );
    });

    const updatedStaff = await Promise.all(updatePromises);

    // Update route with assigned staff
    const routeUpdate = {
      $addToSet: {
        [staffType === 'drivers' ? 'assignedDrivers' : 'assignedConductors']: { 
          $each: staffIds 
        }
      }
    };

    await Route.findByIdAndUpdate(routeId, routeUpdate);

    // Log the assignment
    console.log(`Bulk assigned ${updatedStaff.length} ${staffType} to route ${routeId} in depot ${depotId}`);

    res.json({
      success: true,
      message: `Successfully assigned ${updatedStaff.length} ${staffType} to route`,
      data: {
        assignedCount: updatedStaff.length,
        depot: {
          id: depot._id,
          name: depot.name || depot.depotName
        },
        route: {
          id: route._id,
          name: route.routeName
        },
        assignedStaff: updatedStaff.map(s => ({
          id: s._id,
          name: s.name,
          email: s.email
        }))
      }
    });

  } catch (error) {
    console.error('Bulk assignment error:', error);
    res.status(500).json({ 
      error: 'Internal server error during bulk assignment',
      details: error.message 
    });
  }
});

// Get staff assignments for a route
router.get('/route-assignments/:routeId', auth, async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await Route.findById(routeId)
      .populate('assignedDrivers', 'name email phone employeeCode status')
      .populate('assignedConductors', 'name email phone employeeCode status');

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json({
      success: true,
      data: {
        route: {
          id: route._id,
          name: route.routeName,
          startPoint: route.startPoint,
          endPoint: route.endPoint
        },
        assignedDrivers: route.assignedDrivers || [],
        assignedConductors: route.assignedConductors || []
      }
    });

  } catch (error) {
    console.error('Get route assignments error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Remove staff from route
router.delete('/remove-staff-from-route', auth, async (req, res) => {
  try {
    const { staffType, staffIds, routeId } = req.body;

    if (!staffType || !staffIds || !Array.isArray(staffIds) || !routeId) {
      return res.status(400).json({ 
        error: 'Missing required fields: staffType, staffIds, routeId' 
      });
    }

    // Remove from route
    const routeUpdate = {
      $pull: {
        [staffType === 'drivers' ? 'assignedDrivers' : 'assignedConductors']: { 
          $in: staffIds 
        }
      }
    };

    await Route.findByIdAndUpdate(routeId, routeUpdate);

    // Clear route assignment from staff
    const staffUpdate = {
      $unset: { assignedRoute: 1 }
    };

    await User.updateMany(
      { _id: { $in: staffIds } },
      staffUpdate
    );

    res.json({
      success: true,
      message: `Successfully removed ${staffIds.length} ${staffType} from route`
    });

  } catch (error) {
    console.error('Remove staff from route error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

module.exports = router;

