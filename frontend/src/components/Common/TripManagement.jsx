import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Play, 
  Square, 
  Route, 
  Clock, 
  Users, 
  Bus, 
  Navigation,
  Location,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../utils/api';

const TripManagement = () => {
  const { user } = useAuth();
  const [assignedTrips, setAssignedTrips] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [tripStatus, setTripStatus] = useState('idle'); // idle, starting, active, ending
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const locationWatchId = useRef(null);
  const locationInterval = useRef(null);

  // Fetch assigned trips
  useEffect(() => {
    fetchAssignedTrips();
  }, []);

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const fetchAssignedTrips = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/duty/assigned', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok && response.data?.success) {
        const tripsData = response.data.data || response.data;
        setAssignedTrips(tripsData);
        // Check if there's an active trip
        const activeTrip = tripsData.find(trip => 
          trip.status === 'started' || trip.status === 'in-progress'
        );
        if (activeTrip) {
          setCurrentTrip(activeTrip);
          setTripStatus('active');
          startLocationTracking();
        }
      }
    } catch (error) {
      setError('Failed to fetch assigned trips');
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationPermission('unsupported');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(permission.state);
      
      permission.onchange = () => {
        setLocationPermission(permission.state);
      };
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const position = await getCurrentPosition();
      setLocationPermission('granted');
      setIsLocationEnabled(true);
      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
      return true;
    } catch (error) {
      setLocationPermission('denied');
      setError('Location permission denied. Please enable location access to start trips.');
      return false;
    }
  };

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });
  };

  const startLocationTracking = () => {
    if (locationWatchId.current) {
      navigator.geolocation.clearWatch(locationWatchId.current);
    }

    locationWatchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        };
        setCurrentLocation(newLocation);
        
        // Send location update to server if trip is active
        if (currentTrip && tripStatus === 'active') {
          updateTripLocation(newLocation);
        }
      },
      (error) => {
        console.error('Location tracking error:', error);
        setError('Location tracking failed. Please check your location settings.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    // Also update location every 30 seconds
    locationInterval.current = setInterval(async () => {
      try {
        const position = await getCurrentPosition();
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        };
        setCurrentLocation(newLocation);
        
        if (currentTrip && tripStatus === 'active') {
          updateTripLocation(newLocation);
        }
      } catch (error) {
        console.error('Periodic location update failed:', error);
      }
    }, 30000);
  };

  const stopLocationTracking = () => {
    if (locationWatchId.current) {
      navigator.geolocation.clearWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
    
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
    
    setIsLocationEnabled(false);
  };

  const updateTripLocation = async (location) => {
    try {
      await apiFetch(`/api/duty/${currentTrip._id}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp
        }),
      });
    } catch (error) {
      console.error('Failed to update trip location:', error);
    }
  };

  const startTrip = async (trip) => {
    try {
      setLoading(true);
      setError(null);

      // Request location permission if not granted
      if (locationPermission !== 'granted') {
        const locationGranted = await requestLocationPermission();
        if (!locationGranted) {
          return;
        }
      }

      // Start location tracking
      startLocationTracking();

      // Start the trip on server
      const response = await apiFetch(`/api/duty/${trip._id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: currentLocation,
          startTime: new Date().toISOString()
        }),
      });

      if (response.success) {
        setCurrentTrip(trip);
        setTripStatus('active');
        setAssignedTrips(prev => 
          prev.map(t => 
            t._id === trip._id 
              ? { ...t, status: 'started' }
              : t
          )
        );
        
        // Mark attendance
        await markAttendance('present', currentLocation);
      }
    } catch (error) {
      setError('Failed to start trip. Please try again.');
      console.error('Error starting trip:', error);
      stopLocationTracking();
    } finally {
      setLoading(false);
    }
  };

  const endTrip = async () => {
    try {
      setLoading(true);
      setError(null);

      // End the trip on server
      const response = await apiFetch(`/api/duty/${currentTrip._id}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: currentLocation,
          endTime: new Date().toISOString()
        }),
      });

      if (response.success) {
        setCurrentTrip(null);
        setTripStatus('idle');
        setAssignedTrips(prev => 
          prev.map(t => 
            t._id === currentTrip._id 
              ? { ...t, status: 'completed' }
              : t
          )
        );
        
        // Stop location tracking
        stopLocationTracking();
        
        // Mark attendance
        await markAttendance('logout', currentLocation);
      }
    } catch (error) {
      setError('Failed to end trip. Please try again.');
      console.error('Error ending trip:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (status, location) => {
    try {
      await apiFetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          location: location ? `${location.latitude},${location.longitude}` : null,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Failed to mark attendance:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'text-blue-600 bg-blue-100';
      case 'started': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-orange-600 bg-orange-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'assigned': return <Clock className="w-4 h-4" />;
      case 'started': return <Play className="w-4 h-4" />;
      case 'in-progress': return <Navigation className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading && assignedTrips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Trip Management</h2>
            <p className="text-primary-light mt-1">
              Manage your assigned trips and track your journey
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
              isLocationEnabled ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
            }`}>
              {isLocationEnabled ? <Location className="w-4 h-4" /> : <Location className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {isLocationEnabled ? 'Location Active' : 'Location Inactive'}
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/20">
              {currentLocation ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm font-medium">GPS Active</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">GPS Inactive</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current Trip Status */}
      {currentTrip && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Active Trip</h3>
              <p className="text-green-100 mt-1">
                {currentTrip.routeId?.name} - {currentTrip.tripId?.tripCode}
              </p>
              <div className="flex items-center space-x-4 mt-3 text-sm">
                <span>Driver: {currentTrip.driverId?.name}</span>
                <span>Conductor: {currentTrip.conductorId?.name}</span>
                <span>Bus: {currentTrip.busId?.busNumber}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {currentLocation ? (
                    `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`
                  ) : (
                    'Location unavailable'
                  )}
                </div>
                <div className="text-green-100 text-sm">Current Location</div>
              </div>
              <button
                onClick={endTrip}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 disabled:bg-red-400 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>End Trip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Assigned Trips */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Assigned Trips</h3>
        
        {assignedTrips.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Route className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">No Trips Assigned</h4>
            <p className="text-gray-500">You don't have any trips assigned at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignedTrips.map((trip) => (
              <div key={trip._id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(trip.status)}
                          <span className="capitalize">{trip.status}</span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">#{trip.dutyCode}</span>
                    </div>
                    
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      {trip.routeId?.name}
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Route className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm text-gray-500">Route</div>
                          <div className="font-medium">{trip.routeId?.routeCode}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm text-gray-500">Departure</div>
                          <div className="font-medium">
                            {new Date(trip.scheduledStartTime).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm text-gray-500">Capacity</div>
                          <div className="font-medium">{trip.busId?.capacity || 'N/A'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Bus className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm text-gray-500">Bus</div>
                          <div className="font-medium">{trip.busId?.busNumber}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <strong>From:</strong> {trip.routeId?.origin} → <strong>To:</strong> {trip.routeId?.destination}
                    </div>
                  </div>
                  
                  <div className="ml-6">
                    {trip.status === 'assigned' && (
                      <button
                        onClick={() => startTrip(trip)}
                        disabled={loading || locationPermission === 'denied'}
                        className="bg-primary hover:bg-primary-dark disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Trip</span>
                      </button>
                    )}
                    
                    {trip.status === 'started' && (
                      <div className="text-center">
                        <div className="text-green-600 font-semibold mb-2">Trip Started</div>
                        <div className="text-sm text-gray-500">
                          Location tracking active
                        </div>
                      </div>
                    )}
                    
                    {trip.status === 'completed' && (
                      <div className="text-center">
                        <div className="text-gray-600 font-semibold mb-2">Trip Completed</div>
                        <div className="text-sm text-gray-500">
                          {new Date(trip.actualEndTime).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Location Permission Request */}
      {locationPermission === 'denied' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">
              Location access is required to start trips. Please enable location access in your browser settings.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripManagement;
