const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Alerts endpoint' });
});

// Kerala alerts - simple sample data for frontend consumption
router.get('/kerala', (req, res) => {
  const alerts = [
    { id: 'a1', type: 'traffic', level: 'medium', text: 'NH 66 slow near Alappuzha (10-15 min delay)' },
    { id: 'a2', type: 'rain', level: 'high', text: 'Heavy rain warning in Ernakulam after 6 PM' },
    { id: 'a3', type: 'event', level: 'info', text: 'Temple festival near Cherthala – expect crowd' }
  ];

  res.json(alerts);
});

module.exports = router;
