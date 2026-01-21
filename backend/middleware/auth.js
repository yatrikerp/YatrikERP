const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const DepotUser = require('../models/DepotUser');
const Driver = require('../models/Driver');
const Conductor = require('../models/Conductor');
const Vendor = require('../models/Vendor');
const StudentPass = require('../models/StudentPass');
const { logger } = require('../src/core/logger');

// In-memory user cache disabled to ensure live reads from DB
const userCache = { get: () => null, set: () => {}, entries: () => [], delete: () => {} };
const CACHE_TTL = 0;

// Base authentication middleware
const auth = async (req, res, next) => {
  try {
    // Check if this is being called during module loading (no req object)
    if (!req || !req.headers) {
      return next ? next() : null;
    }

    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    
    if (!token) {
      logger.error('[AUTH] No token provided for:', req.path);
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided',
        message: 'Authentication required. Please log in.'
      });
    }

    // Verify token
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      logger.info('[AUTH] Token verified successfully:', {
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
        path: req.path
      });
    } catch (error) {
      logger.error('[AUTH] Token verification failed:', error.message, 'for path:', req.path);
      logger.error('[AUTH] Token details:', {
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + '...',
        errorName: error.name,
        errorMessage: error.message
      });
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token',
        message: 'Authentication failed. Please log in again.',
        code: 'TOKEN_INVALID'
      });
    }
    
    // Skip in-memory cache for always-live data
    const cacheKey = `${payload.userId || payload.vendorId || payload.studentId}_${payload.role}`;

    // Extract roleType from token payload
    const roleType = payload.roleType || 'internal';
    const role = (payload.role || '').toLowerCase();
    const payloadRole = String(payload.role || '').toUpperCase();

    // Initialize user variable
    let user = null;

    // PRIORITY CHECK: Check Vendor FIRST if token indicates vendor (before User lookup)
    // This prevents vendor tokens from being rejected by User lookup
    if ((payloadRole === 'VENDOR' || role === 'vendor' || payload.vendorId) && (payload.vendorId || payload.userId)) {
      const vendor = await Vendor.findById(payload.vendorId || payload.userId)
        .select('_id companyName email phone status trustScore complianceScore verificationStatus')
        .lean();
      
      if (vendor) {
        // Check if vendor status allows access (approved or active)
        if (vendor.status === 'approved' || vendor.status === 'active' || vendor.status === 'pending') {
          user = {
            _id: vendor._id,
            vendorId: vendor._id,
            name: vendor.companyName,
            email: vendor.email,
            phone: vendor.phone,
            role: 'vendor',
            roleType: 'external',
            status: vendor.status,
            companyName: vendor.companyName,
            trustScore: vendor.trustScore,
            complianceScore: vendor.complianceScore,
            verificationStatus: vendor.verificationStatus
          };
          logger.info('[AUTH] Vendor authenticated via priority check:', vendor.companyName, 'status:', vendor.status);
        } else {
          return res.status(403).json({
            success: false,
            error: `Vendor account is ${vendor.status}. Please contact administrator.`
          });
        }
      }
    }

    // Fetch user from database with minimal fields (only if vendor not found)
    if (!user) {
      try {
        // PRIORITY: Check for admin user first
        if (payloadRole === 'ADMIN' || payloadRole === 'ADMINISTRATOR' || role === 'admin') {
          logger.info('[AUTH] Admin token detected, looking up admin user:', {
            userId: payload.userId,
            email: payload.email,
            role: payload.role
          });
          
          // Try by ID first - convert to ObjectId if it's a string
          if (payload.userId) {
            try {
              const userId = mongoose.Types.ObjectId.isValid(payload.userId) 
                ? mongoose.Types.ObjectId(payload.userId) 
                : payload.userId;
              
              user = await User.findById(userId)
                .select('_id name email role roleType status depotId lastLogin profileCompleted')
                .lean();
              
              if (user) {
                if (user.role !== 'admin') {
                  logger.warn('[AUTH] User found but role is not admin:', user.role);
                  user = null;
                } else {
                  logger.info('[AUTH] Admin user found by ID:', {
                    userId: user._id,
                    email: user.email,
                    role: user.role,
                    status: user.status
                  });
                }
              } else {
                logger.warn('[AUTH] Admin user not found by ID:', payload.userId);
              }
            } catch (idError) {
              logger.error('[AUTH] Error looking up admin user by ID:', idError);
              user = null;
            }
          }
          
          // If not found by ID, try by email
          if (!user && payload.email) {
            try {
              user = await User.findOne({ 
                email: payload.email.toLowerCase(),
                role: 'admin'
              })
              .select('_id name email role roleType status depotId lastLogin profileCompleted')
              .lean();
              
              if (user) {
                logger.info('[AUTH] Admin user found by email:', {
                  userId: user._id,
                  email: user.email,
                  role: user.role,
                  status: user.status
                });
              } else {
                logger.warn('[AUTH] Admin user not found by email:', payload.email);
              }
            } catch (emailError) {
              logger.error('[AUTH] Error looking up admin user by email:', emailError);
            }
          }
          
          // Fallback to admin@yatrik.com if still not found
          if (!user) {
            try {
              user = await User.findOne({ 
                email: 'admin@yatrik.com',
                role: 'admin'
              })
              .select('_id name email role roleType status depotId lastLogin profileCompleted')
              .lean();
              
              if (user) {
                logger.info('[AUTH] Admin user found by default email:', {
                  userId: user._id,
                  email: user.email,
                  role: user.role,
                  status: user.status
                });
              } else {
                logger.warn('[AUTH] Admin user not found by default email');
              }
            } catch (defaultError) {
              logger.error('[AUTH] Error looking up admin user by default email:', defaultError);
            }
          }
          
          // If still not found, log error and don't use synthetic admin
          if (!user) {
            logger.error('[AUTH] Admin user not found in database after all attempts:', {
              userId: payload.userId,
              email: payload.email,
              role: payload.role
            });
            // Don't create synthetic admin - return error instead
            return res.status(401).json({
              success: false,
              error: 'Admin user not found in database',
              code: 'ADMIN_NOT_FOUND',
              message: 'Admin account not found. Please contact system administrator.'
            });
          }
        } else {
          // For non-admin users, use regular lookup
          try {
            const userId = mongoose.Types.ObjectId.isValid(payload.userId) 
              ? mongoose.Types.ObjectId(payload.userId) 
              : payload.userId;
            user = await User.findById(userId)
              .select('_id name email role roleType status depotId lastLogin profileCompleted')
              .lean();
          } catch (idError) {
            logger.error('[AUTH] Error looking up user by ID:', idError);
          }
        }
      } catch (dbError) {
        logger.error('[AUTH] Database error while fetching user:', dbError);
        logger.error('[AUTH] Database error stack:', dbError.stack);
        // Continue to synthetic user fallback
      }
    }
    
    // Add roleType to user if not present
    if (user && !user.roleType) {
      const internalRoles = ['admin', 'depot_manager', 'conductor', 'driver', 'support_agent', 'data_collector'];
      user.roleType = internalRoles.includes(user.role) ? 'internal' : 'external';
    }

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
          roleType: 'internal',
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

    // If still not found, try Driver model
    if (!user) {
      const driver = await Driver.findById(payload.userId)
        .select('_id driverId name email phone status depotId lastLogin')
        .lean();

      if (driver) {
        user = {
          _id: driver._id,
          driverId: driver.driverId,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          role: 'driver',
          roleType: 'internal',
          status: driver.status,
          depotId: driver.depotId,
          lastLogin: driver.lastLogin
        };
      }
    }

    // If still not found, try Conductor model
    if (!user) {
      const conductor = await Conductor.findById(payload.userId)
        .select('_id conductorId name email phone status depotId lastLogin')
        .lean();

      if (conductor) {
        user = {
          _id: conductor._id,
          conductorId: conductor.conductorId,
          name: conductor.name,
          email: conductor.email,
          phone: conductor.phone,
          role: 'conductor',
          roleType: 'internal',
          status: conductor.status,
          depotId: conductor.depotId,
          lastLogin: conductor.lastLogin
        };
      }
    }

    // Fallback: accept conductor tokens even if DB record is missing (for pattern-logins)
    if (!user) {
      const payloadRole = String(payload.role || '').toUpperCase();
      if (payloadRole === 'CONDUCTOR' && (payload.isConductor || payload.conductorId || payload.conductorNumber)) {
        user = {
          _id: payload.userId || payload.conductorId || `conductor_${payload.conductorNumber || '000'}`,
          name: payload.name || `Conductor ${payload.conductorNumber || ''}`.trim(),
          email: payload.email || '',
          role: 'conductor',
          roleType: 'internal',
          status: 'active',
          depotId: payload.depotId,
          lastLogin: new Date()
        };
      }
    }

    // Check Vendor model if roleType is external and role is vendor
    if (!user && roleType === 'external' && role === 'vendor' && (payload.vendorId || payload.userId)) {
      const vendor = await Vendor.findById(payload.vendorId || payload.userId)
        .select('_id companyName email phone status trustScore complianceScore')
        .lean();
      
      if (vendor) {
        user = {
          _id: vendor._id,
          name: vendor.companyName,
          email: vendor.email,
          phone: vendor.phone,
          role: 'vendor',
          roleType: 'external',
          status: vendor.status,
          vendorId: vendor._id,
          companyName: vendor.companyName
        };
      }
    }

    // Check StudentPass model if roleType is external and role is student
    if (!user && roleType === 'external' && role === 'student' && (payload.studentId || payload.aadhaarNumber)) {
      const student = await StudentPass.findById(payload.studentId || payload.userId)
        .select('_id name email phone status passNumber aadhaarNumber eligibilityStatus')
        .lean();
      
      if (student) {
        user = {
          _id: student._id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          role: 'student',
          roleType: 'external',
          status: student.status,
          studentId: student._id,
          passNumber: student.passNumber,
          aadhaarNumber: student.aadhaarNumber
        };
      }
    }

    // Fallback: accept driver tokens even if DB record is missing (for pattern-logins)
    if (!user) {
      const payloadRole = String(payload.role || '').toUpperCase();
      if (payloadRole === 'DRIVER' && (payload.isDriver || payload.driverId || payload.driverNumber)) {
        user = {
          _id: payload.userId || payload.driverId || `driver_${payload.driverNumber || '000'}`,
          name: payload.name || `Driver ${payload.driverNumber || ''}`.trim(),
          email: payload.email || '',
          role: 'driver',
          status: 'active',
          depotId: payload.depotId,
          lastLogin: new Date(),
          driverId: payload.driverId
        };
      }
    }

    // Final vendor fallback check (should rarely be needed after priority check)
    if (!user && (payload.vendorId || (role === 'vendor' && payload.userId) || payloadRole === 'VENDOR')) {
      const vendorId = payload.vendorId || payload.userId;
      if (vendorId) {
        const vendor = await Vendor.findById(vendorId)
          .select('_id companyName email phone status trustScore complianceScore verificationStatus')
          .lean();

        if (vendor) {
          // Allow approved, active, or pending vendors
          if (vendor.status === 'approved' || vendor.status === 'active' || vendor.status === 'pending') {
            user = {
              _id: vendor._id,
              vendorId: vendor._id,
              name: vendor.companyName,
              email: vendor.email,
              phone: vendor.phone,
              role: 'vendor',
              roleType: 'external',
              status: vendor.status,
              companyName: vendor.companyName,
              trustScore: vendor.trustScore,
              complianceScore: vendor.complianceScore,
              verificationStatus: vendor.verificationStatus
            };
            logger.debug('[AUTH] Vendor authenticated via final fallback:', vendor.companyName, 'status:', vendor.status);
          } else {
            logger.warn('[AUTH] Vendor found but status is', vendor.status, '- access denied');
          }
        }
      }
    }

    // If still not found, try StudentPass model
    if (!user && payload.studentId) {
      const studentPass = await StudentPass.findById(payload.studentId)
        .select('_id name email phone aadhaarNumber passNumber status eligibilityStatus')
        .lean();

      if (studentPass) {
        user = {
          _id: studentPass._id,
          studentId: studentPass._id,
          name: studentPass.name,
          email: studentPass.email,
          phone: studentPass.phone,
          role: 'student',
          status: studentPass.status,
          aadhaarNumber: studentPass.aadhaarNumber,
          passNumber: studentPass.passNumber,
          eligibilityStatus: studentPass.eligibilityStatus
        };
      }
    }

    if (!user) {
      // Fallback: accept vendor tokens even if DB lookup failed (for pattern-logins or new registrations)
      const payloadRole = String(payload.role || '').toUpperCase();
      if (payloadRole === 'VENDOR' && (payload.vendorId || payload.userId)) {
        // Create synthetic vendor user from token payload
        user = {
          _id: payload.vendorId || payload.userId,
          vendorId: payload.vendorId || payload.userId,
          name: payload.name || payload.companyName || 'Vendor',
          email: payload.email || '',
          phone: payload.phone || '',
          role: 'vendor',
          roleType: 'external',
          status: 'approved', // Default to approved for synthetic users
          companyName: payload.companyName || payload.name || 'Vendor'
        };
        logger.debug('[AUTH] Synthetic vendor user created from token:', user.email);
      }
    }

    if (!user) {
      // Fallback: accept depot short-circuit tokens without DB record
      const payloadRole = String(payload.role || '').toUpperCase();
      const depotLike = payload.isDepotUser === true || !!payload.depotCode || ['DEPOT_MANAGER','DEPOT_SUPERVISOR','DEPOT_OPERATOR'].includes(payloadRole);
      if (depotLike) {
        user = {
          _id: payload.userId || '000000000000000000000000',
          name: payload.name || payload.username || 'Depot User',
          email: payload.email || `${payload.username || 'depot'}@yatrik.com`,
          role: (payload.role || 'depot_manager').toString().toLowerCase(),
          status: 'active',
          depotId: payload.depotId || null,
          username: payload.username || null,
          depotCode: payload.depotCode || null,
          depotName: payload.depotName || null,
          permissions: Array.isArray(payload.permissions) ? payload.permissions : []
        };
      } else {
        // NO SYNTHETIC USERS - user MUST exist in database
        logger.error('[AUTH] User not found in database:', {
          userId: payload.userId,
          role: payload.role,
          email: payload.email,
          path: req.path
        });
        return res.status(401).json({ 
          success: false, 
          error: 'User not found in database',
          code: 'USER_NOT_FOUND',
          message: 'Authentication failed. Please contact system administrator.'
        });
      }
    }
    
    // Check user status - allow different statuses for different roles
    const allowedStatuses = ['active'];
    if (user.role === 'admin') {
      // Admin must be active - no other status allowed
      // Keep only 'active' in allowedStatuses
    } else if (user.role === 'vendor') {
      // Vendors can access with approved, active, or pending status
      allowedStatuses.push('approved', 'pending');
    } else if (user.role === 'student') {
      // Students can access with active or approved status
      allowedStatuses.push('approved');
    }
    
    if (!allowedStatuses.includes(user.status)) {
      logger.warn('[AUTH] User account status not allowed:', user.status, 'for role:', user.role);
      return res.status(403).json({ 
        success: false, 
        error: `Account is ${user.status}. Please contact support.`,
        code: 'ACCOUNT_INACTIVE',
        message: `Your account status is ${user.status}. Please contact support.`
      });
    }

    // Do not cache user data to force live reads

    // Ensure user object is properly set
    if (!user) {
      logger.error('[AUTH] User object is null after all checks. Payload:', {
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
        path: req.path
      });
      return res.status(401).json({ 
        success: false, 
        error: 'User authentication failed',
        code: 'USER_AUTH_FAILED',
        message: 'Authentication failed. Please log in again.'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    logger.error('[AUTH] Auth middleware error:', {
      message: error.message,
      stack: error.stack,
      path: req?.path
    });
    if (res && res.status) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token',
        code: 'AUTH_ERROR',
        message: 'Authentication failed. Please log in again.'
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
    
    logger.debug('Role check:', {
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
// Cache pruning disabled as caching is off

module.exports = { auth, requireRole, authWithRole };
