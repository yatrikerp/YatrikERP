const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// ML Recommendations routes (stub)
router.get('/', auth, (req, res) => {
  res.json({ success: true, message: 'ML Recommendations endpoint - under development' });
});

module.exports = router;
