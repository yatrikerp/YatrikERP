import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const GlobalLogoutButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoggingOut, isLoggingIn } = useAuth();

  // Hide on auth pages or when no user
  const hiddenPaths = ['/login', '/signup', '/depot-login', '/oauth/callback', '/reset-password'];
  const isAuthRoute = hiddenPaths.includes(location.pathname);

  if (!user || isAuthRoute || isLoggingOut || isLoggingIn) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Global logout error:', error);
    } finally {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  };

  return (
    <button
      onClick={handleLogout}
      title="Logout"
      className="fixed top-3 right-3 z-[9999] flex items-center justify-center w-7 h-7 rounded-full bg-red-600/90 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent"
      aria-label="Logout"
    >
      <LogOut className="w-3 h-3" />
    </button>
  );
};

export default GlobalLogoutButton;

