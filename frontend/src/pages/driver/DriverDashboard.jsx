import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { apiFetch } from '../../utils/apiFetch';
import './driver.css';

const DriverDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('duties');
  const [duties, setDuties] = useState([]);
  const [currentDuty, setCurrentDuty] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gpsTracking, setGpsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [gpsInterval, setGpsInterval] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'driver') {
      navigate('/login');
      return;
    }
    fetchDuties();
  }, [user, navigate]);

  useEffect(() => {
    if (gpsTracking && currentDuty) {
      startGPSTracking();
    } else {
      stopGPSTracking();
    }

    return () => stopGPSTracking();
  }, [gpsTracking, currentDuty]);

  const fetchDuties = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/driver/duties');
      if (response.success) {
        setDuties(response.data);
        // Set current duty if any is active
        const activeDuty = response.data.find(duty => 
          duty.status === 'started' || duty.status === 'in_progress'
        );
        setCurrentDuty(activeDuty);
        if (activeDuty) {
          fetchTripDetails(activeDuty._id);
        }
      }
    } catch (err) {
      setError('Failed to fetch duties');
      console.error('Error fetching duties:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTripDetails = async (crewId) => {
    try {
      const response = await apiFetch(`/api/driver/trip/${crewId}`);
      if (response.success) {
        setTripDetails(response.data);
      }
    } catch (err) {
      console.error('Error fetching trip details:', err);
    }
  };

  const startDuty = async (crewId) => {
    try {
      const response = await apiFetch(`/api/driver/duty/start/${crewId}`, {
        method: 'POST'
      });
      if (response.success) {
        setCurrentDuty(response.data);
        fetchDuties(); // Refresh duties list
        fetchTripDetails(crewId);
      }
    } catch (err) {
      console.error('Error starting duty:', err);
    }
  };

  const endDuty = async (crewId) => {
    try {
      const response = await apiFetch(`/api/driver/duty/end/${crewId}`, {
        method: 'POST',
        body: JSON.stringify({
          actualEndTime: new Date(),
          notes: 'Duty ended normally'
        })
      });
      if (response.success) {
        setCurrentDuty(null);
        setTripDetails(null);
        setGpsTracking(false);
        fetchDuties(); // Refresh duties list
      }
    } catch (err) {
      console.error('Error ending duty:', err);
    }
  };

  const startGPSTracking = () => {
    if (!navigator.geolocation) {
      alert('GPS not supported by this browser');
      return;
    }

    // Get initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        updateGPSLocation(latitude, longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get current location');
      }
    );

    // Start periodic tracking
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          updateGPSLocation(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }, 30000); // Update every 30 seconds

    setGpsInterval(interval);
  };

  const stopGPSTracking = () => {
    if (gpsInterval) {
      clearInterval(gpsInterval);
      setGpsInterval(null);
    }
  };

  const updateGPSLocation = async (latitude, longitude) => {
    if (!currentDuty) return;

    try {
      await apiFetch('/api/driver/gps/update', {
        method: 'POST',
        body: JSON.stringify({
          crewId: currentDuty._id,
          latitude,
          longitude,
          speed: 0, // Could get from device
          heading: 0, // Could get from device
          stopName: 'Current Location',
          accuracy: 10
        })
      });
    } catch (err) {
      console.error('Error updating GPS location:', err);
    }
  };

  const reportIssue = async (issueType, description, estimatedDelay = 0) => {
    if (!currentDuty) return;

    try {
      const response = await apiFetch('/api/driver/issue/report', {
        method: 'POST',
        body: JSON.stringify({
          crewId: currentDuty._id,
          issueType,
          description,
          estimatedDelay,
          location: 'Current Location',
          severity: 'medium'
        })
      });

      if (response.success) {
        alert('Issue reported successfully');
      }
    } catch (err) {
      console.error('Error reporting issue:', err);
      alert('Failed to report issue');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDutyStatusColor = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'started':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-800 mb-4">{error}</p>
          <button 
            onClick={fetchDuties}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">YATRIK ERP</h1>
              <span className="text-gray-500">|</span>
              <span className="text-lg text-gray-700">Driver Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Duty Status */}
      {currentDuty && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-green-900">
                  Active Duty: {currentDuty.tripId?.routeId?.name || 'Route'}
                </h2>
                <p className="text-green-700">
                  Bus: {currentDuty.busId?.busNumber} | 
                  Conductor: {currentDuty.conductorId?.name} |
                  Started: {formatTime(currentDuty.actualStartTime)}
                </p>
                {currentLocation && (
                  <p className="text-green-600 text-sm mt-1">
                    GPS: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setGpsTracking(!gpsTracking)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    gpsTracking 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {gpsTracking ? 'Stop GPS' : 'Start GPS'}
                </button>
                <button
                  onClick={() => endDuty(currentDuty._id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  End Duty
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Reporting */}
      {currentDuty && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <span className="text-yellow-800 font-medium">Report Issue:</span>
              <button
                onClick={() => reportIssue('delay', 'Traffic delay', 15)}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
              >
                Traffic Delay
              </button>
              <button
                onClick={() => reportIssue('breakdown', 'Vehicle breakdown', 60)}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Breakdown
              </button>
              <button
                onClick={() => reportIssue('weather', 'Weather conditions', 30)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Weather
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('duties')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'duties'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Duties ({duties.length})
              </button>
              {currentDuty && (
                <button
                  onClick={() => setActiveTab('trip')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'trip'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Trip Details
                </button>
              )}
            </nav>
          </div>

          <div className="p-6">
            {/* Duties Tab */}
            {activeTab === 'duties' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Assigned Duties</h3>
                {duties.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">📅</div>
                    <p className="text-gray-500">No duties assigned</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {duties.map((duty) => (
                      <div key={duty._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {duty.tripId?.routeId?.name || 'Route'}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDutyStatusColor(duty.status)}`}>
                                {duty.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Bus:</span> {duty.busId?.busNumber}
                              </div>
                              <div>
                                <span className="font-medium">Conductor:</span> {duty.conductorId?.name}
                              </div>
                              <div>
                                <span className="font-medium">Start:</span> {formatTime(duty.dutyStartTime)}
                              </div>
                              <div>
                                <span className="font-medium">End:</span> {formatTime(duty.dutyEndTime)}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {duty.status === 'assigned' && (
                              <button
                                onClick={() => startDuty(duty._id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                Start Duty
                              </button>
                            )}
                            {duty.status === 'started' && (
                              <button
                                onClick={() => setCurrentDuty(duty)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                              >
                                Continue Duty
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trip Details Tab */}
            {activeTab === 'trip' && currentDuty && tripDetails && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Route Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Route Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Route:</span> {tripDetails.routeStops?.routeId?.name || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Origin:</span> {tripDetails.routeStops?.routeId?.origin || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Destination:</span> {tripDetails.routeStops?.routeId?.destination || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Departure:</span> {formatTime(currentDuty.tripId?.departureTime)}
                      </div>
                      <div>
                        <span className="font-medium">Arrival:</span> {formatTime(currentDuty.tripId?.arrivalTime)}
                      </div>
                    </div>
                  </div>

                  {/* Bus Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Bus Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Bus Number:</span> {currentDuty.busId?.busNumber}
                      </div>
                      <div>
                        <span className="font-medium">Registration:</span> {currentDuty.busId?.registrationNumber}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {currentDuty.busId?.busType?.replace('_', ' ')}
                      </div>
                      <div>
                        <span className="font-medium">Capacity:</span> {currentDuty.busId?.capacity?.total}
                      </div>
                    </div>
                  </div>

                  {/* GPS Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">GPS Status</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          gpsTracking ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {gpsTracking ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      {currentLocation && (
                        <>
                          <div>
                            <span className="font-medium">Latitude:</span> {currentLocation.latitude.toFixed(6)}
                          </div>
                          <div>
                            <span className="font-medium">Longitude:</span> {currentLocation.longitude.toFixed(6)}
                          </div>
                        </>
                      )}
                      <div>
                        <span className="font-medium">Update Interval:</span> 30 seconds
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => setGpsTracking(!gpsTracking)}
                        className={`w-full px-3 py-2 rounded text-sm font-medium ${
                          gpsTracking 
                            ? 'bg-red-600 text-white hover:bg-red-700' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {gpsTracking ? 'Stop GPS Tracking' : 'Start GPS Tracking'}
                      </button>
                      <button
                        onClick={() => endDuty(currentDuty._id)}
                        className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700"
                      >
                        End Duty
                      </button>
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



