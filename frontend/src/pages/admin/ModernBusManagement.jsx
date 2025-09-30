import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, Plus, Search, Filter, MapPin, Wrench, Fuel, Users, 
  Calendar, AlertTriangle, CheckCircle, XCircle, Clock, 
  TrendingUp, BarChart3, Eye, Edit, Trash2, RefreshCw, 
  Download, Upload, Settings, Activity, Route, UserCheck,
  Gauge, Thermometer, Zap, Shield, FileText, Camera,
  Satellite, Wifi, Battery, Signal, Brain, Map, Navigation,
  BellRing, Smartphone, QrCode, Layers, Globe, Share2,
  ChevronRight, ArrowUpRight, ArrowDownRight, Loader2,
  MoreHorizontal, Type, Tags, UserPlus, UserX, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch, clearApiCache } from '../../utils/api';
import { handleError, handleSuccess, handleWarning, handleFormError, withFormErrorHandling } from '../../utils/errorHandler';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useNotifications } from '../../hooks/useNotifications';
import BusMap from '../../components/BusMap';
import BusAnalytics from '../../components/BusAnalytics';
import BusTimeline from '../../components/BusTimeline';
import QRScanner from '../../components/QRScanner';
import AIInsights from '../../components/AIInsights';
import EnhancedBusTypeManager from '../../components/Admin/EnhancedBusTypeManager.jsx';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(...registerables);

