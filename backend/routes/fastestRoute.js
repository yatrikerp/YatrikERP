const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const PathfindingService = require('../services/pathfindingService');
const KSRTCDataImporter = require('../services/ksrtcDataImporter');
const { auth, requireRole } = require('../middleware/auth');
const Stop = require('../models/Stop');
const RouteGraph = require('../models/RouteGraph');

// Initialize services
const pathfindingService = new PathfindingService();
const dataImporter = new KSRTCDataImporter();

// Rate limiting for route queries
const rateLimit = require('express-rate-limit');
const routeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 20, // Allow 20 route queries per minute
  message: 'Route query rate limit exceeded. Please wait before searching again.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// GET /api/fastest-route - Find fastest route between two stops
router.get('/',
  routeLimiter,
  [
    query('originStopId').notEmpty().withMessage('Origin stop ID is required'),
    query('destinationStopId').notEmpty().withMessage('Destination stop ID is required'),
    query('timeOfDay').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format'),
    query('preference').optional().isIn(['duration', 'fare', 'transfers', 'distance']).withMessage('Invalid preference'),
    query('maxOptions').optional().isInt({ min: 1, max: 10 }).withMessage('Max options must be between 1 and 10')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        originStopId,
        destinationStopId,
        timeOfDay,
        preference = 'duration',
        maxOptions = 3
      } = req.query;

      // Validate that stops exist
      const [originStop, destinationStop] = await Promise.all([
        Stop.findById(originStopId),
        Stop.findById(destinationStopId)
      ]);

      if (!originStop) {
        return res.status(404).json({
          success: false,
          message: 'Origin stop not found'
        });
      }

      if (!destinationStop) {
        return res.status(404).json({
          success: false,
          message: 'Destination stop not found'
        });
      }

      // Find route options based on preference
      let result;
      const options = { preference, maxOptions };

      switch (preference) {
        case 'fare':
          result = await pathfindingService.findCheapestRoute(originStopId, destinationStopId, options);
          break;
        case 'transfers':
          result = await pathfindingService.findLeastTransfersRoute(originStopId, destinationStopId, options);
          break;
        default:
          result = await pathfindingService.findRouteOptions(originStopId, destinationStopId, timeOfDay, options);
      }

      res.json({
        success: true,
        data: {
          origin: {
            stopId: originStopId,
            name: originStop.name,
            code: originStop.code,
            coordinates: {
              latitude: originStop.lat,
              longitude: originStop.lon
            }
          },
          destination: {
            stopId: destinationStopId,
            name: destinationStop.name,
            code: destinationStop.code,
            coordinates: {
              latitude: destinationStop.lat,
              longitude: destinationStop.lon
            }
          },
          routes: Array.isArray(result) ? result : [result],
          queryTime: new Date().toISOString(),
          timeOfDay,
          preference
        }
      });

    } catch (error) {
      console.error('Fastest route error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to find fastest route',
        error: error.message
      });
    }
  }
);

// GET /api/fastest-route/cheapest - Find cheapest route
router.get('/cheapest',
  routeLimiter,
  [
    query('originStopId').notEmpty().withMessage('Origin stop ID is required'),
    query('destinationStopId').notEmpty().withMessage('Destination stop ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { originStopId, destinationStopId } = req.query;

      const result = await pathfindingService.findCheapestRoute(originStopId, destinationStopId);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Cheapest route error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to find cheapest route',
        error: error.message
      });
    }
  }
);

// GET /api/fastest-route/least-transfers - Find route with least transfers
router.get('/least-transfers',
  routeLimiter,
  [
    query('originStopId').notEmpty().withMessage('Origin stop ID is required'),
    query('destinationStopId').notEmpty().withMessage('Destination stop ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { originStopId, destinationStopId } = req.query;

      const result = await pathfindingService.findLeastTransfersRoute(originStopId, destinationStopId);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Least transfers route error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to find least transfers route',
        error: error.message
      });
    }
  }
);

// GET /api/fastest-route/nearby - Find nearby stops
router.get('/nearby',
  routeLimiter,
  [
    query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    query('radius').optional().isFloat({ min: 0.1, max: 10 }).withMessage('Radius must be between 0.1 and 10 km')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { latitude, longitude, radius = 1 } = req.query;

      const result = await pathfindingService.findNearbyStops(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius)
      );

      res.json({
        success: true,
        data: {
          location: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          },
          radius: parseFloat(radius),
          stops: result
        }
      });

    } catch (error) {
      console.error('Nearby stops error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to find nearby stops',
        error: error.message
      });
    }
  }
);

