const mongoose = require('mongoose');

/**
 * Response Guard Middleware
 * Prevents multiple response sends and provides safe response methods
 */
class ResponseGuard {
  constructor(res) {
    this.res = res;
    this.sent = false;
  }

  /**
   * Safely send JSON response
   */
  json(data, statusCode = 200) {
    if (!this.sent && !this.res.headersSent) {
      this.sent = true;
      this.res.status(statusCode).json(data);
    }
  }

  /**
   * Safely send error response
   */
  error(message, statusCode = 500, data = null) {
    if (!this.sent && !this.res.headersSent) {
      this.sent = true;
      this.res.status(statusCode).json({
        success: false,
        message,
        ...(data && { data })
      });
    }
  }

  /**
   * Safely send success response
   */
  success(data, message = 'Success', statusCode = 200) {
    if (!this.sent && !this.res.headersSent) {
      this.sent = true;
      this.res.status(statusCode).json({
        success: true,
        message,
        data
      });
    }
  }

  /**
   * Check if response has been sent
   */
  isSent() {
    return this.sent || this.res.headersSent;
  }
}

/**
 * Middleware to create response guard
 */
const createResponseGuard = (req, res, next) => {
  res.guard = new ResponseGuard(res);
  next();
};

/**
 * Utility function to safely validate and convert ObjectId
 */
const safeObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    throw new Error(`Missing ${fieldName}`);
  }
  
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (error) {
    throw new Error(`Invalid ${fieldName} format: ${id}`);
  }
};

/**
 * Utility function to extract user ID from request
 */
const extractUserId = (req, userType = 'user') => {
  const userId = req.user?.[`${userType}Id`] || req.user?._id;
  if (!userId) {
    throw new Error(`No ${userType} ID found in token`);
  }
  return safeObjectId(userId, `${userType} ID`);
};

/**
 * Utility function to handle async route errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('Route error:', error);
      if (!res.guard?.isSent()) {
        res.guard?.error(error.message || 'Internal server error', 500);
      }
    });
  };
};

module.exports = {
  ResponseGuard,
  createResponseGuard,
  safeObjectId,
  extractUserId,
  asyncHandler
};
