import React, { useState, useEffect } from 'react';
import {
  Users,
  Bus,
  Route,
  Calendar,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Activity,
  MapPin,
  Clock,
  CheckCircle,
  Plus,
  RefreshCw,
  BarChart3,
  LineChart,
  UserCheck,
  UserCog,
  Building2,
  GraduationCap
} from 'lucide-react';

import { apiFetch } from '../../utils/api';


const AdminMasterDashboard = () => {
  const [stats, setStats] = useState({
    // User metrics
    users: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    
    // Trip metrics
    totalTrips: 0,
    tripsToday: 0,
    runningTrips: 0,
    completedTripsToday: 0,
    scheduledTrips: 0,
    
    // Revenue metrics
    totalRevenue: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    
    // Booking metrics
    totalBookings: 0,
    bookingsToday: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    
    // Fleet metrics
    totalBuses: 0,
    activeBuses: 0,
    busesInMaintenance: 0,
    busesOnRoute: 0,
    
    // Staff metrics
    totalDrivers: 0,
    activeDrivers: 0,
    totalConductors: 0,
    activeConductors: 0,
    
    // Route metrics
    totalRoutes: 0,
    activeRoutes: 0,
    
    // Depot metrics
    totalDepots: 0,
    activeDepots: 0,
    
    // Validation metrics
    validationsToday: 0,
    totalValidations: 0,
    
    // System metrics
    activeLocks: 0,
    systemAlerts: 0,
    
    // Calculated metrics
    occupancyRate: 0,
    bookingSuccessRate: 0,
    tripCompletionRate: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    api: 'healthy',
    frontend: 'healthy',
    lastCheck: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Check for token and validate before making API calls
    let token = localStorage.getItem('token') || localStorage.getItem('depotToken');
    
    // Clean token if it has Bearer prefix
    if (token && token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '').trim();
      // Update stored token
      if (localStorage.getItem('depotToken')) {
        localStorage.setItem('depotToken', token);
      } else if (localStorage.getItem('token')) {
        localStorage.setItem('token', token);
      }
    }
    
    if (!token || token.trim() === '') {
      console.warn('⚠️ [AdminMasterDashboard] No authentication token found. Please log in.');
      console.warn('⚠️ [AdminMasterDashboard] Available localStorage:', Object.keys(localStorage));
      setAuthError('No authentication token found. Please log in.');
      setLoading(false);
      // Redirect to login after a brief delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    // Basic token validation - let apiFetch handle detailed auth
    try {
      const cleanToken = token.replace('Bearer ', '').trim();
      const parts = cleanToken.split('.');
      if (parts.length !== 3) {
        console.error('❌ [AdminMasterDashboard] Invalid token format:', {
          partsLength: parts.length,
          tokenPreview: cleanToken.substring(0, 30)
        });
        setAuthError('Invalid authentication token. Please log in again.');
        setLoading(false);
        localStorage.clear();
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      
      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.error('❌ [AdminMasterDashboard] Token expired:', {
          exp: payload.exp,
          now: Date.now(),
          expiredAt: new Date(payload.exp * 1000).toISOString()
        });
        setAuthError('Authentication token has expired. Please log in again.');
        setLoading(false);
        localStorage.clear();
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      console.log('✅ [AdminMasterDashboard] Token validated:', {
        role: payload.role,
        email: payload.email,
        userId: payload.userId,
        exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration'
      });
      
      // Don't block API calls based on role here - let apiFetch handle it
      // This allows the API to provide better error messages
    } catch (e) {
      console.error('❌ [AdminMasterDashboard] Error validating token:', e);
      setAuthError('Invalid authentication token. Please log in again.');
      setLoading(false);
      localStorage.clear();
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }

    // Fetch data - apiFetch will handle authentication and role checking
    fetchDashboardData();
    fetchRecentActivities();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        const currentToken = localStorage.getItem('token') || localStorage.getItem('depotToken');
        if (currentToken) {
          // Re-validate token before each refresh
          try {
            const parts = currentToken.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              if (payload.exp && payload.exp * 1000 < Date.now()) {
                // Token expired, clear and stop refreshing
                localStorage.clear();
                setAuthError('Session expired. Please log in again.');
                clearInterval(interval);
                return;
              }
              fetchDashboardData();
              fetchRecentActivities();
            }
          } catch (e) {
            // Invalid token, stop refreshing
            clearInterval(interval);
          }
        }
      }, 15000); // Refresh every 15 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      // Check for token first
      let token = localStorage.getItem('token') || localStorage.getItem('depotToken');
      
      if (!token || token.trim() === '') {
        console.error('❌ [fetchDashboardData] No token available');
        setAuthError('No authentication token found. Please log in.');
        setLoading(false);
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      // Clean token
      token = token.replace('Bearer ', '').trim();

      setLoading(true);
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [fetchDashboardData] Fetching dashboard data...');
      }
      const res = await apiFetch('/api/admin/dashboard', {
        suppressLogout: true,
        suppressError: true
      });
      
      if (res.ok) {
        const data = res.data;
        console.log('📊 Dashboard data received:', {
          cached: data.cached || false,
          processingTime: data.processingTime || 'N/A',
          cacheAge: data.cacheAge || 'N/A'
        });
        
        // Update all stats with comprehensive data
        setStats({
          // User metrics
          users: data.kpis?.users || 0,
          activeUsers: data.kpis?.activeUsers || 0,
          newUsersToday: data.kpis?.newUsersToday || 0,
          newUsersThisWeek: data.kpis?.newUsersThisWeek || 0,
          
          // Trip metrics
          totalTrips: data.kpis?.totalTrips || 0,
          tripsToday: data.kpis?.tripsToday || 0,
          runningTrips: data.kpis?.runningTrips || 0,
          completedTripsToday: data.kpis?.completedTripsToday || 0,
          scheduledTrips: data.kpis?.scheduledTrips || 0,
          
          // Revenue metrics
          totalRevenue: data.kpis?.totalRevenue || 0,
          todayRevenue: data.kpis?.todayRevenue || 0,
          weekRevenue: data.kpis?.weekRevenue || 0,
          monthRevenue: data.kpis?.monthRevenue || 0,
          
          // Booking metrics
          totalBookings: data.kpis?.totalBookings || 0,
          bookingsToday: data.kpis?.bookingsToday || 0,
          pendingBookings: data.kpis?.pendingBookings || 0,
          confirmedBookings: data.kpis?.confirmedBookings || 0,
          cancelledBookings: data.kpis?.cancelledBookings || 0,
          
          // Fleet metrics
          totalBuses: data.kpis?.totalBuses || 0,
          activeBuses: data.kpis?.activeBuses || 0,
          busesInMaintenance: data.kpis?.busesInMaintenance || 0,
          busesOnRoute: data.kpis?.busesOnRoute || 0,
          
          // Staff metrics
          totalDrivers: data.kpis?.totalDrivers || 0,
          activeDrivers: data.kpis?.activeDrivers || 0,
          totalConductors: data.kpis?.totalConductors || 0,
          activeConductors: data.kpis?.activeConductors || 0,
          
          // Route metrics
          totalRoutes: data.kpis?.totalRoutes || 0,
          activeRoutes: data.kpis?.activeRoutes || 0,
          
          // Depot metrics
          totalDepots: data.kpis?.totalDepots || 0,
          activeDepots: data.kpis?.activeDepots || 0,
          
          // Validation metrics
          validationsToday: data.kpis?.validationsToday || 0,
          totalValidations: data.kpis?.totalValidations || 0,
          
          // System metrics
          activeLocks: data.kpis?.activeLocks || 0,
          systemAlerts: data.kpis?.systemAlerts || 0,
          
          // Calculated metrics
          occupancyRate: data.kpis?.occupancyRate || 0,
          bookingSuccessRate: data.kpis?.bookingSuccessRate || 0,
          tripCompletionRate: data.kpis?.tripCompletionRate || 0
        });
        
        // Update system health from summary
        if (data?.summary?.systemHealth) {
          setSystemHealth(data.summary.systemHealth);
        }
        
        console.log('✅ Dashboard stats updated successfully');
      } else {
        // Handle 401 errors specifically
        if (res.status === 401) {
          console.error('❌ [fetchDashboardData] Authentication failed:', {
            status: res.status,
            message: res.message,
            data: res.data
          });
          
          const currentToken = localStorage.getItem('token') || localStorage.getItem('depotToken');
          if (!currentToken || currentToken.trim() === '') {
            setAuthError('No authentication token found. Please log in.');
            setLoading(false);
            setTimeout(() => {
              localStorage.clear();
              window.location.href = '/login';
            }, 2000);
          } else {
            // Token exists but backend rejected it - likely expired or invalid
            setAuthError('Authentication failed. Your session may have expired. Please log in again.');
            setLoading(false);
            setTimeout(() => {
              localStorage.clear();
              window.location.href = '/login';
            }, 3000);
          }
        } else if (res.status === 403) {
          console.error('❌ [fetchDashboardData] Access denied:', {
            status: res.status,
            message: res.message
          });
          setAuthError('You do not have permission to access the admin dashboard.');
          setLoading(false);
        } else {
          console.error('❌ [fetchDashboardData] API error:', res.status, res.message);
          setLoading(false);
        }
      }
    } catch (error) {
      // Don't log network errors as errors if suppressError is set
      if (!error.message?.includes('Network')) {
        console.error('💥 Error fetching dashboard data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // Check for token first
      const token = localStorage.getItem('token') || localStorage.getItem('depotToken');
      if (!token) {
        console.warn('⚠️ No token available for activities fetch');
        return;
      }

      // Validate token
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.warn('⚠️ Token expired for activities fetch');
            return;
          }
        }
      } catch (e) {
        console.warn('⚠️ Invalid token for activities fetch');
        return;
      }

      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Fetching recent activities...');
      }
      const res = await apiFetch('/api/admin/recent-activities', {
        suppressLogout: true,
        suppressError: true
      });
      
      console.log('📡 Recent activities response status:', res.status);
      
      if (res.ok) {
        const data = res.data;
        console.log('📊 Recent activities data:', {
          count: data.activities?.length || 0,
          processingTime: data.processingTime || 'N/A',
          total: data.total || 0
        });
        setRecentActivities(data.activities || []);
        console.log('✅ Recent activities updated:', data.activities?.length || 0, 'activities');
      } else {
        // Handle 401 errors - don't spam console
        if (res.status === 401) {
          console.warn('⚠️ Authentication required for activities.');
        } else if (res.status !== 401) {
          console.error('❌ Recent activities failed:', res.status, res.message);
        }
      }
    } catch (error) {
      // Don't log network errors as errors if suppressError is set
      if (!error.message?.includes('Network')) {
        console.error('💥 Error fetching recent activities:', error);
      }
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      booking_created: Users,
      trip_started: Bus,
      trip_completed: CheckCircle,
      user_registered: Plus,
      driver_assigned: UserCheck,
      conductor_assigned: UserCog,
      route_created: Route,
      depot_created: MapPin,
      payment_received: DollarSign,
      system_alert: AlertTriangle,
      backup_completed: Activity,
      maintenance_scheduled: Clock
    };
    return icons[type] || Activity;
  };

  const getActivityColor = (type) => {
    const colors = {
      booking_created: 'bg-blue-100 text-blue-600',
      trip_started: 'bg-green-100 text-green-600',
      trip_completed: 'bg-green-100 text-green-600',
      user_registered: 'bg-purple-100 text-purple-600',
      driver_assigned: 'bg-indigo-100 text-indigo-600',
      conductor_assigned: 'bg-indigo-100 text-indigo-600',
      route_created: 'bg-orange-100 text-orange-600',
      depot_created: 'bg-teal-100 text-teal-600',
      payment_received: 'bg-green-100 text-green-600',
      system_alert: 'bg-red-100 text-red-600',
      backup_completed: 'bg-blue-100 text-blue-600',
      maintenance_scheduled: 'bg-yellow-100 text-yellow-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const StatCard = ({ title, value, icon: Icon, color, change, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {change && (
            <div className={`flex items-center mt-2 text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1 rotate-180" />}
              {Math.abs(change)}% from last month
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, action, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:scale-105 cursor-pointer">
      <div className={`p-3 rounded-lg ${color} w-fit mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <button 
        onClick={action}
        className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
      >
        {title} <Plus className="w-4 h-4 ml-1" />
      </button>
    </div>
  );

  // Check authentication status and validate token
  const token = localStorage.getItem('token') || localStorage.getItem('depotToken');
  const userData = localStorage.getItem('user') || localStorage.getItem('depotUser');
  
  // Helper to decode JWT token (basic check)
  const isValidToken = (token) => {
    if (!token) return false;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1]));
      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  // Check if user has admin role from token or userData
  const isAdminUser = () => {
    // First check token payload
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const role = (payload.role || '').toLowerCase();
          const roleUpper = String(payload.role || '').toUpperCase();
          const isDepotManager = roleUpper === 'DEPOT_MANAGER' || roleUpper === 'DEPOT_SUPERVISOR' || roleUpper === 'DEPOT_OPERATOR';
          const isAdmin = role === 'admin' || role === 'administrator' || roleUpper === 'ADMIN' || roleUpper === 'ADMINISTRATOR';
          return isAdmin || isDepotManager;
        }
      } catch (e) {
        // Continue to check userData
      }
    }
    
    // Then check userData
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const role = (user.role || '').toLowerCase();
        const roleUpper = String(user.role || '').toUpperCase();
        const isDepotManager = roleUpper === 'DEPOT_MANAGER' || roleUpper === 'DEPOT_SUPERVISOR' || roleUpper === 'DEPOT_OPERATOR';
        const isAdmin = role === 'admin' || role === 'administrator' || roleUpper === 'ADMIN' || roleUpper === 'ADMINISTRATOR';
        return isAdmin || isDepotManager;
      } catch (e) {
        return false;
      }
    }
    
    return false;
  };

  const isAuthenticated = !!token && isValidToken(token);
  const hasAdminRole = isAdminUser();

  if (loading && isAuthenticated && hasAdminRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only show auth error screen if we have a definitive error and not loading
  // Allow the component to try API calls first before blocking
  if (!isAuthenticated && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-6">
              {authError || 'No authentication token found. Please log in to access the admin dashboard.'}
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go to Login
              </button>
              <button
                onClick={() => {
                  // Retry checking auth
                  setAuthError(null);
                  window.location.reload();
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated but has role issue, show error
  if (isAuthenticated && !hasAdminRole && !loading && !authError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You do not have admin privileges. Please log in with an admin account.
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl font-bold text-gray-900">Yatrik Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your system today.</p>
        </div>
                    <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  console.log('=== TESTING RECENT ACTIVITIES API ===');
                  fetchRecentActivities();
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Activity className="w-4 h-4" />
                <span>Test Activities</span>
              </button>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
      </div>

      {/* System Health Status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-blue-900">System Health</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${systemHealth.database === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-700">Database</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${systemHealth.api === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-700">API</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${systemHealth.frontend === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-700">Frontend</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics - Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.users.toLocaleString()}
          icon={Users}
          color="bg-blue-500"
          subtitle={`${stats.activeUsers} active, ${stats.newUsersToday} new today`}
        />
        <StatCard
          title="Running Trips"
          value={stats.runningTrips}
          icon={Bus}
          color="bg-green-500"
          subtitle={`${stats.tripsToday} today, ${stats.completedTripsToday} completed`}
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${stats.todayRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-yellow-500"
          subtitle={`₹${stats.weekRevenue.toLocaleString()} this week`}
        />
        <StatCard
          title="Pending Bookings"
          value={stats.pendingBookings}
          icon={AlertTriangle}
          color="bg-red-500"
          subtitle={`${stats.bookingsToday} bookings today`}
        />
      </div>

      

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Last 7 days</span>
            </div>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Revenue chart will be displayed here</p>
              <p className="text-sm text-gray-400">Integration with chart library required</p>
            </div>
          </div>
        </div>

        {/* User Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">User Activity</h3>
            <div className="flex items-center space-x-2">
              <LineChart className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Real-time</span>
            </div>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <LineChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">User activity chart will be displayed here</p>
              <p className="text-sm text-gray-400">Integration with chart library required</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard
            title="Add User"
            description="Create new user accounts with specific roles and permissions"
            icon={Users}
            color="bg-blue-500"
            action={() => window.location.href = '/admin/users'}
          />
          <QuickActionCard
            title="Enhanced Routes"
            description="Create routes with multiple stops and auto-calculate fare matrix"
            icon={Route}
            color="bg-green-500"
            action={() => window.location.href = '/admin/streamlined-routes'}
          />
          <QuickActionCard
            title="Enhanced Trips"
            description="Schedule trips with auto-generated seating and stop-to-stop fares"
            icon={Calendar}
            color="bg-purple-500"
            action={() => window.location.href = '/admin/streamlined-trips'}
          />
          <QuickActionCard
            title="Bus Management"
            description="Manage fleet, maintenance, and real-time monitoring"
            icon={Bus}
            color="bg-indigo-500"
            action={() => window.location.href = '/admin/buses'}
          />
          <QuickActionCard
            title="Manage Depots"
            description="Manage bus depots, capacity, and facilities"
            icon={MapPin}
            color="bg-purple-500"
            action={() => window.location.href = '/admin/depot-management'}
          />
          <QuickActionCard
            title="View Reports"
            description="Access detailed analytics and performance reports"
            icon={BarChart3}
            color="bg-orange-500"
            action={() => window.location.href = '/admin/reports'}
          />
          <QuickActionCard
            title="Vendor Management"
            description="Manage vendors, approvals, payments, and inventory"
            icon={Building2}
            color="bg-indigo-500"
            action={() => window.location.href = '/admin/vendors'}
          />
          <QuickActionCard
            title="Student Concession"
            description="Manage concession policies, approvals, and monitor usage"
            icon={GraduationCap}
            color="bg-purple-500"
            action={() => window.location.href = '/admin/student-concession'}
          />
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-500">{autoRefresh ? 'Live' : 'Paused'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Activities</option>
              <option value="bookings">Bookings</option>
              <option value="trips">Trips</option>
              <option value="users">Users</option>
              <option value="system">System</option>
              <option value="payments">Payments</option>
            </select>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {autoRefresh ? 'Live' : 'Paused'}
            </button>
            <button 
              onClick={fetchRecentActivities}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {recentActivities.length > 0 ? (
            recentActivities
              .filter(activity => activityFilter === 'all' || activity.category === activityFilter)
              .map((activity, index) => {
                const ActivityIcon = getActivityIcon(activity.type);
                const activityColor = getActivityColor(activity.type);
                
                return (
                  <div key={activity._id || index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activityColor}`}>
                      <ActivityIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title || activity.description || 'System Activity'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {activity.details || activity.message || 'No additional details'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {activity.user || activity.actor || 'System'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 
                           activity.createdAt ? new Date(activity.createdAt).toLocaleString() : 
                           'Just now'}
                        </span>
                      </div>
                    </div>
                    {activity.priority === 'high' && (
                      <div className="flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                  </div>
                );
              })
          ) : (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No recent activities</p>
              <p className="text-sm text-gray-400">Activities will appear here as they happen</p>
            </div>
          )}
        </div>
        
        {/* Activity Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {recentActivities.filter(a => a.category === 'bookings').length}
              </div>
              <div className="text-xs text-gray-500">Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {recentActivities.filter(a => a.category === 'trips').length}
              </div>
              <div className="text-xs text-gray-500">Trips</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {recentActivities.filter(a => a.category === 'users').length}
              </div>
              <div className="text-xs text-gray-500">Users</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {recentActivities.filter(a => a.category === 'system').length}
              </div>
              <div className="text-xs text-gray-500">System</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-yellow-600 font-medium">2 Active Alerts</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">High CPU Usage</p>
              <p className="text-sm text-yellow-700">Server CPU usage is at 85% - consider scaling</p>
            </div>
            <span className="text-sm text-yellow-600">2 min ago</span>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Database Connection Issues</p>
              <p className="text-sm text-red-700">Multiple failed connection attempts detected</p>
            </div>
            <span className="text-sm text-red-600">15 min ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMasterDashboard;
