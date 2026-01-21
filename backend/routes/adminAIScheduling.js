const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');

// Admin AI Scheduling routes (stub)
router.get('/', auth, requireRole(['admin']), (req, res) => {
  res.json({ success: true, message: 'Admin AI Scheduling endpoint - under development' });
});

module.exports = router;
