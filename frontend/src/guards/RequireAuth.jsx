import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';

export default function RequireAuth({ children, roles }) {
  const { user, loading, isLoggingOut, isLoggingIn } = useAuth();
  const location = useLocation();
  
  // Memoize role check to prevent unnecessary re-renders
  const hasAccess = useMemo(() => {
    if (loading || isLoggingOut || isLoggingIn) return true; // Show loading state
    
    if (!user) return false;
    
    if (!roles || roles.length === 0) return true;
    
    // Normalize user role and allowed roles for comparison
    const userRole = (user.role || '').toLowerCase().trim();
    const allowedRoles = roles.map(r => (r || '').toLowerCase().trim());
    
    console.log('RequireAuth - Role check:', {
      userRole,
      allowedRoles,
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userIsDepotUser: user.isDepotUser,
      userDepotId: user.depotId,
      currentPath: window.location.pathname
    });
    
    // Check for exact match or variations
    const hasRole = allowedRoles.some(allowedRole => {
      // Handle role variations
      if (allowedRole === 'admin' && (userRole === 'admin' || userRole === 'administrator')) return true;
      if (allowedRole === 'depot_manager' && (userRole === 'depot_manager' || userRole === 'depot-manager' || userRole === 'depotmanager')) return true;
      if (allowedRole === 'conductor' && userRole === 'conductor') return true;
      if (allowedRole === 'driver' && userRole === 'driver') return true;
      if (allowedRole === 'passenger' && userRole === 'passenger') return true;
      
      // Direct match
      return userRole === allowedRole;
    });
    
    if (!hasRole) {
      console.log(`Access denied: User role "${userRole}" not in allowed roles [${allowedRoles.join(', ')}]`);
    } else {
      console.log(`Access granted: User role "${userRole}" matches allowed roles [${allowedRoles.join(', ')}]`);
    }
    
    return hasRole;
  }, [user, roles, loading, isLoggingOut, isLoggingIn]);
  
  // Show loading state while checking authentication
  if (loading || isLoggingOut || isLoggingIn) {
    return (
      <LoadingSpinner 
        fullScreen 
        text={
          loading ? "Loading..." : 
          isLoggingIn ? "Signing in..." : 
          isLoggingOut ? "Signing out..." : 
          "Authenticating..."
        } 
      />
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Show access denied if user doesn't have required role
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md fade-in">
          <h1 className="text-xl font-bold mb-2 text-red-600">403 – Access Denied</h1>
          <p className="text-gray-600 mb-4">You do not have permission to access this page.</p>
          <div className="text-sm text-gray-500 mb-4">
            <p>Your role: <strong className="text-gray-700">{user.role?.toUpperCase() || 'None'}</strong></p>
            <p>Required roles: <strong className="text-gray-700">{roles?.join(', ').toUpperCase()}</strong></p>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors btn-transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return <div className="fade-in">{children}</div>;
}


