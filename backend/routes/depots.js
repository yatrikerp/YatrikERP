const express = require('express');
const router = express.Router();
const Depot = require('../models/Depot');
const Route = require('../models/Route');
const { auth, requireRole } = require('../middleware/auth');

// Helper function to create role-based auth middleware
const authRole = (roles) => [auth, requireRole(roles)];

// Get all depots (public - visible to all users)
router.get('/', async (req, res) => {
  try {
    const { 
      city, 
      state, 
      status, 
      category,
      hasCapacity, 
      page = 1, 
      limit = 20,
      sortBy = 'depotCode',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (city) {
      filter['location.city'] = { $regex: city, $options: 'i' };
    }
    
    if (state) {
      filter['location.state'] = { $regex: state, $options: 'i' };
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (category && ['main', 'sub', 'operating'].includes(category)) {
      filter.category = category;
    }
    
    if (hasCapacity === 'true') {
      filter['capacity.availableBuses'] = { $gt: 0 };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const depots = await Depot.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .lean();

    // Get total count for pagination
    const total = await Depot.countDocuments(filter);

    res.json({
      success: true,
      data: depots,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching depots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depots',
      error: error.message
    });
  }
});

// Get depot by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const depot = await Depot.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!depot) {
      return res.status(404).json({
        success: false,
        message: 'Depot not found'
      });
    }

    res.json({
      success: true,
      data: depot
    });
  } catch (error) {
    console.error('Error fetching depot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depot',
      error: error.message
    });
  }
});

// Get depot with routes (public)
router.get('/:id/routes', async (req, res) => {
  try {
    const depot = await Depot.findById(req.params.id);
    
    if (!depot) {
      return res.status(404).json({
        success: false,
        message: 'Depot not found'
      });
    }

    const routes = await Route.findByDepot(req.params.id)
      .populate('assignedBuses.busId', 'busNumber capacity busType')
      .lean();

    res.json({
      success: true,
      data: {
        depot,
        routes,
        routeCount: routes.length
      }
    });
  } catch (error) {
    console.error('Error fetching depot routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depot routes',
      error: error.message
    });
  }
});

// Create new depot (admin only)
router.post('/', authRole(['admin']), async (req, res) => {
  try {
    const depotData = {
      ...req.body,
      createdBy: req.user.id
    };

    const depot = new Depot(depotData);
    await depot.save();

    // Create depot user account if requested
    let depotUser = null;
    if (req.body.createUserAccount && req.body.userAccount) {
      try {
        const DepotUser = require('../models/DepotUser');
        
        const userAccountData = {
          username: req.body.userAccount.username,
          email: req.body.userAccount.email,
          password: req.body.userAccount.password,
          depotId: depot._id,
          depotCode: depot.depotCode,
          depotName: depot.depotName,
          role: req.body.userAccount.role || 'depot_manager',
          permissions: req.body.userAccount.permissions || [
            'manage_buses',
            'view_buses',
            'manage_routes',
            'view_routes',
            'manage_schedules',
            'view_schedules',
            'view_reports',
            'view_depot_info'
          ]
        };

        depotUser = new DepotUser(userAccountData);
        await depotUser.save();
      } catch (userError) {
        console.error('Error creating depot user account:', userError);
        // Continue with depot creation even if user creation fails
      }
    }

    const populatedDepot = await Depot.findById(depot._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Depot created successfully',
      data: populatedDepot,
      depotUser: depotUser ? {
        id: depotUser._id,
        username: depotUser.username,
        email: depotUser.email,
        role: depotUser.role,
        permissions: depotUser.permissions
      } : null
    });
  } catch (error) {
    console.error('Error creating depot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create depot',
      error: error.message
    });
  }
});

