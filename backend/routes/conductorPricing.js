const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const { auth } = require('../middleware/auth');

// @route   PUT /api/admin/routes/:id/prices
// @desc    Update conductor prices for intermediate stops
// @access  Private (Admin, Conductor)
router.put('/:id/prices', auth, async (req, res) => {
  // Validation
  const { intermediateStops } = req.body;
  
  if (!Array.isArray(intermediateStops)) {
    return res.status(400).json({
      success: false,
      error: 'Intermediate stops must be an array'
    });
  }
  
  for (const stop of intermediateStops) {
    if (typeof stop.price !== 'number' || stop.price < 0) {
      return res.status(400).json({
        success: false,
        error: 'Each stop price must be a valid number'
      });
    }
    if (typeof stop.stopOrder !== 'number' || stop.stopOrder < 0) {
      return res.status(400).json({
        success: false,
        error: 'Each stop must have a valid order number'
      });
    }
  }
  try {

    // Find the route
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    // Check permissions
    const userRole = req.user.role;
    const allowedRoles = ['ADMIN', 'CONDUCTOR', 'DEPOT_MANAGER'];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only admins and conductors can update prices'
      });
    }

    // Update intermediate stops with new prices
    const { intermediateStops } = req.body;
    
    if (!intermediateStops || !Array.isArray(intermediateStops)) {
      return res.status(400).json({
        success: false,
        error: 'Intermediate stops must be provided as an array'
      });
    }

    // Validate and update each stop
    const updatedStops = intermediateStops.map((stop, index) => {
      if (typeof stop.price !== 'number' || stop.price < 0) {
        throw new Error(`Invalid price for stop ${index + 1}`);
      }
      
      return {
        ...stop,
        price: parseFloat(stop.price),
        stopOrder: index + 1,
        updatedBy: req.user.id,
        updatedAt: new Date()
      };
    });

    // Update the route
    const updatedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      {
        intermediateStops: updatedStops,
        lastModifiedBy: req.user.id,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('depot.depotId', 'depotName depotCode');

    // Log the price update
    console.log(`💰 Conductor ${req.user.name} (${req.user.role}) updated prices for route ${route.routeNumber}`);
    console.log(`📊 Updated ${updatedStops.length} stops with total revenue: ₹${updatedStops.reduce((sum, stop) => sum + stop.price, 0).toFixed(2)}`);

    res.json({
      success: true,
      message: 'Conductor prices updated successfully',
      data: {
        route: updatedRoute,
        priceSummary: {
          totalStops: updatedStops.length,
          totalRevenue: updatedStops.reduce((sum, stop) => sum + stop.price, 0),
          averagePrice: updatedStops.reduce((sum, stop) => sum + stop.price, 0) / updatedStops.length,
          highestPrice: Math.max(...updatedStops.map(stop => stop.price)),
          lowestPrice: Math.min(...updatedStops.map(stop => stop.price))
        }
      }
    });

  } catch (error) {
    console.error('Error updating conductor prices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update conductor prices'
    });
  }
});

// @route   GET /api/admin/routes/:id/prices
// @desc    Get conductor pricing information for a route
// @access  Private (Admin, Conductor)
router.get('/:id/prices', auth, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
      .populate('depot.depotId', 'depotName depotCode')
      .select('routeNumber routeName intermediateStops depot totalDistance estimatedDuration');

    if (!route) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    // Check permissions
    const userRole = req.user.role;
    const allowedRoles = ['ADMIN', 'CONDUCTOR', 'DEPOT_MANAGER'];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Calculate pricing summary
    const pricingSummary = {
      totalStops: route.intermediateStops.length,
      totalRevenue: route.intermediateStops.reduce((sum, stop) => sum + (stop.price || 0), 0),
      averagePrice: route.intermediateStops.length > 0 
        ? route.intermediateStops.reduce((sum, stop) => sum + (stop.price || 0), 0) / route.intermediateStops.length 
        : 0,
      highestPrice: route.intermediateStops.length > 0 
        ? Math.max(...route.intermediateStops.map(stop => stop.price || 0)) 
        : 0,
      lowestPrice: route.intermediateStops.length > 0 
        ? Math.min(...route.intermediateStops.filter(stop => stop.price > 0).map(stop => stop.price)) 
        : 0,
      stopsWithPrices: route.intermediateStops.filter(stop => stop.price > 0).length,
      stopsWithoutPrices: route.intermediateStops.filter(stop => !stop.price || stop.price === 0).length
    };

    res.json({
      success: true,
      data: {
        route: route,
        pricingSummary: pricingSummary
      }
    });

  } catch (error) {
    console.error('Error fetching conductor pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conductor pricing information'
    });
  }
});

// @route   GET /api/conductor/routes
// @desc    Get routes accessible to conductor with pricing info
// @access  Private (Conductor)
router.get('/conductor/routes', auth, async (req, res) => {
  try {
    // Check if user is a conductor
    if (req.user.role !== 'CONDUCTOR') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. This endpoint is for conductors only'
      });
    }

    // Get routes where conductor can manage prices
    // For now, we'll return all active routes, but this could be filtered by depot or assignment
    const routes = await Route.find({ 
      status: 'active',
      isActive: true 
    })
    .populate('depot.depotId', 'depotName depotCode')
    .select('routeNumber routeName intermediateStops depot totalDistance estimatedDuration status')
    .sort({ routeNumber: 1 });

    // Add pricing summary for each route
    const routesWithPricing = routes.map(route => {
      const pricingSummary = {
        totalStops: route.intermediateStops.length,
        totalRevenue: route.intermediateStops.reduce((sum, stop) => sum + (stop.price || 0), 0),
        stopsWithPrices: route.intermediateStops.filter(stop => stop.price > 0).length,
        stopsWithoutPrices: route.intermediateStops.filter(stop => !stop.price || stop.price === 0).length
      };

      return {
        ...route.toObject(),
        pricingSummary
      };
    });

    res.json({
      success: true,
      data: {
        routes: routesWithPricing,
        summary: {
          totalRoutes: routes.length,
          totalRevenue: routesWithPricing.reduce((sum, route) => sum + route.pricingSummary.totalRevenue, 0),
          routesWithPricing: routesWithPricing.filter(route => route.pricingSummary.stopsWithPrices > 0).length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching conductor routes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conductor routes'
    });
  }
});

module.exports = router;
