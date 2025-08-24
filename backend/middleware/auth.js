const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Simple in-memory cache for user data (in production, use Redis)
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Base authentication middleware
const auth = async (req, res, next) => {
  try {
    // Check if this is being called during module loading (no req object)
    if (!req || !req.headers) {
      return next ? next() : null;
    }

    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    // Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Check cache first
    const cacheKey = `${payload.userId}_${payload.role}`;
    const cachedUser = userCache.get(cacheKey);
    
    if (cachedUser && Date.now() - cachedUser.timestamp < CACHE_TTL) {
      req.user = cachedUser.user;
      return next();
    }

    // Fetch user from database with minimal fields
    const user = await User.findById(payload.userId)
      .select('_id name email role status depotId lastLogin')
      .lean();
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Cache user data
    userCache.set(cacheKey, {
      user,
      timestamp: Date.now()
    });

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (res && res.status) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }
    return null;
  }
};

// Role-based authorization middleware factory
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const userRole = req.user.role?.toUpperCase();
    const allowedRoles = Array.isArray(roles) ? roles.map(r => r.toUpperCase()) : [roles.toUpperCase()];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Combined auth + role middleware for easy use in routes
const authWithRole = (roles) => {
  return [auth, requireRole(roles)];
};

// Clear expired cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

module.exports = { auth, requireRole, authWithRole };
