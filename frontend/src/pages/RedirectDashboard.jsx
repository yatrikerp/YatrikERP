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

    // Instant redirect for fastest performance
      try {
      const role = user.role?.toLowerCase() || 'passenger';
        let destination = '/pax'; // Default to passenger dashboard
        
      // Map roles to destinations with exact matching
        switch (role) {
        case 'admin':
            destination = '/admin';
            break;
        case 'conductor':
            destination = '/conductor';
            break;
        case 'driver':
            destination = '/driver';
            break;
        case 'depot_manager':
            destination = '/depot';
            break;
        case 'passenger':
            destination = '/pax';
            break;
        default:
          // Default fallback
          destination = '/pax';
          console.warn(`Unknown role: ${role}, defaulting to passenger dashboard`);
      }
      
      console.log('=== ROLE-BASED REDIRECT DEBUG ===');
      console.log('User object:', user);
      console.log('Raw role from user:', user.role);
      console.log('Normalized role:', role);
      console.log('Role type:', typeof role);
      console.log('Role length:', role.length);
      console.log('Selected destination:', destination);
      console.log('================================');
        navigate(destination, { replace: true });
      } catch (error) {
        console.error('Redirect error:', error);
        navigate('/pax', { replace: true });
      }
  }, [navigate, user, loading]);

  // Show loading spinner while auth is loading
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


