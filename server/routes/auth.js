const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Get user profile - protected route
router.get('/profile', auth, authController.getUserProfile);

// Get all users - for testing only
router.get('/users', authController.getAllUsers);

module.exports = router;