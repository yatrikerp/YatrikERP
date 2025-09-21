const express = require('express');
const router = express.Router();
const { getEmailQueueStatus, clearEmailQueue } = require('../services/emailQueue');

// GET /api/email/status - Get email queue status (for monitoring)
router.get('/status', (req, res) => {
  try {
    const status = getEmailQueueStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get email status',
      error: error.message
    });
  }
});

// POST /api/email/clear - Clear email queue (for testing)
router.post('/clear', (req, res) => {
  try {
    clearEmailQueue();
    res.json({
      success: true,
      message: 'Email queue cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear email queue',
      error: error.message
    });
  }
});

module.exports = router;
