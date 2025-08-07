const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Mock user database
let users = [];

// Register a new user
exports.register = (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate user input
    const validation = User.validate({ name, email, password });
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    // Check if user already exists
    const userExists = users.find(user => user.email === email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const newUser = new User(users.length + 1, name, email, password);
    
    // Add user to database
    users.push(newUser);
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.login = (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(user => user.email === email && user.password === password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'yatrik-erp-secret-key',
      { expiresIn: '1h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile
exports.getUserProfile = (req, res) => {
  try {
    const user = users.find(user => user.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// For testing purposes - get all users (would be removed in production)
exports.getAllUsers = (req, res) => {
  const safeUsers = users.map(({ id, name, email, createdAt }) => ({ id, name, email, createdAt }));
  res.json(safeUsers);
};