import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Upload, RefreshCw, BarChart3, 
  Map, Route, Clock, AlertCircle, CheckCircle,
  Download, Settings, Trash2, Eye, Loader2,
  FileText, Globe, Server, Activity
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { toast } from 'react-hot-toast';

const KSRTCDataManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [graphStatus, setGraphStatus] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [importHistory, setImportHistory] = useState([]);
  const [uploadFiles, setUploadFiles] = useState({
    routes: null,
    stops: null,
    routeStops: null
  });

  useEffect(() => {
    fetchGraphStatus();
    fetchCacheStats();
  }, []);

  const fetchGraphStatus = async () => {
    try {
      const response = await apiFetch('/api/fastest-route/graph-status');
      if (response.ok) {
        setGraphStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching graph status:', error);
    }
  };

  const fetchCacheStats = async () => {
    try {
      const response = await apiFetch('/api/fastest-route/cache-stats');
      if (response.ok) {
        setCacheStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error);
    }
  };

  const handleFileUpload = (dataType, file) => {
    setUploadFiles(prev => ({ ...prev, [dataType]: file }));
  };

  const importData = async (dataType) => {
    const file = uploadFiles[dataType];
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataType', dataType);
      formData.append('format', file.name.endsWith('.csv') ? 'csv' : 'json');

      const response = await apiFetch('/api/fastest-route/import-data', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast.success(`${dataType} data imported successfully`);
        setUploadFiles(prev => ({ ...prev, [dataType]: null }));
        fetchGraphStatus();
      } else {
        toast.error('Failed to import data');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  const buildRouteGraph = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/fastest-route/build-graph', {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Route graph built successfully');
        fetchGraphStatus();
      } else {
        toast.error('Failed to build route graph');
      }
    } catch (error) {
      console.error('Graph build error:', error);
      toast.error('Failed to build route graph');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      const response = await apiFetch('/api/fastest-route/cache', {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Cache cleared successfully');
        fetchCacheStats();
      } else {
        toast.error('Failed to clear cache');
      }
    } catch (error) {
      console.error('Cache clear error:', error);
      toast.error('Failed to clear cache');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'import', label: 'Data Import', icon: Upload },
    { id: 'graph', label: 'Route Graph', icon: Map },
    { id: 'cache', label: 'Cache Management', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Route Graph</p>
              <p className="text-2xl font-bold text-gray-900">
                {graphStatus?.available ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${graphStatus?.available ? 'bg-green-100' : 'bg-red-100'}`}>
              {graphStatus?.available ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stops</p>
              <p className="text-2xl font-bold text-gray-900">
                {graphStatus?.totalStops || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Route className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900">
                {graphStatus?.totalRoutes || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Map className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Graph Details */}
      {graphStatus?.available && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Graph Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{graphStatus.nodeCount}</p>
              <p className="text-sm text-gray-600">Nodes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{graphStatus.edgeCount}</p>
              <p className="text-sm text-gray-600">Edges</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{graphStatus.buildTime}ms</p>
              <p className="text-sm text-gray-600">Build Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">v{graphStatus.version?.split('v')[1] || '1'}</p>
              <p className="text-sm text-gray-600">Version</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Last Updated: {new Date(graphStatus.lastUpdated).toLocaleString()}
            </p>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={buildRouteGraph}
            disabled={loading}
            className="flex items-center justify-center space-x-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            <span>Rebuild Graph</span>
          </button>
          <button
            onClick={clearCache}
            className="flex items-center justify-center space-x-2 p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Trash2 className="w-5 h-5" />
            <span>Clear Cache</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className="flex items-center justify-center space-x-2 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Upload className="w-5 h-5" />
            <span>Import Data</span>
          </button>
        </div>
      </motion.div>
    </div>
  );

  const renderImport = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Import KSRTC Data</h3>
        <p className="text-gray-600 mb-6">
          Import official KSRTC route data from CSV or JSON files. The system supports routes, stops, and route-stop relationships.
        </p>

        <div className="space-y-6">
          {/* Routes Import */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Route className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Routes</span>
              </div>
              <span className="text-sm text-gray-500">CSV/JSON</span>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".csv,.json"
                onChange={(e) => handleFileUpload('routes', e.target.files[0])}
                className="flex-1"
              />
              <button
                onClick={() => importData('routes')}
                disabled={!uploadFiles.routes || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Import
              </button>
            </div>
            {uploadFiles.routes && (
              <p className="text-sm text-green-600 mt-2">
                Selected: {uploadFiles.routes.name}
              </p>
            )}
          </div>

          {/* Stops Import */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Stops</span>
              </div>
              <span className="text-sm text-gray-500">CSV/JSON</span>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".csv,.json"
                onChange={(e) => handleFileUpload('stops', e.target.files[0])}
                className="flex-1"
              />
              <button
                onClick={() => importData('stops')}
                disabled={!uploadFiles.stops || loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Import
              </button>
            </div>
            {uploadFiles.stops && (
              <p className="text-sm text-green-600 mt-2">
                Selected: {uploadFiles.stops.name}
              </p>
            )}
          </div>

          {/* Route Stops Import */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">Route Stops</span>
              </div>
              <span className="text-sm text-gray-500">CSV/JSON</span>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".csv,.json"
                onChange={(e) => handleFileUpload('routeStops', e.target.files[0])}
                className="flex-1"
              />
              <button
                onClick={() => importData('routeStops')}
                disabled={!uploadFiles.routeStops || loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Import
              </button>
            </div>
            {uploadFiles.routeStops && (
              <p className="text-sm text-green-600 mt-2">
                Selected: {uploadFiles.routeStops.name}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Import Guidelines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-blue-50 rounded-xl p-6"
      >
        <h4 className="font-semibold text-blue-900 mb-3">Import Guidelines</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Routes CSV should include: routeNumber, routeName, startingPoint, endingPoint, totalDistance</li>
          <li>• Stops CSV should include: stopCode, stopName, latitude, longitude</li>
          <li>• Route Stops CSV should include: routeNumber, stopCode, stopSequence, distanceFromStart</li>
          <li>• After importing data, rebuild the route graph for pathfinding to work</li>
          <li>• Large datasets may take several minutes to process</li>
        </ul>
      </motion.div>
    </div>
  );

  const renderGraph = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Graph Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Current Graph Status</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${graphStatus?.available ? 'text-green-600' : 'text-red-600'}`}>
                  {graphStatus?.available ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nodes:</span>
                <span className="font-medium">{graphStatus?.nodeCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Edges:</span>
                <span className="font-medium">{graphStatus?.edgeCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Build Time:</span>
                <span className="font-medium">{graphStatus?.buildTime || 0}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">
                  {graphStatus?.lastUpdated ? new Date(graphStatus.lastUpdated).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Graph Actions</h4>
            <div className="space-y-3">
              <button
                onClick={buildRouteGraph}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Rebuild Graph</span>
              </button>
              <button
                onClick={fetchGraphStatus}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Activity className="w-4 h-4" />
                <span>Refresh Status</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Graph Visualization Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Graph Visualization</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Map className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Graph visualization coming soon</p>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderCache = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cache Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Cache Statistics</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Cache Size:</span>
                <span className="font-medium">{cacheStats?.size || 0} entries</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cache Keys:</span>
                <span className="font-medium">{cacheStats?.keys?.length || 0}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Cache Actions</h4>
            <div className="space-y-3">
              <button
                onClick={clearCache}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Cache</span>
              </button>
              <button
                onClick={fetchCacheStats}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Stats</span>
              </button>
            </div>
          </div>
        </div>

        {cacheStats?.keys && cacheStats.keys.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Cached Keys</h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <div className="space-y-1">
                {cacheStats.keys.slice(0, 10).map((key, index) => (
                  <div key={index} className="text-sm font-mono text-gray-600">
                    {key}
                  </div>
                ))}
                {cacheStats.keys.length > 10 && (
                  <div className="text-sm text-gray-500">
                    ... and {cacheStats.keys.length - 10} more
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto-refresh Graph</h4>
              <p className="text-sm text-gray-600">Automatically rebuild graph when data changes</p>
            </div>
            <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Cache TTL</h4>
              <p className="text-sm text-gray-600">Cache time-to-live in minutes</p>
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Max Route Options</h4>
              <p className="text-sm text-gray-600">Maximum number of route options to return</p>
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="3">3 options</option>
              <option value="5">5 options</option>
              <option value="10">10 options</option>
            </select>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'import': return renderImport();
      case 'graph': return renderGraph();
      case 'cache': return renderCache();
      case 'settings': return renderSettings();
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">KSRTC Data Management</h1>
              <p className="mt-1 text-gray-600">Manage official KSRTC routes and pathfinding data</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KSRTCDataManagement;


