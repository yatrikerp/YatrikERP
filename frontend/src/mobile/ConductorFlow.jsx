import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import existing conductor components
import ConductorDashboard from '../pages/conductor/ConductorDashboard';

const ConductorFlow = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login?next=/mobile/conductor');
      return;
    }

    // Ensure user has conductor role
    const userRole = (user.role || 'conductor').toLowerCase();
    if (userRole !== 'conductor') {
      console.warn('User role mismatch for conductor flow:', userRole);
    }
  }, [user, navigate]);

  // If not authenticated, don't render anything (redirect will happen)
  if (!user) {
    return null;
  }

  // Use existing ConductorDashboard component
  // This component already handles all conductor functionality:
  // - Duty selection
  // - QR code scanning
  // - Passenger list management
  // - End duty operations
  return <ConductorDashboard />;
};

export default ConductorFlow;

