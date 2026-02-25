import React, { useMemo, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';

export default function RequireAuth({ children, roles }) {
  const { user, loading, isLoggingOut, isLoggingIn } = useAuth();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [vendorSessionCheck, setVendorSessionCheck] = useState(0);
  
  // EXTENDED CHECK: For vendor users, actively restore session from localStorage
  useEffect(() => {
    if (loading) {
      setIsCheckingAuth(true);
      return;
    }
    
    // Special handling for vendor routes
    if (roles && roles.includes('vendor')) {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      // If we have token/data but no user yet, try to restore session
      if (!user && (token || userData)) {
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            if (parsedUser && parsedUser._id && parsedUser.role === 'vendor') {
              // Force AuthContext to recognize the user
              // This is a fallback - AuthContext should have already done this
              console.log('⚠️ [RequireAuth] Vendor session found but user not in context, waiting for restoration...');
              
              // Wait up to 3 seconds for AuthContext to restore
              let attempts = 0;
              const checkInterval = setInterval(() => {
                attempts++;
                const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
                if (currentUser && currentUser._id) {
                  clearInterval(checkInterval);
                  setIsCheckingAuth(false);
                  return;
                }
                
                // After 3 seconds (30 attempts * 100ms), stop waiting
                if (attempts >= 30) {
                  clearInterval(checkInterval);
                  setIsCheckingAuth(false);
                }
              }, 100);
              
              return () => clearInterval(checkInterval);
            }
          } catch (e) {
            console.error('Error parsing vendor session:', e);
          }
        }
        
        // Wait 2 seconds before giving up
        const timeout = setTimeout(() => {
          setIsCheckingAuth(false);
        }, 2000);
        
        return () => clearTimeout(timeout);
      } else if (user) {
        // User is set, stop checking
        setIsCheckingAuth(false);
      } else {
        // No token/data, stop checking
        setIsCheckingAuth(false);
      }
    } else {
      // Not a vendor route, stop checking immediately
      setIsCheckingAuth(false);
    }
  }, [loading, user, roles, vendorSessionCheck]);
  
  // Memoize role check to prevent unnecessary re-renders
  const hasAccess = useMemo(() => {
    if (loading || isLoggingOut || isLoggingIn || isCheckingAuth) return true; // Show loading state
    
    if (!user) return false;
    
    if (!roles || roles.length === 0) return true;
    
    // Normalize user role and allowed roles for comparison
    const userRole = (user.role || '').toLowerCase().trim();
    const allowedRoles = roles.map(r => (r || '').toLowerCase().trim());
    
    const userRoleType = user.roleType || 'internal';
    
    console.log('RequireAuth - Role check:', {
      userRole,
      userRoleType,
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
      if (allowedRole === 'vendor' && (userRole === 'vendor' || userRole === 'supplier')) return true;
      if (allowedRole === 'student' && (userRole === 'student' || userRole === 'student_pass' || userRole === 'pass_holder')) return true;
      
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
  if (loading || isLoggingOut || isLoggingIn || isCheckingAuth) {
    return (
      <LoadingSpinner 
        fullScreen 
        text={
          loading ? "Loading..." : 
          isLoggingIn ? "Signing in..." : 
          isLoggingOut ? "Signing out..." : 
          isCheckingAuth ? "Checking session..." :
          "Authenticating..."
        } 
      />
    );
  }
  
  // For vendor routes, NEVER redirect if we have valid token/data in localStorage
  // This prevents premature redirects during session restoration
  if (!user) {
    // CRITICAL: For vendor routes, check localStorage directly
    if (roles && roles.includes('vendor')) {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      // If we have vendor session data, NEVER redirect - keep waiting
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          if (parsedUser && parsedUser._id && parsedUser.role === 'vendor') {
            // Check if token is valid
            try {
              const tokenParts = token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                const isExpired = payload.exp && payload.exp * 1000 < Date.now();
                
                if (!isExpired) {
                  // Valid vendor session exists - keep waiting for AuthContext
                  console.log('⚠️ [RequireAuth] Valid vendor session in localStorage, waiting for AuthContext restoration...');
                  // Trigger re-check by updating state
                  setTimeout(() => setVendorSessionCheck(prev => prev + 1), 500);
                  return (
                    <LoadingSpinner 
                      fullScreen 
                      text="Restoring session..."
                    />
                  );
                }
              }
            } catch (e) {
              console.error('Error validating vendor token:', e);
            }
          }
        } catch (e) {
          console.error('Error parsing vendor session:', e);
        }
      }
    }
    
    // Only redirect if truly no session exists
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
            <p>Role type: <strong className="text-gray-700">{user.roleType?.toUpperCase() || 'INTERNAL'}</strong></p>
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


