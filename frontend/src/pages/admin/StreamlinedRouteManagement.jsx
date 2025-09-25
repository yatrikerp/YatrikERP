import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Route, Plus, Upload, Download, Search, Filter, 
  Edit, Trash2, Eye, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Settings, Zap, MapPin, Calendar, Clock,
  FileText, Save, X, ChevronDown, ChevronUp, Navigation,
  DollarSign, Users, Bus, Map
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const StreamlinedRouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [depots, setDepots] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [depotFilter, setDepotFilter] = useState('all');
  
  // Form states
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showSingleAddModal, setShowSingleAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showStopManager, setShowStopManager] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  // Bulk operations
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [bulkOperation, setBulkOperation] = useState('');
  
  // Route form data
  const [routeForm, setRouteForm] = useState({
    routeNumber: '',
    routeName: '',
    startingPoint: {
      city: '',
      location: '',
      coordinates: { lat: 0, lng: 0 }
    },
    endingPoint: {
      city: '',
      location: '',
      coordinates: { lat: 0, lng: 0 }
    },
    totalDistance: 0,
    estimatedDuration: 0,
    intermediateStops: [],
    depot: {
      depotId: '',
      name: ''
    },
    schedules: [],
    status: 'active',
    baseFare: 0,
    farePerKm: 0,
    features: [],
    notes: ''
  });

  // Bulk route form
  const [bulkForm, setBulkForm] = useState({
    depotId: '',
    routeType: 'intercity',
    count: 10,
    startNumber: 1,
    prefix: 'R',
    distanceRange: { min: 50, max: 200 },
    farePerKm: 2.5,
    features: ['AC']
  });

  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    departureTime: '',
    arrivalTime: '',
    frequency: 'daily',
    daysOfWeek: [],
    validFrom: '',
    validTo: '',
    busType: 'ac_sleeper'
  });

  // Stop management
  const [newStop, setNewStop] = useState({
    name: '',
    city: '',
    coordinates: { lat: 0, lng: 0 },
    sequence: 0,
    estimatedArrival: '',
    estimatedDeparture: '',
    distanceFromStart: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    let routesRes, depotsRes, stopsRes;
    
    try {
      [routesRes, depotsRes, stopsRes] = await Promise.all([
        apiFetch('/api/admin/routes'),
        apiFetch('/api/admin/depots'),
        apiFetch('/api/stops')
      ]);

      // Handle different API response structures
      const routesData = Array.isArray(routesRes.data) ? routesRes.data : 
                        routesRes.data?.data?.routes || routesRes.data?.routes || routesRes.routes || [];
      
      const depotsData = Array.isArray(depotsRes.data) ? depotsRes.data : 
                        depotsRes.data?.data?.depots || depotsRes.data?.depots || depotsRes.depots || [];
      
      const stopsData = Array.isArray(stopsRes.data) ? stopsRes.data : 
                       stopsRes.data?.data?.stops || stopsRes.data?.stops || stopsRes.stops || [];

      setRoutes(routesData);
      setDepots(depotsData);
      setStops(stopsData);
      
      console.log('📊 Data fetched:', {
        routes: routesData.length,
        depots: depotsData.length,
        stops: stopsData.length
      });
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      console.error('📋 Routes Response:', routesRes);
      console.error('📋 Depots Response:', depotsRes);
      console.error('📋 Stops Response:', stopsRes);
      toast.error(`Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleRouteAdd = async () => {
    try {
      setLoading(true);
      
      // Transform the form data to match backend API requirements
      const routeData = {
        routeNumber: routeForm.routeNumber,
        routeName: routeForm.routeName,
        startingPoint: routeForm.startingPoint,
        endingPoint: routeForm.endingPoint,
        intermediateStops: routeForm.intermediateStops || [],
        totalDistance: routeForm.totalDistance || 0,
        estimatedDuration: routeForm.estimatedDuration || 0,
        baseFare: routeForm.baseFare || 0,
        depotId: routeForm.depot.depotId, // Backend expects depotId directly
        status: routeForm.status || 'active',
        amenities: routeForm.features || [],
        schedules: routeForm.schedules || [],
        notes: routeForm.notes || ''
      };

      console.log('📝 Sending route data:', routeData);
      
      const response = await apiFetch('/api/admin/routes', {
        method: 'POST',
        body: JSON.stringify(routeData)
      });

      if (response.success) {
        toast.success('Route added successfully');
        setShowSingleAddModal(false);
        resetForm();
        fetchData();
      } else {
        toast.error(response.message || 'Failed to add route');
      }
    } catch (error) {
      console.error('❌ Error adding route:', error);
      toast.error(`Failed to add route: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRouteAdd = async () => {
    try {
      setLoading(true);
      const routesToAdd = [];
      
      // Generate common city pairs for Kerala
      const cityPairs = [
        ['Thiruvananthapuram', 'Kochi'],
        ['Kochi', 'Kozhikode'],
        ['Thiruvananthapuram', 'Kozhikode'],
        ['Kochi', 'Thrissur'],
        ['Thrissur', 'Kozhikode'],
        ['Kollam', 'Kochi'],
        ['Kannur', 'Kozhikode'],
        ['Palakkad', 'Kochi'],
        ['Kottayam', 'Kochi'],
        ['Alappuzha', 'Kochi']
      ];

      for (let i = 0; i < bulkForm.count; i++) {
        const routeNumber = `${bulkForm.prefix}${String(bulkForm.startNumber + i).padStart(3, '0')}`;
        const cityPair = cityPairs[i % cityPairs.length];
        const distance = Math.floor(Math.random() * (bulkForm.distanceRange.max - bulkForm.distanceRange.min + 1)) + bulkForm.distanceRange.min;
        
        routesToAdd.push({
          routeNumber,
          routeName: `${cityPair[0]} - ${cityPair[1]}`,
          startingPoint: {
            city: cityPair[0],
            location: `${cityPair[0]} Central`,
            coordinates: { lat: 8.5241 + Math.random() * 0.1, lng: 76.9366 + Math.random() * 0.1 }
          },
          endingPoint: {
            city: cityPair[1],
            location: `${cityPair[1]} Central`,
            coordinates: { lat: 10.8505 + Math.random() * 0.1, lng: 76.2711 + Math.random() * 0.1 }
          },
          totalDistance: distance,
          estimatedDuration: Math.floor(distance / 40 * 60), // Assuming 40 km/h average
          depotId: bulkForm.depotId, // Backend expects depotId directly
          baseFare: Math.floor(distance * bulkForm.farePerKm),
          amenities: bulkForm.features,
          status: 'active'
        });
      }

      // Add routes in batches
      const batchSize = 5;
      for (let i = 0; i < routesToAdd.length; i += batchSize) {
        const batch = routesToAdd.slice(i, i + batchSize);
        await Promise.all(batch.map(route => 
          apiFetch('/api/admin/routes', {
            method: 'POST',
            body: JSON.stringify(route)
          })
        ));
      }

      toast.success(`${bulkForm.count} routes added successfully`);
      setShowBulkAddModal(false);
      resetBulkForm();
      fetchData();
    } catch (error) {
      console.error('Error adding bulk routes:', error);
      toast.error('Failed to add routes');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteEdit = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/admin/routes/${selectedRoute._id}`, {
        method: 'PUT',
        body: JSON.stringify(routeForm)
      });

      if (response.success) {
        toast.success('Route updated successfully');
        setShowEditModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating route:', error);
      toast.error('Failed to update route');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAdd = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/admin/routes/${selectedRoute._id}/schedules`, {
        method: 'POST',
        body: JSON.stringify(scheduleForm)
      });

      if (response.success) {
        toast.success('Schedule added successfully');
        setShowScheduleModal(false);
        resetScheduleForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Failed to add schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkOperation = async () => {
    if (selectedRoutes.length === 0) {
      toast.error('Please select routes for bulk operation');
      return;
    }

    try {
      setLoading(true);
      
      switch (bulkOperation) {
        case 'activate':
          await Promise.all(selectedRoutes.map(routeId => 
            apiFetch(`/api/admin/routes/${routeId}`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'active' })
            })
          ));
          toast.success(`Activated ${selectedRoutes.length} routes`);
          break;
          
        case 'deactivate':
          await Promise.all(selectedRoutes.map(routeId => 
            apiFetch(`/api/admin/routes/${routeId}`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'inactive' })
            })
          ));
          toast.success(`Deactivated ${selectedRoutes.length} routes`);
          break;
          
        case 'update_fare':
          await Promise.all(selectedRoutes.map(routeId => 
            apiFetch(`/api/admin/routes/${routeId}`, {
              method: 'PUT',
              body: JSON.stringify({ 
                baseFare: bulkForm.baseFare,
                farePerKm: bulkForm.farePerKm 
              })
            })
          ));
          toast.success(`Updated fares for ${selectedRoutes.length} routes`);
          break;
      }
      
      setSelectedRoutes([]);
      setBulkOperation('');
      fetchData();
    } catch (error) {
      console.error('Error in bulk operation:', error);
      toast.error('Bulk operation failed');
    } finally {
      setLoading(false);
    }
  };

  const addStopToRoute = () => {
    if (!newStop.name || !newStop.city) {
      toast.error('Please fill in stop name and city');
      return;
    }

    setRouteForm(prev => ({
      ...prev,
      intermediateStops: [...prev.intermediateStops, {
        ...newStop,
        id: Date.now() // Temporary ID
      }]
    }));

    setNewStop({
      name: '',
      city: '',
      coordinates: { lat: 0, lng: 0 },
      sequence: routeForm.intermediateStops.length + 1,
      estimatedArrival: '',
      estimatedDeparture: '',
      distanceFromStart: 0
    });
  };

  const removeStopFromRoute = (stopId) => {
    setRouteForm(prev => ({
      ...prev,
      intermediateStops: prev.intermediateStops.filter(stop => stop.id !== stopId)
    }));
  };

  const resetForm = () => {
    setRouteForm({
      routeNumber: '',
      routeName: '',
      startingPoint: {
        city: '',
        location: '',
        coordinates: { lat: 0, lng: 0 }
      },
      endingPoint: {
        city: '',
        location: '',
        coordinates: { lat: 0, lng: 0 }
      },
      totalDistance: 0,
      estimatedDuration: 0,
      intermediateStops: [],
      depot: {
        depotId: '',
        name: ''
      },
      schedules: [],
      status: 'active',
      baseFare: 0,
      farePerKm: 0,
      features: [],
      notes: ''
    });
  };

  const resetBulkForm = () => {
    setBulkForm({
      depotId: '',
      routeType: 'intercity',
      count: 10,
      startNumber: 1,
      prefix: 'R',
      distanceRange: { min: 50, max: 200 },
      farePerKm: 2.5,
      features: ['AC']
    });
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      departureTime: '',
      arrivalTime: '',
      frequency: 'daily',
      daysOfWeek: [],
      validFrom: '',
      validTo: '',
      busType: 'ac_sleeper'
    });
  };

  const openEditModal = (route) => {
    setSelectedRoute(route);
    setRouteForm({
      ...route,
      depot: route.depot || { depotId: '', name: '' }
    });
    setShowEditModal(true);
  };

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.routeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.startingPoint?.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.endingPoint?.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
    const matchesDepot = depotFilter === 'all' || route.depot?.depotId === depotFilter;
    
    return matchesSearch && matchesStatus && matchesDepot;
  });

  const RouteCard = ({ route }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={selectedRoutes.includes(route._id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedRoutes([...selectedRoutes, route._id]);
              } else {
                setSelectedRoutes(selectedRoutes.filter(id => id !== route._id));
              }
            }}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <div className="p-2 bg-green-100 rounded-lg">
            <Route className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{route.routeNumber}</h3>
            <p className="text-sm text-gray-500">{route.routeName}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          route.status === 'active' ? 'bg-green-100 text-green-800' :
          route.status === 'inactive' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {route.status}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{route.startingPoint?.city} → {route.endingPoint?.city}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Navigation className="w-4 h-4" />
          <span>{route.totalDistance} km • {Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <DollarSign className="w-4 h-4" />
          <span>Base: ₹{route.baseFare} • Per km: ₹{route.farePerKm}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Bus className="w-4 h-4" />
          <span>{route.schedules?.length || 0} schedules • {route.intermediateStops?.length || 0} stops</span>
        </div>
      </div>

      {route.features && route.features.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {route.features.map((feature, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <button
            onClick={() => openEditModal(route)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Route"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedRoute(route);
              setShowScheduleModal(true);
            }}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Manage Schedules"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            onClick={() => {/* View details */}}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500">
          {route.depot?.name || 'No Depot'}
        </div>
      </div>
    </motion.div>
  );

  const SingleAddModal = () => (
    <AnimatePresence>
      {showSingleAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowSingleAddModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Add Single Route</h3>
                <button
                  onClick={() => setShowSingleAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Number *
                  </label>
                  <input
                    type="text"
                    value={routeForm.routeNumber}
                    onChange={(e) => setRouteForm(prev => ({ ...prev, routeNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="R001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Depot *
                  </label>
                  <select
                    value={routeForm.depot.depotId}
                    onChange={(e) => {
                      const selectedDepot = depots.find(d => d._id === e.target.value);
                      setRouteForm(prev => ({ 
                        ...prev, 
                        depot: { 
                          depotId: e.target.value, 
                          name: selectedDepot?.depotName || '' 
                        } 
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Depot</option>
                    {depots.map(depot => (
                      <option key={depot._id} value={depot._id}>{depot.depotName}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting City *
                  </label>
                  <input
                    type="text"
                    value={routeForm.startingPoint.city}
                    onChange={(e) => setRouteForm(prev => ({ 
                      ...prev, 
                      startingPoint: { ...prev.startingPoint, city: e.target.value } 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Thiruvananthapuram"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ending City *
                  </label>
                  <input
                    type="text"
                    value={routeForm.endingPoint.city}
                    onChange={(e) => setRouteForm(prev => ({ 
                      ...prev, 
                      endingPoint: { ...prev.endingPoint, city: e.target.value } 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Kochi"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    value={routeForm.totalDistance}
                    onChange={(e) => setRouteForm(prev => ({ ...prev, totalDistance: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="150"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Fare (₹)
                  </label>
                  <input
                    type="number"
                    value={routeForm.baseFare}
                    onChange={(e) => setRouteForm(prev => ({ ...prev, baseFare: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="300"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowSingleAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSingleRouteAdd}
                  disabled={loading || !routeForm.routeNumber || !routeForm.depot.depotId || !routeForm.startingPoint.city || !routeForm.endingPoint.city}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Add Route</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const BulkAddModal = () => (
    <AnimatePresence>
      {showBulkAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowBulkAddModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Bulk Add Routes</h3>
                <button
                  onClick={() => setShowBulkAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Depot *
                  </label>
                  <select
                    value={bulkForm.depotId}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, depotId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Depot</option>
                    {depots.map(depot => (
                      <option key={depot._id} value={depot._id}>{depot.depotName}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Type
                  </label>
                  <select
                    value={bulkForm.routeType}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, routeType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="intercity">Intercity</option>
                    <option value="intracity">Intracity</option>
                    <option value="express">Express</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Routes *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={bulkForm.count}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bulkForm.startNumber}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, startNumber: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Prefix
                  </label>
                  <input
                    type="text"
                    value={bulkForm.prefix}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, prefix: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="R"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fare per KM (₹)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={bulkForm.farePerKm}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, farePerKm: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Preview:</h4>
                <p className="text-blue-700 text-sm">
                  Will create routes: {bulkForm.prefix}{String(bulkForm.startNumber).padStart(3, '0')} to {bulkForm.prefix}{String(bulkForm.startNumber + bulkForm.count - 1).padStart(3, '0')}
                </p>
                <p className="text-blue-700 text-sm">
                  Type: {bulkForm.routeType}, Distance: {bulkForm.distanceRange.min}-{bulkForm.distanceRange.max}km, Fare: ₹{bulkForm.farePerKm}/km
                </p>
              </div>
              
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowBulkAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkRouteAdd}
                  disabled={loading || !bulkForm.depotId}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Add {bulkForm.count} Routes</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Streamlined Route Management</h1>
          <p className="text-gray-600">Efficient route planning with intelligent scheduling</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Data Status */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-sm font-medium text-gray-700">
                {loading ? 'Loading...' : 'Data Loaded'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Routes: {routes.length} | Depots: {depots.length} | Stops: {stops.length}
            </div>
          </div>
          <button
            onClick={fetchData}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Route className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Routes</p>
              <p className="text-2xl font-bold text-green-600">{routes.filter(r => r.status === 'active').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Schedules</p>
              <p className="text-2xl font-bold text-blue-600">{routes.reduce((acc, route) => acc + (route.schedules?.length || 0), 0)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stops</p>
              <p className="text-2xl font-bold text-purple-600">{routes.reduce((acc, route) => acc + (route.intermediateStops?.length || 0), 0)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          {selectedRoutes.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">{selectedRoutes.length} routes selected</span>
              <select
                value={bulkOperation}
                onChange={(e) => setBulkOperation(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Bulk Operation</option>
                <option value="activate">Activate Routes</option>
                <option value="deactivate">Deactivate Routes</option>
                <option value="update_fare">Update Fares</option>
              </select>
              <button
                onClick={handleBulkOperation}
                disabled={!bulkOperation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Execute
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowSingleAddModal(true)}
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-3"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-blue-900">Add Single Route</h4>
              <p className="text-sm text-blue-700">Add one route with detailed configuration</p>
            </div>
          </button>
          
          <button
            onClick={() => setShowBulkAddModal(true)}
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-3"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-green-900">Bulk Add Routes</h4>
              <p className="text-sm text-green-700">Add multiple routes with Kerala city pairs</p>
            </div>
          </button>
          
          <button
            onClick={() => {/* Export functionality */}}
            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex items-center space-x-3"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <Download className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-purple-900">Export Routes</h4>
              <p className="text-sm text-purple-700">Export route data for external use</p>
            </div>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Depot</label>
            <select
              value={depotFilter}
              onChange={(e) => setDepotFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Depots</option>
              {depots.map(depot => (
                <option key={depot._id} value={depot._id}>{depot.depotName}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDepotFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Route Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoutes.map(route => (
          <RouteCard key={route._id} route={route} />
        ))}
      </div>

      {filteredRoutes.length === 0 && (
        <div className="text-center py-12">
          <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No routes found</h3>
          <p className="text-gray-600">Try adjusting your search or add some routes.</p>
        </div>
      )}

      {/* Modals */}
      <BulkAddModal />
      <SingleAddModal />
    </div>
  );
};

export default StreamlinedRouteManagement;