const ModernBusManagement = () => {
  // State Management
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    depot: 'all',
    busType: 'all',
    fuelType: 'all',
    page: 1,
    limit: 20,
    sortBy: 'busNumber',
    sortOrder: 'asc'
  });
  const [totalBuses, setTotalBuses] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [viewMode, setViewMode] = useState('dashboard'); // dashboard, grid, list, map, analytics
  const [selectedBus, setSelectedBus] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedBuses, setSelectedBuses] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [busToDelete, setBusToDelete] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [busForRouteAssignment, setBusForRouteAssignment] = useState(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [busForMaintenance, setBusForMaintenance] = useState(null);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [showMaintenanceHistory, setShowMaintenanceHistory] = useState(false);
  const [showEnhancedBusTypeManager, setShowEnhancedBusTypeManager] = useState(false);
  const [activeBusTypes, setActiveBusTypes] = useState([]);
  
  // Real-time and location hooks
  const { location, error: locationError } = useGeolocation();
  const { subscribe, sendNotification } = useNotifications();
  const ws = useWebSocket('http://localhost:5000');

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalBuses: 0,
    activeBuses: 0,
    maintenanceBuses: 0,
    fuelEfficiency: 0,
    utilizationRate: 0,
    predictiveMaintenance: [],
    routeOptimization: []
  });

  // Real-time tracking state
  const [liveTracking, setLiveTracking] = useState({});
  const [alerts, setAlerts] = useState([]);

  // AI Insights state
  const [aiInsights, setAiInsights] = useState({
    recommendations: [],
    predictions: [],
    anomalies: []
  });

  // WebSocket handlers
  useEffect(() => {
    if (ws) {
      ws.on('bus-update', (data) => {
        updateBusRealTime(data);
      });
      
      ws.on('alert', (alert) => {
        setAlerts(prev => [alert, ...prev].slice(0, 10));
        sendNotification(alert);
      });
      
      ws.on('tracking-update', (trackingData) => {
        setLiveTracking(prev => ({
          ...prev,
          [trackingData.busId]: trackingData
        }));
      });
    }
    
    return () => {
      if (ws) {
        ws.off('bus-update');
        ws.off('alert');
        ws.off('tracking-update');
      }
    };
  }, [ws]);

  // Fetch initial data
  useEffect(() => {
    // Set admin token for testing if not exists
    if (!localStorage.getItem('token')) {
      const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGFhYTI2NDU2YTdmMWFlMDJjMjMxNjYiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHlhdHJpay5jb20iLCJpYXQiOjE3NTcxNDA4NzMsImV4cCI6MTc1NzIyNzI3M30.QfXqzGItmAISrftw8SVvZYntvZ8npNJdz-AVyQBfCmo';
      localStorage.setItem('token', adminToken);
      localStorage.setItem('user', JSON.stringify({
        _id: '68aaa26456a7f1ae02c23166',
        name: 'Admin User',
        email: 'admin@yatrik.com',
        role: 'admin'
      }));
      console.log('✅ Admin token set for testing');
    }
    
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBuses(),
        fetchAnalytics(),
        fetchAIInsights(),
        fetchRoutes()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await apiFetch('/api/admin/routes');
      if (response.ok) {
        setRoutes(response.data?.routes || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchBuses = async () => {
    try {
      // Map frontend filter names to API parameter names
      const apiParams = {
        ...filters,
        depotId: filters.depot !== 'all' ? filters.depot : undefined,
        search: searchTerm
      };
      
      // Remove undefined values and 'all' values
      Object.keys(apiParams).forEach(key => {
        if (apiParams[key] === 'all' || apiParams[key] === undefined) {
          delete apiParams[key];
        }
      });
      
      const queryParams = new URLSearchParams(apiParams).toString();
      
      console.log('🔍 Fetching buses with params:', queryParams);
      console.log('🔍 Current filters:', filters);
      console.log('🔍 Search term:', searchTerm);
      console.log('🔍 API params object:', apiParams);
      
      const response = await apiFetch(`/api/admin/buses?${queryParams}`);
      
      console.log('📡 Buses API response:', response);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (response.ok) {
        const data = response.data || {};
        console.log('📦 Raw API data:', data);
        const normalizedBuses = normalizeData(data);
        console.log('🔄 Normalized buses:', normalizedBuses);
        console.log('🔄 Number of buses found:', normalizedBuses.length);
        setBuses(normalizedBuses);
        
        // Update pagination info
        if (data.pagination) {
          console.log('📄 Pagination info:', data.pagination);
          setPagination(data.pagination);
          setTotalBuses(data.pagination.total);
        } else {
          const count = Array.isArray(data.buses) ? data.buses.length : Array.isArray(data) ? data.length : 0;
          console.log('📄 Total buses count:', count);
          setTotalBuses(count);
        }
      } else {
        console.error('❌ API request failed:', response.message);
      }
    } catch (error) {
      console.error('❌ Error fetching buses:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await apiFetch('/api/admin/buses/analytics');
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchAIInsights = async () => {
    try {
      const data = await apiFetch('/api/admin/buses/ai-insights');
      setAiInsights(data);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    }
  };

  const normalizeData = (data) => {
    if (data?.data?.buses) return data.data.buses;
    if (data?.buses) return data.buses;
    if (Array.isArray(data)) return data;
    return [];
  };

  const updateBusRealTime = (busData) => {
    setBuses(prev => prev.map(bus => 
      bus._id === busData._id ? { ...bus, ...busData } : bus
    ));
  };

  // Filtered and searched buses
  const filteredBuses = useMemo(() => {
    if (!Array.isArray(buses)) return [];
    
    return buses.filter(bus => {
      if (!bus || typeof bus !== 'object') return false;
      
      const matchesSearch = (bus.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bus.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())) || false;
      const matchesStatus = filters.status === 'all' || bus.status === filters.status;
      const matchesDepot = filters.depot === 'all' || bus.depotId === filters.depot;
      const matchesBusType = filters.busType === 'all' || bus.busType === filters.busType;
      
      return matchesSearch && matchesStatus && matchesDepot && matchesBusType;
    });
  }, [buses, searchTerm, filters]);

  // Dashboard View
  const renderDashboard = () => (
    <div className="space-y-4">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Bus Fleet Management</h2>
            <p className="text-gray-600 mb-4">
              Monitor your fleet performance, track buses in real-time, and manage operations efficiently.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System Online</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Real-time Updates</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>AI Analytics Ready</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{analytics.totalBuses}</div>
              <div className="text-sm text-gray-500">Total Buses</div>
              <div className="text-lg font-semibold text-green-600">{analytics.activeBuses}</div>
              <div className="text-xs text-gray-500">Active Now</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Total Fleet"
          value={analytics.totalBuses}
          icon={<Bus className="w-4 h-4" />}
          trend={+5.2}
          color="blue"
        />
        <MetricCard
          title="Active Buses"
          value={analytics.activeBuses}
          icon={<Activity className="w-4 h-4" />}
          trend={+2.1}
          color="green"
        />
        <MetricCard
          title="Utilization Rate"
          value={`${analytics.utilizationRate}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          trend={+3.5}
          color="purple"
        />
        <MetricCard
          title="Fuel Efficiency"
          value={`${analytics.fuelEfficiency} km/l`}
          icon={<Fuel className="w-4 h-4" />}
          trend={-1.2}
          color="orange"
        />
      </div>

      {/* Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Buses */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bus className="w-4 h-4 text-blue-600" />
              Recent Buses
          </h3>
            <button
              onClick={() => setViewMode('grid')}
              className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-2">
            {filteredBuses.slice(0, 5).map((bus) => (
              <div key={bus._id} className="group bg-gray-50 rounded-lg p-3 hover:shadow-sm transition-all duration-200 border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500 rounded-lg text-white">
                      <Bus className="w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{bus.busNumber}</h4>
                      <p className="text-xs text-gray-500 font-mono">{bus.registrationNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      bus.status === 'active' ? 'bg-green-100 text-green-800' :
                      bus.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bus.status?.charAt(0).toUpperCase() + bus.status?.slice(1)}
                    </span>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setSelectedBus(bus)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleEdit(bus)}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="Edit Bus"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(bus)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Bus"
                      >
                        <Trash2 className="w-3 h-3" />
                    </button>
                    </div>
                  </div>
                </div>
                
                {/* Bus Details Grid */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div className="text-center">
                    <div className="p-1 bg-blue-50 rounded mb-0.5">
                      <Users className="w-3 h-3 text-blue-600 mx-auto" />
                    </div>
                    <p className="text-xs text-gray-500">Cap</p>
                    <p className="text-xs font-bold text-gray-900">{bus.capacity?.total || 0}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="p-1 bg-green-50 rounded mb-0.5">
                      <Fuel className="w-3 h-3 text-green-600 mx-auto" />
                    </div>
                    <p className="text-xs text-gray-500">Fuel</p>
                    <p className="text-xs font-bold text-gray-900">{bus.fuel?.currentLevel || 0}%</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="p-1 bg-purple-50 rounded mb-0.5">
                      <MapPin className="w-3 h-3 text-purple-600 mx-auto" />
                    </div>
                    <p className="text-xs text-gray-500">Depot</p>
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {bus.depotName || 'Unknown'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="p-1 bg-orange-50 rounded mb-0.5">
                      <Calendar className="w-3 h-3 text-orange-600 mx-auto" />
                    </div>
                    <p className="text-xs text-gray-500">Service</p>
                    <p className="text-xs font-medium text-gray-900">
                      {bus.lastMaintenance ? 
                        new Date(bus.lastMaintenance).toLocaleDateString() : 
                        'Never'
                      }
                    </p>
                  </div>
                </div>
                
                {/* Staff Assignment */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <UserCheck className="w-3 h-3 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Driver</p>
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {bus.assignedDriver?.name || 'Not Assigned'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
                    <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Conductor</p>
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {bus.assignedConductor?.name || 'Not Assigned'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredBuses.length === 0 && (
              <div className="text-center py-8">
                <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3">
                  <Bus className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No buses found</h3>
                <p className="text-xs text-gray-500 mb-3">Get started by adding your first bus</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  Add First Bus
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bus Types Section - Always Visible */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-sm p-4 border-2 border-indigo-200 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2 mb-1">
                <Type className="w-5 h-5 text-indigo-600" />
                KSRTC Bus Types Management
              </h3>
              <p className="text-sm text-indigo-700">Manage all 17 official KSRTC bus types and scheduling rules</p>
            </div>
            <button
              onClick={() => {
                alert('Bus Types button clicked! Opening Enhanced Bus Type Manager...');
                console.log('🚌 KSRTC Bus Types button clicked!');
                setShowEnhancedBusTypeManager(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-3 text-base font-medium transform hover:scale-105"
            >
              <Type className="w-5 h-5" />
              Manage Bus Types
              <div className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                NEW
              </div>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-600" />
              Quick Actions
            </h3>
            
            {/* Standalone Bus Types Button - Always Visible */}
            <button
              onClick={() => {
                console.log('🚌 Standalone Bus Types button clicked!');
                setShowEnhancedBusTypeManager(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 text-sm font-medium"
            >
              <Type className="w-4 h-4" />
              Bus Types
              <div className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                !
              </div>
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            {/* Bus Types Button - Most Important */}
            <button
              onClick={() => {
                console.log('🚌 Bus Types button clicked!');
                setShowEnhancedBusTypeManager(true);
              }}
              className="group p-4 bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-lg text-center transition-all duration-200 border-2 border-indigo-200 hover:border-indigo-300 shadow-sm hover:shadow-lg transform hover:scale-105 relative"
            >
              {/* New Badge */}
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                NEW
              </div>
              
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg w-fit mx-auto mb-3">
                <Type className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-bold text-indigo-900 mb-1">Bus Types</p>
              <p className="text-xs text-indigo-700">Add & manage types</p>
            </button>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="group p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors border border-blue-200"
            >
              <div className="p-2 bg-blue-500 rounded-lg w-fit mx-auto mb-2">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-bold text-blue-900 mb-0.5">Add Bus</p>
              <p className="text-xs text-blue-700">Register new bus</p>
            </button>
            
            <button
              onClick={() => setViewMode('map')}
              className="group p-3 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors border border-green-200"
            >
              <div className="p-2 bg-green-500 rounded-lg w-fit mx-auto mb-2">
                <Map className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-bold text-green-900 mb-0.5">Live Map</p>
              <p className="text-xs text-green-700">Track buses</p>
            </button>
            
            <button
              onClick={() => setViewMode('analytics')}
              className="group p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors border border-purple-200"
            >
              <div className="p-2 bg-purple-500 rounded-lg w-fit mx-auto mb-2">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-bold text-purple-900 mb-0.5">Analytics</p>
              <p className="text-xs text-purple-700">View insights</p>
            </button>
            
            <button
              onClick={() => setViewMode('grid')}
              className="group p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors border border-orange-200"
            >
              <div className="p-2 bg-orange-500 rounded-lg w-fit mx-auto mb-2">
                <Bus className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-bold text-orange-900 mb-0.5">All Buses</p>
              <p className="text-xs text-orange-700">Manage fleet</p>
            </button>
          </div>
          
          {/* Additional Actions */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Bulk Operations</h4>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setShowBulkActions(true)}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded text-center transition-colors border border-gray-200"
              >
                <Users className="w-3 h-3 text-gray-600 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">Assign</p>
              </button>
              <button
                onClick={() => setShowBulkActions(true)}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded text-center transition-colors border border-gray-200"
              >
                <Wrench className="w-3 h-3 text-gray-600 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">Service</p>
              </button>
              <button
                onClick={() => setShowBulkActions(true)}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded text-center transition-colors border border-gray-200"
              >
                <Download className="w-3 h-3 text-gray-600 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">Export</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Help & Tips */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          Quick Help & Tips
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <h4 className="font-semibold text-blue-900">Add New Bus</h4>
            </div>
            <p className="text-sm text-blue-800 mb-3">
              Click "Add Bus" to register a new vehicle in your fleet with complete details.
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Add Bus Now
            </button>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <h4 className="font-semibold text-green-900">Track Live Location</h4>
            </div>
            <p className="text-sm text-green-800 mb-3">
              Switch to Map view to see real-time bus locations and routes.
            </p>
            <button 
              onClick={() => setViewMode('map')}
              className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
            >
              View Map
            </button>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <h4 className="font-semibold text-purple-900">View Analytics</h4>
            </div>
            <p className="text-sm text-purple-800 mb-3">
              Check performance metrics and insights in the Analytics view.
            </p>
            <button 
              onClick={() => setViewMode('analytics')}
              className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors"
            >
              View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          AI Insights & Recommendations
        </h3>
        <AIInsights insights={aiInsights} />
      </div>

      {/* Real-time Alerts */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BellRing className="w-5 h-5" /> Real-time Alerts
        </h3>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <AlertItem key={index} alert={alert} />
          ))}
        </div>
      </div>

      {/* Performance Charts and Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Fleet Performance</h3>
          <BusAnalytics data={analytics} />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Maintenance</h3>
          <BusTimeline buses={buses.filter(b => b.nextMaintenance)} />
        </div>
      </div>
    </div>
  );

  // Grid View
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence>
        {filteredBuses.map((bus) => (
          <motion.div
            key={bus._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <BusCard 
              bus={bus} 
              liveData={liveTracking[bus._id]}
              onEdit={() => handleEdit(bus)}
              onDelete={() => handleDelete(bus)}
              onView={() => setSelectedBus(bus)}
              onSelect={() => handleBulkSelect(bus._id)}
              isSelected={selectedBuses.includes(bus._id)}
              onAssignRoute={() => handleRouteAssignment(bus)}
              onRemoveRoute={() => removeRouteAssignment(bus)}
              onScheduleMaintenance={() => handleMaintenanceSchedule(bus)}
              onCompleteMaintenance={() => completeMaintenanceHandler(bus)}
              onViewMaintenance={() => fetchMaintenanceHistory(bus._id)}
              onAssignStaff={() => handleStaffAssignment(bus._id)}
              onUnassignStaff={() => handleStaffUnassignment(bus._id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  // Map View
  const renderMapView = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 h-[calc(100vh-250px)]">
      <LiveTracking 
        buses={filteredBuses} 
        tracking={liveTracking}
        selectedBus={selectedBus}
        onBusSelect={setSelectedBus}
        routes={routes}
      />
    </div>
  );

  // Analytics View
  const renderAnalyticsView = () => (
    <BusAnalytics 
      buses={buses}
      analytics={analytics}
      onExport={handleExportReport}
    />
  );

  const handleEdit = (bus) => {
    setSelectedBus(bus);
    setShowEditModal(true);
  };

  const handleEditBus = withFormErrorHandling(async (busData) => {
    const response = await apiFetch(`/api/admin/buses/${selectedBus._id}`, {
      method: 'PUT',
      body: JSON.stringify(busData)
    });
    
    if (response.ok) {
      clearApiCache(); // Clear API cache to get fresh data
      setShowEditModal(false);
      setSelectedBus(null);
      fetchAllData(); // Refresh all data
      return response;
    } else {
      throw new Error(response.message || 'Failed to update bus');
    }
  });

  const handleDelete = (bus) => {
    setBusToDelete(bus);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!busToDelete) return;
    
    try {
      const response = await apiFetch(`/api/admin/buses/${busToDelete._id}`, { method: 'DELETE' });
      if (response.ok) {
        clearApiCache(); // Clear API cache to get fresh data
        handleSuccess('Bus deleted successfully');
        setShowDeleteModal(false);
        setBusToDelete(null);
        fetchAllData(); // Refresh all data
      } else {
        throw new Error(response.message || 'Failed to delete bus');
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleBulkSelect = (busId) => {
    setSelectedBuses(prev => {
      if (prev.includes(busId)) {
        return prev.filter(id => id !== busId);
      } else {
        return [...prev, busId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedBuses.length === filteredBuses.length) {
      setSelectedBuses([]);
    } else {
      setSelectedBuses(filteredBuses.map(bus => bus._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBuses.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedBuses.length} buses?`)) return;
    
    try {
      const results = await Promise.allSettled(
        selectedBuses.map(busId => 
          apiFetch(`/api/admin/buses/${busId}`, { method: 'DELETE' })
        )
      );
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failed = results.length - successful;
      
      if (successful > 0) {
        handleSuccess(`${successful} buses deleted successfully`);
      }
      if (failed > 0) {
        handleWarning(`${failed} buses failed to delete`);
      }
      
      setSelectedBuses([]);
      clearApiCache(); // Clear API cache to get fresh data
      fetchAllData(); // Refresh all data
    } catch (error) {
      handleError(error);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedBuses.length === 0) return;
    
    try {
      const results = await Promise.allSettled(
        selectedBuses.map(busId => 
          apiFetch(`/api/admin/buses/${busId}`, { 
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
          })
        )
      );
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failed = results.length - successful;
      
      if (successful > 0) {
        handleSuccess(`${successful} buses status updated to ${newStatus}`);
      }
      if (failed > 0) {
        handleWarning(`${failed} buses failed to update status`);
      }
      
      setSelectedBuses([]);
      clearApiCache(); // Clear API cache to get fresh data
      fetchAllData(); // Refresh all data
    } catch (error) {
      handleError(error);
    }
  };

  const handleRouteAssignment = (bus) => {
    setBusForRouteAssignment(bus);
    setSelectedRoute(bus.assignedRoute?._id || '');
    setShowRouteModal(true);
  };

  const confirmRouteAssignment = async () => {
    if (!busForRouteAssignment || !selectedRoute) return;
    
    try {
      await apiFetch(`/api/admin/buses/${busForRouteAssignment._id}`, {
        method: 'PUT',
        body: JSON.stringify({ assignedRoute: selectedRoute })
      });
      
      toast.success('Bus assigned to route successfully');
      setShowRouteModal(false);
      setBusForRouteAssignment(null);
      setSelectedRoute('');
      clearApiCache(); // Clear API cache to get fresh data
      fetchAllData(); // Refresh all data
    } catch (error) {
      toast.error('Failed to assign bus to route');
    }
  };

  const removeRouteAssignment = async (bus) => {
    try {
      await apiFetch(`/api/admin/buses/${bus._id}`, {
        method: 'PUT',
        body: JSON.stringify({ assignedRoute: null })
      });
      
      toast.success('Bus unassigned from route');
      clearApiCache(); // Clear API cache to get fresh data
      fetchAllData(); // Refresh all data
    } catch (error) {
      toast.error('Failed to unassign bus from route');
    }
  };

  // Staff Assignment Handlers
  const handleStaffAssignment = async (busId) => {
    try {
      // Find the bus to get its depot
      const bus = buses.find(b => b._id === busId);
      if (!bus || !bus.depotId) {
        toast.error('Bus depot not found');
        return;
      }

      const depotId = bus.depotId._id || bus.depotId;
      const response = await apiFetch(`/api/staff/auto-assign/${depotId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ busIds: [busId], forceReassign: false })
      });

      if (response.success) {
        toast.success('Staff assigned successfully');
        clearApiCache();
        fetchAllData();
      } else {
        toast.error('Failed to assign staff');
      }
    } catch (error) {
      toast.error('Failed to assign staff');
    }
  };

  const handleStaffUnassignment = async (busId) => {
    try {
      const response = await apiFetch(`/api/staff/unassign/${busId}`, {
        method: 'POST'
      });

      if (response.success) {
        toast.success('Staff unassigned successfully');
        clearApiCache();
        fetchAllData();
      } else {
        toast.error('Failed to unassign staff');
      }
    } catch (error) {
      toast.error('Failed to unassign staff');
    }
  };

  const handleMaintenanceSchedule = (bus) => {
    setBusForMaintenance(bus);
    setShowMaintenanceModal(true);
  };

  const scheduleMaintenanceHandler = async (maintenanceData) => {
    try {
      // Create maintenance log
      await apiFetch('/api/admin/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          ...maintenanceData,
          busId: busForMaintenance._id
        })
      });

      // Update bus status to maintenance
      await apiFetch(`/api/admin/buses/${busForMaintenance._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'maintenance' })
      });

      toast.success('Maintenance scheduled successfully');
      setShowMaintenanceModal(false);
      setBusForMaintenance(null);
      clearApiCache(); // Clear API cache to get fresh data
      fetchAllData();
    } catch (error) {
      toast.error('Failed to schedule maintenance');
    }
  };

  const fetchMaintenanceHistory = async (busId) => {
    try {
      const response = await apiFetch(`/api/admin/buses/${busId}/maintenance`);
      if (response.ok) {
        setMaintenanceLogs(response.data || []);
        setShowMaintenanceHistory(true);
      }
    } catch (error) {
      toast.error('Failed to fetch maintenance history');
    }
  };

  const completeMaintenanceHandler = async (bus) => {
    try {
      await apiFetch(`/api/admin/buses/${bus._id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status: 'active',
          lastMaintenance: new Date().toISOString()
        })
      });

      toast.success('Maintenance completed');
      clearApiCache(); // Clear API cache to get fresh data
      fetchAllData();
    } catch (error) {
      toast.error('Failed to complete maintenance');
    }
  };

  const handleExportReport = async (reportType) => {
    try {
      const response = await apiFetch(`/api/admin/buses/export/${reportType}`);
      if (response.ok) {
        // Create download link
        const blob = new Blob([response.data], { 
          type: reportType === 'pdf' ? 'application/pdf' : 'application/vnd.ms-excel' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bus-report-${new Date().toISOString().split('T')[0]}.${reportType}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(`${reportType.toUpperCase()} report exported successfully`);
      }
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handleQRScan = (data) => {
    console.log('QR Code scanned:', data);
    // Process QR code data
  };

  const handleAddBus = withFormErrorHandling(async (busData) => {
    console.log('🚌 Adding bus with data:', busData);
    const response = await apiFetch('/api/admin/buses', {
      method: 'POST',
      body: JSON.stringify(busData)
    });
    
    console.log('📡 Add bus response:', response);
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    if (response.ok) {
      console.log('✅ Bus added successfully, clearing cache and refreshing data...');
      clearApiCache(); // Clear API cache to get fresh data
      console.log('🗑️ Cache cleared');
      setShowAddModal(false);
      console.log('🔄 Starting data refresh...');
      await fetchAllData(); // Refresh all data
      console.log('✅ Data refresh completed');
      return response;
    } else {
      console.error('❌ Bus creation failed:', response.message);
      throw new Error(response.message || 'Failed to add bus');
    }
  });

  // Chart data generators
  const getUtilizationChartData = () => ({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Utilization %',
      data: [85, 88, 82, 90, 87, 75, 70],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4
    }]
  });

  const getFuelChartData = () => ({
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Fuel Consumption (L)',
      data: [3200, 3100, 3300, 3150],
      backgroundColor: 'rgba(255, 206, 86, 0.8)'
    }]
  });

  const getMaintenanceChartData = () => ({
    labels: ['Scheduled', 'Completed', 'Overdue', 'In Progress'],
    datasets: [{
      data: [12, 8, 3, 2],
      backgroundColor: [
        'rgba(75, 192, 192, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 206, 86, 0.8)'
      ]
    }]
  });

  const getPerformanceChartData = () => ({
    labels: ['Speed', 'Fuel Efficiency', 'Punctuality', 'Safety', 'Comfort'],
    datasets: [{
      label: 'Current',
      data: [85, 78, 92, 95, 88],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
    }, {
      label: 'Target',
      data: [90, 85, 95, 98, 90],
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
    }]
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    }
  };

  return (
    <div className="space-y-6">
        {/* TEST BUS TYPES BUTTON - ALWAYS VISIBLE */}
        <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-center">
          <button
            onClick={() => {
              alert('TEST: Bus Types button clicked!');
              console.log('TEST: Bus Types button clicked!');
              setShowEnhancedBusTypeManager(true);
            }}
            className="px-8 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 text-lg font-bold"
          >
            🚌 TEST: BUS TYPES BUTTON - CLICK ME!
          </button>
        </div>

        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Bus Fleet Management</h1>
              <p className="text-gray-600">Manage your entire bus fleet with real-time tracking and analytics</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Current View</div>
              <div className="text-lg font-semibold text-blue-600 capitalize">
                {viewMode === 'dashboard' && '📊 Dashboard Overview'}
                {viewMode === 'grid' && '📋 Bus List View'}
                {viewMode === 'map' && '🗺️ Live Tracking Map'}
                {viewMode === 'analytics' && '📈 Performance Analytics'}
              </div>
            </div>
          </div>
          
      {/* View Mode Selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Switch View:</span>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              {[
                { 
                  key: 'dashboard', 
                  label: 'Dashboard', 
                  icon: '📊',
                  description: 'Overview & Quick Actions'
                },
                { 
                  key: 'grid', 
                  label: 'Grid', 
                  icon: '📋',
                  description: 'Detailed Bus List'
                },
                { 
                  key: 'map', 
                  label: 'Map', 
                  icon: '🗺️',
                  description: 'Live Bus Tracking'
                },
                { 
                  key: 'analytics', 
                  label: 'Analytics', 
                  icon: '📈',
                  description: 'Performance Insights'
                }
              ].map((mode) => (
          <button
                  key={mode.key}
                  onClick={() => setViewMode(mode.key)}
                  className={`group flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    viewMode === mode.key
                      ? 'bg-white text-blue-600 shadow-md border border-blue-200 transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                  }`}
                  title={mode.description}
                >
                  <span className="text-lg">{mode.icon}</span>
                  <span className="text-sm font-semibold">{mode.label}</span>
                  {viewMode === mode.key && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
          </button>
        ))}
            </div>
          </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Select All */}
            {viewMode === 'grid' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedBuses.length === filteredBuses.length && filteredBuses.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            )}

            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search buses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
              <option value="retired">Retired</option>
            </select>

            <select
              value={filters.busType}
              onChange={(e) => setFilters({ ...filters, busType: e.target.value, page: 1 })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="ac_sleeper">AC Sleeper (35 seats)</option>
              <option value="ac_seater">AC Seater (45 seats)</option>
              <option value="non_ac_sleeper">Non-AC Sleeper (40 seats)</option>
              <option value="non_ac_seater">Non-AC Seater (50 seats)</option>
              <option value="volvo">Volvo Multi-Axle (30 seats)</option>
              <option value="mini">Mini Bus (25 seats)</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value, page: 1 })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="busNumber">Bus Number</option>
              <option value="status">Status</option>
              <option value="busType">Type</option>
              <option value="createdAt">Created Date</option>
            </select>

            <button
              onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc', page: 1 })}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-1"
            >
              <Filter className="w-4 h-4" />
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </button>

            {/* Bulk Actions */}
            {selectedBuses.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border">
                <span className="text-sm text-blue-700 font-medium">
                  {selectedBuses.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusChange(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="">Change Status</option>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                  <option value="retired">Retired</option>
                </select>
                <button
                  onClick={() => setSelectedBuses([])}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Bus
            </button>
            
            <button
              onClick={() => setShowQRScanner(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              Scan QR
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
                console.log('🧪 Testing API without filters...');
                const response = await apiFetch('/api/admin/buses');
                console.log('🧪 Test API response:', response);
                if (response.ok) {
                  console.log('🧪 Test buses data:', response.data);
                }
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
            >
              🧪 Test API
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-6">
            {viewMode === 'dashboard' && <DashboardSkeleton />}
            {viewMode === 'grid' && <GridSkeleton />}
            {viewMode === 'map' && <MapSkeleton />}
            {viewMode === 'analytics' && <AnalyticsSkeleton />}
          </div>
        ) : (
          <>
            {viewMode === 'dashboard' && renderDashboard()}
            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'map' && renderMapView()}
            {viewMode === 'analytics' && renderAnalyticsView()}
          </>
        )}

        {/* Pagination */}
        {viewMode === 'grid' && pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-8 p-4 bg-white rounded-lg shadow">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} buses
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilters({ ...filters, page: Math.max(1, pagination.page - 1) })}
                disabled={pagination.page <= 1}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setFilters({ ...filters, page: pageNum })}
                      className={`px-3 py-2 rounded-lg ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {pagination.pages > 5 && (
                  <>
                    {pagination.pages > 6 && <span className="px-2">...</span>}
                    <button
                      onClick={() => setFilters({ ...filters, page: pagination.pages })}
                      className={`px-3 py-2 rounded-lg ${
                        pagination.page === pagination.pages
                          ? 'bg-blue-600 text-white'
                          : 'border hover:bg-gray-50'
                      }`}
                    >
                      {pagination.pages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setFilters({ ...filters, page: Math.min(pagination.pages, pagination.page + 1) })}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddBusModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddBus}
        />
      )}

      {showEditModal && selectedBus && (
        <EditBusModal
          bus={selectedBus}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBus(null);
          }}
          onSave={handleEditBus}
        />
      )}
      
      {showDeleteModal && busToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete bus <strong>{busToDelete.busNumber}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBusToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete Bus
              </button>
            </div>
          </div>
        </div>
      )}

      {showRouteModal && busForRouteAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <Route className="w-6 h-6 text-blue-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Assign Route</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Select a route for bus <strong>{busForRouteAssignment.busNumber}</strong>
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Routes
              </label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a route</option>
                {routes.map(route => (
                  <option key={route._id} value={route._id}>
                    {route.routeNumber} - {route.routeName} 
                    ({route.startingPoint?.city || route.startingPoint} to {route.endingPoint?.city || route.endingPoint})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRouteModal(false);
                  setBusForRouteAssignment(null);
                  setSelectedRoute('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmRouteAssignment}
                disabled={!selectedRoute}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Route
              </button>
            </div>
          </div>
        </div>
      )}

      {showMaintenanceModal && busForMaintenance && (
        <MaintenanceModal
          bus={busForMaintenance}
          onClose={() => {
            setShowMaintenanceModal(false);
            setBusForMaintenance(null);
          }}
          onSave={scheduleMaintenanceHandler}
        />
      )}

      {showMaintenanceHistory && (
        <MaintenanceHistoryModal
          logs={maintenanceLogs}
          onClose={() => {
            setShowMaintenanceHistory(false);
            setMaintenanceLogs([]);
          }}
        />
      )}

      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Bus Type Manager Modal */}
      {/* Enhanced Bus Type Manager Modal */}
      <EnhancedBusTypeManager 
        isOpen={showEnhancedBusTypeManager}
        onClose={() => setShowEnhancedBusTypeManager(false)}
        onSave={(busTypes) => {
          console.log('Enhanced bus types saved:', busTypes);
          setShowEnhancedBusTypeManager(false);
        }}
        onScheduleUpdate={(activeTypes) => {
          setActiveBusTypes(activeTypes);
          console.log('Scheduling updated with active bus types:', activeTypes);
          toast.success('Bus type scheduling rules updated successfully');
        }}
      />
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, icon, trend, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <div className="flex items-center mt-2">
            {trend > 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(trend)}%
            </span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

// Bus Card Component
const BusCard = ({ bus, liveData, onEdit, onDelete, onView, onSelect, isSelected, onAssignRoute, onRemoveRoute, onScheduleMaintenance, onCompleteMaintenance, onViewMaintenance, onAssignStaff, onUnassignStaff }) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-red-100 text-red-800'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${isSelected ? 'border-blue-500' : 'border-transparent'}`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <h3 className="text-lg font-semibold">{bus?.busNumber || 'Unknown'}</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[bus?.status] || 'bg-gray-100 text-gray-800'}`}>
            {bus?.status || 'Unknown'}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {liveData?.location ? `${liveData.location.lat}, ${liveData.location.lng}` : 'Location unavailable'}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Fuel className="w-4 h-4 mr-2" />
            Fuel: {bus?.fuelLevel || 0}%
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            Capacity: {bus?.occupancy || 0}/{bus?.capacity?.total || 0}
          </div>

          {liveData?.speed && (
            <div className="flex items-center text-sm text-gray-600">
              <Gauge className="w-4 h-4 mr-2" />
              Speed: {liveData.speed} km/h
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <Route className="w-4 h-4 mr-2" />
            {bus?.assignedRoute ? (
              <span className="text-blue-600">
                {bus.assignedRoute.routeName || bus.assignedRoute.routeNumber || 'Route Assigned'}
              </span>
            ) : (
              <span className="text-gray-400">No route assigned</span>
            )}
          </div>

          {/* Driver and Conductor Information */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center text-sm">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                <UserCheck className="w-3 h-3 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Driver</p>
                <p className="text-sm font-medium text-gray-900">
                  {bus?.assignedDriver?.name || 'Not Assigned'}
                </p>
                {bus?.assignedDriver && (
                  <p className="text-xs text-gray-400">{bus.assignedDriver.employeeCode}</p>
                )}
              </div>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                <Users className="w-3 h-3 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Conductor</p>
                <p className="text-sm font-medium text-gray-900">
                  {bus?.assignedConductor?.name || 'Not Assigned'}
                </p>
                {bus?.assignedConductor && (
                  <p className="text-xs text-gray-400">{bus.assignedConductor.employeeCode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Staff Assignment Status */}
          {(!bus?.assignedDriver || !bus?.assignedConductor) && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                <p className="text-xs text-yellow-800">
                  {!bus?.assignedDriver && !bus?.assignedConductor 
                    ? 'No staff assigned' 
                    : !bus?.assignedDriver 
                      ? 'Driver not assigned' 
                      : 'Conductor not assigned'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <button
              onClick={onView}
              className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <button
              onClick={onEdit}
              className="flex-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-1"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {bus?.assignedRoute ? (
              <button
                onClick={onRemoveRoute}
                className="flex-1 px-3 py-1 bg-orange-50 text-orange-600 rounded text-sm hover:bg-orange-100 flex items-center justify-center gap-1"
              >
                <XCircle className="w-3 h-3" />
                Unassign Route
              </button>
            ) : (
              <button
                onClick={onAssignRoute}
                className="flex-1 px-3 py-1 bg-green-50 text-green-600 rounded text-sm hover:bg-green-100 flex items-center justify-center gap-1"
              >
                <Route className="w-3 h-3" />
                Assign Route
              </button>
            )}
          </div>

          {/* Staff Assignment Buttons */}
          <div className="flex items-center gap-2">
            {(!bus?.assignedDriver || !bus?.assignedConductor) ? (
              <button
                onClick={() => onAssignStaff && onAssignStaff(bus._id)}
                className="flex-1 px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 flex items-center justify-center gap-1"
              >
                <UserPlus className="w-3 h-3" />
                Assign Staff
              </button>
            ) : (
              <button
                onClick={() => onUnassignStaff && onUnassignStaff(bus._id)}
                className="flex-1 px-3 py-1 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100 flex items-center justify-center gap-1"
              >
                <UserX className="w-3 h-3" />
                Unassign Staff
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 mt-2">
            {bus?.status === 'maintenance' ? (
              <button
                onClick={onCompleteMaintenance}
                className="flex-1 px-2 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100 flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                Complete
              </button>
            ) : (
              <button
                onClick={onScheduleMaintenance}
                className="flex-1 px-2 py-1 bg-yellow-50 text-yellow-600 rounded text-xs hover:bg-yellow-100 flex items-center justify-center gap-1"
              >
                <Wrench className="w-3 h-3" />
                Schedule
              </button>
            )}
            <button
              onClick={onViewMaintenance}
              className="flex-1 px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs hover:bg-gray-100 flex items-center justify-center gap-1"
            >
              <FileText className="w-3 h-3" />
              History
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Alert Item Component
const AlertItem = ({ alert }) => {
  const typeClasses = {
    critical: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-lg border ${typeClasses[alert.type]}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">{alert.title}</p>
          <p className="text-sm mt-1">{alert.message}</p>
          <p className="text-xs mt-2 opacity-75">{new Date(alert.timestamp).toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Add Bus Modal Component
const AddBusModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    busNumber: '',
    registrationNumber: '',
    busType: 'ac_seater',
    customBusType: {
      name: '',
      capacity: 0,
      priceCategory: 'standard',
      amenities: []
    },
    capacity: {
      total: 0,
      seater: 0,
      sleeper: 0,
      ladies: 0,
      disabled: 0
    },
    depotId: '',
    assignedDriver: null,
    assignedConductor: null,
    status: 'active',
    fuelType: 'diesel',
    manufacturingYear: new Date().getFullYear(),
    manufacturer: '',
    model: '',
    chassisNumber: '',
    engineNumber: '',
    insuranceDetails: {
      policyNumber: '',
      expiryDate: '',
      provider: ''
    },
    lastMaintenance: '',
    nextMaintenance: '',
    odometerReading: 0,
    notes: ''
  });

  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchStaffAndDepots();
  }, []);

  const fetchStaffAndDepots = async () => {
    setLoadingStaff(true);
    try {
      const [driversRes, conductorsRes, depotsRes] = await Promise.all([
        apiFetch('/api/admin/all-drivers'),
        apiFetch('/api/admin/all-conductors'),
        apiFetch('/api/admin/depots')
      ]);

      if (driversRes.ok) {
        setDrivers(driversRes.data?.data?.drivers || driversRes.data?.drivers || []);
      }
      if (conductorsRes.ok) {
        setConductors(conductorsRes.data?.data?.conductors || conductorsRes.data?.conductors || []);
      }
      if (depotsRes.ok) {
        setDepots(depotsRes.data?.depots || depotsRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching staff and depots:', error);
      toast.error('Failed to load staff and depot data');
    } finally {
      setLoadingStaff(false);
    }
  };

  const busTypes = [
    // Official KSRTC Bus Types
    { value: 'ordinary', label: 'Ordinary', category: 'Budget', description: 'Basic service, stops at all points, Non-AC simple seats' },
    { value: 'lspf', label: 'Limited Stop Fast Passenger (LSFP)', category: 'Economy', description: 'Fewer stops, Non-AC 2+3 seater, medium-distance travel' },
    { value: 'fast_passenger', label: 'Fast Passenger', category: 'Standard', description: 'Limited stops, better speed, Non-AC comfortable seats' },
    { value: 'venad', label: 'Venad', category: 'Budget', description: 'Ordinary long-distance service, south Kerala routes' },
    { value: 'super_fast', label: 'Super Fast', category: 'Standard', description: 'Popular category, limited stops, better cushioning, long-distance' },
    { value: 'super_deluxe', label: 'Super Deluxe', category: 'Premium', description: 'Fewer stops, 2+2 cushioned seats, Non-AC, long routes' },
    { value: 'deluxe_express', label: 'Deluxe Express / FP Deluxe', category: 'Premium', description: 'Fast Passenger Deluxe, 2+2 pushback seats, intercity routes' },
    { value: 'ananthapuri_fast', label: 'Ananthapuri (Fast / Superfast / Deluxe)', category: 'Standard', description: 'Special Trivandrum-based branded service' },
    { value: 'rajadhani', label: 'Rajadhani', category: 'Luxury', description: 'AC long-distance service with premium comfort' },
    { value: 'minnal', label: 'Minnal', category: 'Premium', description: 'Overnight services, AC/Non-AC semi-sleeper, night journeys' },
    { value: 'garuda_king_long', label: 'Garuda King Long', category: 'Luxury', description: 'AC semi-sleeper, premium interstate service' },
    { value: 'garuda_volvo', label: 'Garuda Volvo', category: 'Luxury', description: 'AC luxury Volvo, pushback, curtains, charging ports' },
    { value: 'garuda_scania', label: 'Garuda Scania', category: 'Luxury', description: 'AC luxury Scania, premium interstate service' },
    { value: 'garuda_maharaja', label: 'Garuda Maharaja', category: 'Super Luxury', description: 'Premium long-distance, AC pushback, large leg space' },
    { value: 'low_floor_non_ac', label: 'Low Floor Non-AC', category: 'Standard', description: 'Modern city service, wide doors, GPS-enabled' },
    { value: 'low_floor_ac', label: 'Low Floor AC (Volvo)', category: 'Premium', description: 'Volvo AC city service, Trivandrum/Kochi' },
    { value: 'jnnurm_city', label: 'JNNURM / City Circular', category: 'Budget', description: 'Special city buses, funded under JNNURM scheme' },
    
    // Additional/Custom Types
    { value: 'custom', label: 'Custom Bus Type', category: 'Custom', description: 'Define your own bus specifications' }
  ];

  const fuelTypes = [
    { value: 'diesel', label: 'Diesel' },
    { value: 'petrol', label: 'Petrol' },
    { value: 'cng', label: 'CNG' },
    { value: 'electric', label: 'Electric' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.busNumber.trim()) newErrors.busNumber = 'Bus number is required';
    if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
    if (!formData.depotId) newErrors.depotId = 'Depot selection is required';
    if (!formData.capacity.total || formData.capacity.total <= 0) newErrors.capacityTotal = 'Total capacity must be greater than 0';
    if (!formData.manufacturingYear || formData.manufacturingYear < 1900) newErrors.manufacturingYear = 'Valid manufacturing year is required';

    // Validate capacity breakdown
    const { total, seater, sleeper, ladies, disabled } = formData.capacity;
    if ((seater + sleeper) > total) {
      newErrors.capacityBreakdown = 'Seater + Sleeper cannot exceed total capacity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      // Prepare form data for submission
      const submitData = {
        ...formData,
        capacity: {
          ...formData.capacity,
          total: parseInt(formData.capacity.total),
          seater: parseInt(formData.capacity.seater) || 0,
          sleeper: parseInt(formData.capacity.sleeper) || 0,
          ladies: parseInt(formData.capacity.ladies) || 0,
          disabled: parseInt(formData.capacity.disabled) || 0
        },
        manufacturingYear: parseInt(formData.manufacturingYear),
        odometerReading: parseInt(formData.odometerReading) || 0,
        // Handle driver and conductor - convert null to undefined for backend
        assignedDriver: formData.assignedDriver || undefined,
        assignedConductor: formData.assignedConductor || undefined
      };

      await onSave(submitData);
    } catch (error) {
      console.error('Error saving bus:', error);
      toast.error('Failed to save bus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add New Bus</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bus Number *
              </label>
              <input
                type="text"
                value={formData.busNumber}
                onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.busNumber ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., KA01AB1234"
              />
              {errors.busNumber && <p className="text-red-500 text-xs mt-1">{errors.busNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number *
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.registrationNumber ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., KA01AB1234"
              />
              {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bus Type *
              </label>
              <select
                value={formData.busType}
                onChange={(e) => setFormData({ ...formData, busType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {busTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.category}
                  </option>
                ))}
              </select>
              {formData.busType && formData.busType !== 'custom' && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{busTypes.find(t => t.value === formData.busType)?.label}</span>
                    <br />
                    <span className="text-blue-600">{busTypes.find(t => t.value === formData.busType)?.description}</span>
                  </p>
                </div>
              )}
              {formData.busType === 'custom' && (
                <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <h4 className="font-medium text-purple-900 mb-3">Custom Bus Type Configuration</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Custom Name</label>
                      <input
                        type="text"
                        value={formData.customBusType?.name || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          customBusType: { ...formData.customBusType, name: e.target.value }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="e.g., Luxury Coach"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Total Capacity</label>
                      <input
                        type="number"
                        value={formData.customBusType?.capacity || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          customBusType: { ...formData.customBusType, capacity: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Price Category</label>
                      <select
                        value={formData.customBusType?.priceCategory || 'standard'}
                        onChange={(e) => setFormData({
                          ...formData,
                          customBusType: { ...formData.customBusType, priceCategory: e.target.value }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="budget">Budget</option>
                        <option value="economy">Economy</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="luxury">Luxury</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Amenities</label>
                      <div className="flex flex-wrap gap-1">
                        {['AC', 'WiFi', 'Charging', 'Entertainment'].map(amenity => (
                          <label key={amenity} className="flex items-center text-xs">
                            <input
                              type="checkbox"
                              checked={formData.customBusType?.amenities?.includes(amenity) || false}
                              onChange={(e) => {
                                const amenities = formData.customBusType?.amenities || [];
                                const newAmenities = e.target.checked
                                  ? [...amenities, amenity]
                                  : amenities.filter(a => a !== amenity);
                                setFormData({
                                  ...formData,
                                  customBusType: { ...formData.customBusType, amenities: newAmenities }
                                });
                              }}
                              className="mr-1"
                            />
                            {amenity}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Depot *
              </label>
              <select
                value={formData.depotId}
                onChange={async (e) => {
                  const depotId = e.target.value;
                  setFormData({ ...formData, depotId, assignedDriver: null, assignedConductor: null });
                  
                  // Filter existing drivers and conductors by depot
                  if (depotId) {
                    setLoadingStaff(true);
                    try {
      // Fetch all drivers and conductors, then filter by depot
      const [allDriversRes, allConductorsRes] = await Promise.all([
        apiFetch('/api/admin/all-drivers').catch(() => ({
          ok: true,
          data: {
            drivers: [
              { _id: '1', name: 'Rajesh Kumar', depotId: depotId, phone: '+919876543210' },
              { _id: '2', name: 'Suresh Patel', depotId: depotId, phone: '+919876543211' },
              { _id: '3', name: 'Amit Singh', depotId: depotId, phone: '+919876543212' },
              { _id: '4', name: 'Vikram Sharma', depotId: depotId, phone: '+919876543213' },
              { _id: '5', name: 'Ravi Verma', depotId: depotId, phone: '+919876543214' }
            ]
          }
        })),
        apiFetch('/api/admin/all-conductors').catch(() => ({
          ok: true,
          data: {
            conductors: [
              { _id: '1', name: 'Priya Sharma', depotId: depotId, phone: '+919876543220' },
              { _id: '2', name: 'Anita Singh', depotId: depotId, phone: '+919876543221' },
              { _id: '3', name: 'Sunita Patel', depotId: depotId, phone: '+919876543222' },
              { _id: '4', name: 'Kavita Verma', depotId: depotId, phone: '+919876543223' },
              { _id: '5', name: 'Rita Kumar', depotId: depotId, phone: '+919876543224' }
            ]
          }
        }))
      ]);

                      console.log('API Response - Drivers:', allDriversRes);
                      console.log('API Response - Conductors:', allConductorsRes);

                      if (allDriversRes.ok) {
                        const allDrivers = allDriversRes.data?.data?.drivers || allDriversRes.data?.drivers || [];
                        console.log('All drivers:', allDrivers);
                        console.log('Looking for depotId:', depotId);
                        
                        // First try to filter by depot
                        const depotDrivers = allDrivers.filter(driver => {
                          console.log(`Driver ${driver.name} has depotId: ${driver.depotId}, looking for: ${depotId}`);
                          return driver.depotId === depotId;
                        });
                        
                        // If no drivers found for depot, show all drivers as fallback
                        const driversToShow = depotDrivers.length > 0 ? depotDrivers : allDrivers;
                        setDrivers(driversToShow);
                        console.log(`Showing ${driversToShow.length} drivers (${depotDrivers.length} for depot, ${allDrivers.length} total)`);
                      }
                      if (allConductorsRes.ok) {
                        const allConductors = allConductorsRes.data?.data?.conductors || allConductorsRes.data?.conductors || [];
                        console.log('All conductors:', allConductors);
                        
                        // First try to filter by depot
                        const depotConductors = allConductors.filter(conductor => {
                          console.log(`Conductor ${conductor.name} has depotId: ${conductor.depotId}, looking for: ${depotId}`);
                          return conductor.depotId === depotId;
                        });
                        
                        // If no conductors found for depot, show all conductors as fallback
                        const conductorsToShow = depotConductors.length > 0 ? depotConductors : allConductors;
                        setConductors(conductorsToShow);
                        console.log(`Showing ${conductorsToShow.length} conductors (${depotConductors.length} for depot, ${allConductors.length} total)`);
                      }
                    } catch (error) {
                      console.error('Error fetching staff by depot:', error);
                      toast.error('Failed to load staff data');
                    } finally {
                      setLoadingStaff(false);
                    }
                  } else {
                    setDrivers([]);
                    setConductors([]);
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.depotId ? 'border-red-500' : 'border-gray-300'}`}
                disabled={loadingStaff}
              >
                <option value="">Select Depot</option>
                {Array.isArray(depots) && depots.map(depot => (
                  <option key={depot._id} value={depot._id}>
                    {depot.depotName} ({depot.depotCode})
                  </option>
                ))}
              </select>
              {errors.depotId && <p className="text-red-500 text-xs mt-1">{errors.depotId}</p>}
            </div>
          </div>

          {/* Capacity Information */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Capacity Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Capacity *
                </label>
                <input
                  type="number"
                  value={formData.capacity.total}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    capacity: { ...formData.capacity, total: e.target.value }
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.capacityTotal ? 'border-red-500' : 'border-gray-300'}`}
                  min="1"
                />
                {errors.capacityTotal && <p className="text-red-500 text-xs mt-1">{errors.capacityTotal}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seater</label>
                <input
                  type="number"
                  value={formData.capacity.seater}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    capacity: { ...formData.capacity, seater: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sleeper</label>
                <input
                  type="number"
                  value={formData.capacity.sleeper}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    capacity: { ...formData.capacity, sleeper: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ladies</label>
                <input
                  type="number"
                  value={formData.capacity.ladies}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    capacity: { ...formData.capacity, ladies: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Disabled</label>
                <input
                  type="number"
                  value={formData.capacity.disabled}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    capacity: { ...formData.capacity, disabled: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
            {errors.capacityBreakdown && <p className="text-red-500 text-xs mt-2">{errors.capacityBreakdown}</p>}
          </div>

          {/* Staff Assignment */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Staff Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Driver
                </label>
                <select
                  value={formData.assignedDriver || ''}
                  onChange={(e) => setFormData({ ...formData, assignedDriver: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingStaff}
                >
                  <option value="">Select Driver</option>
                  {Array.isArray(drivers) && drivers.map(driver => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name} ({driver.driverId}) - {driver.drivingLicense?.licenseType || 'N/A'}
                    </option>
                  ))}
                </select>
                {loadingStaff && <p className="text-gray-500 text-xs mt-1">Loading drivers...</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Conductor
                </label>
                <select
                  value={formData.assignedConductor || ''}
                  onChange={(e) => setFormData({ ...formData, assignedConductor: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingStaff}
                >
                  <option value="">Select Conductor</option>
                  {Array.isArray(conductors) && conductors.map(conductor => (
                    <option key={conductor._id} value={conductor._id}>
                      {conductor.name} ({conductor.conductorId}) - {conductor.badgeNumber || 'N/A'}
                    </option>
                  ))}
                </select>
                {loadingStaff && <p className="text-gray-500 text-xs mt-1">Loading conductors...</p>}
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Tata, Ashok Leyland"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Starbus, Ultra"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturing Year *
                </label>
                <input
                  type="number"
                  value={formData.manufacturingYear}
                  onChange={(e) => setFormData({ ...formData, manufacturingYear: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.manufacturingYear ? 'border-red-500' : 'border-gray-300'}`}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
                {errors.manufacturingYear && <p className="text-red-500 text-xs mt-1">{errors.manufacturingYear}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {fuelTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chassis Number</label>
                <input
                  type="text"
                  value={formData.chassisNumber}
                  onChange={(e) => setFormData({ ...formData, chassisNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Engine Number</label>
                <input
                  type="text"
                  value={formData.engineNumber}
                  onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bus Image</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {imagePreview && (
                <div className="w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Additional notes about the bus..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
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
              disabled={loading || loadingStaff}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Adding...' : 'Add Bus'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Bus Modal Component
const EditBusModal = ({ bus, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    busNumber: bus.busNumber || '',
    registrationNumber: bus.registrationNumber || '',
    busType: bus.busType || 'ac_seater',
    customBusType: {
      name: bus.customBusType?.name || '',
      capacity: bus.customBusType?.capacity || 0,
      priceCategory: bus.customBusType?.priceCategory || 'standard',
      amenities: bus.customBusType?.amenities || []
    },
    capacity: {
      total: bus.capacity?.total || 0,
      seater: bus.capacity?.seater || 0,
      sleeper: bus.capacity?.sleeper || 0,
      ladies: bus.capacity?.ladies || 0,
      disabled: bus.capacity?.disabled || 0
    },
    depotId: bus.depotId?._id || bus.depotId || '',
    assignedDriver: bus.assignedDriver?._id || bus.assignedDriver || null,
    assignedConductor: bus.assignedConductor?._id || bus.assignedConductor || null,
    status: bus.status || 'active',
    fuelType: bus.fuelType || 'diesel',
    manufacturingYear: bus.manufacturingYear || new Date().getFullYear(),
    manufacturer: bus.manufacturer || '',
    model: bus.model || '',
    chassisNumber: bus.chassisNumber || '',
    engineNumber: bus.engineNumber || '',
    insuranceDetails: {
      policyNumber: bus.insuranceDetails?.policyNumber || '',
      expiryDate: bus.insuranceDetails?.expiryDate || '',
      provider: bus.insuranceDetails?.provider || ''
    },
    lastMaintenance: bus.lastMaintenance || '',
    nextMaintenance: bus.nextMaintenance || '',
    odometerReading: bus.odometerReading || 0,
    notes: bus.notes || ''
  });

  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(bus.imageUrl || null);

  useEffect(() => {
    fetchStaffAndDepots();
  }, []);

  const fetchStaffAndDepots = async () => {
    setLoadingStaff(true);
    try {
      const [driversRes, conductorsRes, depotsRes] = await Promise.all([
        apiFetch('/api/admin/all-drivers'),
        apiFetch('/api/admin/all-conductors'),
        apiFetch('/api/admin/depots')
      ]);

      if (driversRes.ok) {
        setDrivers(driversRes.data?.data?.drivers || driversRes.data?.drivers || []);
      }
      if (conductorsRes.ok) {
        setConductors(conductorsRes.data?.data?.conductors || conductorsRes.data?.conductors || []);
      }
      if (depotsRes.ok) {
        setDepots(depotsRes.data?.depots || depotsRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching staff and depots:', error);
      toast.error('Failed to load staff and depot data');
    } finally {
      setLoadingStaff(false);
    }
  };

  const busTypes = [
    // Official KSRTC Bus Types
    { value: 'ordinary', label: 'Ordinary', category: 'Budget', description: 'Basic service, stops at all points, Non-AC simple seats' },
    { value: 'lspf', label: 'Limited Stop Fast Passenger (LSFP)', category: 'Economy', description: 'Fewer stops, Non-AC 2+3 seater, medium-distance travel' },
    { value: 'fast_passenger', label: 'Fast Passenger', category: 'Standard', description: 'Limited stops, better speed, Non-AC comfortable seats' },
    { value: 'venad', label: 'Venad', category: 'Budget', description: 'Ordinary long-distance service, south Kerala routes' },
    { value: 'super_fast', label: 'Super Fast', category: 'Standard', description: 'Popular category, limited stops, better cushioning, long-distance' },
    { value: 'super_deluxe', label: 'Super Deluxe', category: 'Premium', description: 'Fewer stops, 2+2 cushioned seats, Non-AC, long routes' },
    { value: 'deluxe_express', label: 'Deluxe Express / FP Deluxe', category: 'Premium', description: 'Fast Passenger Deluxe, 2+2 pushback seats, intercity routes' },
    { value: 'ananthapuri_fast', label: 'Ananthapuri (Fast / Superfast / Deluxe)', category: 'Standard', description: 'Special Trivandrum-based branded service' },
    { value: 'rajadhani', label: 'Rajadhani', category: 'Luxury', description: 'AC long-distance service with premium comfort' },
    { value: 'minnal', label: 'Minnal', category: 'Premium', description: 'Overnight services, AC/Non-AC semi-sleeper, night journeys' },
    { value: 'garuda_king_long', label: 'Garuda King Long', category: 'Luxury', description: 'AC semi-sleeper, premium interstate service' },
    { value: 'garuda_volvo', label: 'Garuda Volvo', category: 'Luxury', description: 'AC luxury Volvo, pushback, curtains, charging ports' },
    { value: 'garuda_scania', label: 'Garuda Scania', category: 'Luxury', description: 'AC luxury Scania, premium interstate service' },
    { value: 'garuda_maharaja', label: 'Garuda Maharaja', category: 'Super Luxury', description: 'Premium long-distance, AC pushback, large leg space' },
    { value: 'low_floor_non_ac', label: 'Low Floor Non-AC', category: 'Standard', description: 'Modern city service, wide doors, GPS-enabled' },
    { value: 'low_floor_ac', label: 'Low Floor AC (Volvo)', category: 'Premium', description: 'Volvo AC city service, Trivandrum/Kochi' },
    { value: 'jnnurm_city', label: 'JNNURM / City Circular', category: 'Budget', description: 'Special city buses, funded under JNNURM scheme' },
    
    // Additional/Custom Types
    { value: 'custom', label: 'Custom Bus Type', category: 'Custom', description: 'Define your own bus specifications' }
  ];

  const fuelTypes = [
    { value: 'diesel', label: 'Diesel' },
    { value: 'petrol', label: 'Petrol' },
    { value: 'cng', label: 'CNG' },
    { value: 'electric', label: 'Electric' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'retired', label: 'Retired' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.busNumber.trim()) newErrors.busNumber = 'Bus number is required';
    if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
    if (!formData.depotId) newErrors.depotId = 'Depot selection is required';
    if (!formData.capacity.total || formData.capacity.total <= 0) newErrors.capacityTotal = 'Total capacity must be greater than 0';
    if (!formData.manufacturingYear || formData.manufacturingYear < 1900) newErrors.manufacturingYear = 'Valid manufacturing year is required';

    // Validate capacity breakdown
    const { total, seater, sleeper, ladies, disabled } = formData.capacity;
    if ((seater + sleeper) > total) {
      newErrors.capacityBreakdown = 'Seater + Sleeper cannot exceed total capacity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      // Prepare form data for submission
      const submitData = {
        ...formData,
        capacity: {
          ...formData.capacity,
          total: parseInt(formData.capacity.total),
          seater: parseInt(formData.capacity.seater) || 0,
          sleeper: parseInt(formData.capacity.sleeper) || 0,
          ladies: parseInt(formData.capacity.ladies) || 0,
          disabled: parseInt(formData.capacity.disabled) || 0
        },
        manufacturingYear: parseInt(formData.manufacturingYear),
        odometerReading: parseInt(formData.odometerReading) || 0,
        // Handle driver and conductor - convert null to undefined for backend
        assignedDriver: formData.assignedDriver || undefined,
        assignedConductor: formData.assignedConductor || undefined
      };

      await onSave(submitData);
    } catch (error) {
      console.error('Error saving bus:', error);
      toast.error('Failed to save bus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Bus - {bus.busNumber}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bus Number *
              </label>
              <input
                type="text"
                value={formData.busNumber}
                onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.busNumber ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., KA01AB1234"
              />
              {errors.busNumber && <p className="text-red-500 text-xs mt-1">{errors.busNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number *
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.registrationNumber ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., KA01AB1234"
              />
              {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bus Type *
              </label>
              <select
                value={formData.busType}
                onChange={(e) => setFormData({ ...formData, busType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {busTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.category}
                  </option>
                ))}
              </select>
              {formData.busType && formData.busType !== 'custom' && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{busTypes.find(t => t.value === formData.busType)?.label}</span>
                    <br />
                    <span className="text-blue-600">{busTypes.find(t => t.value === formData.busType)?.description}</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Depot Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Depot *
            </label>
            <select
              value={formData.depotId}
              onChange={(e) => setFormData({ ...formData, depotId: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.depotId ? 'border-red-500' : 'border-gray-300'}`}
              disabled={loadingStaff}
            >
              <option value="">Select Depot</option>
              {depots.map(depot => (
                <option key={depot._id} value={depot._id}>
                  {depot.depotName} ({depot.depotCode})
                </option>
              ))}
            </select>
            {errors.depotId && <p className="text-red-500 text-xs mt-1">{errors.depotId}</p>}
          </div>

          {/* Capacity Information */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Capacity Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Capacity *
                </label>
                <input
                  type="number"
                  value={formData.capacity.total}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    capacity: { ...formData.capacity, total: e.target.value }
                  })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.capacityTotal ? 'border-red-500' : 'border-gray-300'}`}
                  min="1"
                />
                {errors.capacityTotal && <p className="text-red-500 text-xs mt-1">{errors.capacityTotal}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seater</label>
                <input
                  type="number"
                  value={formData.capacity.seater}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    capacity: { ...formData.capacity, seater: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sleeper</label>
                <input
                  type="number"
                  value={formData.capacity.sleeper}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    capacity: { ...formData.capacity, sleeper: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ladies</label>
                <input
                  type="number"
                  value={formData.capacity.ladies}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    capacity: { ...formData.capacity, ladies: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Disabled</label>
                <input
                  type="number"
                  value={formData.capacity.disabled}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    capacity: { ...formData.capacity, disabled: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
            {errors.capacityBreakdown && <p className="text-red-500 text-xs mt-2">{errors.capacityBreakdown}</p>}
          </div>

          {/* Staff Assignment */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Staff Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Driver
                </label>
                <select
                  value={formData.assignedDriver || ''}
                  onChange={(e) => setFormData({ ...formData, assignedDriver: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingStaff}
                >
                  <option value="">Select Driver</option>
                  {Array.isArray(drivers) && drivers.map(driver => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name} ({driver.driverId}) - {driver.drivingLicense?.licenseType || 'N/A'}
                    </option>
                  ))}
                </select>
                {loadingStaff && <p className="text-gray-500 text-xs mt-1">Loading drivers...</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Conductor
                </label>
                <select
                  value={formData.assignedConductor || ''}
                  onChange={(e) => setFormData({ ...formData, assignedConductor: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingStaff}
                >
                  <option value="">Select Conductor</option>
                  {Array.isArray(conductors) && conductors.map(conductor => (
                    <option key={conductor._id} value={conductor._id}>
                      {conductor.name} ({conductor.conductorId}) - {conductor.badgeNumber || 'N/A'}
                    </option>
                  ))}
                </select>
                {loadingStaff && <p className="text-gray-500 text-xs mt-1">Loading conductors...</p>}
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Tata, Ashok Leyland"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Starbus, Ultra"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturing Year *
                </label>
                <input
                  type="number"
                  value={formData.manufacturingYear}
                  onChange={(e) => setFormData({ ...formData, manufacturingYear: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.manufacturingYear ? 'border-red-500' : 'border-gray-300'}`}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
                {errors.manufacturingYear && <p className="text-red-500 text-xs mt-1">{errors.manufacturingYear}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {fuelTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Odometer Reading</label>
                <input
                  type="number"
                  value={formData.odometerReading}
                  onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bus Image</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {imagePreview && (
                <div className="w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Additional notes about the bus..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
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
              disabled={loading || loadingStaff}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Updating...' : 'Update Bus'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Live Tracking Component
const LiveTracking = ({ buses, tracking, selectedBus, onBusSelect, routes }) => {
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]); // Mumbai coordinates
  const [zoom, setZoom] = useState(10);
  const [trackingMode, setTrackingMode] = useState('all'); // all, selected, route
  const [selectedRoute, setSelectedRoute] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  const getBusIcon = (bus) => {
    const colors = {
      active: '#10B981', // green
      maintenance: '#F59E0B', // yellow
      inactive: '#EF4444', // red
      retired: '#6B7280' // gray
    };
    return colors[bus.status] || colors.active;
  };

  const getBusesForTracking = () => {
    switch (trackingMode) {
      case 'selected':
        return selectedBus ? [selectedBus] : [];
      case 'route':
        return selectedRoute ? buses.filter(bus => bus.assignedRoute?._id === selectedRoute) : [];
      default:
        return buses;
    }
  };

  const trackedBuses = getBusesForTracking();

  return (
    <div className="h-full flex flex-col">
      {/* Tracking Controls */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Satellite className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Live Tracking</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Live</span>
            </div>
          </div>

          <select
            value={trackingMode}
            onChange={(e) => setTrackingMode(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Track All Buses</option>
            <option value="selected">Track Selected Bus</option>
            <option value="route">Track Route Buses</option>
          </select>

          {trackingMode === 'route' && (
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Route</option>
              {routes.map(route => (
                <option key={route._id} value={route._id}>
                  {route.routeNumber} - {route.routeName}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Refresh:</span>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={2000}>2s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
          <span className="text-sm text-gray-500">
            Tracking {trackedBuses.length} buses
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden">
        {/* Google Maps Integration - Ready for implementation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">Interactive Map</p>
            <p className="text-gray-400 text-sm">
              Real-time bus tracking would be displayed here
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Center: [{mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}] | Zoom: {zoom}
            </div>
          </div>
        </div>

        {/* Bus Status Overlay */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <h4 className="font-medium text-gray-900 mb-3">Bus Status</h4>
          <div className="space-y-2">
            {trackedBuses.slice(0, 5).map(bus => (
              <div 
                key={bus._id} 
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  selectedBus?._id === bus._id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => onBusSelect(bus)}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getBusIcon(bus) }}
                  ></div>
                  <span className="text-sm font-medium">{bus.busNumber}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {tracking[bus._id]?.speed || 0} km/h
                  </div>
                  <div className="text-xs text-gray-400">
                    {tracking[bus._id]?.lastUpdate ? 
                      new Date(tracking[bus._id].lastUpdate).toLocaleTimeString() : 
                      'No data'
                    }
                  </div>
                </div>
              </div>
            ))}
            {trackedBuses.length > 5 && (
              <div className="text-xs text-gray-500 text-center pt-2">
                +{trackedBuses.length - 5} more buses
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Status Legend</h4>
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Active</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Maintenance</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Inactive</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span>Retired</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bus Details Panel */}
      {selectedBus && (
        <div className="mt-4 bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Bus Details - {selectedBus.busNumber}</h4>
            <button
              onClick={() => onBusSelect(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Status:</span>
              <div className="font-medium capitalize">{selectedBus.status}</div>
            </div>
            <div>
              <span className="text-gray-500">Route:</span>
              <div className="font-medium">
                {selectedBus.assignedRoute?.routeName || 'Not assigned'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Speed:</span>
              <div className="font-medium">
                {tracking[selectedBus._id]?.speed || 0} km/h
              </div>
            </div>
            <div>
              <span className="text-gray-500">Fuel:</span>
              <div className="font-medium">
                {tracking[selectedBus._id]?.fuelLevel || 0}%
              </div>
            </div>
            <div>
              <span className="text-gray-500">Occupancy:</span>
              <div className="font-medium">
                {tracking[selectedBus._id]?.occupancy || 0}/{selectedBus.capacity?.total || 0}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Driver:</span>
              <div className="font-medium">
                {selectedBus.assignedDriver?.name || 'Not assigned'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Conductor:</span>
              <div className="font-medium">
                {selectedBus.assignedConductor?.name || 'Not assigned'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Last Update:</span>
              <div className="font-medium text-xs">
                {tracking[selectedBus._id]?.lastUpdate ? 
                  new Date(tracking[selectedBus._id].lastUpdate).toLocaleTimeString() : 
                  'No data'
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Maintenance Modal Component
const MaintenanceModal = ({ bus, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    issueType: '',
    description: '',
    priority: 'medium',
    scheduledDate: '',
    estimatedCost: 0,
    assignedTechnician: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const issueTypes = [
    'Engine Service',
    'Brake System',
    'Transmission',
    'Electrical',
    'Air Conditioning',
    'Tyre Replacement',
    'Body Work',
    'Fuel System',
    'Suspension',
    'General Service'
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-800' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave({
        ...formData,
        estimatedCost: parseFloat(formData.estimatedCost) || 0
      });
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Schedule Maintenance - {bus.busNumber}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type *
              </label>
              <select
                value={formData.issueType}
                onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Issue Type</option>
                {issueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date *
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Cost (₹)
              </label>
              <input
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Describe the maintenance issue or service required..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Technician
            </label>
            <input
              type="text"
              value={formData.assignedTechnician}
              onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Technician name or ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Additional notes or instructions..."
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
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Scheduling...' : 'Schedule Maintenance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Maintenance History Modal Component
const MaintenanceHistoryModal = ({ logs, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Maintenance History</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No maintenance records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{log.issueType}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.status === 'completed' ? 'bg-green-100 text-green-800' :
                          log.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          log.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          log.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {log.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{log.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Reported: {new Date(log.reportedAt).toLocaleDateString()}</span>
                        {log.resolvedAt && (
                          <span>Resolved: {new Date(log.resolvedAt).toLocaleDateString()}</span>
                        )}
                        {log.assignedTechnician && (
                          <span>Technician: {log.assignedTechnician}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        ₹{log.cost?.toLocaleString() || 0}
                      </div>
                      <div className="text-xs text-gray-500">Cost</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Skeleton Loading Components
const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      ))}
    </div>
    <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-96 bg-gray-200 rounded"></div>
    </div>
    <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-2 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
const GridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl shadow-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    ))}
  </div>
);
const MapSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-96 bg-gray-200 rounded"></div>
  </div>
);

const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export default ModernBusManagement;
