const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Driver = require('./models/Driver');
const Conductor = require('./models/Conductor');

const app = express();
app.use(cors());
app.use(express.json());

// Simple test route without auth
app.get('/test-drivers', async (req, res) => {
  try {
    const drivers = await Driver.find().lean();
    console.log('Found drivers:', drivers.length);
    res.json({ success: true, drivers, count: drivers.length });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test with auth
app.get('/test-drivers-auth', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    console.log('Token payload:', payload);

    const drivers = await Driver.find().lean();
    console.log('Found drivers:', drivers.length);
    res.json({ success: true, drivers, count: drivers.length });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startServer() {
  try {
    await mongoose.connect('mongodb://localhost:27017/yatrik_erp');
    console.log('Connected to MongoDB');
    
    app.listen(5001, () => {
      console.log('Test server running on port 5001');
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer();
