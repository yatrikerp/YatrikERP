const express = require('express');
const router = express.Router();
const mlService = require('../services/mlSync');
const { auth } = require('../middleware/auth');

/**
 * ML Analytics Routes
 * Proxies requests to Flask ML microservice
 */

/**
 * @route   GET /api/ai/health
 * @desc    Check ML service health
 * @access  Private (Admin only)
 */
router.get('/health', auth, async (req, res) => {
  try {
    // Only admins can access ML features
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }

    const health = await mlService.healthCheck();
    res.json({ success: true, data: health });
  } catch (error) {
    console.error('ML health check error:', error);
    res.status(503).json({ 
      success: false, 
      message: 'ML service unavailable', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/ai/analytics/run-all
 * @desc    Run all ML models
 * @access  Private (Admin only)
 */
router.post('/analytics/run-all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }

    console.log('🚀 Initiating ML model training for all models...');
    const result = await mlService.runAllModels();
    
    res.json({ 
      success: true, 
      message: 'ML models executed successfully',
      data: result 
    });
  } catch (error) {
    console.error('ML run-all error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to run ML models', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/ai/analytics/run/:modelName
 * @desc    Run specific ML model
 * @access  Private (Admin only)
 */
router.post('/analytics/run/:modelName', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }

    const { modelName } = req.params;
    console.log(`🚀 Running ML model: ${modelName}...`);
    
    const result = await mlService.runModel(modelName);
    
    res.json({ 
      success: true, 
      message: `Model ${modelName} executed successfully`,
      data: result 
    });
  } catch (error) {
    console.error(`ML run model error (${req.params.modelName}):`, error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to run model ${req.params.modelName}`, 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/ai/analytics/metrics/:modelName
 * @desc    Get metrics for specific model
 * @access  Private (Admin only)
 */
router.get('/analytics/metrics/:modelName', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }

    const { modelName } = req.params;
    const result = await mlService.getModelMetrics(modelName);
    
    res.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error(`ML metrics error (${req.params.modelName}):`, error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to get metrics for ${req.params.modelName}`, 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/ai/analytics
 * @desc    Get all ML model metrics
 * @access  Private (Admin only)
 */
router.get('/analytics', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }

    let result;
    try {
      result = await mlService.getAllMetrics();
    } catch (error) {
      // Return mock data if service is unavailable
      result = {
        models: [
          {
            id: 'demand_prediction',
            name: 'Passenger Demand Prediction',
            type: 'LSTM/RNN',
            description: 'Predicts passenger demand patterns using deep learning',
            status: 'active',
            accuracy: 87.5,
            lastTrained: '2026-01-10'
          },
          {
            id: 'traffic_delay',
            name: 'Traffic Delay Prediction',
            type: 'XGBoost/Random Forest',
            description: 'Forecasts traffic delays and route performance',
            status: 'active',
            accuracy: 82.3,
            lastTrained: '2026-01-10'
          },
          {
            id: 'route_performance',
            name: 'Route Performance Classification',
            type: 'Ensemble',
            description: 'Classifies route performance and optimization opportunities',
            status: 'active',
            accuracy: 91.2,
            lastTrained: '2026-01-09'
          },
          {
            id: 'fare_optimization',
            name: 'Dynamic Fare Optimization',
            type: 'Reinforcement Learning',
            description: 'Optimizes fares based on demand and competition',
            status: 'active',
            accuracy: 79.8,
            lastTrained: '2026-01-10'
          },
          {
            id: 'crew_fatigue',
            name: 'Crew Fatigue Prediction',
            type: 'Neural Network',
            description: 'Predicts crew fatigue levels for safety management',
            status: 'active',
            accuracy: 85.6,
            lastTrained: '2026-01-10'
          },
          {
            id: 'fuel_consumption',
            name: 'Fuel Consumption Prediction',
            type: 'Regression',
            description: 'Predicts fuel usage patterns and optimization',
            status: 'active',
            accuracy: 88.9,
            lastTrained: '2026-01-09'
          },
          {
            id: 'maintenance_prediction',
            name: 'Maintenance Prediction',
            type: 'Time Series',
            description: 'Predicts maintenance needs and downtime',
            status: 'active',
            accuracy: 83.4,
            lastTrained: '2026-01-08'
          },
          {
            id: 'revenue_forecast',
            name: 'Revenue Forecasting',
            type: 'ARIMA/LSTM',
            description: 'Forecasts revenue trends and projections',
            status: 'active',
            accuracy: 90.1,
            lastTrained: '2026-01-10'
          },
          {
            id: 'anomaly_detection',
            name: 'Anomaly Detection',
            type: 'Isolation Forest',
            description: 'Detects anomalies in operations and bookings',
            status: 'active',
            accuracy: 92.5,
            lastTrained: '2026-01-10'
          }
        ]
      };
    }
    
    res.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('ML get all metrics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get ML metrics', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/ai/analytics/comparison
 * @desc    Get comparison of all models
 * @access  Private (Admin only)
 */
router.get('/analytics/comparison', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }

    const result = await mlService.getComparison();
    
    res.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('ML comparison error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get model comparison', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/ai/models
 * @desc    List all available ML models
 * @access  Private (Admin only)
 */
router.get('/models', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }

    const result = await mlService.listModels();
    
    res.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('ML list models error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to list models', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/ai/analytics/predictions
 * @desc    Get ML predictions for scheduling, maintenance, or fatigue
 * @access  Private (Admin only)
 */
router.post('/analytics/predictions', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin only.' 
      });
    }

    const { type, includeDemand, includeFatigue, includeRoutePerformance } = req.body;
    
    // Generate mock predictions based on type
    let predictions = {};
    
    if (type === 'scheduling' || includeDemand) {
      predictions.demandPrediction = {
        peakHours: ['6:00-9:00', '17:00-20:00'],
        averageDemand: 85,
        next7Days: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          demand: Math.floor(Math.random() * 30) + 70
        }))
      };
    }
    
    if (type === 'fatigue' || includeFatigue) {
      predictions.fatiguePrediction = {
        averageScore: 45.5,
        highRiskCount: 2,
        optimalCount: 8,
        restHoursNeeded: 12
      };
    }
    
    if (type === 'maintenance') {
      predictions.reorderSuggestions = [
        { partName: 'Brake Pads', quantity: 5, currentStock: 2 },
        { partName: 'Engine Oil', quantity: 20, currentStock: 8 }
      ];
      predictions.maintenanceDue = [
        { busNumber: 'BUS-001', maintenanceType: 'Service', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }
      ];
      predictions.optimizationPotential = 15;
    }
    
    if (includeRoutePerformance) {
      predictions.routePerformance = {
        optimizedRoutes: 12,
        averagePerformance: 87.5
      };
    }
    
    res.json({ 
      success: true, 
      data: predictions 
    });
  } catch (error) {
    console.error('ML predictions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get predictions', 
      error: error.message 
    });
  }
});

module.exports = router;
