import React from 'react';
import { useAuth } from '../../context/AuthContext';

const RoleTestPanel = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="role-test-panel">
        <h3>Not Authenticated</h3>
        <p>Please log in to see your role information.</p>
      </div>
    );
  }

  const getRoleColor = (role) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return '#E91E63'; // Brand Pink
      case 'DEPOT_MANAGER':
        return '#00BCD4'; // Turquoise
      case 'DRIVER':
        return '#1976D2'; // Blue
      case 'CONDUCTOR':
        return '#00A86B'; // Green
      case 'PASSENGER':
        return '#9E9E9E'; // Medium Gray
      default:
        return '#212121'; // Dark Gray
    }
  };

  const getRoleDescription = (role) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'Full system access and management';
      case 'DEPOT_MANAGER':
        return 'Depot operations and staff management';
      case 'DRIVER':
        return 'Vehicle operation and trip management';
      case 'CONDUCTOR':
        return 'Passenger service and ticket management';
      case 'PASSENGER':
        return 'Booking and travel services';
      default:
        return 'Unknown role';
    }
  };

  return (
    <div className="role-test-panel" style={{
      padding: '20px',
      backgroundColor: '#F7F8FA',
      borderRadius: '12px',
      border: '2px solid #E0E0E0',
      margin: '20px 0'
    }}>
      <h3 style={{ 
        color: '#212121', 
        marginBottom: '16px',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        🔐 Authentication Status
      </h3>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '8px' 
        }}>
          <span style={{ 
            fontWeight: '500', 
            color: '#212121',
            marginRight: '8px'
          }}>
            Name:
          </span>
          <span style={{ color: '#424242' }}>{user.name}</span>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '8px' 
        }}>
          <span style={{ 
            fontWeight: '500', 
            color: '#212121',
            marginRight: '8px'
          }}>
            Email:
          </span>
          <span style={{ color: '#424242' }}>{user.email}</span>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '16px' 
        }}>
          <span style={{ 
            fontWeight: '500', 
            color: '#212121',
            marginRight: '8px'
          }}>
            Role:
          </span>
          <span style={{ 
            color: getRoleColor(user.role),
            fontWeight: '600',
            fontSize: '14px',
            textTransform: 'uppercase'
          }}>
            {user.role}
          </span>
        </div>
        
        <div style={{ 
          padding: '12px',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          border: `1px solid ${getRoleColor(user.role)}20`,
          marginBottom: '16px'
        }}>
          <p style={{ 
            color: '#424242',
            fontSize: '14px',
            margin: '0',
            lineHeight: '1.4'
          }}>
            {getRoleDescription(user.role)}
          </p>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => window.location.href = '/dashboard'}
          style={{
            padding: '8px 16px',
            backgroundColor: '#E91E63',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Go to Dashboard
        </button>
        
        <button
          onClick={logout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#9E9E9E',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default RoleTestPanel;
