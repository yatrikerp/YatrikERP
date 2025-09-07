import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, Plus, Search, Filter, Download, Upload, RefreshCw, 
  Settings, BarChart3, Map, Users, Wrench, AlertTriangle,
  TrendingUp, Activity, Zap, Shield, Clock, Star
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Import components
import EnhancedBusCard from './EnhancedBusCard';
import AdvancedFilters from './AdvancedFilters';
import BulkOperations from './BulkOperations';
import AIInsightsDashboard from './AIInsightsDashboard';
import PerformanceDashboard from './PerformanceDashboard';
import BusCRUDModal from './BusCRUDModal';
import AdvancedScheduling from './AdvancedScheduling';
import DepotCoordination from './DepotCoordination';
import KSRTCPerformanceOptimizer from './KSRTCPerformanceOptimizer';

// Import hooks and utilities
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useBusManagement } from '../../../hooks/useBusManagement';

const ModernBusManagement = () => {
  const [selectedBuses, setSelectedBuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    busType: 'all',
    depot: 'all',
    maintenance: 'all'
  });
  const [viewMode, setViewMode] = useState('grid'); // grid, list, map
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkOps, setShowBulkOps] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  const [showDepotCoordination, setShowDepotCoordination] = useState(false);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [selectedBus, setSelectedBus] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'create', 'edit', 'view'

  const queryClient = useQueryClient();

  // WebSocket for real-time updates
  const { realTimeData, isConnected } = useWebSocket('bus-management');

  // Debug logging
  console.log('ModernBusManagement: Component rendering');
  console.log('ModernBusManagement: User token:', localStorage.getItem('token'));
  console.log('ModernBusManagement: User data:', localStorage.getItem('user'));

  // Custom hook for bus management
  const {
    buses,
    isLoading,
    error,
    refetch,
    createBus,
    updateBus,
    deleteBus,
    bulkUpdateBuses,
    getBusInsights
  } = useBusManagement();

  // Debug logging for hook results
  console.log('ModernBusManagement: Hook results:', {
    buses,
    isLoading,
    error,
    busesLength: buses?.length || 0
  });

  // Real-time data processing
  const processedBuses = useMemo(() => {
    if (!buses) return [];
    
    return buses.map(bus => ({
      ...bus,
      realTimeData: realTimeData[bus._id] || {},
      insights: getBusInsights(bus._id)
    }));
  }, [buses, realTimeData, getBusInsights]);

  // Filtered and searched buses
  const filteredBuses = useMemo(() => {
    let filtered = processedBuses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(bus => 
        bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.busType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(bus => bus.status === filters.status);
    }

    // Bus type filter
    if (filters.busType !== 'all') {
      filtered = filtered.filter(bus => bus.busType === filters.busType);
    }

    // Depot filter
    if (filters.depot !== 'all') {
      filtered = filtered.filter(bus => bus.depotId === filters.depot);
    }

    // Maintenance filter
    if (filters.maintenance !== 'all') {
      const now = new Date();
      filtered = filtered.filter(bus => {
        if (filters.maintenance === 'due') {
          return bus.maintenance?.nextService && new Date(bus.maintenance.nextService) <= now;
        }
        if (filters.maintenance === 'upcoming') {
          return bus.maintenance?.nextService && 
            new Date(bus.maintenance.nextService) <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        return true;
      });
    }

    return filtered;
  }, [processedBuses, searchTerm, filters]);

  // Statistics
  const stats = useMemo(() => {
    const total = processedBuses.length;
    const active = processedBuses.filter(bus => bus.status === 'active').length;
    const maintenance = processedBuses.filter(bus => bus.status === 'maintenance').length;
    const retired = processedBuses.filter(bus => bus.status === 'retired').length;
    const suspended = processedBuses.filter(bus => bus.status === 'suspended').length;
    
    const avgPerformance = processedBuses.reduce((acc, bus) => 
      acc + (bus.insights?.performanceScore || 0), 0) / total || 0;

    return {
      total,
      active,
      maintenance,
      retired,
      suspended,
      avgPerformance: Math.round(avgPerformance)
    };
  }, [processedBuses]);

  // Event handlers
  const handleSelectBus = (busId) => {
    setSelectedBuses(prev => 
      prev.includes(busId) 
        ? prev.filter(id => id !== busId)
        : [...prev, busId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBuses.length === filteredBuses.length) {
      setSelectedBuses([]);
    } else {
      setSelectedBuses(filteredBuses.map(bus => bus._id));
    }
  };

  const handleCreateBus = () => {
    setSelectedBus(null);
    setModalMode('create');
  };

  const handleEditBus = (bus) => {
    setSelectedBus(bus);
    setModalMode('edit');
  };

  const handleViewBus = (bus) => {
    setSelectedBus(bus);
    setModalMode('view');
  };

  const handleAssignStaff = (bus) => {
    setSelectedBus(bus);
    setModalMode('assign');
  };

  const handleBulkAction = async (action, data) => {
    try {
      await bulkUpdateBuses(selectedBuses, action, data);
      toast.success(`Bulk ${action} completed successfully`);
      setSelectedBuses([]);
      setShowBulkOps(false);
    } catch (error) {
      toast.error(`Bulk ${action} failed: ${error.message}`);
    }
  };

  if (isLoading) {
    console.log('ModernBusManagement: Loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bus management system...</p>
          <div className="text-xs text-gray-400 mt-2">
            <p>Debug: Fetching buses from API...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('ModernBusManagement: Error state:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 text-lg mb-2">Error loading buses</p>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <div className="text-xs text-gray-400 mb-4 p-2 bg-gray-100 rounded">
            <p>Debug Info:</p>
            <p>Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
            <p>User: {localStorage.getItem('user') ? 'Present' : 'Missing'}</p>
            <p>API Base: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Bus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bus Management</h1>
                <p className="text-gray-600">Advanced fleet management system</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => refetch()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Settings */}
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Buses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bus className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Wrench className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retired</p>
                <p className="text-2xl font-bold text-gray-600">{stats.retired}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgPerformance}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search buses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${
                  showFilters 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center space-x-2">
              <button
                onClick={handleCreateBus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Bus</span>
              </button>

              {selectedBuses.length > 0 && (
                <button
                  onClick={() => setShowBulkOps(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Bulk Actions ({selectedBuses.length})</span>
                </button>
              )}

              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Map
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Controls */}
          <div className="flex flex-wrap items-center space-x-2 mt-4">
            <button
              onClick={() => setShowAIInsights(true)}
              className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>AI Insights</span>
            </button>

            <button
              onClick={() => setShowPerformance(true)}
              className="px-3 py-1 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all flex items-center space-x-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Performance</span>
            </button>

            <button
              onClick={() => setShowScheduling(true)}
              className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all flex items-center space-x-2"
            >
              <Clock className="w-4 h-4" />
              <span>Scheduling</span>
            </button>

            <button
              onClick={() => setShowDepotCoordination(true)}
              className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg hover:from-indigo-600 hover:to-blue-600 transition-all flex items-center space-x-2"
            >
              <Map className="w-4 h-4" />
              <span>Depot Coordination</span>
            </button>

            <button
              onClick={() => setShowOptimizer(true)}
              className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>KSRTC Optimizer</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <AdvancedFilters
                filters={filters}
                onFiltersChange={setFilters}
                onClose={() => setShowFilters(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bus Grid/List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header with selection */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedBuses.length === filteredBuses.length && filteredBuses.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  {selectedBuses.length > 0 
                    ? `${selectedBuses.length} of ${filteredBuses.length} selected`
                    : `${filteredBuses.length} buses`
                  }
                </span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Bus Cards */}
          <div className="p-6">
            {filteredBuses.length === 0 ? (
              <div className="text-center py-12">
                <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No buses found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }`}>
                <AnimatePresence>
                  {filteredBuses.map((bus, index) => (
                    <motion.div
                      key={bus._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <EnhancedBusCard
                        bus={bus}
                        realTimeData={realTimeData}
                        insights={bus.insights}
                        isSelected={selectedBuses.includes(bus._id)}
                        onSelect={() => handleSelectBus(bus._id)}
                        onEdit={handleEditBus}
                        onView={handleViewBus}
                        onAssign={handleAssignStaff}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalMode && (
          <BusCRUDModal
            mode={modalMode}
            bus={selectedBus}
            onClose={() => {
              setModalMode(null);
              setSelectedBus(null);
            }}
            onSave={(busData) => {
              if (modalMode === 'create') {
                createBus(busData);
              } else if (modalMode === 'edit') {
                updateBus(selectedBus._id, busData);
              }
              setModalMode(null);
              setSelectedBus(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkOps && (
          <BulkOperations
            selectedBuses={selectedBuses}
            onClose={() => setShowBulkOps(false)}
            onAction={handleBulkAction}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAIInsights && (
          <AIInsightsDashboard
            buses={processedBuses}
            onClose={() => setShowAIInsights(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPerformance && (
          <PerformanceDashboard
            buses={processedBuses}
            onClose={() => setShowPerformance(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScheduling && (
          <AdvancedScheduling
            buses={processedBuses}
            onClose={() => setShowScheduling(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDepotCoordination && (
          <DepotCoordination
            buses={processedBuses}
            onClose={() => setShowDepotCoordination(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOptimizer && (
          <KSRTCPerformanceOptimizer
            buses={processedBuses}
            onClose={() => setShowOptimizer(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernBusManagement;
