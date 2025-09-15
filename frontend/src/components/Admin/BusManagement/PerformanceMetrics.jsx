import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, BarChart3, PieChart, Activity, 
  Fuel, Clock, Users, MapPin, Gauge, Target, Award, Star,
  AlertTriangle, CheckCircle, XCircle, RefreshCw, Download,
  Filter, Calendar, Zap, Shield, Database, Cloud, Eye
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Pie } from 'recharts';
import { toast } from 'react-hot-toast';

const PerformanceMetrics = ({ bus, onMetricsUpdate, timeRange = '24h' }) => {
  const [metrics, setMetrics] = useState({
    performance: {
      overall: 0,
      efficiency: 0,
      reliability: 0,
      safety: 0,
      customerSatisfaction: 0,
      lastCalculated: null
    },
    operational: {
      totalTrips: 0,
      completedTrips: 0,
      onTimePerformance: 0,
      averageDelay: 0,
      passengerSatisfaction: 0,
      fuelEfficiency: 0,
      maintenanceScore: 0
    },
    financial: {
      revenue: 0,
      costs: 0,
      profit: 0,
      costPerKm: 0,
      revenuePerTrip: 0,
      utilization: 0
    },
    technical: {
      engineHours: 0,
      totalDistance: 0,
      averageSpeed: 0,
      fuelConsumption: 0,
      maintenanceCost: 0,
      downtime: 0
    }
  });

  const [historicalData, setHistoricalData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [benchmarks, setBenchmarks] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('performance');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Enhanced error handling
  const handleError = useCallback((error, operation) => {
    console.error(`${operation} error:`, error);
    setError(`${operation} failed: ${error.message}`);
    toast.error(`${operation} operation failed`);
  }, []);

  // Calculate comprehensive performance metrics
  const calculatePerformanceMetrics = useCallback((rawData) => {
    try {
      const {
        trips = [],
        fuel = [],
        maintenance = [],
        passengerFeedback = [],
        operationalData = {}
      } = rawData;

      // Performance Score Calculation (0-100)
      const completedTrips = trips.filter(trip => trip.status === 'completed').length;
      const totalTrips = trips.length;
      const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;

      // On-time performance calculation
      const onTimeTrips = trips.filter(trip => {
        const scheduledTime = new Date(trip.scheduledDeparture);
        const actualTime = new Date(trip.actualDeparture);
        const delayMinutes = (actualTime - scheduledTime) / (1000 * 60);
        return delayMinutes <= 5; // Consider on-time if within 5 minutes
      }).length;
      const onTimePerformance = totalTrips > 0 ? (onTimeTrips / totalTrips) * 100 : 0;

      // Fuel efficiency calculation
      const totalFuel = fuel.reduce((sum, record) => sum + (record.consumption || 0), 0);
      const totalDistance = operationalData.totalDistance || 0;
      const fuelEfficiency = totalDistance > 0 ? (totalDistance / totalFuel) : 0;

      // Maintenance score calculation
      const maintenanceScore = maintenance.length > 0 ? 
        Math.max(0, 100 - (maintenance.reduce((sum, record) => sum + (record.cost || 0), 0) / 1000)) : 100;

      // Customer satisfaction calculation
      const avgSatisfaction = passengerFeedback.length > 0 ?
        passengerFeedback.reduce((sum, feedback) => sum + (feedback.rating || 0), 0) / passengerFeedback.length : 0;
      const customerSatisfaction = (avgSatisfaction / 5) * 100; // Assuming 5-star rating

      // Overall performance calculation (weighted average)
      const overallPerformance = Math.round(
        (completionRate * 0.25) +
        (onTimePerformance * 0.25) +
        (fuelEfficiency * 0.15) +
        (maintenanceScore * 0.15) +
        (customerSatisfaction * 0.20)
      );

      // Safety score calculation
      const safetyIncidents = operationalData.safetyIncidents || 0;
      const safetyScore = Math.max(0, 100 - (safetyIncidents * 10));

      // Reliability score calculation
      const breakdowns = operationalData.breakdowns || 0;
      const reliabilityScore = Math.max(0, 100 - (breakdowns * 5));

      return {
        performance: {
          overall: Math.max(0, Math.min(100, overallPerformance)),
          efficiency: Math.round(fuelEfficiency * 10), // Scale to 0-100
          reliability: Math.max(0, Math.min(100, reliabilityScore)),
          safety: Math.max(0, Math.min(100, safetyScore)),
          customerSatisfaction: Math.max(0, Math.min(100, customerSatisfaction)),
          lastCalculated: new Date()
        },
        operational: {
          totalTrips,
          completedTrips,
          onTimePerformance: Math.max(0, Math.min(100, onTimePerformance)),
          averageDelay: operationalData.averageDelay || 0,
          passengerSatisfaction: Math.max(0, Math.min(100, customerSatisfaction)),
          fuelEfficiency: Math.max(0, Math.min(100, fuelEfficiency * 10)),
          maintenanceScore: Math.max(0, Math.min(100, maintenanceScore))
        },
        financial: {
          revenue: operationalData.revenue || 0,
          costs: operationalData.costs || 0,
          profit: (operationalData.revenue || 0) - (operationalData.costs || 0),
          costPerKm: totalDistance > 0 ? (operationalData.costs || 0) / totalDistance : 0,
          revenuePerTrip: totalTrips > 0 ? (operationalData.revenue || 0) / totalTrips : 0,
          utilization: Math.max(0, Math.min(100, (operationalData.utilization || 0) * 100))
        },
        technical: {
          engineHours: operationalData.engineHours || 0,
          totalDistance,
          averageSpeed: operationalData.averageSpeed || 0,
          fuelConsumption: totalFuel,
          maintenanceCost: maintenance.reduce((sum, record) => sum + (record.cost || 0), 0),
          downtime: operationalData.downtime || 0
        }
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return null;
    }
  }, []);

  // Fetch performance data
  const fetchPerformanceData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // Fetch comprehensive data
      const [tripsResponse, fuelResponse, maintenanceResponse, feedbackResponse, operationalResponse] = await Promise.all([
        fetch(`/api/buses/${bus._id}/trips?timeRange=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/buses/${bus._id}/fuel?timeRange=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/buses/${bus._id}/maintenance?timeRange=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/buses/${bus._id}/feedback?timeRange=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/buses/${bus._id}/operational?timeRange=${timeRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Check all responses
      const responses = [tripsResponse, fuelResponse, maintenanceResponse, feedbackResponse, operationalResponse];
      const failedResponses = responses.filter(response => !response.ok);
      
      if (failedResponses.length > 0) {
        throw new Error(`Failed to fetch data from ${failedResponses.length} endpoints`);
      }

      // Parse all responses
      const [trips, fuel, maintenance, feedback, operational] = await Promise.all(
        responses.map(response => response.json())
      );

      const rawData = {
        trips: trips.success ? trips.data : [],
        fuel: fuel.success ? fuel.data : [],
        maintenance: maintenance.success ? maintenance.data : [],
        passengerFeedback: feedback.success ? feedback.data : [],
        operationalData: operational.success ? operational.data : {}
      };

      // Calculate metrics
      const calculatedMetrics = calculatePerformanceMetrics(rawData);
      
      if (calculatedMetrics) {
        setMetrics(calculatedMetrics);
        setLastUpdate(new Date());
        
        // Fetch historical data for trends
        await fetchHistoricalData();
        
        // Fetch comparison data
        await fetchComparisonData();
        
        onMetricsUpdate?.(calculatedMetrics);
      } else {
        throw new Error('Failed to calculate performance metrics');
      }
    } catch (error) {
      handleError(error, 'Fetch Performance Data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch historical data for trend analysis
  const fetchHistoricalData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buses/${bus._id}/metrics/historical?days=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setHistoricalData(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  // Fetch comparison data (fleet average, top performers)
  const fetchComparisonData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/buses/metrics/benchmarks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setBenchmarks(result.data || {});
        }
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    }
  };

  // Auto-refresh metrics
  useEffect(() => {
    fetchPerformanceData();
    
    const interval = setInterval(fetchPerformanceData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [bus._id, timeRange]);

  // Get performance color based on score
  const getPerformanceColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  // Get trend icon and color
  const getTrendIcon = (current, previous) => {
    if (current > previous) return { icon: TrendingUp, color: 'text-green-600' };
    if (current < previous) return { icon: TrendingDown, color: 'text-red-600' };
    return { icon: Activity, color: 'text-gray-600' };
  };

  // Generate chart data
  const chartData = useMemo(() => {
    if (historicalData.length === 0) return [];

    return historicalData.map(record => ({
      date: new Date(record.date).toLocaleDateString(),
      performance: record.performance || 0,
      efficiency: record.efficiency || 0,
      reliability: record.reliability || 0,
      safety: record.safety || 0
    }));
  }, [historicalData]);

  // Performance indicators data for pie chart
  const performanceIndicators = [
    { name: 'Efficiency', value: metrics.performance.efficiency, color: '#10B981' },
    { name: 'Reliability', value: metrics.performance.reliability, color: '#3B82F6' },
    { name: 'Safety', value: metrics.performance.safety, color: '#F59E0B' },
    { name: 'Customer Satisfaction', value: metrics.performance.customerSatisfaction, color: '#8B5CF6' }
  ];

  // Add null check for bus object after all hooks
  if (!bus || !bus._id) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No bus data available</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Performance Metrics</h3>
            <p className="text-sm text-gray-600">{bus.busNumber} • Last updated: {lastUpdate.toLocaleTimeString()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchPerformanceData}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <select
            value={timeRange}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
        >
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Overall Performance Score */}
      <div className="mb-6">
        <div className={`p-6 rounded-xl ${getPerformanceColor(metrics.performance.overall)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold">Overall Performance</h4>
              <p className="text-sm opacity-75">Comprehensive bus performance score</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{metrics.performance.overall}%</div>
              <div className="flex items-center space-x-1 mt-1">
                <Star className="w-4 h-4" />
                <span className="text-sm">
                  {metrics.performance.overall >= 90 ? 'Excellent' :
                   metrics.performance.overall >= 80 ? 'Good' :
                   metrics.performance.overall >= 70 ? 'Average' :
                   metrics.performance.overall >= 60 ? 'Below Average' : 'Poor'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicators Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Fuel className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.performance.efficiency}%</p>
          <p className="text-sm text-gray-500">Efficiency</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Shield className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.performance.reliability}%</p>
          <p className="text-sm text-gray-500">Reliability</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.performance.safety}%</p>
          <p className="text-sm text-gray-500">Safety</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.performance.customerSatisfaction}%</p>
          <p className="text-sm text-gray-500">Customer Satisfaction</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance Trend Chart */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Performance Trend</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="performance" stroke="#8B5CF6" strokeWidth={2} name="Performance %" />
                <Line type="monotone" dataKey="efficiency" stroke="#10B981" strokeWidth={2} name="Efficiency %" />
                <Line type="monotone" dataKey="reliability" stroke="#3B82F6" strokeWidth={2} name="Reliability %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Distribution */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Performance Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={performanceIndicators}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {performanceIndicators.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Operational</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Trips</span>
              <span className="text-sm font-medium">{metrics.operational.totalTrips}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="text-sm font-medium">{metrics.operational.completedTrips}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">On-Time Performance</span>
              <span className="text-sm font-medium">{metrics.operational.onTimePerformance.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Delay</span>
              <span className="text-sm font-medium">{metrics.operational.averageDelay.toFixed(1)} min</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Financial</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Revenue</span>
              <span className="text-sm font-medium">₹{metrics.financial.revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Costs</span>
              <span className="text-sm font-medium">₹{metrics.financial.costs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Profit</span>
              <span className={`text-sm font-medium ${
                metrics.financial.profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{metrics.financial.profit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Utilization</span>
              <span className="text-sm font-medium">{metrics.financial.utilization.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Technical</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Distance</span>
              <span className="text-sm font-medium">{metrics.technical.totalDistance.toLocaleString()} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Engine Hours</span>
              <span className="text-sm font-medium">{metrics.technical.engineHours.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Speed</span>
              <span className="text-sm font-medium">{metrics.technical.averageSpeed.toFixed(1)} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Downtime</span>
              <span className="text-sm font-medium">{metrics.technical.downtime.toFixed(1)} hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Comparison */}
      {benchmarks.fleetAverage && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Fleet Comparison</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Your Performance</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.performance.overall}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Fleet Average</p>
              <p className="text-2xl font-bold text-blue-600">{benchmarks.fleetAverage}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Top Performer</p>
              <p className="text-2xl font-bold text-green-600">{benchmarks.topPerformer}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Rank</p>
              <p className="text-2xl font-bold text-purple-600">#{benchmarks.rank || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl"
        >
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
            <span className="text-sm text-gray-600">Calculating metrics...</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PerformanceMetrics;