// Update depot (admin only)
router.put('/:id', authRole(['admin']), async (req, res) => {
  try {
    const { assignedStaff, ...depotData } = req.body;
    
    // Update depot basic information
    const depot = await Depot.findByIdAndUpdate(
      req.params.id,
      {
        ...depotData,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('updatedBy', 'name email');

    if (!depot) {
      return res.status(404).json({
        success: false,
        message: 'Depot not found'
      });
    }

    // Handle staff assignments if provided
    if (assignedStaff && Array.isArray(assignedStaff)) {
      const User = require('../models/User');
      
      console.log(`🔄 Processing staff assignments for depot ${depot.depotName}:`, {
        depotId: req.params.id,
        assignedStaff: assignedStaff,
        staffCount: assignedStaff.length
      });
      
      try {
        // First, remove all staff from this depot
        const removeResult = await User.updateMany(
          { depotId: req.params.id, role: { $in: ['driver', 'conductor'] } },
          { $unset: { depotId: 1 } }
        );
        console.log(`🗑️ Removed ${removeResult.modifiedCount} staff from depot`);
        
        // Then assign the new staff to this depot
        if (assignedStaff.length > 0) {
          const assignResult = await User.updateMany(
            { _id: { $in: assignedStaff }, role: { $in: ['driver', 'conductor'] } },
            { depotId: req.params.id }
          );
          console.log(`✅ Assigned ${assignResult.modifiedCount} staff to depot`);
        }
        
        // Verify the assignments
        const verifyStaff = await User.find({ depotId: req.params.id, role: { $in: ['driver', 'conductor'] } });
        console.log(`🔍 Verification: ${verifyStaff.length} staff now assigned to depot ${depot.depotName}`);
        console.log(`🔍 Assigned staff details:`, verifyStaff.map(s => ({ name: s.name, role: s.role, depotId: s.depotId })));
        
      } catch (staffError) {
        console.error('Error updating staff assignments:', staffError);
        // Don't fail the entire request if staff update fails
      }
    }

    // Get updated depot with staff count
    const updatedDepot = await Depot.findById(req.params.id)
      .populate('assignedStaff', 'name email role')
      .lean();
    
    // Get actual staff count for this depot
    const staffCount = await User.countDocuments({ 
      depotId: req.params.id, 
      role: { $in: ['driver', 'conductor'] } 
    });
    
    console.log(`📊 Final verification - Depot ${depot.depotName} now has ${staffCount} staff assigned`);

    res.json({
      success: true,
      message: 'Depot updated successfully',
      data: {
        ...depot.toObject(),
        staffCount: staffCount
      }
    });
  } catch (error) {
    console.error('Error updating depot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update depot',
      error: error.message
    });
  }
});

// Delete depot (admin only)
router.delete('/:id', authRole(['admin']), async (req, res) => {
  try {
    // Check if depot has active routes
    const activeRoutes = await Route.countDocuments({
      'depot.depotId': req.params.id,
      isActive: true
    });

    if (activeRoutes > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete depot. It has ${activeRoutes} active routes.`
      });
    }

    const depot = await Depot.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.user.id },
      { new: true }
    );

    if (!depot) {
      return res.status(404).json({
        success: false,
        message: 'Depot not found'
      });
    }

    res.json({
      success: true,
      message: 'Depot deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting depot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete depot',
      error: error.message
    });
  }
});

// Update depot bus capacity (admin/manager only)
router.patch('/:id/capacity', authRole(['admin', 'manager']), async (req, res) => {
  try {
    const { type, count } = req.body;

    if (!type || count === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Type and count are required'
      });
    }

    const depot = await Depot.findById(req.params.id);
    
    if (!depot) {
      return res.status(404).json({
        success: false,
        message: 'Depot not found'
      });
    }

    await depot.updateBusCount(type, parseInt(count));

    res.json({
      success: true,
      message: 'Depot capacity updated successfully',
      data: depot
    });
  } catch (error) {
    console.error('Error updating depot capacity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update depot capacity',
      error: error.message
    });
  }
});

// Get depot statistics (admin only)
router.get('/stats/overview', authRole(['admin', 'manager']), async (req, res) => {
  try {
    const totalDepots = await Depot.countDocuments({ isActive: true });
    const activeDepots = await Depot.countDocuments({ isActive: true, status: 'active' });
    const inactiveDepots = await Depot.countDocuments({ isActive: true, status: 'inactive' });
    const maintenanceDepots = await Depot.countDocuments({ isActive: true, status: 'maintenance' });

    // Get depot counts by category
    const mainDepots = await Depot.countDocuments({ isActive: true, category: 'main' });
    const subDepots = await Depot.countDocuments({ isActive: true, category: 'sub' });
    const operatingCenters = await Depot.countDocuments({ isActive: true, category: 'operating' });

    // Get total capacity across all depots
    const capacityStats = await Depot.aggregate([
      { $match: { isActive: true } },
      { $group: {
        _id: null,
        totalBuses: { $sum: '$capacity.totalBuses' },
        availableBuses: { $sum: '$capacity.availableBuses' },
        maintenanceBuses: { $sum: '$capacity.maintenanceBuses' }
      }}
    ]);

    // Get depots by city
    const depotsByCity = await Depot.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$location.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get depots with low capacity
    const lowCapacityDepots = await Depot.find({
      isActive: true,
      $expr: {
        $lt: [
          { $divide: ['$capacity.availableBuses', '$capacity.totalBuses'] },
          0.2
        ]
      }
    }).select('depotName location.city capacity');

    res.json({
      success: true,
      data: {
        totalDepots,
        activeDepots,
        inactiveDepots,
        maintenanceDepots,
        mainDepots,
        subDepots,
        operatingCenters,
        capacityStats: capacityStats[0] || { totalBuses: 0, availableBuses: 0, maintenanceBuses: 0 },
        depotsByCity,
        lowCapacityDepots
      }
    });
  } catch (error) {
    console.error('Error fetching depot statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depot statistics',
      error: error.message
    });
  }
});

// Search depots by city (public)
router.get('/search/city/:city', async (req, res) => {
  try {
    const depots = await Depot.findByCity(req.params.city)
      .select('depotName depotCode location status capacity')
      .lean();

    res.json({
      success: true,
      data: depots,
      count: depots.length
    });
  } catch (error) {
    console.error('Error searching depots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search depots',
      error: error.message
    });
  }
});

// Get depots with available capacity (public)
router.get('/search/capacity/:minCapacity', async (req, res) => {
  try {
    const minCapacity = parseInt(req.params.minCapacity) || 0;
    const depots = await Depot.findWithAvailableCapacity(minCapacity)
      .select('depotName depotCode location status capacity')
      .lean();

    res.json({
      success: true,
      data: depots,
      count: depots.length
    });
  } catch (error) {
    console.error('Error searching depots by capacity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search depots by capacity',
      error: error.message
    });
  }
});

module.exports = router;
