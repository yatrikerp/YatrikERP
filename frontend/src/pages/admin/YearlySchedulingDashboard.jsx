import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CalendarDays, Clock, Bus, Route, Users, MapPin, 
  TrendingUp, BarChart3, Target, Sparkles, RefreshCw,
  Play, Pause, Square, CheckCircle, XCircle, AlertTriangle,
  Settings, Download, Upload, Eye, Edit, Trash2,
  Plus, Search, Filter, Navigation, DollarSign,
  Activity, Layers, Cpu, Database, Globe, Shield, Building,
  Zap, Calendar as CalendarIcon, RotateCcw, CalendarCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const YearlySchedulingDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [schedulingLogs, setSchedulingLogs] = useState([]);
  
  // Data states
  const [stats, setStats] = useState({
    totalTrips: 0,
    currentYearTrips: 0,
    monthlyTrips: {},
    seasonalTrips: {},
    weeklyTrips: {},
    totalRoutes: 0,
    totalBuses: 0,
    totalDepots: 0
  });
  
  const [depots, setDepots] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  
  // Yearly scheduling configuration
  const [yearlyConfig, setYearlyConfig] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    selectedDepots: [],
    enableSeasonalAdjustments: true,
    enableHolidayAdjustments: true,
    enableMaintenanceWindows: true,
    enableWeekendSchedules: true,
    crewRotationCycle: 7, // Days
    maintenanceFrequency: 'monthly'
  });
  
  // Pattern configurations
  const [patternConfig, setPatternConfig] = useState({
    weekdayTrips: 29, // 6 AM to 8 PM with 30-min gaps
    weekendTrips: 13, // 7 AM to 7 PM with 1-hour gaps
    seasonalMultipliers: {
      spring: 1.0,
      summer: 1.2,
      autumn: 0.9,
      winter: 0.8
    },
    holidayMultipliers: {
      newYear: 0.5,
      easter: 0.7,
      summerBreak: 0.6,
      diwali: 0.7,
      christmas: 0.5
    }
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching yearly scheduling data...');
      
      const [statsRes, depotsRes, routesRes, busesRes, yearlyStatsRes] = await Promise.all([
        apiFetch('/api/auto-scheduler/stats'),
        apiFetch('/api/admin/depots'),
        apiFetch('/api/admin/routes'),
        apiFetch('/api/admin/buses'),
        apiFetch('/api/auto-scheduler/yearly-stats')
      ]);

      // Process stats
      const statsPayload = statsRes?.data ?? {};
      const statsData = (statsPayload && (statsPayload.data || statsPayload)) || {};
      setStats({
        totalTrips: Number(statsData.totalTrips) || 0,
        currentYearTrips: Number(statsData.scheduledToday) || 0,
        monthlyTrips: yearlyStatsRes?.data?.monthlyTrips || {},
        seasonalTrips: yearlyStatsRes?.data?.seasonalTrips || {},
        weeklyTrips: yearlyStatsRes?.data?.weeklyTrips || {},
        totalRoutes: Number(statsData.totalRoutes) || 0,
        totalBuses: Number(statsData.totalBuses) || 0,
        totalDepots: Number(statsData.totalDepots) || 0
      });
      
      // Extract data
      const extractedDepots = depotsRes?.data?.depots || depotsRes?.data || depotsRes?.depots || depotsRes || [];
      const extractedRoutes = routesRes?.data?.routes || routesRes?.data || routesRes?.routes || routesRes || [];
      const extractedBuses = busesRes?.data?.buses || busesRes?.data?.data?.buses || busesRes?.data || busesRes?.buses || busesRes || [];
      
      setDepots(Array.isArray(extractedDepots) ? extractedDepots : []);
      setRoutes(Array.isArray(extractedRoutes) ? extractedRoutes : []);
      setBuses(Array.isArray(extractedBuses) ? extractedBuses : []);
      
      // Auto-select all depots
      setYearlyConfig(prev => ({
        ...prev,
        selectedDepots: extractedDepots.map(d => d._id)
      }));
      
    } catch (error) {
      console.error('❌ Error fetching yearly scheduling data:', error);
      toast.error('Failed to fetch yearly scheduling data.');
    } finally {
      setLoading(false);
    }
  };

  const startYearlyScheduling = async () => {
    console.log('🚀 Starting yearly scheduling...');
    
    if (!yearlyConfig.startDate || !yearlyConfig.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    if (yearlyConfig.selectedDepots.length === 0) {
      toast.error('Please select at least one depot');
      return;
    }

    try {
      setLoading(true);
      setSchedulerStatus('running');
      setProgress(0);
      setSchedulingLogs([]);
      setCurrentOperation('Initializing yearly scheduling...');

      // Simulate progress updates for yearly scheduling
      const progressSteps = [
        { progress: 5, operation: 'Validating yearly configuration...' },
        { progress: 15, operation: 'Analyzing seasonal patterns...' },
        { progress: 25, operation: 'Setting up holiday schedules...' },
        { progress: 35, operation: 'Configuring maintenance windows...' },
        { progress: 45, operation: 'Generating weekly patterns...' },
        { progress: 60, operation: 'Creating trip schedules...' },
        { progress: 75, operation: 'Assigning buses and crew...' },
        { progress: 90, operation: 'Optimizing yearly schedule...' },
        { progress: 98, operation: 'Finalizing yearly calendar...' }
      ];

      let currentStep = 0;
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          const step = progressSteps[currentStep];
          setProgress(step.progress);
          setCurrentOperation(step.operation);
          currentStep++;
        }
      }, 2000);

      console.log('📡 Making API call to /api/auto-scheduler/yearly-schedule');
      const response = await apiFetch('/api/auto-scheduler/yearly-schedule', {
        method: 'POST',
        body: JSON.stringify({
          ...yearlyConfig,
          patternConfig
        })
      });
      
      console.log('📡 API response received:', response);

      clearInterval(progressInterval);

      const resOk = response.ok === true;
      const payload = response.data || {};
      const backendSuccess = payload.success === true;

      if (resOk && backendSuccess) {
        setProgress(100);
        setCurrentOperation('Yearly scheduling completed successfully');
        setSchedulerStatus('completed');
        
        const data = payload.data || {};
        toast.success(`Yearly scheduling completed! Created ${data.tripsCreated} trips for the entire year`);
        
        // Add success log
        setSchedulingLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          message: `Successfully created ${data.tripsCreated} trips for the entire year`,
          type: 'success'
        }]);
        
        // Update stats
        await fetchInitialData();
        
        // Navigate to trips view
        navigate('/admin/streamlined-trips');
        
      } else {
        const errMsg = payload.message || response.message || payload.error || 'Yearly scheduling failed';
        toast.error(errMsg);
        setSchedulingLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          message: `Failed: ${errMsg}`,
          type: 'error'
        }]);
        throw new Error(errMsg);
      }
    } catch (error) {
      console.error('Error in yearly scheduling:', error);
      toast.error(`Yearly scheduling failed: ${error.message}`);
      setSchedulerStatus('error');
      setCurrentOperation(`Scheduling failed: ${error.message}`);
      setProgress(0);
      
      setSchedulingLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        message: `Error: ${error.message}`,
        type: 'error'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearYearlySchedule = async () => {
    if (!window.confirm('Are you sure you want to clear the entire yearly schedule? This will delete all scheduled trips for the selected period.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch('/api/auto-scheduler/clear-yearly-schedule', {
        method: 'POST',
        body: JSON.stringify({
          startDate: yearlyConfig.startDate,
          endDate: yearlyConfig.endDate
        })
      });

      if (response.success) {
        toast.success('Yearly schedule cleared successfully');
        await fetchInitialData();
      }
    } catch (error) {
      console.error('Error clearing yearly schedule:', error);
      toast.error('Failed to clear yearly schedule');
    } finally {
      setLoading(false);
    }
  };

  const generateYearlyReport = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/auto-scheduler/generate-yearly-report', {
        method: 'POST',
        body: JSON.stringify({
          startDate: yearlyConfig.startDate,
          endDate: yearlyConfig.endDate,
          includeAnalytics: true,
          includeSeasonalData: true,
          includeMonthlyBreakdown: true
        })
      });

      if (response.success) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yearly-scheduling-report-${yearlyConfig.startDate}-to-${yearlyConfig.endDate}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Yearly report generated and downloaded');
      }
    } catch (error) {
      console.error('Error generating yearly report:', error);
      toast.error('Failed to generate yearly report');
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
        <h3 className="text-lg font-semibold text-gray-900">Yearly Scheduling Progress</h3>
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
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-1000 ${
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

  const YearlyConfigurationPanel = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Yearly Scheduling Configuration</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={yearlyConfig.startDate}
              onChange={(e) => setYearlyConfig(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="date"
              value={yearlyConfig.endDate}
              onChange={(e) => setYearlyConfig(prev => ({ ...prev, endDate: e.target.value }))}
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
                      checked={yearlyConfig.selectedDepots.length === depots.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setYearlyConfig(prev => ({
                            ...prev,
                            selectedDepots: depots.map(d => d._id)
                          }));
                        } else {
                          setYearlyConfig(prev => ({
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
                        checked={yearlyConfig.selectedDepots.includes(depot._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setYearlyConfig(prev => ({
                              ...prev,
                              selectedDepots: [...prev.selectedDepots, depot._id]
                            }));
                          } else {
                            setYearlyConfig(prev => ({
                              ...prev,
                              selectedDepots: prev.selectedDepots.filter(id => id !== depot._id)
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{depot.depotName}</span>
                    </label>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Scheduling Options</h4>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={yearlyConfig.enableSeasonalAdjustments}
              onChange={(e) => setYearlyConfig(prev => ({ ...prev, enableSeasonalAdjustments: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable seasonal adjustments (Summer: +20%, Winter: -20%)</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={yearlyConfig.enableHolidayAdjustments}
              onChange={(e) => setYearlyConfig(prev => ({ ...prev, enableHolidayAdjustments: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable holiday schedule adjustments</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={yearlyConfig.enableMaintenanceWindows}
              onChange={(e) => setYearlyConfig(prev => ({ ...prev, enableMaintenanceWindows: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable maintenance windows</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={yearlyConfig.enableWeekendSchedules}
              onChange={(e) => setYearlyConfig(prev => ({ ...prev, enableWeekendSchedules: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable weekend schedule variations</span>
          </label>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Crew Rotation Cycle (days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={yearlyConfig.crewRotationCycle}
              onChange={(e) => setYearlyConfig(prev => ({ ...prev, crewRotationCycle: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const ActionButtons = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Yearly Scheduling Actions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={startYearlyScheduling}
          disabled={loading || schedulerStatus === 'running' || !yearlyConfig.startDate || !yearlyConfig.endDate || yearlyConfig.selectedDepots.length === 0}
          className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center space-x-3"
          title={
            !yearlyConfig.startDate || !yearlyConfig.endDate ? 'Please select start and end dates' :
            yearlyConfig.selectedDepots.length === 0 ? 'Please select at least one depot' :
            loading || schedulerStatus === 'running' ? 'Yearly scheduling in progress...' :
            'Start yearly scheduling'
          }
        >
          <div className="p-2 bg-blue-100 rounded-lg">
            {loading && schedulerStatus === 'running' ? 
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" /> :
              <CalendarDays className="w-5 h-5 text-blue-600" />
            }
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-blue-900">Start Yearly Scheduling</h4>
            <p className="text-sm text-blue-700">Create full year schedule</p>
          </div>
        </button>
        
        <button
          onClick={generateYearlyReport}
          disabled={loading}
          className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center space-x-3"
        >
          <div className="p-2 bg-green-100 rounded-lg">
            <Download className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-green-900">Generate Report</h4>
            <p className="text-sm text-green-700">Download yearly report</p>
          </div>
        </button>
        
        <button
          onClick={clearYearlySchedule}
          disabled={loading || !yearlyConfig.startDate || !yearlyConfig.endDate}
          className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center space-x-3"
        >
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-red-900">Clear Schedule</h4>
            <p className="text-sm text-red-700">Remove yearly trips</p>
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
            <p className="text-sm text-gray-700">Update statistics</p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <CalendarDays className="w-8 h-8 text-purple-600" />
            <span>Yearly Scheduling Dashboard</span>
          </h1>
          <p className="text-gray-600">Automated yearly trip scheduling with cyclical patterns</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInitialData}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard
          title="Total Trips (Year)"
          value={stats.totalTrips || 0}
          icon={CalendarDays}
          color="text-blue-600"
          subtitle="Full year coverage"
        />
        <StatusCard
          title="Current Year Trips"
          value={stats.currentYearTrips || 0}
          icon={CalendarCheck}
          color="text-green-600"
          subtitle="Already scheduled"
        />
        <StatusCard
          title="Total Routes"
          value={routes.length || stats.totalRoutes || 0}
          icon={Route}
          color="text-purple-600"
          subtitle="Active routes"
        />
        <StatusCard
          title="Total Buses"
          value={buses.length || stats.totalBuses || 0}
          icon={Bus}
          color="text-orange-600"
          subtitle="Available buses"
        />
      </div>

      {/* Progress and Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressBar 
          progress={progress} 
          status={schedulerStatus} 
          currentOperation={currentOperation} 
        />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Yearly Schedule Features</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-700">365-day cyclical scheduling</span>
            </div>
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-700">Seasonal adjustments (Summer +20%, Winter -20%)</span>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-700">Weekend vs weekday patterns</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-700">Holiday schedule adjustments</span>
            </div>
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-red-600" />
              <span className="text-sm text-gray-700">Maintenance windows</span>
            </div>
            <div className="flex items-center space-x-3">
              <RotateCcw className="w-5 h-5 text-indigo-600" />
              <span className="text-sm text-gray-700">Automatic crew rotation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <YearlyConfigurationPanel />

      {/* Action Buttons */}
      <ActionButtons />

      {/* Status indicator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {!yearlyConfig.startDate && (
          <p className="text-sm text-red-600 flex items-center">
            <span className="mr-2">⚠️</span>
            Please select a start date to enable yearly scheduling
          </p>
        )}
        {!yearlyConfig.endDate && (
          <p className="text-sm text-red-600 flex items-center">
            <span className="mr-2">⚠️</span>
            Please select an end date to enable yearly scheduling
          </p>
        )}
        {yearlyConfig.startDate && yearlyConfig.endDate && yearlyConfig.selectedDepots.length === 0 && (
          <p className="text-sm text-red-600 flex items-center">
            <span className="mr-2">⚠️</span>
            Please select at least one depot to enable yearly scheduling
          </p>
        )}
        {yearlyConfig.startDate && yearlyConfig.endDate && yearlyConfig.selectedDepots.length > 0 && (
          <p className="text-sm text-green-600 flex items-center">
            <span className="mr-2">✅</span>
            Ready to start yearly scheduling for {yearlyConfig.selectedDepots.length} depot(s) from {yearlyConfig.startDate} to {yearlyConfig.endDate}
          </p>
        )}
      </div>
    </div>
  );
};

export default YearlySchedulingDashboard;