// GET /api/fastest-route/options - Find multiple route options
router.get('/options',
  routeLimiter,
  [
    query('originStopId').notEmpty().withMessage('Origin stop ID is required'),
    query('destinationStopId').notEmpty().withMessage('Destination stop ID is required'),
    query('timeOfDay').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time must be in HH:MM format'),
    query('maxOptions').optional().isInt({ min: 1, max: 10 }).withMessage('Max options must be between 1 and 10')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        originStopId,
        destinationStopId,
        timeOfDay,
        maxOptions = 5
      } = req.query;

      const result = await pathfindingService.findRouteOptions(
        originStopId,
        destinationStopId,
        timeOfDay,
        { maxOptions }
      );

      res.json({
        success: true,
        data: {
          routes: result,
          totalOptions: result.length,
          queryTime: new Date().toISOString(),
          timeOfDay
        }
      });

    } catch (error) {
      console.error('Route options error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to find route options',
        error: error.message
      });
    }
  }
);

// POST /api/fastest-route/import-data - Import KSRTC data (admin only)
router.post('/import-data',
  auth,
  requireRole(['admin']),
  [
    body('dataType').isIn(['routes', 'stops', 'routeStops', 'all']).withMessage('Invalid data type'),
    body('filePath').notEmpty().withMessage('File path is required'),
    body('format').isIn(['csv', 'json']).withMessage('Format must be csv or json')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { dataType, filePath, format } = req.body;

      let result;
      switch (dataType) {
        case 'routes':
          result = await dataImporter.importRoutes(filePath, format);
          break;
        case 'stops':
          result = await dataImporter.importStops(filePath, format);
          break;
        case 'routeStops':
          result = await dataImporter.importRouteStops(filePath, format);
          break;
        case 'all':
          // Import all data types
          const routesResult = await dataImporter.importRoutes(filePath + '/routes.' + format, format);
          const stopsResult = await dataImporter.importStops(filePath + '/stops.' + format, format);
          const routeStopsResult = await dataImporter.importRouteStops(filePath + '/routeStops.' + format, format);
          
          result = {
            routes: routesResult,
            stops: stopsResult,
            routeStops: routeStopsResult
          };
          break;
      }

      res.json({
        success: true,
        message: 'Data import completed',
        data: result
      });

    } catch (error) {
      console.error('Data import error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import data',
        error: error.message
      });
    }
  }
);

// POST /api/fastest-route/build-graph - Build route graph (admin only)
router.post('/build-graph',
  auth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const graph = await dataImporter.buildRouteGraph();

      res.json({
        success: true,
        message: 'Route graph built successfully',
        data: {
          graphId: graph._id,
          version: graph.graphVersion,
          totalStops: graph.totalStops,
          totalRoutes: graph.totalRoutes,
          buildTime: graph.buildTime,
          nodeCount: graph.nodeCount,
          edgeCount: graph.edgeCount
        }
      });

    } catch (error) {
      console.error('Graph build error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to build route graph',
        error: error.message
      });
    }
  }
);

// GET /api/fastest-route/graph-status - Get graph status
router.get('/graph-status', async (req, res) => {
  try {
    const graph = await RouteGraph.getLatest();

    if (!graph) {
      return res.json({
        success: true,
        data: {
          available: false,
          message: 'No route graph available. Please import data and build graph.'
        }
      });
    }

    res.json({
      success: true,
      data: {
        available: true,
        graphId: graph._id,
        version: graph.graphVersion,
        lastUpdated: graph.lastUpdated,
        totalStops: graph.totalStops,
        totalRoutes: graph.totalRoutes,
        buildTime: graph.buildTime,
        nodeCount: graph.nodeCount,
        edgeCount: graph.edgeCount,
        isActive: graph.isActive,
        isLatest: graph.isLatest
      }
    });

  } catch (error) {
    console.error('Graph status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get graph status',
      error: error.message
    });
  }
});

// DELETE /api/fastest-route/cache - Clear pathfinding cache (admin only)
router.delete('/cache',
  auth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      pathfindingService.clearCache();

      res.json({
        success: true,
        message: 'Cache cleared successfully'
      });

    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cache',
        error: error.message
      });
    }
  }
);

// GET /api/fastest-route/cache-stats - Get cache statistics (admin only)
router.get('/cache-stats',
  auth,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const stats = pathfindingService.getCacheStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Cache stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cache statistics',
        error: error.message
      });
    }
  }
);

module.exports = router;











































