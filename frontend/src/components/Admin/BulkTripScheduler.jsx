import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, RefreshCw, X,
  Target, BarChart3, Settings, Rocket
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const BulkTripScheduler = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({
    current: {
      totalTrips: 0,
      totalDepots: 0,
      totalRoutes: 0,
      totalBuses: 0
    }
  });
  const [depotAnalysis, setDepotAnalysis] = useState([]);
  const [schedulerForm, setSchedulerForm] = useState({
    daysToSchedule: 30,
    tripsPerDepotPerDay: 20,
    startDate: new Date().toISOString().slice(0, 10),
    autoAssignCrew: true,
    autoAssignBuses: true,
    generateReports: true,
    selectedDepots: [],
    selectedRoutes: [],
    selectedBuses: []
  });

  useEffect(() => {
    if (isOpen) {
      fetchSchedulerStatus();
      fetchDepotAnalysis();
    }
  }, [isOpen]);

  const fetchSchedulerStatus = async () => {
    try {
      const response = await apiFetch('/api/bulk-scheduler/status');
      if (response.success) {
        setStatus(response.data.data || response.data);
      } else {
        // Set default status to prevent NaN
        setStatus({
          current: {
            totalTrips: 0,
            totalDepots: 0,
            totalRoutes: 0,
            totalBuses: 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
      // Set default status to prevent NaN
      setStatus({
        current: {
          totalTrips: 0,
          totalDepots: 0,
          totalRoutes: 0,
          totalBuses: 0
        }
      });
    }
  };

  const fetchDepotAnalysis = async () => {
    try {
      const response = await apiFetch('/api/bulk-scheduler/depot-analysis');
      if (response.success) {
        setDepotAnalysis(response.data.data || response.data || []);
      } else {
        setDepotAnalysis([]);
      }
    } catch (error) {
      console.error('Error fetching depot analysis:', error);
      setDepotAnalysis([]);
    }
  };

  const handleGenerateTrips = async () => {
    if (!schedulerForm.startDate) {
      toast.error('Please select a start date');
      return;
    }

    if (schedulerForm.daysToSchedule > 365) {
      toast.error('Cannot schedule more than 365 days in advance');
      return;
    }

    const totalTargetTrips = (status?.current?.totalDepots || depotAnalysis?.length || 0) * (schedulerForm.tripsPerDepotPerDay || 0) * (schedulerForm.daysToSchedule || 0);
    
    if (totalTargetTrips > 50000) {
      const confirmed = window.confirm(
        `You are about to generate ${totalTargetTrips} trips. This is a large operation that may take several minutes. Continue?`
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/api/bulk-scheduler/generate', {
        method: 'POST',
        body: JSON.stringify(schedulerForm)
      });

      if (response.success) {
        toast.success(`Successfully generated ${response.data.totalGenerated} trips!`);
        if (onSuccess) {
          onSuccess(response.data);
        }
        fetchSchedulerStatus();
      } else {
        toast.error(response.message || 'Failed to generate trips');
      }
    } catch (error) {
      console.error('Error generating trips:', error);
      toast.error('Failed to generate trips');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupTrips = async () => {
    const confirmed = window.confirm(
      'This will delete all future trips. Are you sure you want to continue?'
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await apiFetch('/api/bulk-scheduler/cleanup', {
        method: 'POST',
        body: JSON.stringify({
          deleteFutureOnly: true,
          confirmCleanup: true
        })
      });

      if (response.success) {
        toast.success(`Deleted ${response.deletedCount} trips`);
        fetchSchedulerStatus();
      } else {
        toast.error(response.message || 'Failed to cleanup trips');
      }
    } catch (error) {
      console.error('Error cleaning up trips:', error);
      toast.error('Failed to cleanup trips');
    } finally {
      setLoading(false);
    }
  };

  const getReadinessColor = (score) => {
    if (score >= 4) return 'text-green-600 bg-green-100';
    if (score >= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getReadinessText = (score) => {
    if (score >= 4) return 'Ready';
    if (score >= 2) return 'Partial';
    return 'Not Ready';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
      >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            position: 'relative',
            top: 'auto',
            left: 'auto',
            transform: 'none',
            zIndex: 9999,
            margin: 'auto'
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                  <Rocket className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Bulk Trip Scheduler</h3>
                  <p className="text-sm text-gray-600">Generate 6000+ trips across all depots</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Status Overview */}
            {status && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>System Status</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-600">Total Trips</p>
                    <p className="text-2xl font-bold text-gray-900">{status.current.totalTrips}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-600">Active Depots</p>
                    <p className="text-2xl font-bold text-green-600">{status.current.totalDepots}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-600">Available Buses</p>
                    <p className="text-2xl font-bold text-blue-600">{status.current.totalBuses || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-600">Active Routes</p>
                    <p className="text-2xl font-bold text-purple-600">{status.current.totalRoutes}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">System Health</span>
                    <span className="font-medium text-gray-900">
                      {status?.current?.totalDepots > 0 ? 'Ready' : 'Initializing'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${status?.current?.totalDepots > 0 ? '100' : '50'}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Scheduler Configuration */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-green-600" />
                <span>Scheduler Configuration</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days to Schedule
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={schedulerForm.daysToSchedule}
                    onChange={(e) => setSchedulerForm(prev => ({ ...prev, daysToSchedule: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum 365 days</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trips per Depot per Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={schedulerForm.tripsPerDepotPerDay}
                    onChange={(e) => setSchedulerForm(prev => ({ ...prev, tripsPerDepotPerDay: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Recommended: 20</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={schedulerForm.startDate}
                    onChange={(e) => setSchedulerForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <h5 className="font-medium text-gray-900">Options</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={schedulerForm.autoAssignCrew}
                      onChange={(e) => setSchedulerForm(prev => ({ ...prev, autoAssignCrew: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Auto-assign Crew</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={schedulerForm.autoAssignBuses}
                      onChange={(e) => setSchedulerForm(prev => ({ ...prev, autoAssignBuses: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Auto-assign Buses</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={schedulerForm.generateReports}
                      onChange={(e) => setSchedulerForm(prev => ({ ...prev, generateReports: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Generate Reports</span>
                  </label>
                </div>
              </div>

              {/* Target Calculation */}
              <div className="mt-4 bg-blue-50 rounded-lg p-3">
                <h5 className="font-medium text-blue-900 mb-2">Target Calculation</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-blue-700">Total Depots</p>
                    <p className="font-bold text-blue-900">{status?.current?.totalDepots || depotAnalysis?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Days to Schedule</p>
                    <p className="font-bold text-blue-900">{schedulerForm.daysToSchedule}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Trips per Depot/Day</p>
                    <p className="font-bold text-blue-900">{schedulerForm.tripsPerDepotPerDay}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Total Target Trips</p>
                    <p className="font-bold text-blue-900">
                      {((status?.current?.totalDepots || depotAnalysis?.length || 0) * (schedulerForm.daysToSchedule || 0) * (schedulerForm.tripsPerDepotPerDay || 0)) || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Depot Readiness Analysis */}
            {depotAnalysis.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <span>Depot Readiness Analysis</span>
                </h4>
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Depot</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Buses</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Routes</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Drivers</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Conductors</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Readiness</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Max Trips/Day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {depotAnalysis.map((depot, index) => (
                        <tr key={depot.depotId} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{depot.depotName}</p>
                              <p className="text-xs text-gray-500">{depot.depotCode}</p>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              depot.buses > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {depot.buses}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              depot.routes > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {depot.routes}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              depot.drivers > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {depot.drivers}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              depot.conductors > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {depot.conductors}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReadinessColor(depot.readinessScore)}`}>
                              {getReadinessText(depot.readinessScore)}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="font-medium text-gray-900">{depot.maxTripsPerDay}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCleanupTrips}
                  disabled={loading}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Cleanup Future Trips</span>
                </button>
                <button
                  onClick={fetchSchedulerStatus}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Status</span>
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateTrips}
                  disabled={loading || ((status?.current?.totalDepots || 0) === 0 && (depotAnalysis?.length || 0) === 0)}
                  className="px-10 py-4 bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-600 text-white rounded-2xl hover:from-emerald-600 hover:via-cyan-600 hover:to-violet-700 transition-all duration-300 disabled:opacity-50 flex items-center space-x-4 shadow-2xl hover:shadow-3xl transform hover:scale-110 font-bold text-xl border-2 border-white/20 hover:border-white/40 relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #7c3aed 100%)',
                    boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3), 0 10px 20px rgba(124, 58, 237, 0.2)',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                  {loading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Rocket className="w-6 h-6" />
                  )}
                  <span className="relative z-10">🚀 Generate Trips</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BulkTripScheduler;
