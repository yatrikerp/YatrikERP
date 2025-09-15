import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';

const TripAssignment = ({ userRole, depotId }) => {
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    driverId: '',
    routeId: '',
    busId: '',
    tripId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '06:00'
  });

  // Brand Colors
  const colors = {
    primary: '#E91E63',
    secondary: '#00BCD4',
    success: '#00A86B',
    danger: '#F44336',
    warning: '#FFB300',
    info: '#1976D2',
    dark: '#212121',
    light: '#F7F8FA',
    white: '#FFFFFF'
  };

  // Fetch available drivers
  const fetchDrivers = async () => {
    try {
      const endpoint = userRole === 'admin' ? '/api/admin/drivers' : '/api/driver/depot';
      const response = await apiFetch(endpoint);
      if (response.ok) {
        setDrivers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  // Fetch available routes
  const fetchRoutes = async () => {
    try {
      const response = await apiFetch('/api/routes');
      if (response.ok) {
        setRoutes(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  // Fetch available buses
  const fetchBuses = async () => {
    try {
      const endpoint = userRole === 'admin' ? '/api/admin/buses' : '/api/depot/buses';
      const response = await apiFetch(endpoint);
      if (response.ok) {
        setBuses(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
    }
  };

  // Fetch available trips
  const fetchTrips = async () => {
    try {
      const response = await apiFetch('/api/trips');
      if (response.ok) {
        setTrips(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchRoutes();
    fetchBuses();
    fetchTrips();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAssignTrip = async (e) => {
    e.preventDefault();
    
    if (!formData.driverId || !formData.routeId || !formData.busId) {
      alert('Please select driver, route, and bus');
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiFetch('/api/admin/assign-trip', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Trip assigned successfully! Driver will be notified.');
        
        // Reset form
        setFormData({
          driverId: '',
          routeId: '',
          busId: '',
          tripId: '',
          scheduledDate: new Date().toISOString().split('T')[0],
          scheduledTime: '06:00'
        });
      } else {
        alert(response.message || 'Failed to assign trip');
      }
    } catch (error) {
      console.error('Error assigning trip:', error);
      alert('Failed to assign trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: colors.white,
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        margin: '0 0 20px 0',
        fontSize: '20px',
        fontWeight: '700',
        color: colors.dark
      }}>
        🚌 Assign Trip to Driver
      </h2>

      <form onSubmit={handleAssignTrip} style={{ display: 'grid', gap: '16px' }}>
        {/* Driver Selection */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: colors.dark,
            marginBottom: '8px'
          }}>
            Select Driver
          </label>
          <select
            name="driverId"
            value={formData.driverId}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              background: colors.white
            }}
          >
            <option value="">Choose a driver...</option>
            {drivers.map(driver => (
              <option key={driver._id} value={driver._id}>
                {driver.name} ({driver.employeeCode}) - {driver.status}
              </option>
            ))}
          </select>
        </div>

        {/* Route Selection */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: colors.dark,
            marginBottom: '8px'
          }}>
            Select Route
          </label>
          <select
            name="routeId"
            value={formData.routeId}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              background: colors.white
            }}
          >
            <option value="">Choose a route...</option>
            {routes.map(route => (
              <option key={route._id} value={route._id}>
                {route.routeName} ({route.origin} → {route.destination})
              </option>
            ))}
          </select>
        </div>

        {/* Bus Selection */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: colors.dark,
            marginBottom: '8px'
          }}>
            Select Bus
          </label>
          <select
            name="busId"
            value={formData.busId}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              background: colors.white
            }}
          >
            <option value="">Choose a bus...</option>
            {buses.map(bus => (
              <option key={bus._id} value={bus._id}>
                {bus.busNumber} ({bus.registrationNumber}) - {bus.status}
              </option>
            ))}
          </select>
        </div>

        {/* Date and Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.dark,
              marginBottom: '8px'
            }}>
              Scheduled Date
            </label>
            <input
              type="date"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                background: colors.white
              }}
            />
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.dark,
              marginBottom: '8px'
            }}>
              Scheduled Time
            </label>
            <input
              type="time"
              name="scheduledTime"
              value={formData.scheduledTime}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                background: colors.white
              }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#9CA3AF' : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            color: colors.white,
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '16px',
            marginTop: '8px'
          }}
        >
          {loading ? '🔄 Assigning...' : '✅ Assign Trip'}
        </button>
      </form>
    </div>
  );
};

export default TripAssignment;
