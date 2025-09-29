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
      // Normalize role to handle case variations
      const role = (user.role || '').toLowerCase().trim();
      const email = (user.email || '').toLowerCase();
      
      console.log('RedirectDashboard - User data:', { 
        role, 
        email, 
        userId: user._id,
        userName: user.name 
      });

      // Check for depot email pattern first
      const depotEmailPattern = /^[a-z0-9]+-depot@yatrik\.com$/; // tvm-depot@yatrik.com
      const isDepotEmail = depotEmailPattern.test(email);
      
      let destination = '/pax'; // Default fallback
      
      console.log('RedirectDashboard - Analyzing user:', {
        role,
        email,
        isDepotEmail,
        userDepotId: user.depotId,
        userDepotCode: user.depotCode,
        userDepotName: user.depotName,
        isDepotUser: user.isDepotUser
      });
      
      if (role === 'admin' || role === 'administrator') {
        destination = '/admin';
        console.log('Redirecting admin user to:', destination);
      } else if (role === 'depot_manager' || role === 'depot-manager' || role === 'depotmanager' || 
                 isDepotEmail || user.isDepotUser || user.depotId) {
        destination = '/depot';
        console.log('Redirecting depot user to:', destination, {
          reason: role === 'depot_manager' ? 'role' : 
                 isDepotEmail ? 'email_pattern' : 
                 user.isDepotUser ? 'isDepotUser_flag' : 
                 user.depotId ? 'depotId_present' : 'unknown'
        });
      } else if (role === 'conductor') {
        destination = '/conductor';
        console.log('Redirecting conductor to:', destination);
      } else if (role === 'driver') {
        destination = '/driver';
        console.log('Redirecting driver to:', destination);
      } else {
        destination = '/pax';
        console.log('Redirecting passenger to:', destination);
      }

      console.log(`Final destination: ${destination} for role: ${role}`);
      navigate(destination, { replace: true });
      
    } catch (error) {
      console.error('Redirect error:', error);
      console.error('User data that caused error:', user);
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


