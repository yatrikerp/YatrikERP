import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, Plus, Search, Filter, MapPin, Clock, Calendar, 
  Users, Route, Edit, Trash2, Eye, RefreshCw, Play, 
  Pause, Square, AlertTriangle, CheckCircle, XCircle,
  Loader2, Download, Upload
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const AdminTrips = () => {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    route: 'all',
    date: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list, calendar, map
  const [error, setError] = useState(null);

  const fetchTrips = useCallback(async () => {
    try {
      console.log('🚌 AdminTrips: Fetching trips...');
      const queryParams = new URLSearchParams(filters).toString();
      console.log('🚌 AdminTrips: Query params:', queryParams);
      const response = await apiFetch(`/api/admin/trips?${queryParams}`);
      console.log('🚌 AdminTrips: Trips API response:', response);
      console.log('🚌 AdminTrips: Response status:', response?.status);
      console.log('🚌 AdminTrips: Response ok:', response?.ok);
      console.log('🚌 AdminTrips: Response data:', response?.data);
      
      if (response.ok) {
        // Handle the correct response format: { success: true, data: { trips: [...] } }
        const tripsData = response.data?.data?.trips || response.data?.trips || response.data || [];
        console.log('🚌 AdminTrips: Trips data extracted:', tripsData);
        console.log('🚌 AdminTrips: Number of trips:', tripsData.length);
        setTrips(Array.isArray(tripsData) ? tripsData : []);
        console.log('🚌 AdminTrips: Trips state updated successfully');
      } else {
        console.error('🚌 AdminTrips: Trips API error:', response);
        console.error('🚌 AdminTrips: Error message:', response?.message);
        console.error('🚌 AdminTrips: Error status:', response?.status);
        setTrips([]);
      }
    } catch (error) {
      console.error('🚌 AdminTrips: Error fetching trips:', error);
      console.error('🚌 AdminTrips: Error stack:', error.stack);
      setTrips([]);
      throw error; // Re-throw to be caught by fetchAllData's Promise.allSettled
    }
  }, [filters]);

  const fetchRoutes = useCallback(async () => {
    try {
      const response = await apiFetch('/api/admin/routes');
      if (response.ok) {
        const routesData = response.data?.routes || response.data || [];
        setRoutes(Array.isArray(routesData) ? routesData : []);
      } else {
        setRoutes([]);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      setRoutes([]);
    }
  }, []);

  const fetchBuses = useCallback(async () => {
    try {
      console.log('🚌 AdminTrips: Fetching buses...');
      console.log('🚌 AdminTrips: Making request to /api/admin/buses');
      
      const response = await apiFetch('/api/admin/buses');
      console.log('🚌 AdminTrips: Buses API response:', response);
      console.log('🚌 AdminTrips: Response status:', response?.status);
      console.log('🚌 AdminTrips: Response ok:', response?.ok);
      console.log('🚌 AdminTrips: Response data:', response?.data);
      
      if (response.ok) {
        const busesData = response.data?.data?.buses || response.data?.buses || response.data || [];
        console.log('🚌 AdminTrips: Raw buses data:', busesData);
        console.log('🚌 AdminTrips: Number of buses:', busesData.length);
        
        // Process and normalize bus data for complete information
        const processedBuses = busesData.map(bus => ({
          _id: bus._id,
          busNumber: bus.busNumber,
          registrationNumber: bus.registrationNumber,
          busType: bus.busType,
          status: bus.status,
          capacity: bus.capacity,
          amenities: bus.amenities || [],
          depotId: bus.depotId,
          assignedDriver: bus.assignedDriver,
          assignedConductor: bus.assignedConductor,
          maintenance: bus.maintenance,
          fuel: bus.fuel,
          notes: bus.notes,
          createdAt: bus.createdAt,
          updatedAt: bus.updatedAt
        }));
        
        console.log('🚌 AdminTrips: Processed buses:', processedBuses);
        setBuses(processedBuses);
        console.log('🚌 AdminTrips: Buses state updated successfully');
      } else {
        console.error('🚌 AdminTrips: Buses API error:', response);
        setBuses([]);
      }
    } catch (error) {
      console.error('🚌 AdminTrips: Error fetching buses:', error);
      console.error('🚌 AdminTrips: Error stack:', error.stack);
      setBuses([]);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const [driversRes, conductorsRes] = await Promise.all([
        apiFetch('/api/admin/all-drivers'),
        apiFetch('/api/admin/conductors')
      ]);
      
      if (driversRes.ok) {
        const driversData = driversRes.data?.data?.drivers || driversRes.data?.drivers || driversRes.data || [];
        setDrivers(Array.isArray(driversData) ? driversData : []);
      } else {
        setDrivers([]);
      }
      
      if (conductorsRes.ok) {
        const conductorsData = conductorsRes.data?.data?.conductors || conductorsRes.data?.conductors || conductorsRes.data || [];
        setConductors(Array.isArray(conductorsData) ? conductorsData : []);
      } else {
        setConductors([]);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      setDrivers([]);
      setConductors([]);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🚌 AdminTrips: Fetching all data...');
      console.log('🚌 AdminTrips: Current user token:', localStorage.getItem('token'));
      console.log('🚌 AdminTrips: Depot token:', localStorage.getItem('depotToken'));
      
      // Check if user is authenticated
      const token = localStorage.getItem('token') || localStorage.getItem('depotToken');
      if (!token) {
        console.error('🚌 AdminTrips: No authentication token found!');
        toast.error('Please log in to access Trip Management');
        setError(new Error('No authentication token found'));
        return;
      }
      
      // Fetch buses first (most critical for trip creation)
      console.log('🚌 AdminTrips: Fetching buses first...');
      await fetchBuses();
      
      // Set loading to false immediately after buses are loaded
      setLoading(false);
      console.log('🚌 AdminTrips: Buses loaded, modal ready');
      
      // Fetch remaining data in background (non-blocking)
      Promise.allSettled([
        fetchTrips(),
        fetchRoutes(),
        fetchStaff()
      ]).then(results => {
        console.log('🚌 AdminTrips: Background data fetch completed:', results);
        
        // Check for any rejected promises
        const rejected = results.filter(result => result.status === 'rejected');
        if (rejected.length > 0) {
          console.error('🚌 AdminTrips: Some background API calls failed:', rejected);
        }
      });
    } catch (error) {
      console.error('🚌 AdminTrips: Error fetching data:', error);
      console.error('🚌 AdminTrips: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(error);
      toast.error('Failed to fetch data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchBuses, fetchTrips, fetchRoutes, fetchStaff]);

  // useEffect hook after all useCallback hooks
  useEffect(() => {
    try {
      fetchAllData();
    } catch (error) {
      console.error('🚌 AdminTrips: useEffect error:', error);
      setError(error);
    }
  }, [filters, fetchAllData]);

  // Add error boundary for the component (after all hooks)
  if (error) {
    console.error('🚌 AdminTrips: Component error:', error);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error in Trip Management</div>
          <div className="text-gray-600 mb-4">{error.message}</div>
          <button 
            onClick={() => setError(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const handleCreateTrip = async (tripData) => {
    try {
      console.log('🚌 AdminTrips: Creating trip with data:', tripData);
      const response = await apiFetch('/api/admin/trips', {
        method: 'POST',
        body: JSON.stringify(tripData)
      });
      
      console.log('🚌 AdminTrips: Trip creation response:', response);
      
      if (response.ok) {
        toast.success('Trip created successfully');
        setShowAddModal(false);
        console.log('🚌 AdminTrips: Refreshing trips list...');
        
        // Force refresh all data to ensure trips are loaded
        await fetchAllData();
        
        console.log('🚌 AdminTrips: Trips list refreshed');
      } else {
        console.error('🚌 AdminTrips: Trip creation failed:', response);
        toast.error('Failed to create trip: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('🚌 AdminTrips: Trip creation error:', error);
      toast.error('Failed to create trip: ' + error.message);
    }
  };

  const handleUpdateTrip = async (tripData) => {
    try {
      const response = await apiFetch(`/api/admin/trips/${selectedTrip._id}`, {
        method: 'PUT',
        body: JSON.stringify(tripData)
      });
      
      if (response.ok) {
        toast.success('Trip updated successfully');
        setShowEditModal(false);
        setSelectedTrip(null);
        fetchTrips();
      } else {
        toast.error('Failed to update trip');
      }
    } catch (error) {
      toast.error('Failed to update trip');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    const trip = trips.find(t => t._id === tripId);
    const tripName = trip ? (trip.tripNumber || trip.routeId?.routeName || 'this trip') : 'this trip';
    
    if (!window.confirm(`Are you sure you want to delete "${tripName}"? This will permanently remove the trip from the database and cannot be undone.`)) return;
    
    try {
      setLoading(true);
      console.log('Deleting trip with ID:', tripId);
      
      const response = await apiFetch(`/api/admin/trips/${tripId}`, { method: 'DELETE' });
      console.log('Delete trip response:', response);
      
      if (response.ok && response.data?.success) {
        toast.success(`Trip "${tripName}" permanently deleted from database!`);
        await fetchTrips(); // Reload trips from database
      } else {
        console.error('Delete failed:', response);
        const errorMessage = response.data?.message || response.message || 'Unknown error';
        toast.error(`Failed to delete trip: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast.error(`Failed to delete trip: ${error.message || 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTripStatusChange = async (tripId, newStatus) => {
    try {
      await apiFetch(`/api/admin/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      
      toast.success(`Trip ${newStatus} successfully`);
      fetchTrips();
    } catch (error) {
      toast.error(`Failed to ${newStatus} trip`);
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.routeId?.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.busId?.busNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filters.status === 'all' || trip.status === filters.status;
    const matchesRoute = filters.route === 'all' || trip.routeId?._id === filters.route;
    const matchesDate = !filters.date || 
      new Date(trip.serviceDate).toDateString() === new Date(filters.date).toDateString();
    
    return matchesSearch && matchesStatus && matchesRoute && matchesDate;
  });

  // Debug: Log trips data
  console.log('🚌 AdminTrips: Current trips state:', trips);
  console.log('🚌 AdminTrips: Filtered trips:', filteredTrips);
  console.log('🚌 AdminTrips: Filters:', filters);
  console.log('🚌 AdminTrips: Search term:', searchTerm);

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'running': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'running': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Render function with error handling
  const renderContent = () => {
    try {
      return (
        <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bus className="w-8 h-8 text-blue-600" />
              Trip Management
            </h1>
            
            <div className="flex items-center gap-2">
              {['list', 'calendar'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.route}
              onChange={(e) => setFilters({ ...filters, route: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Routes</option>
              {(routes || []).map(route => (
                <option key={route._id} value={route._id}>
                  {route.routeNumber} - {route.routeName}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Action Buttons */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Trip
            </button>
            
            <button
              onClick={fetchAllData}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={async () => {
                try {
                  const response = await apiFetch('/api/admin/db-health');
                  console.log('Database Health Check:', response);
                  if (response.ok && response.data?.success) {
                    toast.success(`Database Status: ${response.data.data.status}\nConnected: ${response.data.data.database.connected}\nTrips: ${response.data.data.collections.trips}`);
                  } else {
                    toast.error('Database health check failed');
                  }
                } catch (error) {
                  console.error('Database health check error:', error);
                  toast.error('Database health check failed: ' + error.message);
                }
              }}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-2"
            >
              DB Health
            </button>
            
            <button
              onClick={async () => {
                try {
                  // Create a test trip
                  const testTrip = {
                    routeId: routes[0]?._id || routes[0]?.id,
                    busId: buses[0]?._id || buses[0]?.id,
                    driverId: drivers[0]?._id || drivers[0]?.id,
                    conductorId: conductors[0]?._id || conductors[0]?.id,
                    serviceDate: new Date().toISOString().split('T')[0],
                    startTime: '10:00',
                    endTime: '12:00',
                    status: 'scheduled'
                  };
                  
                  console.log('Creating test trip:', testTrip);
                  const createResponse = await apiFetch('/api/admin/trips', { 
                    method: 'POST', 
                    body: JSON.stringify(testTrip) 
                  });
                  
                  if (createResponse.ok && createResponse.data?.trip) {
                    const tripId = createResponse.data.trip._id;
                    console.log('Test trip created with ID:', tripId);
                    
                    // Wait a moment then delete it
                    setTimeout(async () => {
                      console.log('Deleting test trip:', tripId);
                      const deleteResponse = await apiFetch(`/api/admin/trips/${tripId}`, { method: 'DELETE' });
                      
                      if (deleteResponse.ok && deleteResponse.data?.success) {
                        toast.success('Test trip created and deleted successfully!');
                        await fetchTrips(); // Refresh the list
                      } else {
                        console.error('Test trip delete failed:', deleteResponse);
                        toast.error('Test trip created but delete failed: ' + (deleteResponse.data?.message || 'Unknown error'));
                      }
                    }, 1000);
                    
                    toast.success('Test trip created, testing delete...');
                  } else {
                    console.error('Test trip creation failed:', createResponse);
                    toast.error('Test trip creation failed: ' + (createResponse.data?.message || 'Unknown error'));
                  }
                } catch (error) {
                  console.error('Test trip error:', error);
                  toast.error('Test trip failed: ' + error.message);
                }
              }}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2"
            >
              Test Trip Delete
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Trips ({filteredTrips.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trip Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bus & Crew
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTrips.map((trip) => (
                    <motion.tr
                      key={trip._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {trip.tripId || trip._id}
                          </div>
                          <div className="text-sm text-gray-500">
                            Service Date: {new Date(trip.serviceDate).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Route className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {trip.routeId?.routeName || 'Unknown Route'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {trip.routeId?.routeNumber || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center text-sm">
                            <Bus className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="font-medium">{trip.busId?.busNumber || 'No Bus'}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="w-4 h-4 text-gray-400 mr-1" />
                            <span>{trip.driverId?.name || 'No Driver'}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-1" />
                            <span>{trip.startTime} - {trip.endTime}</span>
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            Duration: {trip.estimatedDuration || 'N/A'}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(trip.status)}
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(trip.status)}`}>
                            {trip.status}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTrip(trip);
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {trip.status === 'scheduled' && (
                            <button
                              onClick={() => handleTripStatusChange(trip._id, 'running')}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          
                          {trip.status === 'running' && (
                            <button
                              onClick={() => handleTripStatusChange(trip._id, 'completed')}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              <Square className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteTrip(trip._id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={loading ? 'Deleting...' : 'Delete trip'}
                          >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              
              {filteredTrips.length === 0 && (
                <div className="text-center py-12">
                  <Bus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No trips found</p>
                  <p className="text-gray-400">Create your first trip to get started</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Trip Modal */}
      {showAddModal && (
        <TripModal
          title="Add New Trip"
          trip={null}
          routes={routes}
          buses={buses}
          drivers={drivers}
          conductors={conductors}
          onClose={() => setShowAddModal(false)}
          onSave={handleCreateTrip}
        />
      )}

      {/* Edit Trip Modal */}
      {showEditModal && selectedTrip && !loading && (
        <TripModal
          title="Edit Trip"
          trip={selectedTrip}
          routes={routes}
          buses={buses}
          drivers={drivers}
          conductors={conductors}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTrip(null);
          }}
          onSave={handleUpdateTrip}
        />
      )}
    </div>
      );
    } catch (error) {
      console.error('🚌 AdminTrips: Render error:', error);
      setError(error);
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Render Error in Trip Management</div>
            <div className="text-gray-600 mb-4">{error.message}</div>
            <button 
              onClick={() => setError(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
  };

  return renderContent();
};

// Trip Modal Component
const TripModal = ({ title, trip, routes, buses, drivers, conductors, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    routeId: trip?.routeId?._id || '',
    busId: trip?.busId?._id || '',
    driverId: trip?.driverId?._id || '',
    conductorId: trip?.conductorId?._id || '',
    serviceDate: trip?.serviceDate ? trip.serviceDate.split('T')[0] : '',
    startTime: trip?.startTime || '',
    endTime: trip?.endTime || '',
    fare: trip?.fare || 0,
    status: trip?.status || 'scheduled',
    depotId: trip?.depotId?._id || '',
    notes: trip?.notes || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [localBuses, setLocalBuses] = useState(Array.isArray(buses) ? buses : []);
  
  // Ensure buses are loaded when modal opens
  useEffect(() => {
    console.log('🚌 TripModal: Modal opened with buses:', buses);
    if (Array.isArray(buses) && buses.length > 0) {
      setLocalBuses(buses);
    } else {
      console.log('🚌 TripModal: No buses provided, fetching directly...');
      // Fetch buses directly if not provided
      fetchBusesDirectly();
    }
  }, [buses]);

  // Direct bus fetching function
  const fetchBusesDirectly = async () => {
    try {
      console.log('🚌 TripModal: Fetching buses directly...');
      const response = await apiFetch('/api/admin/buses');
      if (response.ok) {
        const busesData = response.data?.data?.buses || response.data?.buses || response.data || [];
        const safeBusesData = Array.isArray(busesData) ? busesData : [];
        console.log('🚌 TripModal: Direct fetch got buses:', safeBusesData.length);
        setLocalBuses(safeBusesData);
      }
    } catch (error) {
      console.error('🚌 TripModal: Direct fetch error:', error);
      setLocalBuses([]); // Ensure we always have an array
    }
  };

  // Filter buses by selected route - use localBuses
  const availableBuses = Array.isArray(localBuses) ? localBuses.filter(bus => 
    bus && bus.status === 'active'
  ) : [];

  // Debug: Log bus data to see what we're working with
  console.log('🚌 TripModal: Buses data:', buses);
  console.log('🚌 TripModal: Local buses:', localBuses);
  console.log('🚌 TripModal: Available buses:', availableBuses);
  console.log('🚌 TripModal: First bus structure:', availableBuses[0]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.routeId) newErrors.routeId = 'Route is required';
    if (!formData.busId) newErrors.busId = 'Bus is required';
    if (!formData.serviceDate) newErrors.serviceDate = 'Service date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }
    if (formData.fare < 0) newErrors.fare = 'Fare cannot be negative';
    
    // Check if depotId will be available from selected bus
    const selectedBus = localBuses.find(bus => bus._id === formData.busId);
    if (!selectedBus?.depotId && !formData.depotId) {
      newErrors.busId = 'Selected bus must have a depot assigned';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      // Get depotId from selected bus
      const selectedBus = localBuses.find(bus => bus._id === formData.busId);
      const depotId = selectedBus?.depotId || formData.depotId;
      
      console.log('🚌 TripModal: Submitting trip with depotId:', depotId);
      console.log('🚌 TripModal: Selected bus:', selectedBus);
      
      await onSave({
        ...formData,
        depotId: depotId,
        fare: parseFloat(formData.fare) || 0
      });
    } catch (error) {
      console.error('Error saving trip:', error);
    } finally {
      setLoading(false);
    }
  };

  // Always show the form - don't wait for data loading
  const isDataLoaded = true;
  
  // Debug: Log bus loading status
  console.log('🚌 TripModal: Data loading status:', {
    busesLength: buses.length,
    localBusesLength: localBuses.length,
    isDataLoaded,
    buses: buses,
    localBuses: localBuses
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {!isDataLoaded ? (
          <div className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading buses...</p>
            <p className="text-sm text-gray-500 mt-2">Buses loaded: {Array.isArray(buses) ? buses.length : 'Not an array'}</p>
            <button 
              onClick={() => {
                console.log('🚌 TripModal: Force showing form');
                const safeBuses = Array.isArray(buses) ? buses : [];
                setLocalBuses(safeBuses);
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Show Form Anyway
            </button>
          </div>
        ) : (

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route *
              </label>
              <select
                value={formData.routeId}
                onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.routeId ? 'border-red-500' : 'border-gray-300'}`}
                required
              >
                <option value="">Select Route</option>
                {(routes || []).map(route => (
                  <option key={route._id} value={route._id}>
                    {route.routeNumber} - {route.routeName}
                  </option>
                ))}
              </select>
              {errors.routeId && <p className="text-red-500 text-xs mt-1">{errors.routeId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bus *
              </label>
              <select
                value={formData.busId}
                onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.busId ? 'border-red-500' : 'border-gray-300'}`}
                required
              >
                <option value="">
                  {availableBuses.length === 0 ? 'Loading buses...' : 'Select Bus'}
                </option>
                {availableBuses.map(bus => {
                  // Debug each bus
                  console.log('🚌 TripModal: Rendering bus:', bus);
                  
                  // Get bus display info with fallbacks
                  const busNumber = bus.busNumber || bus.registrationNumber || bus._id?.slice(-6) || 'Unknown';
                  const busType = bus.busType || 'Standard';
                  const conductor = bus.assignedConductor?.name || 'No Conductor';
                  const capacity = bus.capacity?.total || 'N/A';
                  
                  return (
                    <option key={bus._id} value={bus._id}>
                      {busNumber} - {busType} (Capacity: {capacity}, Conductor: {conductor})
                    </option>
                  );
                })}
              </select>
              {errors.busId && <p className="text-red-500 text-xs mt-1">{errors.busId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver
              </label>
              <select
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Driver</option>
                {(drivers || []).map(driver => (
                  <option key={driver._id} value={driver._id}>
                    {driver.name} ({driver.driverId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conductor
              </label>
              <select
                value={formData.conductorId}
                onChange={(e) => setFormData({ ...formData, conductorId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Conductor</option>
                {(conductors || []).map(conductor => (
                  <option key={conductor._id} value={conductor._id}>
                    {conductor.name} ({conductor.conductorId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Date *
              </label>
              <input
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.serviceDate ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.serviceDate && <p className="text-red-500 text-xs mt-1">{errors.serviceDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fare (₹)
              </label>
              <input
                type="number"
                value={formData.fare}
                onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startTime ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.endTime ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Additional notes about the trip..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Saving...' : trip ? 'Update Trip' : 'Create Trip'}</span>
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default AdminTrips;