import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
    
    if (token && userData) {
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

  const login = useCallback(async (userData, token) => {
    if (isLoggingIn) return; // Prevent multiple login calls
    
    setIsLoggingIn(true);
    console.log('AuthContext.login called:', { userData, token });
    
    try {
      // Validate user data
      if (!userData || !userData._id || !userData.role) {
        throw new Error('Invalid user data');
      }
      
      // Normalize role to uppercase
      const normalizedUser = {
        ...userData,
        role: userData.role.toUpperCase()
      };
      
      setUser(normalizedUser);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      console.log('AuthContext.login completed, user state updated:', normalizedUser);
      
      // Remove artificial delay - not needed
      // await new Promise(resolve => setTimeout(resolve, 100));
      
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
    
    // Clear state immediately for instant UI response
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove artificial delay - not needed
    // await new Promise(resolve => setTimeout(resolve, 100));
    
    setIsLoggingOut(false);
  }, [isLoggingOut]);

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
