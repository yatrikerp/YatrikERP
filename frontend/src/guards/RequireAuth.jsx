import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';

export default function RequireAuth({ children, roles }) {
  const { user, loading, isLoggingOut } = useAuth();
  const location = useLocation();
  
  // Memoize role check to prevent unnecessary re-renders
  const hasAccess = useMemo(() => {
    if (loading || isLoggingOut) return true; // Show loading state
    
    if (!user) return false;
    
    if (!roles || roles.length === 0) return true;
    
    const userRole = user.role?.toUpperCase();
    const allowedRoles = roles.map(r => (r || '').toUpperCase());
    
    return allowedRoles.includes(userRole);
  }, [user, roles, loading, isLoggingOut]);
  
  // Show loading state while checking authentication
  if (loading || isLoggingOut) {
    return <LoadingSpinner fullScreen text="Authenticating..." />;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
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
            onClick={() => window.location.href = '/login'} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors btn-transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  return <div className="fade-in">{children}</div>;
}


