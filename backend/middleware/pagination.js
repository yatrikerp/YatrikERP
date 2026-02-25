/**
 * PERFORMANCE: Pagination middleware
 * Enforces pagination defaults to prevent loading all records
 */

const enforcePagination = (req, res, next) => {
  // Default pagination values
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(10, parseInt(req.query.limit) || 20)); // Max 100, min 10, default 20
  
  // Reject requests attempting to fetch all records
  if (req.query.limit === '0' || req.query.limit === 'all' || req.query.limit === '*') {
    return res.status(400).json({
      success: false,
      message: 'Pagination is required. Use page and limit query parameters.',
      error: 'limit cannot be 0, "all", or "*"'
    });
  }
  
  // Attach pagination to request
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };
  
  next();
};

/**
 * Helper to add pagination metadata to response
 */
const addPaginationMetadata = (data, total, pagination) => {
  return {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      pages: Math.ceil(total / pagination.limit),
      hasNext: pagination.page < Math.ceil(total / pagination.limit),
      hasPrev: pagination.page > 1
    }
  };
};

module.exports = {
  enforcePagination,
  addPaginationMetadata
};
