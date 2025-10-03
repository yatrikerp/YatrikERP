import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import existing driver components
import DriverDashboard from '../pages/DriverDashboard';

const DriverFlow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login?next=/mobile/driver');
      return;
    }

    // Ensure user has driver role
    const userRole = (user.role || 'driver').toLowerCase();
    if (userRole !== 'driver') {
      console.warn('User role mismatch for driver flow:', userRole);
    }
  }, [user, navigate]);

  // If not authenticated, don't render anything (redirect will happen)
  if (!user) {
    return null;
  }

  // Use existing DriverDashboard component
  // This component already handles all driver functionality:
  // - Assigned route display
  // - GPS tracking start/stop
  // - Status updates
  // - Route management
  return <DriverDashboard />;
};

export default DriverFlow;

