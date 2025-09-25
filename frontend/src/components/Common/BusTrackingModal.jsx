import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Navigation, 
  Bus, 
  Clock, 
  Users, 
  Wifi, 
  Signal, 
  Battery,
  RefreshCw,
  Eye,
  Route,
  Play,
  Pause,
  AlertTriangle,
  ExternalLink,
  Settings
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { generateMapsEmbedUrl, isMapsApiConfigured } from '../../config/maps';
import GoogleMapsRouteTracker from './GoogleMapsRouteTracker';

const BusTrackingModal = ({ isOpen, onClose }) => {
  const [runningTrips, setRunningTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Sample data for demonstration
  const sampleTrips = [
    {
      _id: '1',
      tripId: 'TRP001',
      routeId: {
        routeName: 'Thiruvananthapuram → Kottayam',
        routeNumber: 'RT001',
        startingPoint: { city: 'Thiruvananthapuram', location: 'Central Bus Station' },
        endingPoint: { city: 'Kottayam', location: 'KSRTC Bus Station' }
      },
      busId: {
        busNumber: 'KL-07-AB-1234',
        busType: 'AC Sleeper',
        capacity: { total: 35, available: 12 }
      },
      driverId: { name: 'Rajesh Kumar', phone: '+91-9876543210' },
      conductorId: { name: 'Priya Menon', phone: '+91-9876543211' },
      serviceDate: new Date().toISOString(),
      startTime: '08:00',
      endTime: '12:30',
      status: 'running',
      currentLocation: 'Thiruvananthapuram, Kerala',
      coordinates: { lat: 8.5241, lng: 76.9558 },
      currentSpeed: '65 km/h',
      estimatedArrival: '12:30',
      lastUpdate: '2 minutes ago',
      passengers: 23
    },
    {
      _id: '2',
      tripId: 'TRP002',
      routeId: {
        routeName: 'Kochi → Kozhikode',
        routeNumber: 'RT002',
        startingPoint: { city: 'Kochi', location: 'KSRTC Bus Station' },
        endingPoint: { city: 'Kozhikode', location: 'Central Bus Station' }
      },
      busId: {
        busNumber: 'KL-11-CD-5678',
        busType: 'Semi-Deluxe',
        capacity: { total: 40, available: 8 }
      },
      driverId: { name: 'Suresh Nair', phone: '+91-9876543212' },
      conductorId: { name: 'Anita Raj', phone: '+91-9876543213' },
      serviceDate: new Date().toISOString(),
      startTime: '10:30',
      endTime: '15:00',
      status: 'running',
      currentLocation: 'Thrissur, Kerala',
      coordinates: { lat: 10.5276, lng: 76.2144 },
      currentSpeed: '55 km/h',
      estimatedArrival: '15:00',
      lastUpdate: '1 minute ago',
      passengers: 32
    },
    {
      _id: '3',
      tripId: 'TRP003',
      routeId: {
        routeName: 'Thiruvananthapuram → Bangalore',
        routeNumber: 'RT003',
        startingPoint: { city: 'Thiruvananthapuram', location: 'Central Bus Station' },
        endingPoint: { city: 'Bangalore', location: 'Majestic Bus Station' }
      },
      busId: {
        busNumber: 'KL-01-EF-9012',
        busType: 'AC Sleeper',
        capacity: { total: 30, available: 5 }
      },
      driverId: { name: 'Vikram Singh', phone: '+91-9876543214' },
      conductorId: { name: 'Lakshmi Devi', phone: '+91-9876543215' },
      serviceDate: new Date().toISOString(),
      startTime: '20:00',
      endTime: '06:00',
      status: 'running',
      currentLocation: 'Salem, Tamil Nadu',
      coordinates: { lat: 11.6643, lng: 78.1460 },
      currentSpeed: '70 km/h',
      estimatedArrival: '06:00',
      lastUpdate: '3 minutes ago',
      passengers: 25
    }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchRunningTrips();
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => stopAutoRefresh();
  }, [isOpen]);

  const fetchRunningTrips = async () => {
    setLoading(true);
    try {
      // Try to fetch from API first
      const response = await apiFetch('/api/tracking/running-trips');
      if (response.ok && response.data?.success) {
        const trips = response.data.data.trips || [];
        setRunningTrips(trips);
        if (trips.length > 0 && !selectedTrip) {
          setSelectedTrip(trips[0]);
        }
      } else {
        // Fallback to sample data if API fails
        console.warn('API failed, using sample data');
        setRunningTrips(sampleTrips);
        if (sampleTrips.length > 0 && !selectedTrip) {
          setSelectedTrip(sampleTrips[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching running trips:', error);
      // Fallback to sample data
      setRunningTrips(sampleTrips);
      if (sampleTrips.length > 0 && !selectedTrip) {
        setSelectedTrip(sampleTrips[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const startAutoRefresh = () => {
    const interval = setInterval(fetchRunningTrips, 30000); // Refresh every 30 seconds
    setRefreshInterval(interval);
  };

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'running': {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Play,
        text: 'Running'
      },
      'scheduled': {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Clock,
        text: 'Scheduled'
      },
      'delayed': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: AlertTriangle,
        text: 'Delayed'
      },
      'completed': {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Navigation,
        text: 'Completed'
      }
    };
    return configs[status] || configs['running'];
  };

  const generateGoogleMapsUrl = (trip) => {
    if (!trip || !trip.coordinates) return null;
    
    const { lat, lng } = trip.coordinates;
    return generateMapsEmbedUrl(lat, lng, 13);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Live Bus Tracking</h2>
                  <p className="text-gray-500">Track currently running buses in real-time</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchRunningTrips}
                  disabled={loading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Trip List */}
              <div className="w-96 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Running Trips ({runningTrips.length})</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live Updates</span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : runningTrips.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No buses currently running</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {runningTrips.map((trip) => {
                        const statusConfig = getStatusConfig(trip.status);
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                          <motion.div
                            key={trip._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedTrip?._id === trip._id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}
                            onClick={() => setSelectedTrip(trip)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900">{trip.tripId}</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.text}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Route className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-gray-900">{trip.routeId.routeName}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Bus className="w-4 h-4 text-gray-500" />
                                <span>{trip.busId.busNumber}</span>
                                <span className="text-gray-400">•</span>
                                <span>{trip.busId.busType}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-green-600" />
                                <span>{trip.currentLocation}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Navigation className="w-4 h-4 text-orange-600" />
                                <span>{trip.currentSpeed}</span>
                                <span className="text-gray-400">•</span>
                                <span>{trip.lastUpdate}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Map and Trip Details */}
              <div className="flex-1 flex flex-col">
                {selectedTrip ? (
                  <>
                    {/* Map */}
                    <div className="h-2/3 relative m-4">
                      <GoogleMapsRouteTracker 
                        trip={selectedTrip}
                        isTracking={true}
                        onLocationUpdate={(trip) => {
                          console.log('Location updated:', trip);
                          // Handle location updates here
                        }}
                        className="w-full h-full"
                      />
                    </div>

                    {/* Trip Details */}
                    <div className="h-1/3 p-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-gray-500">Route</label>
                            <p className="font-medium text-gray-900">{selectedTrip.routeId.routeName}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500">Bus Number</label>
                            <p className="font-medium text-gray-900">{selectedTrip.busId.busNumber}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500">Driver</label>
                            <p className="font-medium text-gray-900">{selectedTrip.driverId.name}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-gray-500">Current Speed</label>
                            <p className="font-medium text-gray-900">{selectedTrip.currentSpeed}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500">Estimated Arrival</label>
                            <p className="font-medium text-gray-900">{selectedTrip.estimatedArrival}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500">Passengers</label>
                            <p className="font-medium text-gray-900">{selectedTrip.passengers}/{selectedTrip.busId.capacity.total}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Wifi className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-600">GPS Active</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Signal className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-600">Signal Strong</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Battery className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-600">100%</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Bus to Track</h3>
                      <p className="text-gray-500">Choose a running trip from the list to see its location on the map</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BusTrackingModal;
