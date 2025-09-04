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
  XCircle,
  Eye,
  Plus,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  UserCheck,
  UserCog
} from 'lucide-react';
import { toast } from 'react-hot-toast';


const AdminMasterDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTrips: 0,
    runningTrips: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalBookings: 0,
    pendingBookings: 0
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

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivities();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchDashboardData();
        fetchRecentActivities();
      }, 15000); // Refresh every 15 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.kpis?.users || 0,
          activeUsers: data.kpis?.users || 0,
          totalTrips: data.kpis?.tripsToday || 0,
          runningTrips: data.kpis?.runningTrips || 0,
          totalRevenue: data.kpis?.totalRevenue || 0,
          todayRevenue: data.kpis?.todayRevenue || 0,
          totalBookings: data.kpis?.totalBookings || 0,
          pendingBookings: data.kpis?.pendingBookings || 0
        });
        setRecentActivities(data.top5Recent?.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      console.log('🔄 Fetching recent activities...');
      const response = await fetch('/api/admin/recent-activities', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('📡 Recent activities response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Recent activities data:', data);
        setRecentActivities(data.activities || []);
        console.log('✅ Recent activities updated:', data.activities?.length || 0, 'activities');
      } else {
        console.error('❌ Recent activities failed:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('💥 Error fetching recent activities:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          color="bg-blue-500"
          change={12}
          subtitle="Active accounts"
        />
        <StatCard
          title="Running Trips"
          value={stats.runningTrips}
          icon={Bus}
          color="bg-green-500"
          change={8}
          subtitle="Currently active"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${stats.todayRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-yellow-500"
          change={15}
          subtitle="Daily earnings"
        />
        <StatCard
          title="Pending Bookings"
          value={stats.pendingBookings}
          icon={AlertTriangle}
          color="bg-red-500"
          change={-5}
          subtitle="Awaiting confirmation"
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
            title="Manage Routes"
            description="Add, edit, or remove bus routes and schedules"
            icon={Route}
            color="bg-green-500"
            action={() => window.location.href = '/admin/routes-management'}
          />
          <QuickActionCard
            title="Schedule Trip"
            description="Create new trips with specific buses and conductors"
            icon={Calendar}
            color="bg-purple-500"
            action={() => window.location.href = '/admin/trips'}
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
