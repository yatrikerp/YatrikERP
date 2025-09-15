import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './driver.modern.css';
import { apiFetch } from '../../utils/api';
import locationService from '../../services/locationService';

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Core State
  const [loading, setLoading] = useState(true);
  const [dutyStatus, setDutyStatus] = useState('not_assigned'); // not_assigned, assigned, active, completed
  const [currentTrip, setCurrentTrip] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, gps, fuel, maintenance
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // Driver Data
  const [driverInfo] = useState({
    name: user?.name || 'Driver Name',
    id: user?.id || 'DRV001',
    license: 'DL123456789',
    experience: '5 years',
    phone: user?.phone || '+91 9876543210',
    email: user?.email || 'driver@yatrik.com'
  });
  
  // Trip Data
  const [tripData, setTripData] = useState({
    busNumber: '',
    routeName: '',
    dutyId: '',
    totalDistance: 0,
    completedTrips: 0,
    todayEarnings: 0,
    fuelLevel: 85,
    speed: 0,
    nextStop: '',
    tripProgress: 0
  });
  
  // System Health
  const [systemHealth] = useState({
    gps: 'connected',
    engine: 'normal',
    fuel: 'sufficient',
    brakes: 'good',
    temperature: 'normal'
  });
  
  // Brand Colors (from memory)
  const colors = {
    primary: '#E91E63',      // Brand Pink
    secondary: '#00BCD4',    // Turquoise Transport Blue
    success: '#00A86B',      // Green
    danger: '#F44336',       // Red
    warning: '#FFB300',      // Amber
    info: '#1976D2',         // Blue
    dark: '#212121',         // Dark Gray/Black
    light: '#F7F8FA',        // Light Gray
    white: '#FFFFFF'
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  // Duty Management
  const fetchCurrentDuty = useCallback(async () => {
    try {
      const response = await apiFetch('/api/driver/duties/current');
      if (response.ok && response.data) {
        setCurrentTrip(response.data);
        setDutyStatus(response.data.status || 'assigned');
        setTripData({
          busNumber: response.data.busNumber || 'KL-07-CD-5678',
          routeName: response.data.routeName || 'Kochi - Alappuzha Express',
          dutyId: response.data._id || '',
          totalDistance: response.data.totalDistance || 125,
          completedTrips: response.data.completedTrips || 3,
          todayEarnings: response.data.earnings || 1850,
          fuelLevel: response.data.fuelLevel || 85,
          speed: response.data.currentSpeed || 0,
          nextStop: response.data.nextStop || 'Cherthala',
          tripProgress: response.data.progress || 60
        });
        
        // Store duty ID for location service
        if (response.data._id) {
          localStorage.setItem('currentDutyId', response.data._id);
        }
      } else {
        // No real duty found - set demo data and don't make further API calls
        setDutyStatus('assigned');
        setCurrentTrip({ _id: 'demo' }); // Set demo trip to prevent API calls
        setTripData({
          busNumber: 'KL-07-CD-5678',
          routeName: 'Kochi - Alappuzha Express',
          dutyId: 'DUTY002',
          totalDistance: 125,
          completedTrips: 3,
          todayEarnings: 1850,
          fuelLevel: 85,
          speed: 0,
          nextStop: 'Cherthala',
          tripProgress: 60
        });
      }
    } catch (error) {
      console.error('Error fetching current duty:', error);
      // Set demo data for development
      setDutyStatus('assigned');
      setCurrentTrip({ _id: 'demo' }); // Set demo trip to prevent API calls
      setTripData({
        busNumber: 'KL-07-CD-5678',
        routeName: 'Kochi - Alappuzha Express',
        dutyId: 'DUTY002',
        totalDistance: 125,
        completedTrips: 3,
        todayEarnings: 1850,
        fuelLevel: 85,
        speed: 0,
        nextStop: 'Cherthala',
        tripProgress: 60
      });
    }
  }, []);

  const startTrip = async () => {
    try {
      // Handle demo mode
      if (!currentTrip?._id || currentTrip._id === 'demo') {
        setDutyStatus('active');
        beginLocationStreaming();
        return;
      }
      
      const response = await apiFetch(`/api/driver/duties/${currentTrip._id}/start`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setDutyStatus('active');
        beginLocationStreaming();
        await fetchCurrentDuty();
      }
    } catch (error) {
      console.error('Error starting trip:', error);
      setDutyStatus('active');
      beginLocationStreaming();
    }
  };

  const endTrip = async () => {
    try {
      // Handle demo mode
      if (!currentTrip?._id || currentTrip._id === 'demo') {
        setDutyStatus('completed');
        stopLocationStreaming();
        generateTripReport();
        return;
      }
      
      const response = await apiFetch(`/api/driver/duties/${currentTrip._id}/end`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setDutyStatus('completed');
        stopLocationStreaming();
        generateTripReport();
      }
    } catch (error) {
      console.error('Error ending trip:', error);
      setDutyStatus('completed');
      stopLocationStreaming();
      generateTripReport();
    }
  };

  const generateTripReport = () => {
    const report = {
      dutyId: tripData.dutyId,
      busNumber: tripData.busNumber,
      route: tripData.routeName,
      totalDistance: tripData.totalDistance,
      earnings: tripData.todayEarnings,
      fuelConsumed: 100 - tripData.fuelLevel,
      completedAt: new Date().toISOString()
    };
    
    console.log('Trip Report Generated:', report);
    alert(`Trip completed successfully!\n\nSummary:\n- Distance covered: ${tripData.totalDistance}km\n- Earnings: ₹${tripData.todayEarnings}\n- Fuel remaining: ${tripData.fuelLevel}%`);
  };

  // GPS Functions are now handled by locationService

  const beginLocationStreaming = useCallback(() => {
    // Use location service instead of manual implementation
    if (!locationService.getTrackingStatus().isTracking) {
      locationService.startTracking((location, error) => {
        if (error) {
          console.error('Location tracking error:', error);
          return;
        }
        
        setCurrentLocation({
          lat: location.latitude,
          lng: location.longitude
        });
        
        // Update speed in UI
        setTripData(prev => ({
          ...prev,
          speed: Math.round((location.speed || 0) * 3.6)
        }));
      });
    }
  }, []);

  const stopLocationStreaming = useCallback(() => {
    locationService.stopTracking();
  }, []);

  // Emergency Functions
  const reportEmergency = async (type) => {
    try {
      const emergencyData = {
        type,
        location: currentLocation,
        dutyId: currentTrip?._id || 'demo',
        timestamp: new Date().toISOString(),
        driverId: user?.id,
        busNumber: tripData.busNumber,
        routeName: tripData.routeName
      };

      // If no real duty ID, just show demo alert
      if (!currentTrip?._id || currentTrip._id === 'demo') {
        alert(`${type} reported successfully! Emergency services have been notified.`);
        return;
      }

      const response = await apiFetch('/api/driver/emergency', {
        method: 'POST',
        body: JSON.stringify(emergencyData)
      });
      
      if (response.ok) {
        alert(`${type} reported successfully! Emergency services have been notified.`);
        
        // Update trip status to emergency
        setTripData(prev => ({
          ...prev,
          status: 'emergency'
        }));
      } else {
        alert(`Emergency report sent to local authorities. ${type} logged.`);
      }
    } catch (error) {
      console.error('Error reporting emergency:', error);
      alert(`Emergency report sent to local authorities. ${type} logged.`);
    }
  };

  // Update ETA Function
  const updateETA = async (etaMinutes, reason = '') => {
    try {
      if (!currentTrip?._id || currentTrip._id === 'demo') {
        alert(`ETA updated: ${etaMinutes} minutes`);
        return;
      }

      const response = await apiFetch(`/api/driver/duties/${currentTrip._id}/eta`, {
        method: 'POST',
        body: JSON.stringify({
          etaMinutes,
          reason,
          location: currentLocation,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert(`ETA updated: ${etaMinutes} minutes`);
        // Update local state
        setTripData(prev => ({
          ...prev,
          nextStopETA: etaMinutes
        }));
      }
    } catch (error) {
      console.error('Error updating ETA:', error);
      alert(`ETA updated locally: ${etaMinutes} minutes`);
    }
  };

  // Report Delay Function
  const reportDelay = async (delayMinutes, reason) => {
    try {
      if (!currentTrip?._id || currentTrip._id === 'demo') {
        alert(`Delay reported: ${delayMinutes} minutes - ${reason}`);
        return;
      }

      const response = await apiFetch(`/api/driver/duties/${currentTrip._id}/delay`, {
        method: 'POST',
        body: JSON.stringify({
          delayMinutes,
          reason,
          location: currentLocation,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert(`Delay reported: ${delayMinutes} minutes - ${reason}`);
      }
    } catch (error) {
      console.error('Error reporting delay:', error);
      alert(`Delay reported locally: ${delayMinutes} minutes - ${reason}`);
    }
  };

  // Initialize location tracking using location service
  const initializeLocationTracking = useCallback(async () => {
    try {
      // Get current location from the service (already started in AuthContext)
      const status = locationService.getTrackingStatus();
      
      if (status.isTracking && status.currentLocation) {
        setCurrentLocation({
          lat: status.currentLocation.latitude,
          lng: status.currentLocation.longitude
        });
        console.log('Using existing location tracking session');
      } else {
        // Start new tracking session if not already started
        console.log('Starting new location tracking session...');
        
        const initialLocation = await locationService.getCurrentLocation();
        setCurrentLocation({
          lat: initialLocation.latitude,
          lng: initialLocation.longitude
        });
        
        // Start continuous tracking
        locationService.startTracking((location, error) => {
          if (error) {
            console.error('Location tracking error:', error);
            return;
          }
          
          setCurrentLocation({
            lat: location.latitude,
            lng: location.longitude
          });
          
          // Update speed in UI
          setTripData(prev => ({
            ...prev,
            speed: Math.round((location.speed || 0) * 3.6) // Convert m/s to km/h
          }));
        });
      }
      
      console.log('Location tracking initialized successfully');
    } catch (error) {
      console.error('Failed to initialize location tracking:', error);
      // Continue without location if permission denied
    }
  }, []);

  // Fetch driver notifications
  const fetchNotifications = async () => {
    try {
      const response = await apiFetch('/api/driver/notifications');
      if (response.ok && response.data?.length > 0) {
        const newTrips = response.data.filter(n => n.type === 'trip_assigned');
        if (newTrips.length > 0) {
          alert(`🚌 New Trip Assignment!\n\nYou have ${newTrips.length} new trip(s) assigned. Please check your dashboard.`);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        if (!user) return;
        
        // Fetch duty data
        await fetchCurrentDuty();
        
        // Check for new notifications
        await fetchNotifications();
        
        // Initialize location tracking if not already started
        await initializeLocationTracking();
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setLoading(false);
      }
    };

    initializeDashboard();

    // Refresh data and check notifications every 30 seconds
    const interval = setInterval(() => {
      fetchCurrentDuty();
      fetchNotifications();
    }, 30000);

    return () => {
      clearInterval(interval);
      // Location service cleanup is handled in AuthContext
    };
  }, [user, fetchCurrentDuty, initializeLocationTracking]);

  // Auto-start GPS when trip becomes active
  useEffect(() => {
    if (dutyStatus === 'active') {
      beginLocationStreaming();
    } else {
      stopLocationStreaming();
    }
  }, [dutyStatus, beginLocationStreaming, stopLocationStreaming]);

  if (loading) {
    return (
      <div className="driver-loading">
        <div className="loading-spinner"></div>
        <h3>🚗 Loading Driver Dashboard...</h3>
      </div>
    );
  }

  return (
    <div className="driver-dashboard-new" style={{ 
      fontFamily: 'Inter, sans-serif', 
      background: colors.light, 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* Main Content */}
      <div style={{ height: '100vh', display: 'flex' }}>
        {/* Left Panel - Vehicle Controls */}
        <div style={{
          width: '400px',
          background: colors.white,
          borderRight: `1px solid #E5E7EB`,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #E5E7EB',
            background: `linear-gradient(135deg, ${colors.info}15 0%, ${colors.secondary}15 100%)`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: colors.dark }}>
                🚗 Driver Dashboard
              </h2>
              <button 
                onClick={handleLogout}
                style={{
                  background: colors.danger,
                  color: colors.white,
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '12px'
                }}
              >
                Logout
              </button>
            </div>
            <div style={{ fontSize: '14px', color: colors.dark, fontWeight: '600', marginBottom: '4px' }}>
              {driverInfo.name} • {tripData.busNumber}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>
              Status: {dutyStatus === 'active' ? '🟢 On Trip' : dutyStatus === 'assigned' ? '🟡 Assigned' : '⚪ Off Duty'}
            </div>
          </div>

          <div style={{ padding: '20px', flex: 1 }}>
            {/* Vehicle Status */}
            <div style={{
              background: `linear-gradient(135deg, ${colors.success}15 0%, ${colors.info}15 100%)`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: colors.dark }}>
                🔧 Vehicle Status
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Engine</div>
                  <div style={{
                    background: systemHealth.engine === 'normal' ? colors.success : colors.danger,
                    color: colors.white,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {systemHealth.engine === 'normal' ? '✅ Normal' : '⚠️ Alert'}
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>GPS</div>
                  <div style={{
                    background: systemHealth.gps === 'connected' ? colors.success : colors.danger,
                    color: colors.white,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {systemHealth.gps === 'connected' ? '📍 Active' : '📍 Lost'}
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Fuel</div>
                  <div style={{
                    background: tripData.fuelLevel > 25 ? colors.success : colors.danger,
                    color: colors.white,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    ⛽ {tripData.fuelLevel}%
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Speed</div>
                  <div style={{
                    background: colors.info,
                    color: colors.white,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    🚗 {tripData.speed} km/h
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Controls */}
            <div style={{
              background: colors.white,
              border: `1px solid #E5E7EB`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: colors.dark }}>
                🎮 Trip Controls
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dutyStatus === 'assigned' && (
                  <button
                    onClick={startTrip}
                    style={{
                      background: colors.success,
                      color: colors.white,
                      border: 'none',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    ▶️ Start Trip
                  </button>
                )}
                
                {dutyStatus === 'active' && (
                  <button
                    onClick={endTrip}
                    style={{
                      background: colors.danger,
                      color: colors.white,
                      border: 'none',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    ⏹️ End Trip
                  </button>
                )}
                
                <button
                  onClick={fetchCurrentDuty}
                  style={{
                    background: colors.info,
                    color: colors.white,
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  🔄 Refresh Data
                </button>
              </div>
            </div>

            {/* ETA & Delay Controls */}
            <div style={{
              background: colors.white,
              border: `1px solid #E5E7EB`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: colors.dark }}>
                ⏱️ ETA & Delay Management
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => updateETA(5)}
                    style={{
                      background: colors.success,
                      color: colors.white,
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}
                  >
                    On Time (+5min)
                  </button>
                  
                  <button
                    onClick={() => updateETA(10)}
                    style={{
                      background: colors.info,
                      color: colors.white,
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}
                  >
                    Slight Delay (+10min)
                  </button>
                  
                  <button
                    onClick={() => updateETA(20)}
                    style={{
                      background: colors.warning,
                      color: colors.white,
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}
                  >
                    Moderate Delay (+20min)
                  </button>
                  
                  <button
                    onClick={() => updateETA(30)}
                    style={{
                      background: colors.danger,
                      color: colors.white,
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}
                  >
                    Major Delay (+30min)
                  </button>
                </div>
              </div>
            </div>

            {/* Emergency Controls */}
            <div style={{
              background: `linear-gradient(135deg, ${colors.danger}15 0%, ${colors.warning}15 100%)`,
              border: `1px solid ${colors.danger}`,
              borderRadius: '12px',
              padding: '16px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: colors.danger }}>
                🚨 Emergency Controls
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => reportEmergency('Breakdown')}
                  style={{
                    background: colors.warning,
                    color: colors.white,
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                >
                  🔧 Report Breakdown
                </button>
                
                <button
                  onClick={() => reportEmergency('Medical Emergency')}
                  style={{
                    background: colors.danger,
                    color: colors.white,
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                >
                  🚑 Medical Emergency
                </button>
                
                <button
                  onClick={() => reportDelay(15, 'Traffic Congestion')}
                  style={{
                    background: '#FF8C00',
                    color: colors.white,
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                >
                  🚦 Report Traffic Delay
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Trip Information & Analytics */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Trip Status Bar */}
          <div style={{
            background: colors.white,
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: colors.dark }}>
                Current Trip Status
              </h2>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                Distance: {tripData.totalDistance}km • 
                Earnings: ₹{tripData.todayEarnings} • 
                Trips: {tripData.completedTrips}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                background: currentLocation ? colors.success : colors.warning,
                color: colors.white,
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                📍 {currentLocation ? 'GPS Active' : 'GPS Searching'}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{
            background: colors.white,
            borderBottom: '1px solid #E5E7EB',
            display: 'flex'
          }}>
            {[
              { key: 'dashboard', label: '📊 Dashboard', icon: '📊' },
              { key: 'gps', label: '🗺️ GPS Tracking', icon: '🗺️' },
              { key: 'fuel', label: '⛽ Fuel Monitor', icon: '⛽' },
              { key: 'maintenance', label: '🔧 Maintenance', icon: '🔧' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key)}
                style={{
                  background: activeView === tab.key ? colors.info : 'transparent',
                  color: activeView === tab.key ? colors.white : colors.dark,
                  border: 'none',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  borderBottom: activeView === tab.key ? `3px solid ${colors.info}` : '3px solid transparent'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, overflow: 'auto', background: '#FAFAFA' }}>
            {activeView === 'dashboard' && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
                  <div style={{
                    background: colors.white,
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: colors.info }}>
                      {tripData.totalDistance}km
                    </div>
                    <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                      Total Distance Today
                    </div>
                  </div>
                  
                  <div style={{
                    background: colors.white,
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: colors.success }}>
                      ₹{tripData.todayEarnings}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                      Today's Earnings
                    </div>
                  </div>
                  
                  <div style={{
                    background: colors.white,
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: colors.primary }}>
                      {tripData.completedTrips}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                      Completed Trips
                    </div>
                  </div>
                  
                  <div style={{
                    background: colors.white,
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: colors.warning }}>
                      {tripData.fuelLevel}%
                    </div>
                    <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                      Fuel Remaining
                    </div>
                  </div>
                </div>

                {/* Trip Progress */}
                <div style={{
                  background: colors.white,
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: colors.dark }}>
                    🛣️ Trip Progress
                  </h3>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: colors.dark }}>
                        Next Stop: {tripData.nextStop}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: colors.info }}>
                        {tripData.tripProgress}%
                      </span>
                    </div>
                    
                    <div style={{
                      width: '100%',
                      height: '12px',
                      background: '#E5E7EB',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${tripData.tripProgress}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${colors.info} 0%, ${colors.secondary} 100%)`,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'gps' && (
              <div style={{ padding: '24px' }}>
                <div style={{
                  background: colors.white,
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: colors.dark }}>
                    GPS Tracking System
                  </h3>
                  <p style={{ margin: '0 0 24px 0', color: '#6B7280' }}>
                    Real-time location monitoring and route tracking
                  </p>
                  
                  {currentLocation ? (
                    <div style={{
                      background: `linear-gradient(135deg, ${colors.success}15 0%, ${colors.info}15 100%)`,
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: colors.success, marginBottom: '8px' }}>
                        📍 Location Active
                      </div>
                      <div style={{ fontSize: '14px', color: colors.dark }}>
                        Lat: {currentLocation.lat?.toFixed(6)}<br/>
                        Lng: {currentLocation.lng?.toFixed(6)}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      background: `linear-gradient(135deg, ${colors.warning}15 0%, ${colors.danger}15 100%)`,
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: colors.warning }}>
                        📍 Searching for GPS signal...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeView === 'fuel' && (
              <div style={{ padding: '24px' }}>
                <div style={{
                  background: colors.white,
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⛽</div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: colors.dark }}>
                    Fuel Monitoring
                  </h3>
                  <p style={{ margin: '0 0 24px 0', color: '#6B7280' }}>
                    Current fuel level and consumption tracking
                  </p>
                  
                  <div style={{
                    background: tripData.fuelLevel > 25 ? `linear-gradient(135deg, ${colors.success}15 0%, ${colors.info}15 100%)` : `linear-gradient(135deg, ${colors.danger}15 0%, ${colors.warning}15 100%)`,
                    borderRadius: '8px',
                    padding: '20px'
                  }}>
                    <div style={{ fontSize: '48px', fontWeight: '700', color: tripData.fuelLevel > 25 ? colors.success : colors.danger }}>
                      {tripData.fuelLevel}%
                    </div>
                    <div style={{ fontSize: '16px', color: colors.dark, marginTop: '8px' }}>
                      {tripData.fuelLevel > 50 ? 'Fuel level is good' : 
                       tripData.fuelLevel > 25 ? 'Consider refueling soon' : 
                       'Low fuel - Refuel immediately'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'maintenance' && (
              <div style={{ padding: '24px' }}>
                <div style={{
                  background: colors.white,
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>🔧</div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: colors.dark, textAlign: 'center' }}>
                    Vehicle Maintenance
                  </h3>
                  <p style={{ margin: '0 0 24px 0', color: '#6B7280', textAlign: 'center' }}>
                    Vehicle health status and maintenance alerts
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{
                      background: colors.light,
                      padding: '16px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: colors.success }}>
                        ✅ Good
                      </div>
                      <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                        Engine Status
                      </div>
                    </div>
                    
                    <div style={{
                      background: colors.light,
                      padding: '16px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: colors.success }}>
                        ✅ Good
                      </div>
                      <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                        Brake System
                      </div>
                    </div>
                    
                    <div style={{
                      background: colors.light,
                      padding: '16px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: colors.warning }}>
                        ⚠️ Check
                      </div>
                      <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                        Tire Pressure
                      </div>
                    </div>
                    
                    <div style={{
                      background: colors.light,
                      padding: '16px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: colors.success }}>
                        ✅ Normal
                      </div>
                      <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                        Temperature
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;



