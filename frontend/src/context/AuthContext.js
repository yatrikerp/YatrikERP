import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import locationService from '../services/locationService';

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
      
      // Normalize role to handle various formats
      let normalizedRole = userData.role;
      if (typeof normalizedRole === 'string') {
        normalizedRole = normalizedRole.toLowerCase().trim();
        
        // Handle role variations
        if (normalizedRole === 'administrator') normalizedRole = 'admin';
        if (normalizedRole === 'depot-manager' || normalizedRole === 'depotmanager') normalizedRole = 'depot_manager';
      }
      
      const normalizedUser = {
        ...userData,
        role: normalizedRole
      };
      
      console.log('AuthContext - Normalized user data:', {
        originalRole: userData.role,
        normalizedRole: normalizedUser.role,
        userId: normalizedUser._id,
        userName: normalizedUser.name,
        userEmail: normalizedUser.email,
        isDepotUser
      });
      
      // Update state immediately for instant UI response
      setUser(normalizedUser);
      
      if (isDepotUser) {
        // Store depot-specific data
        await Promise.all([
          localStorage.setItem('depotToken', token),
          localStorage.setItem('depotUser', JSON.stringify(normalizedUser))
        ]);
      } else {
        // Store regular user data
        await Promise.all([
          localStorage.setItem('token', token),
          localStorage.setItem('user', JSON.stringify(normalizedUser))
        ]);
      }

      // Auto-start location tracking for drivers
      if (normalizedUser.role === 'driver') {
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
    
    // Stop location tracking for drivers
    if (user?.role === 'driver') {
      locationService.stopTracking();
      console.log('Location tracking stopped for driver logout');
    }
    
    // Clear state immediately for instant UI response
    setUser(null);
    
    // Clear localStorage - handle both regular and depot authentication
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('depotToken');
    localStorage.removeItem('depotUser');
    localStorage.removeItem('depotInfo');
    localStorage.removeItem('currentDutyId');
    
    setIsLoggingOut(false);
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
