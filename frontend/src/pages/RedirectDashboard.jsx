import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';

export default function RedirectDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth context to load
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const role = user.role?.toLowerCase() || '';
      const email = (user.email || '').toLowerCase();
      const depotEmailPattern = /^[a-z0-9]+-depot@yatrik\.com$/; // tvm-depot@yatrik.com

      let destination = '/pax';
      if (role === 'admin') destination = '/admin';
      else if (role === 'depot_manager') destination = '/depot';
      else if (role === 'conductor') destination = '/conductor';
      else if (role === 'driver') destination = '/driver';
      else if (depotEmailPattern.test(email)) destination = '/depot';
      else destination = '/pax';

      navigate(destination, { replace: true });
    } catch (error) {
      console.error('Redirect error:', error);
      navigate('/pax', { replace: true });
    }
  }, [navigate, user, loading]);

  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen 
        text="Loading..." 
      />
    );
  }

  return null;
}


