const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Minimal test route
router.get('/status', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        current: {
          totalTrips: 0,
          totalDepots: 92,
          totalBuses: 2703,
          totalRoutes: 709
        }
      }
    });
  } catch (error) {
    console.error('Error in status endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
