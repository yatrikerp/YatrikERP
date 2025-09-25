const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // For now, return mock stops data
    // In production, this would fetch from a Stops model or Route intermediate stops
    const mockStops = [
      { _id: '1', name: 'Thiruvananthapuram Central', city: 'Thiruvananthapuram', coordinates: { lat: 8.5241, lng: 76.9366 } },
      { _id: '2', name: 'Kollam Junction', city: 'Kollam', coordinates: { lat: 8.8932, lng: 76.6141 } },
      { _id: '3', name: 'Kochi Central', city: 'Kochi', coordinates: { lat: 9.9312, lng: 76.2673 } },
      { _id: '4', name: 'Thrissur Railway Station', city: 'Thrissur', coordinates: { lat: 10.5276, lng: 76.2144 } },
      { _id: '5', name: 'Kozhikode Railway Station', city: 'Kozhikode', coordinates: { lat: 11.2588, lng: 75.7804 } },
      { _id: '6', name: 'Kannur Railway Station', city: 'Kannur', coordinates: { lat: 11.8745, lng: 75.3704 } },
      { _id: '7', name: 'Palakkad Junction', city: 'Palakkad', coordinates: { lat: 10.7867, lng: 76.6548 } },
      { _id: '8', name: 'Kottayam Railway Station', city: 'Kottayam', coordinates: { lat: 9.5907, lng: 76.5218 } },
      { _id: '9', name: 'Alappuzha Railway Station', city: 'Alappuzha', coordinates: { lat: 9.4981, lng: 76.3388 } },
      { _id: '10', name: 'Pathanamthitta Bus Stand', city: 'Pathanamthitta', coordinates: { lat: 9.2647, lng: 76.7870 } }
    ];

    res.json({ 
      success: true, 
      data: { stops: mockStops },
      stops: mockStops // Also include at root level for compatibility
    });
  } catch (error) {
    console.error('Stops error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stops',
      error: error.message
    });
  }
});

module.exports = router;
