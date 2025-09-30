const express = require('express');
const router = express.Router();
const FarePolicy = require('../models/FarePolicy');
const FareCalculationService = require('../services/fareCalculationService');
const { auth } = require('../middleware/auth');

// Test endpoint to verify fare policy routes are working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Fare Policy API is working!',
    timestamp: new Date().toISOString()
  });
});

// Public endpoint to get all fare policies (no auth required for testing)
router.get('/public', async (req, res) => {
  try {
    const policies = await FarePolicy.find({ isActive: true })
      .select('name busType minimumFare ratePerKm isActive')
      .sort({ busType: 1 });

    res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    console.error('Error fetching public fare policies:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Calculate fare based on distance and bus type
router.post('/calculate', auth, async (req, res) => {
  try {
    const { distance, busType, routeType = 'intercity' } = req.body;
    
    if (!distance || !busType) {
      return res.status(400).json({
        success: false,
        message: 'Distance and bus type are required'
      });
    }

    // Find the appropriate fare policy
    const policy = await FarePolicy.findOne({
      busType: busType,
      isActive: true
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'No fare policy found for the specified bus type'
      });
    }

    // Calculate fare
    const baseFare = distance * policy.ratePerKm;
    const totalFare = Math.max(baseFare, policy.minimumFare);

    res.json({
      success: true,
      data: {
        baseFare: Math.round(baseFare * 100) / 100,
        totalFare: Math.round(totalFare * 100) / 100,
        minimumFare: policy.minimumFare,
        ratePerKm: policy.ratePerKm,
        appliedPolicy: policy.name,
        policy: {
          id: policy._id,
          name: policy.name,
          busType: policy.busType,
          ratePerKm: policy.ratePerKm,
          minimumFare: policy.minimumFare,
          peakHourMultiplier: policy.peakHourMultiplier,
          weekendMultiplier: policy.weekendMultiplier,
          holidayMultiplier: policy.holidayMultiplier
        }
      }
    });

  } catch (error) {
    console.error('Error calculating fare:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating fare',
      error: error.message
    });
  }
});

// Get all fare policies
router.get('/', auth, async (req, res) => {
  try {
    const { busType, routeType, isActive } = req.query;
    
    let filter = {};
    if (busType) filter.busType = busType;
    if (routeType) filter.routeType = routeType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const policies = await FarePolicy.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ busType: 1, routeType: 1 });

    res.json({
      success: true,
      data: policies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get fare policy by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const policy = await FarePolicy.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Fare policy not found'
      });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new fare policy
router.post('/', auth, async (req, res) => {
  try {
    const policyData = {
      ...req.body,
      createdBy: req.user.id,
      updatedBy: req.user.id
    };

    const policy = new FarePolicy(policyData);
    await policy.save();

    res.status(201).json({
      success: true,
      data: policy
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update fare policy
router.put('/:id', auth, async (req, res) => {
  try {
    const policyData = {
      ...req.body,
      updatedBy: req.user.id
    };

    const policy = await FarePolicy.findByIdAndUpdate(
      req.params.id,
      policyData,
      { new: true, runValidators: true }
    );

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Fare policy not found'
      });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Delete fare policy
router.delete('/:id', auth, async (req, res) => {
  try {
    const policy = await FarePolicy.findByIdAndDelete(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        error: 'Fare policy not found'
      });
    }

    res.json({
      success: true,
      message: 'Fare policy deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Calculate fare
router.post('/calculate', auth, async (req, res) => {
  try {
    const { busType, routeType, distance, options = {} } = req.body;

    if (!busType || !routeType || distance === undefined) {
      return res.status(400).json({
        success: false,
        error: 'busType, routeType, and distance are required'
      });
    }

    const result = await FareCalculationService.calculateFare(
      busType,
      routeType,
      distance,
      options
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get fare comparison for multiple bus types
router.post('/compare', auth, async (req, res) => {
  try {
    const { busTypes, routeType, distance, options = {} } = req.body;

    if (!busTypes || !routeType || distance === undefined) {
      return res.status(400).json({
        success: false,
        error: 'busTypes, routeType, and distance are required'
      });
    }

    const result = await FareCalculationService.getFareComparison(
      busTypes,
      routeType,
      distance,
      options
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get fare policies for specific bus type
router.get('/bus-type/:busType', auth, async (req, res) => {
  try {
    const result = await FareCalculationService.getFarePoliciesForBusType(req.params.busType);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Initialize default fare policies
router.post('/initialize-defaults', auth, async (req, res) => {
  try {
    const result = await FareCalculationService.createDefaultFarePolicies();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get fare for route with distance
router.post('/route-fare', auth, async (req, res) => {
  try {
    const { routeId, busType, departureTime, options = {} } = req.body;

    // Get route distance from Route model
    const Route = require('../models/Route');
    const route = await Route.findById(routeId);
    
    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    // Determine route type based on distance
    let routeType = 'local';
    if (route.distance > 100) routeType = 'interstate';
    else if (route.distance > 50) routeType = 'long_distance';
    else if (route.distance > 25) routeType = 'intercity';

    // Determine time of day
    const hour = new Date(departureTime || new Date()).getHours();
    let timeOfDay = 'afternoon';
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const result = await FareCalculationService.calculateFare(
      busType,
      routeType,
      route.distance,
      { ...options, timeOfDay }
    );

    res.json({
      success: true,
      data: {
        ...result.data,
        route: {
          id: route._id,
          name: route.routeName,
          distance: route.distance,
          routeType
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
