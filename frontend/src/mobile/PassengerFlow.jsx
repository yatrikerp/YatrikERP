import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import existing passenger components
import MobilePassengerDashboard from '../components/passenger/MobilePassengerDashboard';
import EnhancedPassengerDashboard from '../components/passenger/EnhancedPassengerDashboard';

const PassengerFlow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login?next=/mobile/passenger');
      return;
    }

    // Ensure user has passenger role
    const userRole = (user.role || 'passenger').toLowerCase();
    if (userRole !== 'passenger') {
      console.warn('User role mismatch for passenger flow:', userRole);
    }
  }, [user, navigate]);

  // If not authenticated, don't render anything (redirect will happen)
  if (!user) {
    return null;
  }

  // Use existing MobilePassengerDashboard component
  // This component already handles all passenger functionality:
  // - Search trips
  // - Book tickets  
  // - Seat selection
  // - QR wallet payments
  // - Trip management
  return <MobilePassengerDashboard />;
};

export default PassengerFlow;

