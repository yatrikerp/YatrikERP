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

    const result = await mlService.getAllMetrics();
    
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

module.exports = router;
