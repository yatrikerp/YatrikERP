import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, Users, AlertTriangle, CheckCircle, Clock, 
  Plus, Settings, BarChart3, Map, Wrench, 
  TrendingUp, Activity, Zap, Shield, Star,
  RefreshCw, Eye, Edit, Trash2, Play, Pause
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch, clearApiCache } from '../../utils/api';

const StreamlinedBusManagementDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [buses, setBuses] = useState([]);
  const [busesLoading, setBusesLoading] = useState(false);
  const [busesByDepot, setBusesByDepot] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    depot: 'all',
    viewMode: 'all' // 'all', 'byDepot', 'byStatus'
  });
  const [tripFormData, setTripFormData] = useState({
    routeId: '',
    depotId: '',
    busType: '',
    serviceDate: '',
    startTime: '',
    endTime: '',
    capacity: 0,
    notes: ''
  });
  const [routes, setRoutes] = useState([]);
  const [depots, setDepots] = useState([]);
  const [busTypes] = useState([
    { value: 'ordinary', label: 'Ordinary' },
    { value: 'fast_passenger', label: 'Fast Passenger' },
    { value: 'super_fast', label: 'Super Fast' },
    { value: 'super_deluxe', label: 'Super Deluxe' },
    { value: 'low_floor_ac', label: 'AC Low Floor' },
    { value: 'garuda_volvo', label: 'Luxury Volvo' },
    { value: 'venad', label: 'City Fast' },
    { value: 'deluxe_express', label: 'Express' },
    { value: 'garuda_king_long', label: 'Garuda King' },
    { value: 'rajadhani', label: 'Rajadhani' }
  ]);

  // Fetch buses with filters
  const fetchBuses = async () => {
    try {
      setBusesLoading(true);
      
      // Clear API cache to ensure fresh data
      clearApiCache();
      
      const queryParams = new URLSearchParams();
      
      // Set limit to fetch all buses (220 buses)
      queryParams.append('limit', '500');
      queryParams.append('page', '1');
      queryParams.append('_t', Date.now().toString()); // Cache busting
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.depot !== 'all') queryParams.append('depotId', filters.depot);
      
      const apiUrl = `/api/admin/buses?${queryParams.toString()}`;
      console.log('API URL:', apiUrl);
      
      const response = await apiFetch(apiUrl);
      console.log('API Response:', response);
      
      if (response.success) {
        const fetchedBuses = response.data.buses || [];
        setBuses(fetchedBuses);
        
        // Group buses by depot
        const groupedByDepot = {};
        fetchedBuses.forEach(bus => {
          const depotName = bus.depotId?.depotName || 'Unknown Depot';
          if (!groupedByDepot[depotName]) {
            groupedByDepot[depotName] = [];
          }
          groupedByDepot[depotName].push(bus);
        });
        setBusesByDepot(groupedByDepot);
        
        console.log('Fetched buses:', fetchedBuses.length);
        console.log('Depots with buses:', Object.keys(groupedByDepot));
        console.log('Sample buses:', fetchedBuses.slice(0, 5).map(bus => ({
          busNumber: bus.busNumber,
          depot: bus.depotId?.depotName || 'Unknown',
          status: bus.status
        })));
      } else {
        console.error('API Error:', response);
        toast.error('Failed to fetch buses');
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
      toast.error('Error fetching buses');
    } finally {
      setBusesLoading(false);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await apiFetch('/api/admin/dashboard/summary');
      if (response.success) {
        setDashboardData(response.data);
      } else {
        toast.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error fetching dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch routes and depots for trip form
  const fetchFormData = async () => {
    try {
      const [routesResponse, depotsResponse] = await Promise.all([
        apiFetch('/api/admin/routes'),
        apiFetch('/api/admin/depots')
      ]);

      if (routesResponse.success) {
        setRoutes(routesResponse.data.routes || []);
      }
      if (depotsResponse.success) {
        setDepots(depotsResponse.data.depots || []);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchFormData();
    fetchBuses();
  }, []);

  // Fetch buses when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBuses();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Create trip with automatic assignment
  const createTripWithAssignment = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/admin/trips/assign', {
        method: 'POST',
        body: JSON.stringify(tripFormData)
      });

      if (response.success) {
        toast.success('Trip created successfully with automatic assignment!');
        setShowTripForm(false);
        setTripFormData({
          routeId: '',
          depotId: '',
          busType: '',
          serviceDate: '',
          startTime: '',
          endTime: '',
          capacity: 0,
          notes: ''
        });
        fetchDashboardData(); // Refresh dashboard
      } else {
        if (response.requiresManualAssignment) {
          toast.error(response.message);
          // Show manual assignment options
          console.log('Available options:', response.availableOptions);
          console.log('Partial assignments:', response.partialAssignments);
        } else {
          toast.error(response.message);
        }
      }
    } catch (error) {
      console.error('Error creating trip:', error);
      toast.error('Error creating trip');
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      total: 'bg-blue-500',
      active: 'bg-green-500',
      idle: 'bg-yellow-500',
      assigned: 'bg-purple-500',
      maintenance: 'bg-orange-500',
      retired: 'bg-red-500',
      suspended: 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  // Get alert severity color
  const getAlertColor = (severity) => {
    return severity === 'critical' ? 'text-red-600' : 'text-yellow-600';
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Streamlined Bus Management</h1>
          <p className="text-gray-600 mt-1">Complete fleet and trip management system</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowTripForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Trip
          </button>
        </div>
      </div>

      {/* Fleet Summary Cards */}
      {dashboardData?.fleet && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bus className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.fleet.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.fleet.active || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Idle</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.fleet.idle || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Map className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.fleet.assigned || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Wrench className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.fleet.maintenance || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Retired</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.fleet.retired || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Pause className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.fleet.suspended || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bus Type Distribution */}
      {dashboardData?.busTypeDistribution && dashboardData.busTypeDistribution.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Bus Type Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {dashboardData.busTypeDistribution.map((type, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 capitalize">{type._id.replace('_', ' ')}</p>
                <p className="text-2xl font-bold text-gray-900">{type.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Depots */}
      {dashboardData?.depotDistribution && dashboardData.depotDistribution.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Map className="w-5 h-5 mr-2 text-green-600" />
            Top Depots by Bus Count
          </h3>
          <div className="space-y-3">
            {dashboardData.depotDistribution.map((depot, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{depot._id}</span>
                <span className="text-lg font-bold text-blue-600">{depot.count} buses</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Trips */}
      {dashboardData?.recentTrips && dashboardData.recentTrips.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-600" />
            Recent Trip Activity
          </h3>
          <div className="space-y-3">
            {dashboardData.recentTrips.map((trip, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {trip.routeId?.routeName} ({trip.routeId?.routeNumber})
                  </p>
                  <p className="text-sm text-gray-600">
                    Bus: {trip.busId?.busNumber} | Driver: {trip.driverId?.name} | Conductor: {trip.conductorId?.name}
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(trip.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crew Summary */}
      {dashboardData?.crew && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Driver Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.crew.drivers?.total || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Drivers</p>
                <p className="text-2xl font-bold text-green-600">{dashboardData.crew.drivers?.active || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-600" />
              Conductor Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Conductors</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.crew.conductors?.total || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Conductors</p>
                <p className="text-2xl font-bold text-green-600">{dashboardData.crew.conductors?.active || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Alerts */}
      {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Compliance Alerts
          </h3>
          <div className="space-y-4">
            {dashboardData.alerts.map((busAlert, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{busAlert.busNumber}</h4>
                  <span className="text-sm text-gray-500">Depot: {busAlert.depotId}</span>
                </div>
                <div className="space-y-2">
                  {busAlert.alerts.map((alert, alertIndex) => (
                    <div key={alertIndex} className="flex items-center">
                      <AlertTriangle className={`w-4 h-4 mr-2 ${getAlertColor(alert.severity)}`} />
                      <span className={`text-sm ${getAlertColor(alert.severity)}`}>
                        {alert.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bus List Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bus className="w-5 h-5 mr-2 text-blue-600" />
              Bus Fleet ({buses.length} buses)
            </h3>
            {Object.keys(busesByDepot).length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Showing buses from {Object.keys(busesByDepot).length} depots
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setFilters({ search: '', status: 'all', depot: 'all', viewMode: 'all' });
                clearApiCache();
                fetchBuses();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <Bus className="w-4 h-4 mr-2" />
              Show All Buses
            </button>
            <button
              onClick={() => {
                clearApiCache();
                fetchBuses();
              }}
              disabled={busesLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center"
            >
              <Zap className={`w-4 h-4 mr-2 ${busesLoading ? 'animate-spin' : ''}`} />
              Force Refresh
            </button>
            <button
              onClick={fetchBuses}
              disabled={busesLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${busesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Search buses..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="idle">Idle</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <select
              value={filters.depot}
              onChange={(e) => setFilters(prev => ({ ...prev, depot: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Depots</option>
              {depots.map(depot => (
                <option key={depot._id} value={depot._id}>
                  {depot.depotName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filters.viewMode}
              onChange={(e) => setFilters(prev => ({ ...prev, viewMode: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Buses View</option>
              <option value="byDepot">Group by Depot</option>
              <option value="byStatus">Group by Status</option>
            </select>
          </div>
          <div>
            <button
              onClick={() => setFilters({ search: '', status: 'all', depot: 'all', viewMode: 'all' })}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Depot Distribution Summary */}
        {Object.keys(busesByDepot).length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Bus Distribution Across Depots</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Object.entries(busesByDepot).map(([depotName, depotBuses]) => (
                <div key={depotName} className="text-center p-2 bg-white rounded border">
                  <div className="text-xs text-gray-600">{depotName}</div>
                  <div className="text-lg font-bold text-blue-600">{depotBuses.length}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bus Display - Conditional based on view mode */}
        {busesLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading buses...</span>
          </div>
        ) : buses.length > 0 ? (
          <>
            {filters.viewMode === 'byDepot' ? (
              /* Group by Depot View */
              <div className="space-y-6">
                {Object.entries(busesByDepot).map(([depotName, depotBuses]) => (
                  <div key={depotName} className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Map className="w-5 h-5 mr-2 text-blue-600" />
                        {depotName} ({depotBuses.length} buses)
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Number</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {depotBuses.map((bus) => (
                            <tr key={bus._id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Bus className="w-4 h-4 text-blue-600 mr-2" />
                                  <span className="text-sm font-medium text-gray-900">{bus.busNumber}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-900 capitalize">{bus.busType?.replace('_', ' ')}</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  bus.status === 'idle' ? 'bg-yellow-100 text-yellow-800' :
                                  bus.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                                  bus.status === 'maintenance' ? 'bg-orange-100 text-orange-800' :
                                  bus.status === 'retired' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {bus.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-900">{bus.capacity?.total || 0} seats</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button className="text-blue-600 hover:text-blue-900">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="text-green-600 hover:text-green-900">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button className="text-red-600 hover:text-red-900">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : filters.viewMode === 'byStatus' ? (
              /* Group by Status View */
              <div className="space-y-6">
                {Object.entries(
                  buses.reduce((acc, bus) => {
                    if (!acc[bus.status]) acc[bus.status] = [];
                    acc[bus.status].push(bus);
                    return acc;
                  }, {})
                ).map(([status, statusBuses]) => (
                  <div key={status} className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          status === 'idle' ? 'bg-yellow-500' :
                          status === 'assigned' ? 'bg-purple-500' :
                          status === 'maintenance' ? 'bg-orange-500' :
                          status === 'retired' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}></div>
                        {status.charAt(0).toUpperCase() + status.slice(1)} ({statusBuses.length} buses)
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Number</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depot</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {statusBuses.map((bus) => (
                            <tr key={bus._id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Bus className="w-4 h-4 text-blue-600 mr-2" />
                                  <span className="text-sm font-medium text-gray-900">{bus.busNumber}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-900 capitalize">{bus.busType?.replace('_', ' ')}</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-900">{bus.depotId?.depotName || 'Unknown'}</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-900">{bus.capacity?.total || 0} seats</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button className="text-blue-600 hover:text-blue-900">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="text-green-600 hover:text-green-900">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button className="text-red-600 hover:text-red-900">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* All Buses View */
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depot</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {buses.map((bus) => (
                      <tr key={bus._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Bus className="w-4 h-4 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{bus.busNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 capitalize">{bus.busType?.replace('_', ' ')}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{bus.depotId?.depotName || 'Unknown'}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            bus.status === 'idle' ? 'bg-yellow-100 text-yellow-800' :
                            bus.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                            bus.status === 'maintenance' ? 'bg-orange-100 text-orange-800' :
                            bus.status === 'retired' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {bus.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{bus.capacity?.total || 0} seats</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Bus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No buses found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Trip Creation Form Modal */}
      <AnimatePresence>
        {showTripForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create Trip with Automatic Assignment</h2>
                <button
                  onClick={() => setShowTripForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
                    <select
                      value={tripFormData.routeId}
                      onChange={(e) => setTripFormData(prev => ({ ...prev, routeId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Route</option>
                      {routes.map(route => (
                        <option key={route._id} value={route._id}>
                          {route.routeName} ({route.routeNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Depot</label>
                    <select
                      value={tripFormData.depotId}
                      onChange={(e) => setTripFormData(prev => ({ ...prev, depotId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Depot</option>
                      {depots.map(depot => (
                        <option key={depot._id} value={depot._id}>
                          {depot.depotName} ({depot.depotCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type</label>
                    <select
                      value={tripFormData.busType}
                      onChange={(e) => setTripFormData(prev => ({ ...prev, busType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Bus Type</option>
                      {busTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Date</label>
                    <input
                      type="date"
                      value={tripFormData.serviceDate}
                      onChange={(e) => setTripFormData(prev => ({ ...prev, serviceDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={tripFormData.startTime}
                      onChange={(e) => setTripFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={tripFormData.notes}
                    onChange={(e) => setTripFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowTripForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createTripWithAssignment}
                  disabled={loading || !tripFormData.routeId || !tripFormData.depotId || !tripFormData.busType}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Trip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StreamlinedBusManagementDashboard;
