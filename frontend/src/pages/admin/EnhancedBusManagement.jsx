import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus, Plus, Grid3X3, List as ListIcon, Map, BarChart3,
  RefreshCw, Settings, Download, Upload, Users, Activity,
  CheckCircle, Wrench, AlertTriangle, TrendingUp, Brain,
  Filter, Search, Eye, Edit, Zap, Award, Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Custom hooks and components
import { useBusManagement } from '../../hooks/useBusManagement';
import { useWebSocket } from '../../hooks/useWebSocket';
import {
  EnhancedBusCard,
  AdvancedFilters,
  BulkOperations,
  AIInsightsDashboard,
  PerformanceDashboard,
  ResponsiveBusLayout
} from '../../components/Admin/BusManagement';

const EnhancedBusManagement = () => {
  // State management
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    depotId: 'all',
    busType: 'all',
    fuelLevel: 'all',
    maintenanceStatus: 'all',
    performanceScore: 'all',
    dateRange: 'all'
  });

  const [viewMode, setViewMode] = useState('grid'); // grid, list, map, analytics, performance
  const [selectedBuses, setSelectedBuses] = useState([]);
  const [showInsights, setShowInsights] = useState(true);
  const [savedFilters, setSavedFilters] = useState([]);

  // WebSocket for real-time updates
  const { isConnected, connectionError } = useWebSocket('/admin');

  // React Query hook for data management
  const {
    buses,
    analytics,
    realTime,
    insights,
    maintenancePredictions,
    isLoading,
    isRealTimeLoading,
    isInsightsLoading,
    createBus,
    updateBus,
    bulkUpdate,
    deleteBus,
    refetch,
    isCreating,
    isUpdating,
    isBulkUpdating,
    isDeleting
  } = useBusManagement(filters);

  // Memoized filtered buses for performance
  const filteredBuses = useMemo(() => {
    if (!buses) return [];
    
    return buses.filter(bus => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          bus.busNumber?.toLowerCase().includes(searchTerm) ||
          bus.registrationNumber?.toLowerCase().includes(searchTerm) ||
          bus.assignedDriver?.name?.toLowerCase().includes(searchTerm) ||
          bus.assignedConductor?.name?.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && bus.status !== filters.status) return false;

      // Depot filter
      if (filters.depotId !== 'all' && bus.depotId !== filters.depotId) return false;

      // Bus type filter
      if (filters.busType !== 'all' && bus.busType !== filters.busType) return false;

      // Fuel level filter
      if (filters.fuelLevel !== 'all') {
        const fuelLevel = bus.fuel?.currentLevel || 0;
        switch (filters.fuelLevel) {
          case 'high': if (fuelLevel < 80) return false; break;
          case 'medium': if (fuelLevel < 40 || fuelLevel >= 80) return false; break;
          case 'low': if (fuelLevel < 20 || fuelLevel >= 40) return false; break;
          case 'critical': if (fuelLevel >= 20) return false; break;
        }
      }

      // Performance score filter
      if (filters.performanceScore !== 'all') {
        const score = insights[bus._id]?.performanceScore || 0;
        switch (filters.performanceScore) {
          case 'excellent': if (score < 90) return false; break;
          case 'good': if (score < 70 || score >= 90) return false; break;
          case 'average': if (score < 50 || score >= 70) return false; break;
          case 'poor': if (score >= 50) return false; break;
        }
      }

      return true;
    });
  }, [buses, filters, insights]);

  // Selection handlers
  const handleSelectBus = useCallback((busId) => {
    setSelectedBuses(prev => 
      prev.includes(busId) 
        ? prev.filter(id => id !== busId)
        : [...prev, busId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedBuses(filteredBuses.map(bus => bus._id));
  }, [filteredBuses]);

  const handleDeselectAll = useCallback(() => {
    setSelectedBuses([]);
  }, []);

  // Bulk operations
  const handleBulkAssign = useCallback((busIds, assignments) => {
    const updates = busIds.map(busId => ({ id: busId, ...assignments }));
    bulkUpdate(updates);
    setSelectedBuses([]);
  }, [bulkUpdate]);

  const handleBulkDelete = useCallback((busIds) => {
    // In a real app, you'd want to handle this more carefully
    busIds.forEach(busId => deleteBus(busId));
    setSelectedBuses([]);
  }, [deleteBus]);

  const handleBulkExport = useCallback((busIds) => {
    const exportData = buses.filter(bus => busIds.includes(bus._id));
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `buses_export_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success(`Exported ${busIds.length} buses`);
  }, [buses]);

  // Filter management
  const handleSaveFilter = useCallback((name, filterData) => {
    const newFilter = { name, filters: filterData, createdAt: new Date() };
    setSavedFilters(prev => [...prev, newFilter]);
    toast.success('Filter saved successfully');
  }, []);

  const handleLoadFilter = useCallback((index) => {
    const filter = savedFilters[index];
    if (filter) {
      setFilters(filter.filters);
      toast.success(`Loaded filter: ${filter.name}`);
    }
  }, [savedFilters]);

  const handleDeleteFilter = useCallback((index) => {
    setSavedFilters(prev => prev.filter((_, i) => i !== index));
    toast.success('Filter deleted successfully');
  }, []);

  // Enhanced Analytics Card Component
  const EnhancedStatCard = ({ title, value, icon: Icon, color, trend, subtitle, onClick }) => (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white bg-opacity-20 rounded-xl">
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend > 0 ? 'text-green-200' : 'text-red-200'
          }`}>
            <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      
      <h3 className="text-sm font-medium opacity-90 mb-1">{title}</h3>
      <p className="text-3xl font-bold mb-2">{value}</p>
      {subtitle && <p className="text-sm opacity-75">{subtitle}</p>}
    </motion.div>
  );


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-32 w-32 border-4 border-blue-600 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Bus Management</h1>
          <p className="text-gray-600">AI-powered fleet management with real-time insights</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={refetch}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => setShowInsights(!showInsights)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              showInsights 
                ? 'bg-purple-100 text-purple-700 border border-purple-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>AI Insights</span>
          </button>
          
          <button
            onClick={() => console.log('Add new bus')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bus</span>
          </button>
        </div>
      </motion.div>

      {/* AI Insights Dashboard */}
      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AIInsightsDashboard
              insights={insights}
              maintenancePredictions={maintenancePredictions}
              isLoading={isInsightsLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Analytics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <EnhancedStatCard
          title="Total Fleet"
          value={analytics.totalBuses || 0}
          icon={Bus}
          color="from-blue-500 to-blue-600"
          trend={analytics.fleetGrowth}
          subtitle="Active buses"
          onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
        />
        
        <EnhancedStatCard
          title="Active Buses"
          value={analytics.activeBuses || 0}
          icon={CheckCircle}
          color="from-green-500 to-green-600"
          trend={analytics.activeGrowth}
          subtitle="In service"
          onClick={() => setFilters(prev => ({ ...prev, status: 'active' }))}
        />
        
        <EnhancedStatCard
          title="Maintenance"
          value={analytics.maintenanceBuses || 0}
          icon={Wrench}
          color="from-yellow-500 to-orange-500"
          trend={analytics.maintenanceTrend}
          subtitle="Under repair"
          onClick={() => setFilters(prev => ({ ...prev, status: 'maintenance' }))}
        />
        
        <EnhancedStatCard
          title="Efficiency"
          value={`${analytics.averageUtilization || 0}%`}
          icon={Activity}
          color="from-purple-500 to-purple-600"
          trend={analytics.efficiencyTrend}
          subtitle="Fleet performance"
          onClick={() => setViewMode('analytics')}
        />
      </motion.div>

      {/* Advanced Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          depots={[]} // TODO: Fetch depots
          savedFilters={savedFilters}
          onSaveFilter={handleSaveFilter}
          onLoadFilter={handleLoadFilter}
          onDeleteFilter={handleDeleteFilter}
        />
      </motion.div>

      {/* View Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">View Mode:</span>
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors flex items-center space-x-2 ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="text-sm">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors flex items-center space-x-2 ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ListIcon className="w-4 h-4" />
                <span className="text-sm">List</span>
              </button>
              <button
                onClick={() => setViewMode('performance')}
                className={`p-2 rounded-md transition-colors flex items-center space-x-2 ${
                  viewMode === 'performance' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Performance</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span>{filteredBuses.length} of {buses.length} buses</span>
            {/* WebSocket Connection Status */}
            <div className={`flex items-center space-x-1 ${
              isConnected ? 'text-green-600' : connectionError ? 'text-red-600' : 'text-yellow-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 
                connectionError ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
              }`}></div>
              <span>
                {isConnected ? 'Live' : connectionError ? 'Offline' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Fleet Overview
          </h3>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleBulkExport(buses.map(b => b._id))}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export All</span>
            </button>
            
            <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-2 hover:bg-gray-50 rounded-lg transition-colors">
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
            
            <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-2 hover:bg-gray-50 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Render buses based on view mode */}
        {viewMode === 'performance' ? (
          <PerformanceDashboard
            buses={filteredBuses}
            analytics={analytics}
            realTimeData={realTime}
            timeRange="7d"
          />
        ) : (
          <ResponsiveBusLayout
            buses={filteredBuses}
            realTimeData={realTime}
            insights={insights}
            selectedBuses={selectedBuses}
            onSelectBus={handleSelectBus}
            onEdit={(bus) => console.log('Edit bus:', bus)}
            onView={(bus) => console.log('View bus:', bus)}
            onAssign={(bus) => console.log('Assign staff:', bus)}
          />
        )}
      </motion.div>

      {/* Bulk Operations Component */}
      <AnimatePresence>
        {selectedBuses.length > 0 && (
          <BulkOperations
            selectedBuses={selectedBuses}
            totalBuses={filteredBuses.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onBulkUpdate={handleBulkAssign}
            onBulkDelete={handleBulkDelete}
            onBulkAssign={handleBulkAssign}
            onBulkExport={handleBulkExport}
            isLoading={isBulkUpdating || isDeleting}
            depots={[]} // TODO: Pass actual depots
            drivers={[]} // TODO: Pass actual drivers
            conductors={[]} // TODO: Pass actual conductors
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedBusManagement;
