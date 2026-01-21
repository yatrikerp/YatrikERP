import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import locationService from '../services/locationService';
import { clearAllCaches } from '../utils/cacheManager';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const depotToken = localStorage.getItem('depotToken');
    const depotUserData = localStorage.getItem('depotUser');
    
    // Check for depot user first, then regular user
    if (depotToken && depotUserData) {
      try {
        const parsedUser = JSON.parse(depotUserData);
        // Validate depot user data structure
        if (parsedUser && parsedUser._id && parsedUser.role) {
          setUser(parsedUser);
        } else {
          // Invalid depot user data, clear storage
          localStorage.removeItem('depotToken');
          localStorage.removeItem('depotUser');
          localStorage.removeItem('depotInfo');
        }
      } catch (error) {
        console.error('Error parsing depot user data:', error);
        localStorage.removeItem('depotToken');
        localStorage.removeItem('depotUser');
        localStorage.removeItem('depotInfo');
      }
    } else if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Validate user data structure
        if (parsedUser && parsedUser._id && parsedUser.role) {
          setUser(parsedUser);
        } else {
          // Invalid user data, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = useCallback(async (userData, token, isDepotUser = false) => {
    if (isLoggingIn) return; // Prevent multiple login calls
    
    setIsLoggingIn(true);
    console.log('AuthContext.login called:', { userData, token, isDepotUser });
    
    try {
      // Validate user data
      if (!userData || !userData._id || !userData.role) {
        throw new Error('Invalid user data');
      }
      
      // Check for depot email pattern to auto-detect depot users
      const email = (userData.email || '').toLowerCase();
      const depotEmailPattern = /^[a-z0-9]+-depot@yatrik\.com$/;
      const isDepotEmail = depotEmailPattern.test(email);
      
      // Auto-detect depot user if email matches pattern or isDepotUser flag is set
      const detectedDepotUser = isDepotEmail || userData.isDepotUser || userData.depotId;
      
      console.log('AuthContext - Depot detection:', {
        email,
        isDepotEmail,
        userDataIsDepotUser: userData.isDepotUser,
        userDataDepotId: userData.depotId,
        detectedDepotUser,
        originalIsDepotUser: isDepotUser
      });
      
      // Normalize role to handle various formats
      let normalizedRole = userData.role;
      if (typeof normalizedRole === 'string') {
        normalizedRole = normalizedRole.toLowerCase().trim();
        
        // Handle role variations
        if (normalizedRole === 'administrator') normalizedRole = 'admin';
        if (normalizedRole === 'depot-manager' || normalizedRole === 'depotmanager') normalizedRole = 'depot_manager';
        if (normalizedRole === 'vendor' || normalizedRole === 'supplier' || normalizedRole === 'VENDOR') normalizedRole = 'vendor';
        if (normalizedRole === 'student' || normalizedRole === 'student_pass' || normalizedRole === 'pass_holder') normalizedRole = 'student';
      }
      
      // Determine roleType
      const internalRoles = ['admin', 'depot_manager', 'conductor', 'driver', 'support_agent', 'data_collector'];
      const userRoleType = internalRoles.includes(normalizedRole) ? 'internal' : 'external';
      
      // Ensure vendorId is set for vendor users
      if (normalizedRole === 'vendor' && !userData.vendorId && userData._id) {
        userData.vendorId = userData._id;
      }
      
      const normalizedUser = {
        ...userData,
        role: normalizedRole,
        roleType: userData.roleType || userRoleType,
        isDepotUser: detectedDepotUser || isDepotUser,
        // Ensure vendorId is preserved
        vendorId: userData.vendorId || (normalizedRole === 'vendor' ? userData._id : undefined),
        // Ensure companyName is preserved for vendors
        companyName: userData.companyName || (normalizedRole === 'vendor' ? userData.name : undefined)
      };
      
      console.log('AuthContext - Normalized user data:', {
        originalRole: userData.role,
        normalizedRole: normalizedUser.role,
        userId: normalizedUser._id,
        userName: normalizedUser.name,
        userEmail: normalizedUser.email,
        isDepotUser
      });
      
      // OPTIMIZED: Update state immediately for instant UI response
      setUser(normalizedUser);
      
      // Clean token - ensure no Bearer prefix is stored
      const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
      
      // Validate token format before storing
      if (!cleanToken || cleanToken.split('.').length !== 3) {
        console.error('❌ [AuthContext] Invalid token format received:', {
          tokenLength: cleanToken?.length,
          hasBearer: token.includes('Bearer'),
          parts: cleanToken?.split('.').length
        });
        throw new Error('Invalid authentication token received from server');
      }
      
      console.log('✅ [AuthContext] Token validated and ready to store:', {
        tokenLength: cleanToken.length,
        tokenPreview: cleanToken.substring(0, 20) + '...',
        role: normalizedUser.role,
        email: normalizedUser.email
      });
      
      // OPTIMIZED: Store data in background for fastest response
      if (normalizedUser.isDepotUser) {
        // Store depot-specific data
        try {
          localStorage.setItem('depotToken', cleanToken);
          localStorage.setItem('depotUser', JSON.stringify(normalizedUser));
          localStorage.setItem('depotInfo', JSON.stringify({
            depotId: normalizedUser.depotId,
            depotCode: normalizedUser.depotCode,
            depotName: normalizedUser.depotName,
            permissions: normalizedUser.permissions
          }));
          console.log('✅ [AuthContext] Depot token stored successfully');
        } catch (err) {
          console.error('❌ [AuthContext] Failed to store depot data:', err);
          throw err;
        }
      } else {
        // Store regular user data
        try {
          localStorage.setItem('token', cleanToken);
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          console.log('✅ [AuthContext] Regular token stored successfully');
        } catch (err) {
          console.error('❌ [AuthContext] Failed to store user data:', err);
          throw err;
        }
      }

      // OPTIMIZED: Auto-start location tracking for drivers in background
      if (normalizedUser.role === 'driver') {
        // Start location tracking in background - don't block login
        setTimeout(async () => {
          try {
            console.log('Starting automatic location tracking for driver...');
            
            // Get initial location
            const initialLocation = await locationService.getCurrentLocation();
            console.log('Initial driver location detected:', initialLocation);
            
            // Start continuous tracking
            locationService.startTracking((location, error) => {
              if (error) {
                console.error('Location tracking error:', error);
                return;
              }
              
              console.log('Driver location updated:', location);
              
              // Send location to backend if driver has an active duty
              const currentDutyId = localStorage.getItem('currentDutyId');
              if (currentDutyId && currentDutyId !== 'demo') {
                locationService.sendLocationToBackend(currentDutyId)
                  .catch(err => console.error('Failed to send location to backend:', err));
              }
            });
            
          } catch (locationError) {
            console.warn('Failed to initialize location tracking:', locationError);
            // Continue login process even if location fails
          }
        }, 100); // Small delay to not block login
      }
      
      console.log('AuthContext.login completed, user state updated:', normalizedUser);
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  }, [isLoggingIn]);

  const logout = useCallback(async () => {
    if (isLoggingOut) return; // Prevent multiple logout calls
    
    setIsLoggingOut(true);
    console.log('🚪 Starting logout process...');
    
    try {
      // Stop location tracking for drivers
      if (user?.role === 'driver') {
        locationService.stopTracking();
        console.log('📍 Location tracking stopped for driver logout');
      }
      
      // Clear state immediately for instant UI response
      setUser(null);
      console.log('👤 User state cleared');
      
      // Clear all caches and storage comprehensively
      console.log('🧹 Starting comprehensive cache clearing...');
      const cacheCleared = await clearAllCaches();
      
      if (cacheCleared) {
        console.log('✅ All caches cleared successfully during logout');
      } else {
        console.warn('⚠️ Some caches may not have been cleared completely');
      }
      
      // Additional cleanup for specific user roles
      if (user?.role === 'driver') {
        // Clear any driver-specific data
        try {
          localStorage.removeItem('driver_location');
          localStorage.removeItem('driver_status');
          localStorage.removeItem('active_duty');
        } catch (error) {
          console.warn('Error clearing driver-specific data:', error);
        }
      } else if (user?.role === 'conductor') {
        // Clear any conductor-specific data
        try {
          localStorage.removeItem('conductor_tickets');
          localStorage.removeItem('conductor_status');
        } catch (error) {
          console.warn('Error clearing conductor-specific data:', error);
        }
      } else if (user?.role === 'depot_manager') {
        // Clear any depot-specific data
        try {
          localStorage.removeItem('depot_schedule');
          localStorage.removeItem('depot_fleet');
        } catch (error) {
          console.warn('Error clearing depot-specific data:', error);
        }
      } else if (user?.role === 'admin') {
        // Clear any admin-specific data
        try {
          localStorage.removeItem('admin_dashboard_cache');
          localStorage.removeItem('admin_reports_cache');
        } catch (error) {
          console.warn('Error clearing admin-specific data:', error);
        }
      }
      
      console.log('🎉 Logout process completed successfully');
      
    } catch (error) {
      console.error('❌ Error during logout process:', error);
      // Still clear basic storage even if cache clearing fails
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('depotToken');
        localStorage.removeItem('depotUser');
        localStorage.removeItem('depotInfo');
        localStorage.removeItem('currentDutyId');
      } catch (fallbackError) {
        console.error('❌ Error during fallback storage clearing:', fallbackError);
      }
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, user]);

  const value = {
    user,
    login,
    logout,
    loading,
    isLoggingOut,
    isLoggingIn
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
