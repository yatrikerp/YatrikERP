import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Check for OAuth error first
        const error = searchParams.get('error');
        
        if (error) {
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Get user data and token from backend OAuth
        const user = searchParams.get('user');
        const token = searchParams.get('token');
        const nextParam = searchParams.get('next');
        
        if (user && token) {
          try {
            // Parse user data from backend
            const userData = JSON.parse(decodeURIComponent(user));
            
            // Log in the user with backend data
            login(userData, token);
            
            // Determine redirect destination - prioritize 'next' parameter
            const role = (userData.role || 'passenger').toUpperCase();
            let dest;
            
            if (nextParam && nextParam.startsWith('/')) {
              // Check if the user has access to the requested route
              const hasAccess = (
                (nextParam.startsWith('/pax') && role === 'PASSENGER') ||
                (nextParam.startsWith('/admin') && role === 'ADMIN') ||
                (nextParam.startsWith('/conductor') && role === 'CONDUCTOR') ||
                (nextParam.startsWith('/driver') && role === 'DRIVER') ||
                (nextParam.startsWith('/depot') && role === 'DEPOT_MANAGER')
              );
              
              dest = hasAccess ? nextParam : getDefaultRoute(role);
            } else {
              dest = getDefaultRoute(role);
            }
            
            // Instant redirect
            navigate(dest, { replace: true });
            return;
          } catch (parseError) {
            setError('Invalid user data received. Please try again.');
            setTimeout(() => navigate('/login'), 2000);
            return;
          }
        }
        
        // If no user data or token, show error
        setError('Authentication incomplete. Please try signing in again.');
        setTimeout(() => navigate('/login'), 2000);
        
      } catch (error) {
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    // Helper function for default routes
    const getDefaultRoute = (role) => {
      switch (role) {
        case 'ADMIN': return '/admin';
        case 'CONDUCTOR': return '/conductor';
        case 'DRIVER': return '/driver';
        case 'DEPOT_MANAGER': return '/depot';
        default: return '/pax';
      }
    };

    handleGoogleCallback();
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
          <div className="text-red-500 text-xl mb-4">❌ {error}</div>
          <div className="text-gray-600">Redirecting to login page...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-900 font-medium">Completing Google sign-in...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we authenticate you</p>
      </div>
    </div>
  );
};

export default OAuthCallback;


