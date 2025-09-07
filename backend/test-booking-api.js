const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test cities endpoint
app.get('/api/booking/cities', (req, res) => {
  console.log('Cities endpoint called');
  res.json({
    success: true,
    data: {
      cities: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Bangalore', 'Chennai', 'Hyderabad'],
      count: 6
    }
  });
});

// Test search endpoint
app.post('/api/booking/search', (req, res) => {
  console.log('Search endpoint called with:', req.body);
  const { from, to, departureDate, passengers } = req.body;
  
  if (!from || !to || !departureDate) {
    return res.status(400).json({
      success: false,
      message: 'From, to, and departure date are required'
    });
  }

  // Mock trip data
  const mockTrips = [
    {
      id: 'trip1',
      from: from,
      to: to,
      departure: '08:00',
      arrival: '12:00',
      duration: '4h 00m',
      busType: 'AC Seater',
      operator: 'Yatrik Travels',
      price: 350,
      availableSeats: 25,
      amenities: ['WiFi', 'Charging', 'Water'],
      rating: 4.5
    },
    {
      id: 'trip2',
      from: from,
      to: to,
      departure: '14:00',
      arrival: '18:00',
      duration: '4h 00m',
      busType: 'Non-AC Seater',
      operator: 'Yatrik Travels',
      price: 280,
      availableSeats: 30,
      amenities: ['Water'],
      rating: 4.2
    }
  ];

  res.json({
    success: true,
    data: {
      trips: mockTrips,
      searchCriteria: {
        from,
        to,
        departureDate,
        passengers
      }
    }
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Test booking API server running on port ${PORT}`);
  console.log(`📡 Cities endpoint: http://localhost:${PORT}/api/booking/cities`);
  console.log(`🔍 Search endpoint: http://localhost:${PORT}/api/booking/search`);
});

