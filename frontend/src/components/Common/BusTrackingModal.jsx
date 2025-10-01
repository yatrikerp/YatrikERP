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
import FreeMapTracker from './FreeMapTracker';

const BusTrackingModal = ({ isOpen, onClose }) => {
  const [runningTrips, setRunningTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Sample data for demonstration (Same structure as Driver Dashboard)
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
      conductorId: { name: 'Priya Menon', phone: '+91-9876543216' },
      serviceDate: new Date().toISOString(),
      startTime: '08:00',
      endTime: '12:30',
      status: 'running',
      currentLocation: 'Near Alappuzha, Kerala',
      coordinates: { lat: 9.4981, lng: 76.3388 }, // Realistic location between TVM and Kottayam
      currentSpeed: '65 km/h',
      estimatedArrival: '12:30',
      lastUpdate: new Date().toLocaleTimeString(),
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
      conductorId: { name: 'Anil Kumar', phone: '+91-9876543218' },
      serviceDate: new Date().toISOString(),
      startTime: '10:30',
      endTime: '15:00',
      status: 'running',
      currentLocation: 'Near Thrissur, Kerala',
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
      driverId: { name: 'Manoj Pillai', phone: '+91-9876543214' },
      conductorId: { name: 'Sunitha Raj', phone: '+91-9876543220' },
      serviceDate: new Date().toISOString(),
      startTime: '20:00',
      endTime: '06:00',
      status: 'running',
      currentLocation: 'Near Salem, Tamil Nadu',
      coordinates: { lat: 11.6643, lng: 78.1460 },
      currentSpeed: '70 km/h',
      estimatedArrival: '06:00',
      lastUpdate: '3 minutes ago',
      passengers: 25
    }
  ];

  useEffect(() => {
    if (isOpen) {
      console.log('🚌 BusTrackingModal opened - Fetching live data...');
      // Fetch real data immediately
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
      const response = await fetch('/api/tracking/running-trips');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.trips) {
          const trips = data.data.trips || [];
          setRunningTrips(trips);
          if (trips.length > 0) {
            setSelectedTrip(trips[0]);
          } else {
            setSelectedTrip(null);
            // Use sample data if no real trips are running
            console.log('No running trips found, using sample data');
            setRunningTrips(sampleTrips);
            setSelectedTrip(sampleTrips[0]);
          }
          console.log('✅ Fetched running trips from API:', trips.length);
        } else {
          throw new Error('Invalid API response');
        }
      } else {
        throw new Error(`API request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching running trips:', error);
      // Use sample data as fallback
      console.log('Using sample data as fallback');
      setRunningTrips(sampleTrips);
      setSelectedTrip(sampleTrips[0]);
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
            className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Compact */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Live Bus Tracking</h2>
                  <p className="text-xs text-gray-500">Track currently running buses in real-time</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchRunningTrips}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Trip List (Compact) */}
              <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="px-3 py-2 border-b border-gray-200 bg-white">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Running Trips ({runningTrips.length})</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live Updates</span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <div className="p-2 space-y-2">
                    {runningTrips.map((trip) => {
                      const statusConfig = getStatusConfig(trip.status);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <motion.div
                          key={trip._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedTrip?._id === trip._id
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                          }`}
                          onClick={() => setSelectedTrip(trip)}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-semibold text-gray-900">{trip.tripId}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3 mr-0.5" />
                              {statusConfig.text}
                            </span>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-1.5 text-xs">
                              <Route className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="font-medium text-gray-900 line-clamp-1">{trip.routeId.routeName}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Bus className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                              <span className="truncate">{trip.busId.busNumber}</span>
                              <span className="text-gray-400">•</span>
                              <span className="truncate">{trip.busId.busType}</span>
                            </div>
                            
                            <div className="flex items-start gap-1.5 text-xs text-gray-600">
                              <MapPin className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{trip.currentLocation}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Navigation className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                              <span>{trip.currentSpeed}</span>
                              <span className="text-gray-400">•</span>
                              <span>{trip.lastUpdate}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  {/* Removed loading indicator for instant display */}
                </div>
              </div>

              {/* Right Panel - Map and Trip Details (Optimized) */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Map - Enhanced with Route Display */}
                <div className="h-[55%] relative p-3">
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    padding: 0,
                    overflow: 'hidden',
                    height: '100%'
                  }}>
                    {selectedTrip ? (
                      <GoogleMapsRouteTracker 
                        trip={{
                          busId: { 
                            busNumber: selectedTrip.busId?.busNumber || 'N/A'
                          },
                          routeId: {
                            routeName: selectedTrip.routeId?.routeName || 'Unknown Route',
                            startingPoint: selectedTrip.routeId?.startingPoint,
                            endingPoint: selectedTrip.routeId?.endingPoint,
                            routeNumber: selectedTrip.routeId?.routeNumber
                          },
                          currentLocation: selectedTrip.currentLocation || 'Current Location',
                          currentSpeed: selectedTrip.currentSpeed || '0 km/h',
                          lastUpdate: selectedTrip.lastUpdate || new Date().toLocaleTimeString(),
                          coordinates: selectedTrip.coordinates || { lat: 10.8505, lng: 76.2711 },
                          estimatedArrival: selectedTrip.estimatedArrival,
                          passengers: selectedTrip.passengers,
                          status: selectedTrip.status,
                          routeProgress: selectedTrip.routeProgress || 0
                        }}
                        isTracking={true}
                        onLocationUpdate={(trip) => {
                          console.log('📍 Location updated:', trip);
                          // Update the selected trip with new location data
                          if (selectedTrip && trip) {
                            setSelectedTrip(prevTrip => ({
                              ...prevTrip,
                              coordinates: trip.coordinates,
                              currentLocation: trip.currentLocation,
                              currentSpeed: trip.currentSpeed,
                              lastUpdate: trip.lastUpdate
                            }));
                          }
                        }}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                        <div className="text-center p-6">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-8 h-8 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Bus Tracking</h3>
                          <p className="text-gray-600 mb-4">Select a running trip from the left panel to view its live location and route</p>
                          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span>Real-time Updates</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Navigation className="w-4 h-4" />
                              <span>Route Tracking</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Bus className="w-4 h-4" />
                              <span>Live Location</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trip Details - Compact & Scrollable */}
                <div className="h-[45%] px-3 pb-3 border-t border-gray-200 flex flex-col overflow-hidden">
                  <h3 className="text-sm font-semibold text-gray-900 py-2 sticky top-0 bg-white">Trip Details</h3>
                  {selectedTrip ? (
                    <div className="flex-1 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pb-2">
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">Route</label>
                          <p className="text-sm font-medium text-gray-900 truncate">{selectedTrip.routeId.routeName}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">Current Speed</label>
                          <p className="text-sm font-medium text-gray-900">{selectedTrip.currentSpeed}</p>
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500 block mb-1">Route Progress</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${selectedTrip.routeProgress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700">{selectedTrip.routeProgress || 0}%</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">Bus Number</label>
                          <p className="text-sm font-medium text-gray-900">{selectedTrip.busId.busNumber}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">Estimated Arrival</label>
                          <p className="text-sm font-medium text-gray-900">{selectedTrip.estimatedArrival}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">Driver</label>
                          <p className="text-sm font-medium text-gray-900 truncate">{selectedTrip.driverId.name}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">Passengers</label>
                          <p className="text-sm font-medium text-gray-900">{selectedTrip.passengers}/{selectedTrip.busId.capacity.total}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">Conductor</label>
                          <p className="text-sm font-medium text-gray-900 truncate">{selectedTrip.conductorId?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">Bus Type</label>
                          <p className="text-sm font-medium text-gray-900 truncate">{selectedTrip.busId.busType}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-2 border border-green-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Wifi className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs text-gray-700">GPS</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Signal className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs text-gray-700">Strong</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Battery className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs text-gray-700">100%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Bus className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No trip selected</p>
                        <p className="text-xs text-gray-400 mt-1">Select a trip from the list</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BusTrackingModal;
