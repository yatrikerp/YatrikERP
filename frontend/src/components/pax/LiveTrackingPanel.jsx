import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Bus, 
  Play, 
  Pause,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import LiveTrackingMap from './LiveTrackingMap';

const LiveTrackingPanel = () => {
  const [activeTrips, setActiveTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  // Fetch active trips from backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return; // Skip unauthenticated calls
    fetchActiveTrips(token);
  }, []);

  const fetchActiveTrips = async (token) => {
    try {
      const response = await fetch('/api/trips/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        return;
      }
      {
        const data = await response.json();
        if (data.success) {
          setActiveTrips(data.trips || []);
        }
      }
    } catch (error) {
      console.error('Error fetching active trips:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress': return 'text-green-600 bg-green-50 border-green-200';
      case 'Delayed': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Completed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'In Progress': return <Play className="w-4 h-4" />;
      case 'Delayed': return <AlertCircle className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleStartTracking = (tripId) => {
    setIsTracking(true);
    setSelectedTrip(activeTrips.find(trip => trip.id === tripId));
  };

  const handleStopTracking = () => {
    setIsTracking(false);
    setSelectedTrip(null);
  };

  const handleRefreshLocation = () => {
    // TODO: Implement real-time location refresh
    console.log('Refreshing location...');
  };

  if (activeTrips.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Live Tracking</h2>
          <p className="text-gray-600 mt-1">Track your buses in real-time</p>
        </div>
        <div className="p-8 text-center">
          <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No active trips to track</p>
          <p className="text-sm text-gray-400">Your trips will appear here when they are in progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Live Tracking</h2>
          <p className="text-gray-600 mt-1">Track your buses in real-time</p>
        </div>
      </div>

      {/* Active Trips */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Active Trips</h3>
          <p className="text-gray-600 mt-1">Trips currently in progress</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {activeTrips.map((trip) => (
              <div key={trip.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Trip Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{trip.route}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(trip.status)}`}>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(trip.status)}
                          {trip.status}
                        </div>
                      </span>
                    </div>

                    {/* Current Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-sm text-gray-500">Current Location</p>
                          <p className="font-medium text-gray-900">{trip.currentLocation}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500">ETA</p>
                          <p className="font-medium text-gray-900">{trip.eta}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-purple-500" />
                        <div>
                          <p className="text-sm text-gray-500">Next Stop</p>
                          <p className="font-medium text-gray-900">{trip.nextStop}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Bus className="w-4 h-4 text-orange-500" />
                        <div>
                          <p className="text-sm text-gray-500">Speed</p>
                          <p className="font-medium text-gray-900">{trip.speed}</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>Journey Progress</span>
                        <span>{trip.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${trip.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Driver:</span>
                        <span className="ml-2 font-medium text-gray-900">{trip.driver}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Conductor:</span>
                        <span className="ml-2 font-medium text-gray-900">{trip.conductor}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Seat:</span>
                        <span className="ml-2 font-medium text-gray-900">{trip.seatNo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 ml-4">
                    {!isTracking || selectedTrip?.id !== trip.id ? (
                      <button
                        onClick={() => handleStartTracking(trip.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Track Live
                      </button>
                    ) : (
                      <button
                        onClick={handleStopTracking}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <Pause className="w-4 h-4" />
                        Stop Tracking
                      </button>
                    )}
                    
                    <button
                      onClick={handleRefreshLocation}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Map View */}
      {isTracking && selectedTrip && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Live Map View</h3>
            <p className="text-gray-600 mt-1">Real-time location of {selectedTrip.busNumber}</p>
          </div>
          <div className="p-6">
            <LiveTrackingMap
              trackingData={{
                busNumber: selectedTrip.busNumber || selectedTrip.bus?.registrationNumber || 'Bus',
                route: selectedTrip.route || `${selectedTrip?.origin || ''} → ${selectedTrip?.destination || ''}`.trim(),
                currentLocation: selectedTrip.currentLocation || selectedTrip?.lastKnownLocation?.name || '—',
                destination: selectedTrip.destination || selectedTrip?.to || '—',
                estimatedArrival: selectedTrip.eta || selectedTrip.estimatedArrival || '—',
                currentSpeed: selectedTrip.speed || selectedTrip.currentSpeed || '—',
                status: selectedTrip.status || 'on-route',
                lastUpdate: selectedTrip.lastUpdate || 'Just now',
                coordinates: selectedTrip.coordinates || selectedTrip.currentCoordinates || selectedTrip?.lastKnownLocation || selectedTrip?.gps?.coords || undefined
              }}
            />
            
            {/* Live Updates */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Current Location</span>
                </div>
                <p className="text-blue-800">{selectedTrip.currentLocation}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">ETA</span>
                </div>
                <p className="text-green-800">{selectedTrip.eta}</p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Next Stop</span>
                </div>
                <p className="text-purple-800">{selectedTrip.nextStop}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrackingPanel;
