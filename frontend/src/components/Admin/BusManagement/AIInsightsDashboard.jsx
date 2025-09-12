import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Brain, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle, Zap, Target, BarChart3, PieChart,
  Activity, Fuel, Wrench, Clock, Star, Award,
  Lightbulb, RefreshCw, Download, Filter, Search
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Pie } from 'recharts';

const AIInsightsDashboard = ({ buses = [], onClose }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('performance');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate AI insights and analytics
  const insights = useMemo(() => {
    if (!buses.length) return null;

    const totalBuses = buses.length;
    const activeBuses = buses.filter(bus => bus.status === 'active').length;
    const maintenanceBuses = buses.filter(bus => bus.status === 'maintenance').length;
    
    // Performance metrics
    const performanceScores = buses.map(bus => bus.insights?.performanceScore || 0);
    const avgPerformance = performanceScores.reduce((acc, score) => acc + score, 0) / totalBuses;
    
    // Fuel efficiency
    const fuelLevels = buses.map(bus => bus.fuel?.currentLevel || 0);
    const avgFuelLevel = fuelLevels.reduce((acc, level) => acc + level, 0) / totalBuses;
    const lowFuelBuses = buses.filter(bus => (bus.fuel?.currentLevel || 0) < 20).length;
    
    // Maintenance insights
    const now = new Date();
    const maintenanceDue = buses.filter(bus => {
      if (!bus.maintenance?.nextService) return false;
      return new Date(bus.maintenance.nextService) <= now;
    }).length;
    
    const maintenanceUpcoming = buses.filter(bus => {
      if (!bus.maintenance?.nextService) return false;
      const serviceDate = new Date(bus.maintenance.nextService);
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return serviceDate <= weekFromNow && serviceDate > now;
    }).length;

    // Efficiency trends
    const efficiencyTrends = buses.map(bus => ({
      busNumber: bus.busNumber,
      performance: bus.insights?.performanceScore || 0,
      fuelEfficiency: bus.fuel?.averageConsumption || 0,
      maintenanceScore: bus.maintenance?.totalDistance ? 
        Math.max(0, 100 - (bus.maintenance.totalDistance / 100000) * 10) : 50
    }));

    // Top performers
    const topPerformers = buses
      .filter(bus => bus.insights?.performanceScore)
      .sort((a, b) => (b.insights?.performanceScore || 0) - (a.insights?.performanceScore || 0))
      .slice(0, 5);

    // Recommendations
    const recommendations = [];
    
    if (lowFuelBuses > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Low Fuel Alert',
        description: `${lowFuelBuses} buses have low fuel levels (<20%)`,
        action: 'Schedule refueling for affected buses',
        priority: 'high'
      });
    }
    
    if (maintenanceDue > 0) {
      recommendations.push({
        type: 'error',
        title: 'Maintenance Overdue',
        description: `${maintenanceDue} buses have overdue maintenance`,
        action: 'Immediately schedule maintenance for overdue buses',
        priority: 'critical'
      });
    }
    
    if (maintenanceUpcoming > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Maintenance Due Soon',
        description: `${maintenanceUpcoming} buses need maintenance within 7 days`,
        action: 'Plan maintenance schedule for upcoming services',
        priority: 'medium'
      });
    }
    
    if (avgPerformance < 70) {
      recommendations.push({
        type: 'info',
        title: 'Performance Optimization',
        description: `Average fleet performance is ${Math.round(avgPerformance)}%`,
        action: 'Review and optimize underperforming buses',
        priority: 'medium'
      });
    }

    // Generate sample time series data
    const generateTimeSeriesData = () => {
      const data = [];
      const days = selectedTimeRange === 'week' ? 7 : selectedTimeRange === 'month' ? 30 : 90;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        data.push({
          date: date.toISOString().split('T')[0],
          performance: Math.round(avgPerformance + (Math.random() - 0.5) * 20),
          fuelEfficiency: Math.round(avgFuelLevel + (Math.random() - 0.5) * 30),
          maintenance: Math.round((maintenanceDue + maintenanceUpcoming) * (0.8 + Math.random() * 0.4)),
          utilization: Math.round(activeBuses / totalBuses * 100 + (Math.random() - 0.5) * 20)
        });
      }
      
      return data;
    };

    return {
      overview: {
        totalBuses,
        activeBuses,
        maintenanceBuses,
        avgPerformance: Math.round(avgPerformance),
        avgFuelLevel: Math.round(avgFuelLevel),
        lowFuelBuses,
        maintenanceDue,
        maintenanceUpcoming
      },
      efficiencyTrends,
      topPerformers,
      recommendations,
      timeSeriesData: generateTimeSeriesData()
    };
  }, [buses, selectedTimeRange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  if (!insights) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-xl p-8 text-center">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No data available for AI insights</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">AI Insights Dashboard</h3>
                <p className="text-sm text-gray-600">Intelligent fleet analytics and recommendations</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Fleet Performance</p>
                    <p className="text-2xl font-bold text-blue-900">{insights.overview.avgPerformance}%</p>
                  </div>
                  <div className="p-3 bg-blue-200 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Active Buses</p>
                    <p className="text-2xl font-bold text-green-900">{insights.overview.activeBuses}</p>
                  </div>
                  <div className="p-3 bg-green-200 rounded-lg">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Maintenance Due</p>
                    <p className="text-2xl font-bold text-yellow-900">{insights.overview.maintenanceDue}</p>
                  </div>
                  <div className="p-3 bg-yellow-200 rounded-lg">
                    <Wrench className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Low Fuel</p>
                    <p className="text-2xl font-bold text-red-900">{insights.overview.lowFuelBuses}</p>
                  </div>
                  <div className="p-3 bg-red-200 rounded-lg">
                    <Fuel className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Trend Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Performance Trend</h4>
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 90 Days</option>
                  </select>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insights.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="performance" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Performance %"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="utilization" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Utilization %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Fleet Distribution */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Fleet Status Distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: insights.overview.activeBuses, color: '#10B981' },
                          { name: 'Maintenance', value: insights.overview.maintenanceBuses, color: '#F59E0B' },
                          { name: 'Retired', value: insights.overview.totalBuses - insights.overview.activeBuses - insights.overview.maintenanceBuses, color: '#6B7280' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {[
                          { name: 'Active', value: insights.overview.activeBuses, color: '#10B981' },
                          { name: 'Maintenance', value: insights.overview.maintenanceBuses, color: '#F59E0B' },
                          { name: 'Retired', value: insights.overview.totalBuses - insights.overview.activeBuses - insights.overview.maintenanceBuses, color: '#6B7280' }
                        ].map((entry, index) => (
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

            {/* Top Performers */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Buses</h4>
              <div className="space-y-3">
                {insights.topPerformers.map((bus, index) => (
                  <motion.div
                    key={bus._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{bus.busNumber}</p>
                        <p className="text-sm text-gray-500">{bus.registrationNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {bus.insights?.performanceScore || 0}%
                        </p>
                        <p className="text-xs text-gray-500">Performance</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor((bus.insights?.performanceScore || 0) / 20)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h4 className="text-lg font-semibold text-gray-900">AI Recommendations</h4>
              </div>
              <div className="space-y-4">
                {insights.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-l-4 ${
                      rec.type === 'error' ? 'bg-red-50 border-red-400' :
                      rec.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                      'bg-blue-50 border-blue-400'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-1 rounded-full ${
                        rec.type === 'error' ? 'bg-red-100' :
                        rec.type === 'warning' ? 'bg-yellow-100' :
                        'bg-blue-100'
                      }`}>
                        {rec.type === 'error' ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : rec.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900">{rec.title}</h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rec.priority === 'critical' ? 'bg-red-100 text-red-700' :
                            rec.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        <p className="text-sm font-medium text-gray-800 mt-2">💡 {rec.action}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AIInsightsDashboard;