import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Bus, 
  Route, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Play,
  Pause,
  RefreshCw,
  Download,
  BarChart3,
  TrendingUp,
  Settings,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const MassScheduler = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [schedulingStatus, setSchedulingStatus] = useState(null);
  const [schedulingHistory, setSchedulingHistory] = useState([]);
  const [systemStats, setSystemStats] = useState({
    totalBuses: 0,
    activeRoutes: 0,
    availableDrivers: 0,
    availableConductors: 0,
    scheduledTrips: 0
  });

  // Form state
  const [schedulingForm, setSchedulingForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    schedulingMode: 'auto', // auto, optimized, manual
    priority: 'balanced', // balanced, efficiency, coverage
    maxConcurrent: 100,
    enableOptimization: true
  });

  // Preview data
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchSystemStats();
    fetchSchedulingHistory();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const response = await apiFetch('/api/auto-scheduler/status');
      setSystemStats(response.data);
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const fetchSchedulingHistory = async () => {
    try {
      // Mock history for now - replace with actual API call
      const mockHistory = [
        {
          id: 1,
          date: new Date().toISOString().split('T')[0],
          totalBuses: 6000,
          scheduledBuses: 5800,
          totalTrips: 17400,
          successRate: 96.7,
          duration: '2m 34s',
          status: 'completed'
        },
        {
          id: 2,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalBuses: 6000,
          scheduledBuses: 5950,
          totalTrips: 17850,
          successRate: 99.2,
          duration: '2m 12s',
          status: 'completed'
        }
      ];
      setSchedulingHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching scheduling history:', error);
    }
  };

  const generatePreview = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/auto-scheduler/preview', {
        params: {
          startDate: schedulingForm.startDate,
          endDate: schedulingForm.endDate
        }
      });
      
      setPreviewData(response.data);
      setShowPreview(true);
      toast.success('Preview generated successfully');
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const startMassScheduling = async () => {
    try {
      setIsLoading(true);
      setSchedulingStatus({
        status: 'running',
        progress: 0,
        currentStage: 'Initializing...',
        estimatedTime: '3-5 minutes'
      });

      const response = await apiFetch('/api/auto-scheduler/schedule-all', {
        method: 'POST',
        body: JSON.stringify({
          startDate: schedulingForm.startDate,
          endDate: schedulingForm.endDate,
          options: {
            mode: schedulingForm.schedulingMode,
            priority: schedulingForm.priority,
            maxConcurrent: schedulingForm.maxConcurrent,
            enableOptimization: schedulingForm.enableOptimization
          }
        })
      });

      setSchedulingStatus({
        status: 'completed',
        progress: 100,
        currentStage: 'Completed',
        results: response.data,
        duration: response.duration || '2m 45s'
      });

      toast.success(`Successfully scheduled ${response.data.scheduledBuses} buses with ${response.data.totalTrips} trips`);
      
      // Refresh system stats
      await fetchSystemStats();
      await fetchSchedulingHistory();
      
    } catch (error) {
      console.error('Error starting mass scheduling:', error);
      setSchedulingStatus({
        status: 'failed',
        progress: 0,
        currentStage: 'Failed',
        error: error.message
      });
      toast.error('Mass scheduling failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}% from yesterday
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const ProgressBar = ({ progress, stage, status }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Scheduling Progress</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          status === 'running' ? 'bg-blue-100 text-blue-800' :
          status === 'completed' ? 'bg-green-100 text-green-800' :
          status === 'failed' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{stage}</span>
          <span className="text-sm font-medium text-gray-900">{progress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className={`h-3 rounded-full ${
              status === 'completed' ? 'bg-green-500' :
              status === 'failed' ? 'bg-red-500' :
              'bg-blue-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        {status === 'running' && (
          <div className="flex items-center text-sm text-blue-600">
            <Clock className="w-4 h-4 mr-2" />
            Estimated time remaining: {schedulingStatus?.estimatedTime}
          </div>
        )}
      </div>
    </div>
  );

  const SchedulingForm = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Mass Scheduling Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={schedulingForm.startDate}
            onChange={(e) => setSchedulingForm(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={schedulingForm.endDate}
            onChange={(e) => setSchedulingForm(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scheduling Mode
          </label>
          <select
            value={schedulingForm.schedulingMode}
            onChange={(e) => setSchedulingForm(prev => ({ ...prev, schedulingMode: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="auto">Automatic (Recommended)</option>
            <option value="optimized">Optimized</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={schedulingForm.priority}
            onChange={(e) => setSchedulingForm(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="balanced">Balanced</option>
            <option value="efficiency">Efficiency</option>
            <option value="coverage">Coverage</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Concurrent Operations
          </label>
          <input
            type="number"
            min="1"
            max="500"
            value={schedulingForm.maxConcurrent}
            onChange={(e) => setSchedulingForm(prev => ({ ...prev, maxConcurrent: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableOptimization"
            checked={schedulingForm.enableOptimization}
            onChange={(e) => setSchedulingForm(prev => ({ ...prev, enableOptimization: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enableOptimization" className="ml-2 block text-sm text-gray-700">
            Enable Route Optimization
          </label>
        </div>
      </div>
      
      <div className="flex items-center justify-end space-x-4 mt-6">
        <button
          onClick={generatePreview}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Preview</span>
        </button>
        
        <button
          onClick={startMassScheduling}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>Start Mass Scheduling</span>
        </button>
      </div>
    </div>
  );

  const PreviewModal = () => (
    <AnimatePresence>
      {showPreview && previewData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowPreview(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Scheduling Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800">Total Buses</h4>
                  <p className="text-2xl font-bold text-blue-900">{previewData.totalBuses}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800">Available Routes</h4>
                  <p className="text-2xl font-bold text-green-900">{previewData.totalRoutes}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800">Estimated Trips</h4>
                  <p className="text-2xl font-bold text-purple-900">
                    {previewData.depots ? 
                      Object.values(previewData.depots).reduce((sum, depot) => sum + depot.estimatedTrips, 0) : 
                      0
                    }
                  </p>
                </div>
              </div>
              
              {previewData.depots && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Depot Breakdown</h4>
                  <div className="space-y-3">
                    {Object.entries(previewData.depots).map(([depotId, depot]) => (
                      <div key={depotId} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">{depot.depotName}</h5>
                            <p className="text-sm text-gray-600">
                              {depot.totalBuses} buses • {depot.totalRoutes} routes • {depot.availableDrivers} drivers
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{depot.estimatedTrips} trips</p>
                            <p className="text-sm text-gray-600">estimated</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
          <h1 className="text-3xl font-bold text-gray-900">Mass Bus Scheduler</h1>
          <p className="text-gray-600">Automatically schedule 6000+ buses with intelligent route optimization</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSystemStats}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Buses"
          value={systemStats.totalBuses.toLocaleString()}
          icon={Bus}
          color="bg-blue-500"
          subtitle="Active fleet"
          trend={2.5}
        />
        <StatCard
          title="Active Routes"
          value={systemStats.activeRoutes.toLocaleString()}
          icon={Route}
          color="bg-green-500"
          subtitle="Available routes"
          trend={1.2}
        />
        <StatCard
          title="Available Drivers"
          value={systemStats.availableDrivers.toLocaleString()}
          icon={Users}
          color="bg-purple-500"
          subtitle="Ready to assign"
          trend={-0.8}
        />
        <StatCard
          title="Available Conductors"
          value={systemStats.availableConductors.toLocaleString()}
          icon={Users}
          color="bg-orange-500"
          subtitle="Ready to assign"
          trend={1.5}
        />
        <StatCard
          title="Scheduled Trips"
          value={systemStats.scheduledTrips.toLocaleString()}
          icon={Calendar}
          color="bg-indigo-500"
          subtitle="Today's trips"
          trend={3.2}
        />
      </div>

      {/* Scheduling Status */}
      {schedulingStatus && (
        <ProgressBar
          progress={schedulingStatus.progress}
          stage={schedulingStatus.currentStage}
          status={schedulingStatus.status}
        />
      )}

      {/* Scheduling Form */}
      <SchedulingForm />

      {/* Scheduling History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Scheduling Runs</h3>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {schedulingHistory.map((run) => (
              <div key={run.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    run.status === 'completed' ? 'bg-green-100' :
                    run.status === 'running' ? 'bg-blue-100' :
                    'bg-red-100'
                  }`}>
                    {run.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                     run.status === 'running' ? <Clock className="w-5 h-5 text-blue-600" /> :
                     <XCircle className="w-5 h-5 text-red-600" />}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">{run.date}</h4>
                    <p className="text-sm text-gray-600">
                      {run.totalBuses.toLocaleString()} buses • {run.totalTrips.toLocaleString()} trips • {run.duration}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{run.successRate}% success</p>
                  <p className="text-sm text-gray-600">
                    {run.scheduledBuses.toLocaleString()}/{run.totalBuses.toLocaleString()} scheduled
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <PreviewModal />
    </div>
  );
};

export default MassScheduler;



