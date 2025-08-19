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
          console.error('Google OAuth error:', error);
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Check if we have user data and token from backend OAuth
        const user = searchParams.get('user');
        const token = searchParams.get('token');
        
        console.log('OAuth callback received - user:', user ? 'present' : 'missing', 'token:', token ? 'present' : 'missing');
        
        if (user && token) {
          try {
            // Parse user data from backend
            const userData = JSON.parse(decodeURIComponent(user));
            console.log('User data received from backend:', userData);
            
            // Log in the user with backend data
            login(userData, token);
            
            console.log('User logged in successfully, redirecting to dashboard...');
            
            // Check if there's a specific redirect destination from the URL
            const urlParams = new URLSearchParams(window.location.search);
            const nextParam = urlParams.get('next');
            
            // Redirect based on role, but prioritize the 'next' parameter if it's a valid route for the user's role
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
              
              if (hasAccess) {
                dest = nextParam;
              } else {
                // User doesn't have access to requested route, redirect to their default dashboard
                dest = role === 'ADMIN' ? '/admin' :
                       role === 'CONDUCTOR' ? '/conductor' :
                       role === 'DRIVER' ? '/driver' :
                       role === 'DEPOT_MANAGER' ? '/depot' :
                       '/pax';
              }
            } else {
              // No specific destination, use role-based routing
              dest = role === 'ADMIN' ? '/admin' :
                     role === 'CONDUCTOR' ? '/conductor' :
                     role === 'DRIVER' ? '/driver' :
                     role === 'DEPOT_MANAGER' ? '/depot' :
                     '/pax';
            }
            
            console.log('OAuth redirect:', { role, nextParam, finalDest: dest });
            navigate(dest, { replace: true });
            return;
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            setError('Invalid user data received. Please try again.');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
        }
        
        // If no user data or token, show error
        console.error('No user data or token received from OAuth callback');
        setError('Authentication incomplete. Please try signing in again.');
        setTimeout(() => navigate('/login'), 3000);


        
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ {error}</div>
          <div className="text-gray-600">Redirecting to login page...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing Google sign-in...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we authenticate you</p>
      </div>
    </div>
  );
};

export default OAuthCallback;


