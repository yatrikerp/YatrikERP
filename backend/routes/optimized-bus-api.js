const express = require('express');
const Bus = require('../models/Bus');
const Depot = require('../models/Depot');
const router = express.Router();

// Cache for frequently accessed data
let busStatsCache = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Middleware to check cache
const checkCache = (req, res, next) => {
  const now = Date.now();
  if (busStatsCache && (now - lastCacheUpdate) < CACHE_DURATION) {
    req.cachedData = busStatsCache;
    req.fromCache = true;
  }
  next();
};

// Get bus statistics (cached for 5 minutes)
router.get('/stats', checkCache, async (req, res) => {
  try {
    if (req.fromCache) {
      return res.json({
        success: true,
        data: req.cachedData,
        cached: true,
        timestamp: new Date()
      });
    }

    // Generate fresh statistics
    const stats = await Bus.aggregate([
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalBuses: { $sum: 1 },
                activeBuses: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                maintenanceBuses: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
                assignedBuses: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } }
              }
            }
          ],
          busTypeStats: [
            {
              $group: {
                _id: '$busType',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          depotStats: [
            {
              $lookup: {
                from: 'depots',
                localField: 'depotId',
                foreignField: '_id',
                as: 'depot'
              }
            },
            {
              $unwind: '$depot'
            },
            {
              $group: {
                _id: {
                  depotId: '$depotId',
                  depotName: '$depot.depotName',
                  depotCode: '$depot.depotCode',
                  category: '$depot.category'
                },
                busCount: { $sum: 1 }
              }
            },
            {
              $group: {
                _id: '$_id.category',
                depots: { $sum: 1 },
                buses: { $sum: '$busCount' }
              }
            }
          ]
        }
      }
    ]);

    const result = {
      total: stats[0].totalStats[0] || {},
      busTypes: stats[0].busTypeStats,
      depotCategories: stats[0].depotStats
    };

    // Update cache
    busStatsCache = result;
    lastCacheUpdate = Date.now();

    res.json({
      success: true,
      data: result,
      cached: false,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bus statistics',
      message: error.message
    });
  }
});

// Get buses with pagination (optimized)
router.get('/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Apply filters
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.busType) {
      filter.busType = req.query.busType;
    }
    if (req.query.depotId) {
      filter.depotId = req.query.depotId;
    }

    // Get buses with minimal data for list view
    const buses = await Bus.find(filter)
      .populate('depotId', 'depotName depotCode category')
      .select('busNumber registrationNumber busType status capacity.total amenities depotId')
      .sort({ busNumber: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Bus.countDocuments(filter);

    res.json({
      success: true,
      data: {
        buses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch buses',
      message: error.message
    });
  }
});

// Get bus details (single bus)
router.get('/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('depotId', 'depotName depotCode category location contact')
      .populate('assignedDriver', 'name employeeCode')
      .populate('assignedConductor', 'name employeeCode')
      .populate('currentTrip', 'tripNumber routeName scheduledDeparture')
      .lean();

    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }

    res.json({
      success: true,
      data: bus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bus details',
      message: error.message
    });
  }
});

// Get buses by depot (optimized)
router.get('/depot/:depotId', async (req, res) => {
  try {
    const { depotId } = req.params;
    const { status, busType } = req.query;
    
    const filter = { depotId };
    if (status) filter.status = status;
    if (busType) filter.busType = busType;

    const buses = await Bus.find(filter)
      .select('busNumber registrationNumber busType status capacity.total amenities')
      .sort({ busNumber: 1 })
      .lean();

    const depot = await Depot.findById(depotId)
      .select('depotName depotCode category')
      .lean();

    res.json({
      success: true,
      data: {
        depot,
        buses,
        count: buses.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch depot buses',
      message: error.message
    });
  }
});

// Search buses (optimized)
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const buses = await Bus.find({
      $or: [
        { busNumber: { $regex: query, $options: 'i' } },
        { registrationNumber: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('depotId', 'depotName depotCode')
      .select('busNumber registrationNumber busType status depotId')
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: buses,
      count: buses.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search buses',
      message: error.message
    });
  }
});

// Get bus types (cached)
let busTypesCache = null;
router.get('/types/list', async (req, res) => {
  try {
    if (busTypesCache) {
      return res.json({
        success: true,
        data: busTypesCache,
        cached: true
      });
    }

    const busTypes = await Bus.distinct('busType');
    busTypesCache = busTypes;

    res.json({
      success: true,
      data: busTypes,
      cached: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bus types',
      message: error.message
    });
  }
});

// Update bus status (optimized)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'idle', 'assigned', 'maintenance', 'retired', 'suspended'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true, lean: true }
    ).select('busNumber status updatedAt');

    if (!bus) {
      return res.status(404).json({
        success: false,
        error: 'Bus not found'
      });
    }

    // Clear cache when status changes
    busStatsCache = null;

    res.json({
      success: true,
      data: bus,
      message: `Bus ${bus.busNumber} status updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update bus status',
      message: error.message
    });
  }
});

module.exports = router;
