import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Bus, 
  Route, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Plus,
  Download,
  Settings,
  Activity,
  MapPin,
  Calendar,
  BarChart3
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const ModernDashboard = () => {
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    runningTrips: 0,
    todayRevenue: 0,
    pendingBookings: 0
  });

  const [alerts, setAlerts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  // Fetch real data from backend
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await apiFetch('/api/admin/dashboard', {
        suppressLogout: true,
        suppressError: true
      });
      
      if (res.ok) {
        const data = res.data;
        if (data.success || data.kpis) {
          setSystemStats({
            totalUsers: data.stats?.totalUsers || data.kpis?.users || 0,
            runningTrips: data.stats?.runningTrips || data.kpis?.runningTrips || 0,
            todayRevenue: data.stats?.todayRevenue || data.kpis?.todayRevenue || 0,
            pendingBookings: data.stats?.pendingBookings || data.kpis?.pendingBookings || 0
          });
          setAlerts(data.alerts || []);
          setRecentActivity(data.recentActivity || []);
          setRevenueData(data.revenueData || []);
        }
      } else if (res.status === 401) {
        console.warn('Authentication required. Please log in again.');
        localStorage.clear();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'info': return <Activity className="w-5 h-5 text-blue-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Yatrik Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back! Here's what's happening with your system today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Download className="w-4 h-4 mr-2 inline" />
            Export Report
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Settings className="w-4 h-4 mr-2 inline" />
            Configure
          </button>
        </div>
      </motion.div>

      {/* System Health Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{systemStats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
            <TrendingUp className="w-4 h-4 mr-1" />
            +12% from last month
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Running Trips</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{systemStats.runningTrips}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Bus className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-600 dark:text-blue-400">
            <MapPin className="w-4 h-4 mr-1" />
            Across 15 routes
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{systemStats.todayRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
            <TrendingUp className="w-4 h-4 mr-1" />
            +8% from yesterday
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Bookings</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{systemStats.pendingBookings}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-orange-600 dark:text-orange-400">
            <Clock className="w-4 h-4 mr-1" />
            Requires attention
          </div>
        </motion.div>
      </motion.div>

      {/* Quick Actions & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <span className="font-medium">Add User</span>
                <Plus className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <span className="font-medium">Schedule Trip</span>
                <Calendar className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                <span className="font-medium">Update Fares</span>
                <DollarSign className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                <span className="font-medium">View Reports</span>
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Revenue Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Overview</h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {revenueData.map((item, index) => (
                <div key={item.day} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-blue-100 dark:bg-blue-900/20 rounded-t-lg relative group">
                    <div 
                      className="bg-blue-500 rounded-t-lg transition-all duration-300 group-hover:bg-blue-600"
                      style={{ height: `${(item.revenue / 80000) * 200}px` }}
                    />
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      ₹{item.revenue.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 mt-2">{item.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Weekly revenue trend showing consistent growth
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Smart Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Smart Alerts */}
        <motion.div variants={itemVariants}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Smart Alerts</h3>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {alert.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.user} {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.route !== 'N/A' ? activity.route : ''} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* System Status Overview */}
      <motion.div variants={itemVariants}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Database</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">45ms latency</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">API Server</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">120ms latency</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Frontend</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">15ms latency</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Mobile App</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">200ms latency</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModernDashboard;
