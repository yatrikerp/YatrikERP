import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useMobileDetection from '../hooks/useMobileDetection';
import { isMobileDevice, shouldUseMobileUI } from '../utils/mobileDetection';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { isMobile } = useMobileDetection();
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
            await login(userData, token);
            
            // Wait a bit for the login to complete and mobile detection to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Re-check mobile detection after login using multiple methods
            const currentIsMobile = isMobileDevice() || window.innerWidth < 768;
            const shouldUseMobile = shouldUseMobileUI();
            
            // Determine redirect destination - prioritize 'next' parameter
            const role = (userData.role || 'passenger').toUpperCase();
            let dest;
            
            if (nextParam && nextParam.startsWith('/')) {
              // Check if the user has access to the requested route
              const hasAccess = (
                (nextParam.startsWith('/pax') && role === 'PASSENGER') ||
                (nextParam.startsWith('/passenger') && role === 'PASSENGER') ||
                (nextParam.startsWith('/admin') && role === 'ADMIN') ||
                (nextParam.startsWith('/conductor') && role === 'CONDUCTOR') ||
                (nextParam.startsWith('/driver') && role === 'DRIVER') ||
                (nextParam.startsWith('/depot') && role === 'DEPOT_MANAGER')
              );
              
              if (hasAccess) {
                // For mobile users, redirect /pax to mobile dashboard
                if ((currentIsMobile || shouldUseMobile) && nextParam === '/pax' && role === 'PASSENGER') {
                  dest = '/passenger/mobile';
                } else {
                  dest = nextParam;
                }
              } else {
                dest = getDefaultRoute(role, currentIsMobile || shouldUseMobile);
              }
            } else {
              dest = getDefaultRoute(role, currentIsMobile || shouldUseMobile);
            }

            // If user has a pending booking from popular routes, force booking-choice
            try {
              const pending = localStorage.getItem('pendingBooking');
              if (pending && role === 'PASSENGER') {
                dest = '/booking-choice';
              }
            } catch (_) {}
            
            // Debug logging for mobile redirect
            console.log('🔍 OAuth Callback Redirect Debug:');
            console.log('  Role:', role);
            console.log('  Hook isMobile:', isMobile);
            console.log('  Current isMobile:', currentIsMobile);
            console.log('  Should Use Mobile:', shouldUseMobile);
            console.log('  Window width:', window.innerWidth);
            console.log('  Touch device:', 'ontouchstart' in window);
            console.log('  Max touch points:', navigator.maxTouchPoints);
            console.log('  Next Param:', nextParam);
            console.log('  Final Destination:', dest);
            console.log('  User Agent:', navigator.userAgent);
            console.log('  User Data:', userData);
            
            // Use a small delay to ensure state is fully updated
            setTimeout(() => {
              navigate(dest, { replace: true });
            }, 200);
            return;
          } catch (parseError) {
            console.error('Parse error:', parseError);
            setError('Invalid user data received. Please try again.');
            setTimeout(() => navigate('/login'), 2000);
            return;
          }
        }
        
        // If no user data or token, show error
        setError('Authentication incomplete. Please try signing in again.');
        setTimeout(() => navigate('/login'), 2000);
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    // Helper function for default routes - mobile aware
    const getDefaultRoute = (role, mobileCheck) => {
      const currentIsMobile = mobileCheck || isMobile;
      const baseRoutes = {
        'ADMIN': '/admin',
        'CONDUCTOR': '/conductor',
        'DRIVER': '/driver',
        'DEPOT_MANAGER': '/depot',
        'PASSENGER': currentIsMobile ? '/passenger/mobile' : '/pax' // Mobile users go to mobile dashboard
      };
      
      return baseRoutes[role] || (currentIsMobile ? '/passenger/mobile' : '/pax');
    };

    handleGoogleCallback();
  }, [searchParams, login, navigate, isMobile]);

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


