import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bus, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Wrench, 
  Fuel, 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Download,
  Upload,
  Settings,
  Activity,
  Route,
  UserCheck,
  Gauge,
  Thermometer,
  Zap,
  Shield,
  FileText,
  Camera,
  Satellite,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminBuses = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [depotFilter, setDepotFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [depots, setDepots] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, map
  const [analytics, setAnalytics] = useState({
    totalBuses: 0,
    activeBuses: 0,
    maintenanceBuses: 0,
    retiredBuses: 0,
    averageUtilization: 0,
    fuelEfficiency: 0,
    maintenanceCost: 0
  });

  // Real-time data refresh
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [realTimeData, setRealTimeData] = useState({});

  useEffect(() => {
    fetchBuses();
    fetchDepots();
    fetchDrivers();
    fetchConductors();
    fetchAnalytics();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      fetchRealTimeData();
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/buses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBuses(data.buses || []);
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
      toast.error('Failed to fetch buses');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepots = async () => {
    try {
      const response = await fetch('/api/admin/depots', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepots(data.depots || []);
      }
    } catch (error) {
      console.error('Error fetching depots:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchConductors = async () => {
    try {
      const response = await fetch('/api/admin/conductors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConductors(data.conductors || []);
      }
    } catch (error) {
      console.error('Error fetching conductors:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/buses/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || {});
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchRealTimeData = async () => {
    try {
      const response = await fetch('/api/admin/buses/realtime', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRealTimeData(data.realTimeData || {});
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  };

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bus.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
    const matchesDepot = depotFilter === 'all' || bus.depotId === depotFilter;
    
    return matchesSearch && matchesStatus && matchesDepot;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'retired': return <XCircle className="w-4 h-4" />;
      case 'suspended': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getBusTypeIcon = (busType) => {
    switch (busType) {
      case 'ac_sleeper': return <Users className="w-4 h-4" />;
      case 'ac_seater': return <Users className="w-4 h-4" />;
      case 'volvo': return <Bus className="w-4 h-4" />;
      case 'mini': return <Bus className="w-4 h-4" />;
      default: return <Bus className="w-4 h-4" />;
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, change, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {change && (
            <div className={`flex items-center mt-2 text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${change < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(change)}% from last month
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const BusCard = ({ bus }) => {
    const realTimeInfo = realTimeData[bus._id] || {};
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all hover:scale-105">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getBusTypeIcon(bus.busType)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{bus.busNumber}</h3>
              <p className="text-sm text-gray-500">{bus.registrationNumber}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(bus.status)}`}>
            {getStatusIcon(bus.status)}
            <span className="capitalize">{bus.status}</span>
          </span>
        </div>

        {/* Bus Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{bus.capacity.total} seats</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{depots.find(d => d._id === bus.depotId)?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Fuel className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{bus.fuel?.currentLevel || 0}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{bus.specifications?.mileage || 0} km/l</span>
          </div>
        </div>

        {/* Real-time Status */}
        {realTimeInfo.location && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 font-medium">Current Location</span>
              <span className="text-blue-600">{realTimeInfo.location.speed || 0} km/h</span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {realTimeInfo.location.stopName || 'In Transit'}
            </div>
          </div>
        )}

        {/* Maintenance Status */}
        {bus.maintenance && (
          <div className="bg-yellow-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-700 font-medium">Next Service</span>
              <span className="text-yellow-600">
                {new Date(bus.maintenance.nextService).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setSelectedBus(bus);
                setShowEditModal(true);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Bus"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => {/* View details */}}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Updated {new Date(bus.updatedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const BusList = ({ bus }) => {
    const realTimeInfo = realTimeData[bus._id] || {};
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getBusTypeIcon(bus.busType)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{bus.busNumber}</h3>
              <p className="text-sm text-gray-500">{bus.registrationNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Capacity</p>
              <p className="font-medium">{bus.capacity.total}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Fuel</p>
              <p className="font-medium">{bus.fuel?.currentLevel || 0}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bus.status)}`}>
                {bus.status}
              </span>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                <Edit className="w-4 h-4" />
              </button>
              <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-3xl font-bold text-gray-900">Bus Management</h1>
          <p className="text-gray-600">Manage all buses in the fleet with real-time monitoring</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchBuses}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bus</span>
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Buses"
          value={analytics.totalBuses}
          icon={Bus}
          color="bg-blue-500"
          subtitle="Fleet size"
        />
        <StatCard
          title="Active Buses"
          value={analytics.activeBuses}
          icon={CheckCircle}
          color="bg-green-500"
          subtitle="In service"
        />
        <StatCard
          title="Maintenance"
          value={analytics.maintenanceBuses}
          icon={Wrench}
          color="bg-yellow-500"
          subtitle="Under repair"
        />
        <StatCard
          title="Utilization"
          value={`${analytics.averageUtilization}%`}
          icon={Activity}
          color="bg-purple-500"
          subtitle="Average capacity"
        />
      </div>

      {/* Advanced Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search buses by number or registration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
              <option value="suspended">Suspended</option>
            </select>
            
            <select
              value={depotFilter}
              onChange={(e) => setDepotFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Depots</option>
              {depots.map(depot => (
                <option key={depot._id} value={depot._id}>{depot.name}</option>
              ))}
            </select>
            
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
              >
                <Activity className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Status Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900 font-medium">Real-time Monitoring Active</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-blue-700">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>GPS Tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Fuel Monitoring</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Maintenance Alerts</span>
            </div>
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Buses Grid/List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Fleet Overview ({filteredBuses.length} buses)
          </h3>
          <div className="flex items-center space-x-3">
            <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
            <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {filteredBuses.length === 0 ? (
          <div className="text-center py-12">
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No buses found</p>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredBuses.map(bus => (
              viewMode === 'grid' ? (
                <BusCard key={bus._id} bus={bus} />
              ) : (
                <BusList key={bus._id} bus={bus} />
              )
            ))}
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
            <Route className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Route Assignment</h3>
          <p className="text-gray-600 text-sm mb-4">Assign buses to specific routes and schedules</p>
          <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center">
            Manage Routes <Plus className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-3 bg-yellow-100 rounded-lg w-fit mb-4">
            <Wrench className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Maintenance</h3>
          <p className="text-gray-600 text-sm mb-4">Schedule and track bus maintenance</p>
          <button className="text-yellow-600 hover:text-yellow-700 font-medium text-sm flex items-center">
            View Schedule <Calendar className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
            <UserCheck className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Staff Assignment</h3>
          <p className="text-gray-600 text-sm mb-4">Assign drivers and conductors to buses</p>
          <button className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center">
            Manage Staff <Users className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
          <p className="text-gray-600 text-sm mb-4">View detailed fleet performance reports</p>
          <button className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center">
            View Reports <BarChart3 className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Add/Edit Bus Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Bus</h3>
            <p className="text-gray-600 mb-4">Bus creation form will be implemented here</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Bus
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Bus: {selectedBus.busNumber}</h3>
            <p className="text-gray-600 mb-4">Bus editing form will be implemented here</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBuses;
