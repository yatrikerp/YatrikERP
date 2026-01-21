/**
 * Role-Based Authorization Middleware
 * Enterprise ERP - YATRIK
 * 
 * Usage: authorizeRoles(['admin', 'depot_manager'])
 *        authorizeRoles(['vendor'], 'external')
 *        authorizeRoles(['student'], 'external')
 */

const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const userRole = (req.user.role || '').toLowerCase();
      const userRoleType = req.user.roleType || 'internal';
      
      // Flatten allowed roles array (handles nested arrays)
      const roles = allowedRoles.flat();
      
      // Check if user role is in allowed roles
      const hasRole = roles.some(allowedRole => {
        const normalizedAllowed = String(allowedRole).toLowerCase().trim();
        const normalizedUser = userRole.toLowerCase().trim();
        
        // Exact match
        if (normalizedAllowed === normalizedUser) return true;
        
        // Handle role variations
        if (normalizedAllowed === 'admin' && (normalizedUser === 'admin' || normalizedUser === 'administrator')) return true;
        if (normalizedAllowed === 'depot_manager' && (normalizedUser === 'depot_manager' || normalizedUser === 'depot-manager' || normalizedUser === 'depotmanager')) return true;
        if (normalizedAllowed === 'vendor' && normalizedUser === 'vendor') return true;
        if (normalizedAllowed === 'student' && normalizedUser === 'student') return true;
        
        return false;
      });

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Insufficient permissions.',
          requiredRoles: roles,
          userRole: userRole,
          userRoleType: userRoleType
        });
      }

      // Additional roleType check if specified
      // This allows restricting to internal/external users
      const lastArg = allowedRoles[allowedRoles.length - 1];
      if (lastArg === 'internal' || lastArg === 'external') {
        if (userRoleType !== lastArg) {
          return res.status(403).json({
            success: false,
            error: `Access denied. This endpoint is for ${lastArg} users only.`,
            userRoleType: userRoleType
          });
        }
      }

      // Check account status
      if (req.user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          error: 'Account is suspended. Please contact administrator.'
        });
      }

      if (req.user.status === 'pending' && userRoleType === 'external') {
        // External users with pending status can still access basic endpoints
        // but may be restricted from certain features
        req.user.isPending = true;
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
};

module.exports = authorizeRoles;

