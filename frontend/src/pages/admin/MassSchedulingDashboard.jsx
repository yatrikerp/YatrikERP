import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Bus, Route, Calendar, Users, MapPin, Clock,
  TrendingUp, BarChart3, Target, Sparkles, RefreshCw,
  Play, Pause, Square, CheckCircle, XCircle, AlertTriangle,
  Settings, Download, Upload, Eye, Edit, Trash2,
  Plus, Search, Filter, Navigation, DollarSign,
  Activity, Layers, Cpu, Database, Globe, Shield, Building
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const MassSchedulingDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [schedulingLogs, setSchedulingLogs] = useState([]);
  
  // Data states
  const [stats, setStats] = useState({
    totalBuses: 0,
    totalRoutes: 0,
    totalTrips: 0,
    scheduledToday: 0,
    activeTrips: 0,
    utilizationRate: 0,
    efficiencyScore: 0
  });
  
  const [depots, setDepots] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [trips, setTrips] = useState([]);
  
  // Scheduling configuration
  const [schedulerConfig, setSchedulerConfig] = useState({
    targetDate: new Date().toISOString().split('T')[0], // Default to today
    selectedDepots: [],
    maxTripsPerRoute: 8,
    timeGap: 30,
    autoAssignCrew: true,
    autoAssignBuses: true,
    generateReports: true
  });
  
  // Real-time updates
  const [realtimeStats, setRealtimeStats] = useState({
    tripsCreated: 0,
    busesAssigned: 0,
    driversAssigned: 0,
    conductorsAssigned: 0,
    errors: 0,
    warnings: 0
  });

  useEffect(() => {
    fetchInitialData();
    // Set up real-time updates
    const interval = setInterval(fetchRealtimeStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching initial data for Mass Scheduling Dashboard...');
      
      const [statsRes, depotsRes, routesRes, busesRes, tripsRes] = await Promise.all([
        apiFetch('/api/auto-scheduler/stats'),
        apiFetch('/api/admin/depots'),
        apiFetch('/api/admin/routes'),
        apiFetch('/api/admin/buses'),
        apiFetch('/api/admin/trips')
      ]);

      console.log('📊 Raw API responses:', {
        stats: statsRes,
        depots: depotsRes,
        routes: routesRes,
        buses: busesRes,
        trips: tripsRes
      });

      // Ensure stats are properly formatted (support nested { success, data })
      const statsPayload = statsRes?.data ?? {};
      const statsData = (statsPayload && (statsPayload.data || statsPayload)) || {};
      setStats({
        totalBuses: Number(statsData.totalBuses) || 0,
        totalRoutes: Number(statsData.totalRoutes) || 0,
        scheduledToday: Number(statsData.scheduledToday) || 0,
        efficiencyScore: Number(statsData.efficiencyScore) || 0,
        utilizationRate: Number(statsData.utilizationRate) || 0
      });
      
      // Enhanced data extraction with better error handling
      const extractedDepots = depotsRes?.data?.depots || depotsRes?.data || depotsRes?.depots || depotsRes || [];
      const extractedRoutes = routesRes?.data?.routes || routesRes?.data || routesRes?.routes || routesRes || [];
      const extractedBuses = busesRes?.data?.buses || busesRes?.data?.data?.buses || busesRes?.data || busesRes?.buses || busesRes || [];
      const extractedTrips = tripsRes?.data?.data?.trips || tripsRes?.data?.trips || tripsRes?.data || tripsRes?.trips || tripsRes || [];
      
      console.log('📈 Extracted data counts:', {
        depots: extractedDepots.length,
        routes: extractedRoutes.length,
        buses: extractedBuses.length,
        trips: extractedTrips.length
      });
      
      setDepots(Array.isArray(extractedDepots) ? extractedDepots : []);
      setRoutes(Array.isArray(extractedRoutes) ? extractedRoutes : []);
      setBuses(Array.isArray(extractedBuses) ? extractedBuses : []);
      setTrips(Array.isArray(extractedTrips) ? extractedTrips : []);
      
      // Show data availability status
      if (extractedBuses.length === 0) {
        console.warn('⚠️ No buses found - check if buses are created in Streamlined Bus Management');
        toast.error('No buses found. Please create buses in Streamlined Bus Management first.');
      }
      if (extractedRoutes.length === 0) {
        console.warn('⚠️ No routes found - check if routes are created in Streamlined Route Management');
        toast.error('No routes found. Please create routes in Streamlined Route Management first.');
      }
      if (extractedDepots.length === 0) {
        console.warn('⚠️ No depots found - check if depots are created');
        toast.error('No depots found. Please create depots first.');
      }
      
    } catch (error) {
      console.error('❌ Error fetching initial data:', error);
      toast.error('Failed to fetch initial data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeStats = async () => {
    try {
      const response = await apiFetch('/api/auto-scheduler/realtime-stats');
      const payload = response?.data ?? {};
      const realtimeData = (payload && (payload.data || payload)) || {};
      setRealtimeStats({
        tripsCreated: Number(realtimeData.tripsCreated) || 0,
        busesAssigned: Number(realtimeData.busesAssigned) || 0,
        driversAssigned: Number(realtimeData.driversAssigned) || 0,
        conductorsAssigned: Number(realtimeData.conductorsAssigned) || 0,
        errors: Number(realtimeData.errors) || 0,
        warnings: Number(realtimeData.warnings) || 0
      });
    } catch (error) {
      console.error('Error fetching realtime stats:', error);
    }
  };

  const startMassScheduling = async () => {
    console.log('🚀 Starting mass scheduling...');
    console.log('Current config:', schedulerConfig);
    console.log('Available depots:', depots);
    
    if (!schedulerConfig.targetDate) {
      console.log('❌ No target date selected');
      toast.error('Please select a target date');
      return;
    }

    if (schedulerConfig.selectedDepots.length === 0) {
      console.log('❌ No depots selected');
      toast.error('Please select at least one depot');
      return;
    }

    if (depots.length === 0) {
      console.log('❌ No depots available');
      toast.error('No depots available. Please create depots first.');
      return;
    }

    try {
      console.log('✅ Validation passed, starting scheduling...');
      setLoading(true);
      setSchedulerStatus('running');
      setProgress(0);
      setSchedulingLogs([]);
      setCurrentOperation('Initializing mass scheduling...');

      // Simulate progress updates
      const progressSteps = [
        { progress: 10, operation: 'Validating configuration...' },
        { progress: 25, operation: 'Fetching available buses and routes...' },
        { progress: 40, operation: 'Assigning drivers and conductors...' },
        { progress: 60, operation: 'Creating trip schedules...' },
        { progress: 80, operation: 'Optimizing routes...' },
        { progress: 95, operation: 'Finalizing schedules...' }
      ];

      let currentStep = 0;
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          const step = progressSteps[currentStep];
          setProgress(step.progress);
          setCurrentOperation(step.operation);
          currentStep++;
        }
      }, 800);

      console.log('📡 Making API call to /api/auto-scheduler/mass-schedule');
      const response = await apiFetch('/api/auto-scheduler/mass-schedule', {
        method: 'POST',
        body: JSON.stringify({
          ...schedulerConfig,
          date: schedulerConfig.targetDate
        })
      });
      
      console.log('📡 API response received:', response);

      clearInterval(progressInterval);

      const resOk = response.ok === true;
      const payload = response.data || {};
      const backendSuccess = payload.success === true;

      if (resOk && backendSuccess) {
        setProgress(100);
        setCurrentOperation('Scheduling completed successfully');
        setSchedulerStatus('completed');
        
        const data = payload.data || {};
        toast.success(`Mass scheduling completed! Created ${data.tripsCreated} trips with ${data.successRate} success rate`);
        
        // Update real-time stats with actual results
        setRealtimeStats({
          tripsCreated: data.tripsCreated || 0,
          busesAssigned: data.busesAssigned || 0,
          driversAssigned: data.driversAssigned || 0,
          conductorsAssigned: data.conductorsAssigned || 0,
          errors: 0,
          warnings: 0
        });
        
        // Update main stats
        await fetchInitialData();
        
        // Add success log
        setSchedulingLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          message: `Successfully created ${data.tripsCreated} trips for ${data.totalRoutes} routes`,
          type: 'success'
        }]);
        
        // Deep link to Trips with the target date so user can see results immediately
        if (data.date) {
          navigate(`/admin/streamlined-trips?date=${encodeURIComponent(data.date)}`);
        }
        
        // Surface backend warnings if any
        if (Array.isArray(data.warnings) && data.warnings.length > 0) {
          data.warnings.slice(0, 3).forEach(w => setSchedulingLogs(prev => [...prev, {
            timestamp: new Date().toLocaleTimeString(),
            message: `Warning: ${w}`,
            type: 'warning'
          }]));
        }
      } else {
        // Show backend error message
        const errMsg = payload.message || response.message || payload.error || 'Scheduling failed';
        toast.error(errMsg);
        setSchedulingLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          message: `Failed: ${errMsg}`,
          type: 'error'
        }]);
        throw new Error(errMsg);
      }
    } catch (error) {
      console.error('Error in mass scheduling:', error);
      toast.error(`Mass scheduling failed: ${error.message}`);
      setSchedulerStatus('error');
      setCurrentOperation(`Scheduling failed: ${error.message}`);
      setProgress(0);
      
      // Add error log
      setSchedulingLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        message: `Error: ${error.message}`,
        type: 'error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const stopScheduling = async () => {
    try {
      await apiFetch('/api/auto-scheduler/stop', { method: 'POST' });
      setSchedulerStatus('stopped');
      setCurrentOperation('Scheduling stopped by user');
      toast.info('Scheduling stopped');
    } catch (error) {
      console.error('Error stopping scheduler:', error);
      toast.error('Failed to stop scheduler');
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/auto-scheduler/generate-report', {
        method: 'POST',
        body: JSON.stringify({
          date: schedulerConfig.targetDate,
          includeAnalytics: true,
          includeRecommendations: true
        })
      });

      if (response.success) {
        // Trigger download
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scheduling-report-${schedulerConfig.targetDate}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Report generated and downloaded');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };


  const clearSchedule = async () => {
    if (!window.confirm('Are you sure you want to clear all scheduled trips for this date?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch('/api/auto-scheduler/clear-schedule', {
        method: 'POST',
        body: JSON.stringify({
          date: schedulerConfig.targetDate
        })
      });

      if (response.success) {
        toast.success('Schedule cleared successfully');
        await fetchInitialData();
      }
    } catch (error) {
      console.error('Error clearing schedule:', error);
      toast.error('Failed to clear schedule');
    } finally {
      setLoading(false);
    }
  };

  const StatusCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>
            {typeof value === 'object' ? JSON.stringify(value) : String(value || 0)}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ progress, status, currentOperation }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Scheduling Progress</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          status === 'running' ? 'bg-blue-100 text-blue-800' :
          status === 'completed' ? 'bg-green-100 text-green-800' :
          status === 'error' ? 'bg-red-100 text-red-800' :
          status === 'stopped' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              status === 'completed' ? 'bg-green-500' :
              status === 'error' ? 'bg-red-500' :
              status === 'stopped' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {currentOperation && (
        <p className="text-sm text-gray-600">{currentOperation}</p>
      )}
      
      {/* Scheduling Logs */}
      {schedulingLogs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Activity Log</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {schedulingLogs.slice(-5).reverse().map((log, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs">
                <span className="text-gray-400">{log.timestamp}</span>
                <span className={`px-2 py-1 rounded-full ${
                  log.type === 'success' ? 'bg-green-100 text-green-800' :
                  log.type === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {log.type}
                </span>
                <span className="text-gray-600">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const RealtimeStats = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{Number(realtimeStats.tripsCreated) || 0}</p>
          <p className="text-sm text-gray-600">Trips Created</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{Number(realtimeStats.busesAssigned) || 0}</p>
          <p className="text-sm text-gray-600">Buses Assigned</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{Number(realtimeStats.driversAssigned) || 0}</p>
          <p className="text-sm text-gray-600">Drivers Assigned</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">{Number(realtimeStats.conductorsAssigned) || 0}</p>
          <p className="text-sm text-gray-600">Conductors Assigned</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{Number(realtimeStats.errors) || 0}</p>
          <p className="text-sm text-gray-600">Errors</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{Number(realtimeStats.warnings) || 0}</p>
          <p className="text-sm text-gray-600">Warnings</p>
        </div>
      </div>
    </div>
  );

  const ConfigurationPanel = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduling Configuration</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Date *
            </label>
            <input
              type="date"
              value={schedulerConfig.targetDate}
              onChange={(e) => setSchedulerConfig(prev => ({ ...prev, targetDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Depots *
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {depots.length === 0 ? (
                <p className="text-sm text-gray-500">No depots available. Please create depots first.</p>
              ) : (
                <>
                  <label className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={schedulerConfig.selectedDepots.length === depots.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSchedulerConfig(prev => ({
                            ...prev,
                            selectedDepots: depots.map(d => d._id)
                          }));
                        } else {
                          setSchedulerConfig(prev => ({
                            ...prev,
                            selectedDepots: []
                          }));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Select All</span>
                  </label>
                  {depots.map(depot => (
                    <label key={depot._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={schedulerConfig.selectedDepots.includes(depot._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSchedulerConfig(prev => ({
                              ...prev,
                              selectedDepots: [...prev.selectedDepots, depot._id]
                            }));
                          } else {
                            setSchedulerConfig(prev => ({
                              ...prev,
                              selectedDepots: prev.selectedDepots.filter(id => id !== depot._id)
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{depot.depotName}</span>
                      <span className="text-xs text-gray-500">
                        ({depot.location?.city || depot.location?.address || 'Location not set'})
                      </span>
                    </label>
                  ))}
                </>
              )}
            </div>
            {schedulerConfig.selectedDepots.length > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                {schedulerConfig.selectedDepots.length} depot(s) selected
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Trips per Route
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={schedulerConfig.maxTripsPerRoute}
              onChange={(e) => setSchedulerConfig(prev => ({ ...prev, maxTripsPerRoute: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Gap (minutes)
            </label>
            <input
              type="number"
              min="15"
              max="120"
              value={schedulerConfig.timeGap}
              onChange={(e) => setSchedulerConfig(prev => ({ ...prev, timeGap: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Optimization Options</h4>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={schedulerConfig.autoAssignCrew}
              onChange={(e) => setSchedulerConfig(prev => ({ ...prev, autoAssignCrew: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-assign drivers and conductors</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={schedulerConfig.autoAssignBuses}
              onChange={(e) => setSchedulerConfig(prev => ({ ...prev, autoAssignBuses: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-assign buses to routes</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={schedulerConfig.generateReports}
              onChange={(e) => setSchedulerConfig(prev => ({ ...prev, generateReports: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Generate scheduling reports</span>
          </label>
        </div>
      </div>
    </div>
  );

  const ActionButtons = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduling Actions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => {
            console.log('Start Scheduling clicked');
            console.log('Config:', schedulerConfig);
            console.log('Depots available:', depots.length);
            console.log('Selected depots:', schedulerConfig.selectedDepots.length);
            startMassScheduling();
          }}
          disabled={loading || schedulerStatus === 'running' || !schedulerConfig.targetDate || schedulerConfig.selectedDepots.length === 0}
          className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center space-x-3"
          title={
            !schedulerConfig.targetDate ? 'Please select a target date' :
            schedulerConfig.selectedDepots.length === 0 ? 'Please select at least one depot' :
            loading || schedulerStatus === 'running' ? 'Scheduling in progress...' :
            'Start mass scheduling'
          }
        >
          <div className="p-2 bg-blue-100 rounded-lg">
            {loading && schedulerStatus === 'running' ? 
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" /> :
              <Play className="w-5 h-5 text-blue-600" />
            }
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-blue-900">Start Scheduling</h4>
            <p className="text-sm text-blue-700">Begin mass scheduling process</p>
          </div>
        </button>
        
        <button
          onClick={stopScheduling}
          disabled={schedulerStatus !== 'running'}
          className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center space-x-3"
        >
          <div className="p-2 bg-red-100 rounded-lg">
            <Square className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-red-900">Stop Scheduling</h4>
            <p className="text-sm text-red-700">Stop current operation</p>
          </div>
        </button>
        
        
        <button
          onClick={generateReport}
          disabled={loading}
          className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center space-x-3"
        >
          <div className="p-2 bg-green-100 rounded-lg">
            <Download className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-green-900">Generate Report</h4>
            <p className="text-sm text-green-700">Download scheduling report</p>
          </div>
        </button>
        
        <button
          onClick={clearSchedule}
          disabled={loading || !schedulerConfig.targetDate}
          className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50 flex items-center space-x-3"
        >
          <div className="p-2 bg-orange-100 rounded-lg">
            <Trash2 className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-orange-900">Clear Schedule</h4>
            <p className="text-sm text-orange-700">Remove all scheduled trips</p>
          </div>
        </button>
        
        <button
          onClick={fetchInitialData}
          disabled={loading}
          className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center space-x-3"
        >
          <div className="p-2 bg-gray-100 rounded-lg">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">Refresh Data</h4>
            <p className="text-sm text-gray-700">Update all statistics</p>
          </div>
        </button>
      </div>
      
      {/* Status indicator */}
      <div className="mt-4 p-3 rounded-lg bg-gray-50">
        {!schedulerConfig.targetDate && (
          <p className="text-sm text-red-600 flex items-center">
            <span className="mr-2">⚠️</span>
            Please select a target date to enable scheduling
          </p>
        )}
        {schedulerConfig.targetDate && schedulerConfig.selectedDepots.length === 0 && (
          <p className="text-sm text-red-600 flex items-center">
            <span className="mr-2">⚠️</span>
            Please select at least one depot to enable scheduling
          </p>
        )}
        {schedulerConfig.targetDate && schedulerConfig.selectedDepots.length > 0 && (
          <p className="text-sm text-green-600 flex items-center">
            <span className="mr-2">✅</span>
            Ready to start scheduling for {schedulerConfig.selectedDepots.length} depot(s)
          </p>
        )}
        {depots.length === 0 && (
          <p className="text-sm text-yellow-600 flex items-center">
            <span className="mr-2">⚠️</span>
            No depots available. Please create depots first.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Zap className="w-8 h-8 text-purple-600" />
            <span>Mass Scheduling Dashboard</span>
          </h1>
          <p className="text-gray-600">Automated fleet scheduling with automatic assignments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInitialData}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full ${
              schedulerStatus === 'running' ? 'bg-green-500 animate-pulse' :
              schedulerStatus === 'completed' ? 'bg-green-500' :
              schedulerStatus === 'error' ? 'bg-red-500' :
              'bg-gray-400'
            }`} />
            <span>System Status: {schedulerStatus}</span>
          </div>
        </div>
      </div>

      {/* Data Status Alert */}
      {(buses.length === 0 || routes.length === 0 || depots.length === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800">Data Setup Required</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {depots.length === 0 && (
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-yellow-800">No Depots Found</h4>
                  <span className="text-red-500">❌</span>
                </div>
                <p className="text-sm text-yellow-700 mb-3">Create depots to enable mass scheduling</p>
                <button
                  onClick={() => navigate('/admin/depots')}
                  className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                >
                  Create Depots
                </button>
              </div>
            )}
            {buses.length === 0 && (
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-yellow-800">No Buses Found</h4>
                  <span className="text-red-500">❌</span>
                </div>
                <p className="text-sm text-yellow-700 mb-3">Create buses in Streamlined Bus Management</p>
                <button
                  onClick={() => navigate('/admin/streamlined-buses')}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Create Buses
                </button>
              </div>
            )}
            {routes.length === 0 && (
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-yellow-800">No Routes Found</h4>
                  <span className="text-red-500">❌</span>
                </div>
                <p className="text-sm text-yellow-700 mb-3">Create routes in Streamlined Route Management</p>
                <button
                  onClick={() => navigate('/admin/streamlined-routes')}
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Create Routes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard
          title="Total Buses"
          value={buses.length || stats.totalBuses || 0}
          icon={Bus}
          color="text-blue-600"
          subtitle={`${buses.filter(b => b.status === 'active').length} active`}
        />
        <StatusCard
          title="Total Routes"
          value={routes.length || stats.totalRoutes || 0}
          icon={Route}
          color="text-green-600"
          subtitle={`${routes.filter(r => r.status === 'active').length} active`}
        />
        <StatusCard
          title="Scheduled Today"
          value={trips.filter(t => new Date(t.serviceDate).toDateString() === new Date().toDateString()).length || stats.scheduledToday || 0}
          icon={Calendar}
          color="text-purple-600"
          subtitle="Trips scheduled"
        />
        <StatusCard
          title="Total Depots"
          value={depots.length || 0}
          icon={Building}
          color="text-indigo-600"
          subtitle="Available depots"
        />
      </div>

      {/* Progress and Real-time Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressBar 
          progress={progress} 
          status={schedulerStatus} 
          currentOperation={currentOperation} 
        />
        <RealtimeStats />
      </div>

      {/* Data Integration Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Integration Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-3">
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Streamlined Bus Management</h4>
            <p className="text-sm text-gray-600 mb-2">
              {buses.length > 0 ? `${buses.length} buses available` : 'No buses found'}
            </p>
            <button
              onClick={() => navigate('/admin/streamlined-buses')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Bus Management →
            </button>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-3">
              <Route className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Streamlined Route Management</h4>
            <p className="text-sm text-gray-600 mb-2">
              {routes.length > 0 ? `${routes.length} routes available` : 'No routes found'}
            </p>
            <button
              onClick={() => navigate('/admin/streamlined-routes')}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View Route Management →
            </button>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-3">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Streamlined Trip Management</h4>
            <p className="text-sm text-gray-600 mb-2">
              {trips.length > 0 ? `${trips.length} trips created` : 'No trips found'}
            </p>
            <button
              onClick={() => navigate('/admin/streamlined-trips')}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View Trip Management →
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <ConfigurationPanel />

      {/* Action Buttons */}
      <ActionButtons />

      {/* System Health */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-3">
              <Database className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Database</h4>
            <p className="text-sm text-green-600">Connected</p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-3">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Auto Scheduler</h4>
            <p className="text-sm text-green-600">Ready</p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-3">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Security</h4>
            <p className="text-sm text-green-600">Protected</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MassSchedulingDashboard;
