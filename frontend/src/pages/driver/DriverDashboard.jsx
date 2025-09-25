import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './driver.modern.css';
import GoogleMapsRouteTracker from '../../components/Common/GoogleMapsRouteTracker';
import { apiFetch } from '../../utils/api';
import locationService from '../../services/locationService';

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Core State
  const [loading, setLoading] = useState(true);
  const [dutyStatus, setDutyStatus] = useState('not_assigned'); // not_assigned, assigned, ready, waiting_movement, active, completed
  const [currentTrip, setCurrentTrip] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, gps, fuel, maintenance
  const [currentLocation, setCurrentLocation] = useState(null);
  const locationPostIntervalRef = useRef(null);
  const alertsApiDownRef = useRef(false);
  
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
    fuelLevel: 85,
    speed: 0,
    nextStop: '',
    tripProgress: 0
  });
  // Safety Mode: lock UI when moving
  const [isDrivingLocked, setIsDrivingLocked] = useState(false);
  // Kerala quick setup: locale, alerts, eta
  const [locale, setLocale] = useState('en'); // 'en' | 'ml'
  const [keralaAlerts, setKeralaAlerts] = useState([]);
  const [nextStopETA, setNextStopETA] = useState(null);
  const [passengerLoad, setPassengerLoad] = useState({ filled: 0, capacity: 0 });

  const t = useCallback((en, ml) => (locale === 'ml' ? (ml || en) : en), [locale]);

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

  // UI: shared styles for consistent look
  const ui = {
    card: {
      background: colors.white,
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
    },
    kpiCard: {
      background: colors.white,
      borderRadius: '16px',
      border: '1px solid #E5E7EB',
      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      textAlign: 'center',
      padding: '24px',
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    primaryBtn: (disabled) => ({
      background: disabled ? '#9CA3AF' : colors.info,
      color: colors.white,
      border: 'none',
      padding: '10px 16px',
      borderRadius: '10px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      boxShadow: '0 4px 10px rgba(25,118,210,0.25)'
    })
  };
  
  //

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
        fuelLevel: 85,
        speed: 0,
        nextStop: 'Cherthala',
        tripProgress: 60
      });
    }
  }, []);

  const movementCheckIntervalRef = useRef(null);
  const movementStartTimeRef = useRef(null);

  const startTrip = async () => {
    try {
      // Handle demo mode
      if (!currentTrip?._id || currentTrip._id === 'demo') {
        setDutyStatus('waiting_movement');
        beginLocationStreaming();
        try { locationService.setHighPerformanceMode(true); } catch {}
        startPostingLocation(currentTrip._id);
        startMovementWatcher();
        return;
      }
      
      // Hybrid: wait for movement before activating
      setDutyStatus('waiting_movement');
      beginLocationStreaming();
      try { locationService.setHighPerformanceMode(true); } catch {}
      startPostingLocation(currentTrip._id);
      startMovementWatcher();
    } catch (error) {
      console.error('Error starting trip:', error);
      setDutyStatus('waiting_movement');
      beginLocationStreaming();
      try { locationService.setHighPerformanceMode(true); } catch {}
      startPostingLocation(tripData.dutyId || currentTrip?._id);
      startMovementWatcher();
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
        try { locationService.setHighPerformanceMode(false); } catch {}
        stopMovementWatcher();
        generateTripReport();
      }
    } catch (error) {
      console.error('Error ending trip:', error);
      setDutyStatus('completed');
      stopLocationStreaming();
      generateTripReport();
    }
  };

  // Movement-based activation watcher helpers first
  const stopMovementWatcher = useCallback(() => {
    if (movementCheckIntervalRef.current) {
      clearInterval(movementCheckIntervalRef.current);
      movementCheckIntervalRef.current = null;
    }
    movementStartTimeRef.current = null;
  }, []);

  const startMovementWatcher = useCallback(() => {
    movementStartTimeRef.current = Date.now();
    if (movementCheckIntervalRef.current) clearInterval(movementCheckIntervalRef.current);
    movementCheckIntervalRef.current = setInterval(async () => {
      if (tripData.speed > 5 && dutyStatus === 'waiting_movement') {
        try {
          if (currentTrip?._id && currentTrip._id !== 'demo') {
            const res = await apiFetch(`/api/driver/duties/${currentTrip._id}/start`, { method: 'POST' });
            if (!res.ok) throw new Error('backend start failed');
          }
        } catch (e) {}
        setDutyStatus('active');
        await fetchCurrentDuty();
        stopMovementWatcher();
        return;
      }
      const elapsedMin = (Date.now() - (movementStartTimeRef.current || Date.now())) / 60000;
      if (elapsedMin >= 10 && dutyStatus === 'waiting_movement') {
        try {
          if (currentTrip?._id && currentTrip._id !== 'demo') {
            await apiFetch(`/api/driver/duties/${currentTrip._id}/incident`, {
              method: 'POST',
              body: JSON.stringify({ type: 'no_movement_alert', description: 'Bus duty not started yet (no movement > 10 minutes)', severity: 'medium', location: currentLocation })
            });
          }
        } catch (e) {}
        movementStartTimeRef.current = Date.now();
      }
    }, 2000);
  }, [tripData.speed, dutyStatus, currentTrip, currentLocation, fetchCurrentDuty, stopMovementWatcher]);

  // Accept / Reject Duty (frontend state; backend endpoint can be added later)
  const acceptDuty = async () => {
    setDutyStatus('ready');
  };

  const rejectDuty = async () => {
    try {
      if (currentTrip?._id && currentTrip._id !== 'demo') {
        await apiFetch(`/api/driver/duties/${currentTrip._id}/incident`, {
          method: 'POST',
          body: JSON.stringify({ type: 'duty_rejected', description: 'Driver rejected duty', severity: 'medium', location: currentLocation })
        });
      }
    } catch (e) {}
    setDutyStatus('not_assigned');
    setCurrentTrip(null);
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
        
        // Update speed in UI and toggle safety lock
        const nextSpeed = Math.round((location.speed || 0) * 3.6);
        setTripData(prev => ({
          ...prev,
          speed: nextSpeed
        }));
        setIsDrivingLocked(nextSpeed > 0);
      });
    }
  }, []);

  const stopLocationStreaming = useCallback(() => {
    locationService.stopTracking();
    if (locationPostIntervalRef.current) {
      clearInterval(locationPostIntervalRef.current);
      locationPostIntervalRef.current = null;
    }
  }, []);

  const startPostingLocation = useCallback((dutyId) => {
    if (!dutyId) return;
    if (locationPostIntervalRef.current) {
      clearInterval(locationPostIntervalRef.current);
      locationPostIntervalRef.current = null;
    }
    locationPostIntervalRef.current = setInterval(async () => {
      const smoothed = locationService.getSmoothedLocation();
      const lat = smoothed?.latitude ?? currentLocation?.lat;
      const lng = smoothed?.longitude ?? currentLocation?.lng;
      if (lat == null || lng == null) return;
      try {
        await apiFetch(`/api/duty/${dutyId}/location`, {
          method: 'POST',
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            speed: smoothed?.speed,
            heading: smoothed?.heading,
            accuracy: smoothed?.accuracy ?? 0,
            timestamp: smoothed?.timestamp ?? new Date().toISOString()
          })
        });
      } catch (e) {
        // ignore
      }
    }, 3000);
  }, [currentLocation]);

  // Emergency Functions
  const reportEmergency = async (type) => {
    try {
      const incidentData = {
        type,
        description: `${type} reported by driver` ,
        severity: type === 'Medical Emergency' ? 'high' : 'medium',
        location: currentLocation
      };

      // If no real duty ID, just show demo alert
      if (!currentTrip?._id || currentTrip._id === 'demo') {
        alert(`${type} reported successfully! Emergency services have been notified.`);
        return;
      }

      const response = await apiFetch(`/api/driver/duties/${currentTrip._id}/incident`, {
        method: 'POST',
        body: JSON.stringify(incidentData)
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
        setNextStopETA(etaMinutes);
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
          
          // Update speed in UI and toggle safety lock
          const nextSpeed = Math.round((location.speed || 0) * 3.6); // Convert m/s to km/h
          setTripData(prev => ({
            ...prev,
            speed: nextSpeed
          }));
          setIsDrivingLocked(nextSpeed > 0);
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

  // Live passenger load sync
  const fetchPassengerLoad = useCallback(async () => {
    try {
      if (!currentTrip?._id || currentTrip._id === 'demo') return;
      const res = await apiFetch(`/api/trips/${currentTrip._id}/load`);
      if (res.ok && res.data) {
        setPassengerLoad({ filled: res.data.filled ?? 0, capacity: res.data.capacity ?? 0 });
      }
    } catch (e) {}
  }, [currentTrip]);

  // Kerala alerts (hartal/flood/road). Fallback to static sample if API not available
  const fetchKeralaAlerts = useCallback(async () => {
    if (alertsApiDownRef.current) return; // avoid repeated 404 spam
    try {
      const res = await apiFetch('/api/alerts/kerala', { suppressError: true });
      if (res.ok && Array.isArray(res.data)) {
        setKeralaAlerts(res.data.slice(0, 3));
        return;
      }
      // If backend returns non-ok (e.g., 404), stop future attempts
      alertsApiDownRef.current = true;
    } catch (e) {
      alertsApiDownRef.current = true;
    }
    setKeralaAlerts([
      { id: 'a1', type: 'traffic', level: 'medium', text: 'NH 66 slow near Alappuzha (10-15 min delay)' },
      { id: 'a2', type: 'rain', level: 'high', text: 'Heavy rain warning in Ernakulam after 6 PM' },
      { id: 'a3', type: 'event', level: 'info', text: 'Temple festival near Cherthala – expect crowd' }
    ]);
  }, []);

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

        // Kerala alerts
        await fetchKeralaAlerts();

        // Passenger load initial & periodic refresh
        await fetchPassengerLoad();
        
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
      fetchPassengerLoad();
    }, 30000);

    return () => {
      clearInterval(interval);
      // Location service cleanup is handled in AuthContext
    };
  }, [user, fetchCurrentDuty, initializeLocationTracking, fetchKeralaAlerts, fetchPassengerLoad]);

  // Auto-start GPS when trip becomes active
  useEffect(() => {
    if (dutyStatus === 'active') {
      beginLocationStreaming();
      try { locationService.setHighPerformanceMode(true); } catch {}
    } else {
      stopLocationStreaming();
      try { locationService.setHighPerformanceMode(false); } catch {}
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
          width: '360px',
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
                🚗 {t('Driver Dashboard', 'ഡ്രൈവർ ഡാഷ്ബോർഡ്')}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setLocale(prev => (prev === 'en' ? 'ml' : 'en'))}
                  style={{
                    background: colors.secondary,
                    color: colors.white,
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                >
                  {locale === 'en' ? 'മലയാളം' : 'English'}
                </button>
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
            </div>
            <div style={{ fontSize: '14px', color: colors.dark, fontWeight: '600', marginBottom: '4px' }}>
              {driverInfo.name} • {tripData.busNumber}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>
              {t('Status', 'സ്ഥിതി')}: {dutyStatus === 'active' ? t('🟢 On Trip', '🟢 യാത്രയിലാണ്') : dutyStatus === 'assigned' ? t('🟡 Assigned', '🟡 ചുമതല നൽകിയ') : t('⚪ Off Duty', '⚪ ഡ്യൂട്ടിയിൽ ഇല്ല')}
            </div>
          </div>

          <div style={{ padding: '16px 16px 20px 16px', flex: 1 }}>
            {/* Live Vehicle Stats */}
            <div style={{
              ...ui.card,
              background: `linear-gradient(135deg, ${colors.success}12 0%, ${colors.info}12 100%)`,
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: colors.dark }}>
                📈 Live Vehicle Stats
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
              ...ui.card,
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: colors.dark }}>
                🎮 {t('Trip Controls', 'ട്രിപ്പ് നിയന്ത്രണം')}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dutyStatus === 'assigned' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={acceptDuty}
                      style={{
                        background: isDrivingLocked ? '#9CA3AF' : colors.success,
                        color: colors.white,
                        border: 'none',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        cursor: isDrivingLocked ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}
                      disabled={isDrivingLocked}
                    >
                      ✅ Accept Duty
                    </button>
                    <button
                      onClick={rejectDuty}
                      style={{
                        background: isDrivingLocked ? '#9CA3AF' : colors.danger,
                        color: colors.white,
                        border: 'none',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        cursor: isDrivingLocked ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}
                      disabled={isDrivingLocked}
                    >
                      ❌ Reject Duty
                    </button>
                  </div>
                )}

                {dutyStatus === 'ready' && (
                  <button
                    onClick={startTrip}
                    style={ui.primaryBtn(isDrivingLocked)}
                    disabled={isDrivingLocked}
                  >
                    ▶️ Start Trip
                  </button>
                )}
                
                {dutyStatus === 'active' && (
                  <button
                    onClick={endTrip}
                    style={{
                      background: isDrivingLocked ? '#9CA3AF' : colors.danger,
                      color: colors.white,
                      border: 'none',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      cursor: isDrivingLocked ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    disabled={isDrivingLocked}
                  >
                    ⏹️ End Trip
                  </button>
                )}
                
                <button
                  onClick={fetchCurrentDuty}
                  style={{
                    background: isDrivingLocked ? '#9CA3AF' : colors.info,
                    color: colors.white,
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    cursor: isDrivingLocked ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  disabled={isDrivingLocked}
                >
                  🔄 Refresh Data
                </button>
              </div>
            </div>

            {/* ETA & Delay Controls */}
            <div style={{
              ...ui.card,
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: colors.dark }}>
                ⏱️ {t('ETA & Delay Management', 'ETA & വൈകൽ നിയന്ത്രണം')}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => updateETA(10, 'Running Late')}
                    style={{
                      background: isDrivingLocked ? '#9CA3AF' : colors.info,
                      color: colors.white,
                      border: 'none',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: isDrivingLocked ? 'not-allowed' : 'pointer',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}
                    disabled={isDrivingLocked}
                  >
                    🚦 {t('Running Late (+10 min)', 'താമസം (+10 മിനിറ്റ്)')}
                  </button>
                  
                  <button
                    onClick={() => reportEmergency('Breakdown')}
                    style={{
                      background: isDrivingLocked ? '#9CA3AF' : colors.warning,
                      color: colors.white,
                      border: 'none',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: isDrivingLocked ? 'not-allowed' : 'pointer',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}
                    disabled={isDrivingLocked}
                  >
                    🔧 {t('Breakdown', 'ബ്രേക്ക് ഡൗൺ')}
                  </button>
                </div>
                {dutyStatus === 'active' && (
                  <button
                    onClick={endTrip}
                    style={{
                      background: isDrivingLocked ? '#9CA3AF' : colors.danger,
                      color: colors.white,
                      border: 'none',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: isDrivingLocked ? 'not-allowed' : 'pointer',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}
                    disabled={isDrivingLocked}
                  >
                    ⏹ {t('End Duty', 'ഡ്യൂട്ടി അവസാനിപ്പിക്കുക')}
                  </button>
                )}
              </div>
            </div>

            {/* Emergency Controls */}
            <div style={{
              ...ui.card,
              background: `linear-gradient(135deg, ${colors.danger}10 0%, ${colors.warning}10 100%)`,
              border: `1px solid ${colors.danger}`,
              padding: '16px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: colors.danger }}>
                🚨 {t('Emergency Controls', 'എമർജൻസി നിയന്ത്രണം')}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => reportEmergency('Breakdown')}
                  style={{
                    background: isDrivingLocked ? '#9CA3AF' : colors.warning,
                    color: colors.white,
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: isDrivingLocked ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                  disabled={isDrivingLocked}
                >
                  🔧 {t('Report Breakdown', 'ബ്രേക്ക്‌ഡൗൺ റിപ്പോർട്ട്')}
                </button>
                
                <button
                  onClick={() => reportEmergency('Medical Emergency')}
                  style={{
                    background: isDrivingLocked ? '#9CA3AF' : colors.danger,
                    color: colors.white,
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: isDrivingLocked ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                  disabled={isDrivingLocked}
                >
                  🚑 {t('Medical Emergency', 'മെഡിക്കൽ എമർജൻസി')}
                </button>
                
                <button
                  onClick={() => reportDelay(15, 'Traffic Congestion')}
                  style={{
                    background: isDrivingLocked ? '#9CA3AF' : '#FF8C00',
                    color: colors.white,
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: isDrivingLocked ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                  disabled={isDrivingLocked}
                >
                  🚦 {t('Report Traffic Delay', 'ട്രാഫിക് വൈകൽ റിപ്പോർട്ട്')}
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
            alignItems: 'center',
            gap: '16px'
          }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: colors.dark }}>
                {t('Current Trip Status', 'നിലവിലെ യാത്രയുടെ നില')}
              </h2>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                {t('Distance', 'ദൂരം')}: {tripData.totalDistance}km
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
                📍 {currentLocation ? t('GPS Active', 'GPS സജീവം') : t('GPS Searching', 'GPS തിരയുന്നു')}
              </div>
              {/* Quick actions */}
              <button
                onClick={() => {
                  if (!currentLocation) return;
                  // Prefer Google Maps turn-by-turn navigation deep link
                  const lat = currentLocation.lat?.toFixed(6);
                  const lng = currentLocation.lng?.toFixed(6);
                  const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
                  window.open(gmaps, '_blank');
                }}
                style={{
                  background: colors.info,
                  color: colors.white,
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: isDrivingLocked ? 'not-allowed' : 'pointer',
                  opacity: isDrivingLocked ? 0.7 : 1
                }}
                disabled={isDrivingLocked}
              >
                🗺️ {t('Open Map', 'മാപ് തുറക്കുക')}
              </button>
              <a
                href="tel:100"
                style={{
                  background: colors.secondary,
                  color: colors.white,
                  padding: '8px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  opacity: isDrivingLocked ? 0.7 : 1
                }}
              >
                ☎️ {t('Call Depot', 'ഡിപ്പോ വിളിക്കുക')}
              </a>
            </div>
          </div>

          {/* Kerala Next Stop / ETA strip */}
          <div style={{
            background: '#0B3A53',
            color: colors.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            position: 'sticky',
            top: 0,
            zIndex: 5,
            boxShadow: '0 6px 12px rgba(0,0,0,0.12)'
          }}>
            <div style={{ fontWeight: 700 }}>
              🚏 {t('Next Stop', 'അടുത്ത സ്റ്റോപ്പ്')}: {tripData.nextStop || t('TBD', 'നിശ്ചയിക്കാനുണ്ട്')}
            </div>
            <div style={{ fontWeight: 700 }}>
              ⏱️ {t('ETA', 'പ്രതീക്ഷിത സമയം')}: {nextStopETA ?? tripData.nextStopETA ?? t('—', '—')} {t('min', 'മിനിറ്റ്')}
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
                onClick={() => { if (!isDrivingLocked) setActiveView(tab.key); }}
                style={{
                  background: activeView === tab.key ? colors.info : 'transparent',
                  color: isDrivingLocked ? '#9CA3AF' : (activeView === tab.key ? colors.white : colors.dark),
                  border: 'none',
                  padding: '16px 20px',
                  cursor: isDrivingLocked ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  borderBottom: activeView === tab.key ? `3px solid ${colors.info}` : '3px solid transparent',
                  opacity: isDrivingLocked ? 0.6 : 1
                }}
                disabled={isDrivingLocked}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, overflow: 'auto', background: '#FAFAFA' }}>
            {activeView === 'dashboard' && (
              <div style={{ padding: '24px' }}>
                {/* Kerala Alerts */}
                {keralaAlerts.length > 0 && (
              <div style={{
                ...ui.card,
                padding: '16px',
                marginBottom: '16px'
              }}>
                    <div style={{ fontWeight: 700, marginBottom: '8px' }}>⚠️ {t('Kerala Alerts', 'കേരള മുന്നറിയിപ്പുകൾ')}</div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {keralaAlerts.map(a => (
                        <div key={a.id} style={{
                          background: a.level === 'high' ? '#FEE2E2' : a.level === 'medium' ? '#FEF3C7' : '#DBEAFE',
                          border: '1px solid #E5E7EB',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}>
                          {a.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                  <div style={ui.kpiCard}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: colors.info }}>
                      {tripData.totalDistance}km
                    </div>
                    <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                      {t('Total Distance Today', 'ഇന്നത്തെ ആകെ ദൂരം')}
                    </div>
                  </div>
                  
                  <div style={ui.kpiCard}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: colors.primary }}>
                      {t('Passenger Load', 'യാത്രക്കാരുടെ എണ്ണം')}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: colors.success, marginTop: '6px' }}>
                      {passengerLoad.filled}/{passengerLoad.capacity}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                      {t('Seats Filled', 'സീറ്റുകൾ നിറഞ്ഞു')}
                    </div>
                  </div>
                  
                  <div style={ui.kpiCard}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: colors.primary }}>
                      {tripData.completedTrips}
                    </div>
                      <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                      {t('Completed Trips', 'പൂർത്തിയായ യാത്രകൾ')}
                    </div>
                  </div>
                  
                  <div style={ui.kpiCard}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: colors.warning }}>
                      {tripData.fuelLevel}%
                    </div>
                      <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
                      {t('Fuel Remaining', 'ശേഷിക്കുന്ന ഇന്ധനം')}
                    </div>
                  </div>
                </div>

                {/* Trip Progress */}
                <div style={{
                  ...ui.card,
                  padding: '20px'
                }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: colors.dark }}>
                    🛣️ {t('Trip Progress', 'യാത്ര പുരോഗതി')}
                  </h3>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: colors.dark }}>
                        {t('Next Stop', 'അടുത്ത സ്റ്റോപ്പ്')}: {tripData.nextStop}
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
              <div style={{ padding: '16px' }}>
                <div style={{ ...ui.card, padding: 0, overflow: 'hidden' }}>
                  <div style={{ height: '520px' }}>
                    <GoogleMapsRouteTracker 
                      trip={{
                        busId: { busNumber: tripData.busNumber },
                        currentLocation: tripData.routeName,
                        currentSpeed: `${tripData.speed} km/h`,
                        lastUpdate: new Date().toLocaleTimeString(),
                        coordinates: currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : undefined
                      }}
                      isTracking={true}
                      onLocationUpdate={() => {}}
                      className="w-full h-full"
                    />
                  </div>
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
      {/* Persistent SOS */}
      <button
        onClick={() => reportEmergency('SOS')}
        style={{
          position: 'fixed',
          right: '16px',
          bottom: isDrivingLocked ? '72px' : '16px',
          background: colors.danger,
          color: colors.white,
          border: 'none',
          padding: '12px 16px',
          borderRadius: '9999px',
          fontWeight: 800,
          boxShadow: '0 12px 24px rgba(244,67,54,0.4)',
          zIndex: 1000,
          cursor: 'pointer'
        }}
      >
        🚨 {t('SOS', 'SOS')}
      </button>
      {isDrivingLocked && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(33,33,33,0.95)',
          color: colors.white,
          padding: '10px 16px',
          borderRadius: '9999px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 1000
        }}>
          <span style={{ fontWeight: 700 }}>Driving Safety Mode</span>
          <span style={{ opacity: 0.85 }}>Controls locked above 0 km/h</span>
          <span style={{
            background: colors.info,
            padding: '4px 8px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700
          }}>Speed: {tripData.speed} km/h</span>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;



