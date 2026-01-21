const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Scheduler V2 routes (stub)
router.get('/', auth, (req, res) => {
  res.json({ success: true, message: 'Scheduler V2 endpoint - under development' });
});

module.exports = router;
