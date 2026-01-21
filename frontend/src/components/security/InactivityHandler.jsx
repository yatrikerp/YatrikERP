import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const InactivityHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoggingOut, isLoggingIn } = useAuth();

  useEffect(() => {
    // Only track inactivity for logged-in users
    if (!user) return;

    // Don't trigger during explicit login/logout transitions
    if (isLoggingOut || isLoggingIn) return;

    let timeoutId;

    const handleLogoutForInactivity = async () => {
      try {
        await logout();
      } catch (error) {
        console.error('Error during auto-logout:', error);
      } finally {
        // Show a small message and send user to login
        try {
          toast.error('You were logged out due to inactivity.');
        } catch {
          // Ignore toast errors
        }
        navigate('/login', { replace: true, state: { from: location.pathname } });
      }
    };

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(handleLogoutForInactivity, IDLE_TIMEOUT_MS);
    };

    // User activity events that should reset the timer
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'touchmove'];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Start initial timer
    resetTimer();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, logout, isLoggingOut, isLoggingIn, navigate, location.pathname]);

  return null;
};

export default InactivityHandler;

