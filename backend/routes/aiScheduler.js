const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// AI Scheduler routes (stub)
router.get('/', auth, (req, res) => {
  res.json({ success: true, message: 'AI Scheduler endpoint - under development' });
});

module.exports = router;
