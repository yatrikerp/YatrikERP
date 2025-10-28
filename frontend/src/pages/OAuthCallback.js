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
  const [message, setMessage] = useState("Processing your sign-in...");

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Check for OAuth error first
        const oauthError = searchParams.get('error');
        
        if (oauthError) {
          setMessage("Login failed. Redirecting to login...");
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Get user data and token from backend OAuth
        const user = searchParams.get('user');
        const token = searchParams.get('token');
        const nextParam = searchParams.get('next');
        
        if (!user || !token) {
          setMessage("Login failed. Redirecting to login...");
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        try {
          // Update message before processing
          setMessage("Verifying your account...");
          
          // Parse user data from backend
          const userData = JSON.parse(decodeURIComponent(user));
          
          // Log in the user with backend data
          await login(userData, token);
          
          // Update message after login
          setMessage("Login successful! Redirecting...");
          
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
              } else if ((currentIsMobile || shouldUseMobile) && nextParam.startsWith('/pax/') && role === 'PASSENGER') {
                // For mobile passengers, redirect /pax/* routes appropriately
                dest = nextParam.replace('/pax/', '/mobile/passenger/');
              } else if ((currentIsMobile || shouldUseMobile) && nextParam.startsWith('/passenger/') && role === 'PASSENGER') {
                dest = nextParam.replace('/passenger/', '/mobile/passenger/');
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
          
          console.log('OAuth Callback - Redirecting to:', dest, 'Mobile:', currentIsMobile || shouldUseMobile);
          
          // Use a small delay to ensure state is fully updated
          setTimeout(() => {
            navigate(dest, { replace: true });
          }, 500);
          return;
        } catch (parseError) {
          console.error('Parse error:', parseError);
          setMessage("Login failed. Redirecting to login...");
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        setMessage("Login failed. Redirecting to login...");
        setTimeout(() => navigate('/login'), 2000);
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
        'PASSENGER': currentIsMobile ? '/mobile/passenger' : '/pax'
      };
      
      return baseRoutes[role] || (currentIsMobile ? '/mobile/passenger' : '/pax');
    };

    handleGoogleCallback();
  }, [searchParams, login, navigate, isMobile]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
        backgroundColor: "#0B0C10",
        color: "#66FCF1",
      }}
    >
      <h2 style={{ 
        fontSize: window.innerWidth <= 768 ? "1.4rem" : "1.8rem", 
        marginBottom: "1rem",
        textAlign: "center",
        padding: "0 10px"
      }}>{message}</h2>
      <div className="loader" style={{
        border: "4px solid #1F2833",
        borderTop: "4px solid #66FCF1",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        animation: "spin 1s linear infinite"
      }}></div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          h2 {
            font-size: 1.2rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default OAuthCallback;


