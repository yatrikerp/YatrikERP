const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DepotUser = require('../models/DepotUser');

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
    console.log('Token payload:', payload);
    
    // Check cache first
    const cacheKey = `${payload.userId}_${payload.role}`;
    const cachedUser = userCache.get(cacheKey);
    
    if (cachedUser && Date.now() - cachedUser.timestamp < CACHE_TTL) {
      req.user = cachedUser.user;
      return next();
    }

    // Fetch user from database with minimal fields
    let user = await User.findById(payload.userId)
      .select('_id name email role status depotId lastLogin')
      .lean();

    // If not a regular user, try DepotUser (depot panel accounts)
    if (!user) {
      const depotUser = await DepotUser.findById(payload.userId)
        .select('_id username email role status depotId lastLogin depotCode depotName permissions')
        .lean();

      if (depotUser) {
        // Normalize to common shape used across routes
        user = {
          _id: depotUser._id,
          name: depotUser.username,
          email: depotUser.email,
          role: depotUser.role || 'depot_manager',
          status: depotUser.status,
          depotId: depotUser.depotId,
          lastLogin: depotUser.lastLogin,
          username: depotUser.username,
          depotCode: depotUser.depotCode,
          depotName: depotUser.depotName,
          permissions: depotUser.permissions || []
        };
      }
    }

    if (!user) {
      console.error('User not found for ID:', payload.userId);
      return res.status(401).json({ 
        success: false, 
        error: 'User not found. Please log in again.',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (user.status !== 'active') {
      console.error('User account is not active:', user.status);
      return res.status(401).json({ 
        success: false, 
        error: 'Account is not active. Please contact support.',
        code: 'ACCOUNT_INACTIVE'
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
    
    // Special handling for depot users - allow access to most endpoints
    const isDepotUser = ['DEPOT_MANAGER', 'DEPOT_SUPERVISOR', 'DEPOT_OPERATOR', 'MANAGER', 'SUPERVISOR', 'OPERATOR'].includes(userRole);
    const isAdminUser = ['ADMIN', 'ADMINISTRATOR'].includes(userRole);
    
    console.log('Role check:', {
      userRole,
      allowedRoles,
      isDepotUser,
      isAdminUser,
      isAllowed: allowedRoles.includes(userRole) || isDepotUser || isAdminUser,
      user: req.user
    });
    
    // Allow access if user role is in allowed roles, or if it's a depot/admin user
    if (!allowedRoles.includes(userRole) && !isDepotUser && !isAdminUser) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions',
        userRole,
        allowedRoles
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
