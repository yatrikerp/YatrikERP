import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Map, Users, AlertTriangle, Settings, 
  RefreshCw, Activity, DollarSign, BarChart3, 
  CheckCircle, LogOut
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const StateCommandDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [liveMap, setLiveMap] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [occupancyData, setOccupancyData] = useState(null);
  const [painIndex, setPainIndex] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await apiFetch('/api/state/dashboard', { suppressError: true });
      if (res.ok && res.data?.success) {
        setDashboardData(res.data.data);
      } else {
        // Set fallback data if API fails
        setDashboardData({
          metrics: {
            revenue: { today: 0, yesterday: 0, hourWise: [] },
            operations: { totalTrips: 0, runningTrips: 0, completedTrips: 0 },
            fleet: { totalBuses: 0, activeBuses: 0 },
            routes: { totalRoutes: 0, activeRoutes: 0 },
            depots: { totalDepots: 0, activeDepots: 0 },
            citizens: { todayBookings: 0, totalBookings: 0 },
            systemHealth: { apiUptime: 100, databaseStatus: 'healthy' }
          },
          alerts: [],
          activePolicies: []
        });
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      // Set fallback data on error
      setDashboardData({
        metrics: {
          revenue: { today: 0, yesterday: 0, hourWise: [] },
          operations: { totalTrips: 0, runningTrips: 0, completedTrips: 0 },
          fleet: { totalBuses: 0, activeBuses: 0 },
          routes: { totalRoutes: 0, activeRoutes: 0 },
          depots: { totalDepots: 0, activeDepots: 0 },
          citizens: { todayBookings: 0, totalBookings: 0 },
          systemHealth: { apiUptime: 100, databaseStatus: 'healthy' }
        },
        alerts: [],
        activePolicies: []
      });
    }
  };

  const fetchLiveMap = async () => {
    try {
      const res = await apiFetch('/api/state/live-map', { suppressError: true });
      if (res.ok && res.data?.success) {
        setLiveMap(res.data.data);
      } else {
        setLiveMap({ buses: [] });
      }
    } catch (error) {
      console.error('Live map error:', error);
      setLiveMap({ buses: [] });
    }
  };

  const fetchRevenue = async () => {
    try {
      const res = await apiFetch('/api/state/revenue', { suppressError: true });
      if (res.ok && res.data?.success) {
        setRevenueData(res.data.data);
      } else {
        setRevenueData({ today: { revenue: 0, bookings: 0 }, routeWise: [] });
      }
    } catch (error) {
      console.error('Revenue error:', error);
      setRevenueData({ today: { revenue: 0, bookings: 0 }, routeWise: [] });
    }
  };

  const fetchOccupancy = async () => {
    try {
      const res = await apiFetch('/api/state/load-occupancy', { suppressError: true });
      if (res.ok && res.data?.success) {
        setOccupancyData(res.data.data);
      } else {
        setOccupancyData({ overcrowded: [], underutilized: [] });
      }
    } catch (error) {
      console.error('Occupancy error:', error);
      setOccupancyData({ overcrowded: [], underutilized: [] });
    }
  };

  const fetchPainIndex = async () => {
    try {
      const res = await apiFetch('/api/state/citizen-pain', { suppressError: true });
      if (res.ok && res.data?.success) {
        setPainIndex(res.data.data);
      } else {
        setPainIndex({ painIndex: 0, metrics: { cancellations: 0, delayedTrips: 0 } });
      }
    } catch (error) {
      console.error('Pain index error:', error);
      setPainIndex({ painIndex: 0, metrics: { cancellations: 0, delayedTrips: 0 } });
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await apiFetch('/api/state/alerts', { suppressError: true });
      if (res.ok && res.data?.success) {
        setAlerts(res.data.data?.alerts || []);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('Alerts error:', error);
      setAlerts([]);
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await apiFetch('/api/state/policies', { suppressError: true });
      if (res.ok && res.data?.success) {
        setPolicies(res.data.data || []);
      } else {
        setPolicies([]);
      }
    } catch (error) {
      console.error('Policies error:', error);
      setPolicies([]);
    }
  };

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboard(),
      fetchLiveMap(),
      fetchRevenue(),
      fetchOccupancy(),
      fetchPainIndex(),
      fetchAlerts(),
      fetchPolicies()
    ]);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await refreshAll();
      setLoading(false);
    };
    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshAll, 30000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const handlePolicyToggle = async (policyId, action) => {
    try {
      const res = await apiFetch('/api/state/policy/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId, action })
      });
      if (res.ok && res.data.success) {
        toast.success(`Policy ${action}d`);
        fetchPolicies();
      }
    } catch (error) {
      toast.error('Failed to update policy');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Loading State Command Dashboard...</p>
        </div>
      </div>
    );
  }

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: Activity },
    { id: 'live-map', name: 'Live Mobility Map', icon: Map },
    { id: 'revenue', name: 'Revenue Command', icon: DollarSign },
    { id: 'occupancy', name: 'Load & Occupancy', icon: BarChart3 },
    { id: 'pain', name: 'Citizen Pain Index', icon: Users },
    { id: 'alerts', name: 'System Alerts', icon: AlertTriangle },
    { id: 'policies', name: 'Policy Switchboard', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 flex flex-col">
      {/* Top Header Bar - Full Width */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-lg border-b border-blue-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30 shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-tight">Kerala State Transport Command</h1>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400"></div>
                    <p className="text-sm text-blue-100 font-medium">Real-time Operations Active</p>
                  </div>
                  <span className="text-blue-300">•</span>
                  <p className="text-sm text-blue-200">Governance & Operations Platform</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                    <span className="text-white font-semibold text-sm">
                      {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-white">{user.name || 'State Authority'}</p>
                    <p className="text-xs text-blue-200">{user.email}</p>
                  </div>
                </div>
              )}
              <button
                onClick={refreshAll}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg border border-white/30 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
          {/* Navigation Section */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                      activeModule === module.id
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-left">{module.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Action Buttons Section at Bottom */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeModule === 'dashboard' && <DashboardView data={dashboardData} />}
            {activeModule === 'live-map' && <LiveMapView data={liveMap} />}
            {activeModule === 'revenue' && <RevenueView data={revenueData} />}
            {activeModule === 'occupancy' && <OccupancyView data={occupancyData} />}
            {activeModule === 'pain' && <PainIndexView data={painIndex} />}
            {activeModule === 'alerts' && <AlertsView data={alerts} />}
            {activeModule === 'policies' && <PoliciesView data={policies} onToggle={handlePolicyToggle} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardView = ({ data }) => {
  if (!data) return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>;
  
  const { metrics } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Today's Revenue" value={`₹${(metrics?.revenue?.today || 0).toLocaleString()}`} icon={DollarSign} color="green" />
        <MetricCard title="Running Trips" value={metrics?.operations?.runningTrips || 0} icon={Activity} color="blue" />
        <MetricCard title="Active Buses" value={metrics?.fleet?.activeBuses || 0} icon={Map} color="purple" />
        <MetricCard title="Today's Bookings" value={metrics?.citizens?.todayBookings || 0} icon={Users} color="orange" />
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">System Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">API Uptime</p>
            <p className="text-2xl font-bold text-green-600">{metrics?.systemHealth?.apiUptime || 100}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Database</p>
            <p className="text-2xl font-bold text-green-600">{metrics?.systemHealth?.databaseStatus || 'healthy'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Routes</p>
            <p className="text-2xl font-bold">{metrics?.routes?.totalRoutes || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Depots</p>
            <p className="text-2xl font-bold">{metrics?.depots?.totalDepots || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Live Map Component
const LiveMapView = ({ data }) => {
  if (!data || !data.buses || data.buses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Live Kerala Mobility Map</h3>
        <div className="text-center py-12 text-gray-500">
          <Map className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No active buses at the moment</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Live Kerala Mobility Map</h3>
      <div className="mb-4 flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>On Time</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>Slight Delay</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Major Delay</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span>Idle/Off-road</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.buses.map((bus, idx) => (
          <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{bus.busNumber || `Bus ${idx + 1}`}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                bus.statusColor === 'green' ? 'bg-green-100 text-green-800' :
                bus.statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                bus.statusColor === 'red' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {bus.status || 'Unknown'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {bus.route?.origin || 'Origin'} → {bus.route?.destination || 'Destination'}
            </p>
            {bus.delay > 0 && <p className="text-xs text-red-600 mt-1">Delay: {bus.delay} min</p>}
            {bus.currentLocation && (
              <p className="text-xs text-gray-500 mt-1">📍 {bus.currentLocation}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Revenue View Component
const RevenueView = ({ data }) => {
  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>Loading revenue data...</p>
      </div>
    );
  }
  
  const routeWise = data.routeWise || [];
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Revenue</h3>
        <div className="text-4xl font-bold text-green-600">₹{(data.today?.revenue || 0).toLocaleString()}</div>
        <p className="text-sm text-gray-600 mt-2">{data.today?.bookings || 0} bookings</p>
        {data.yesterday && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">Yesterday: ₹{(data.yesterday.revenue || 0).toLocaleString()}</p>
            <p className={`text-sm mt-1 ${
              (data.today?.revenue || 0) > (data.yesterday.revenue || 0) ? 'text-green-600' : 'text-red-600'
            }`}>
              {((data.today?.revenue || 0) > (data.yesterday.revenue || 0) ? '↑' : '↓')} 
              {Math.abs(((data.today?.revenue || 0) - (data.yesterday.revenue || 0)) / (data.yesterday.revenue || 1) * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Routes by Revenue</h3>
        {routeWise.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No route revenue data available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {routeWise.slice(0, 10).map((route, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                <span className="font-medium">{route.routeName || route.route || `Route ${idx + 1}`}</span>
                <span className="font-semibold text-green-600">₹{(route.revenue || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Occupancy View Component
const OccupancyView = ({ data }) => {
  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p>Loading occupancy data...</p>
      </div>
    );
  }
  
  const overcrowded = data.overcrowded || [];
  const underutilized = data.underutilized || [];
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Overcrowded Routes ({overcrowded.length})</h3>
        {overcrowded.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p>No overcrowded routes</p>
          </div>
        ) : (
          <div className="space-y-2">
            {overcrowded.slice(0, 10).map((route, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-red-50 rounded hover:bg-red-100 transition">
                <span className="font-medium">{route.route || route.routeName || `Route ${idx + 1}`}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(route.occupancy || 0, 100)}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-red-600 w-12 text-right">{route.occupancy || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Underutilized Routes ({underutilized.length})</h3>
        {underutilized.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No underutilized routes</p>
          </div>
        ) : (
          <div className="space-y-2">
            {underutilized.slice(0, 10).map((route, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-yellow-50 rounded hover:bg-yellow-100 transition">
                <span className="font-medium">{route.route || route.routeName || `Route ${idx + 1}`}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(route.occupancy || 0, 100)}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-yellow-600 w-12 text-right">{route.occupancy || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Pain Index View Component
const PainIndexView = ({ data }) => {
  if (!data) return <div className="text-center py-12 text-gray-500">Loading pain index...</div>;
  
  const painColor = data.painIndex > 70 ? 'red' : data.painIndex > 40 ? 'yellow' : 'green';
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Citizen Pain Index</h3>
      <div className="text-center py-8">
        <div className={`text-6xl font-bold text-${painColor}-600 mb-4`}>{data.painIndex}</div>
        <p className="text-gray-600">Out of 100</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Cancellations</p>
          <p className="text-2xl font-bold">{data.metrics?.cancellations || 0}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Delayed Trips</p>
          <p className="text-2xl font-bold">{data.metrics?.delayedTrips || 0}</p>
        </div>
      </div>
    </div>
  );
};

// Alerts View Component
const AlertsView = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-center py-12 text-gray-500">No active alerts</div>;
  
  return (
    <div className="space-y-4">
      {data.map((alert, idx) => (
        <div key={idx} className={`bg-white rounded-lg shadow p-6 border-l-4 ${
          alert.severity === 'critical' ? 'border-red-500' :
          alert.severity === 'high' ? 'border-orange-500' :
          alert.severity === 'medium' ? 'border-yellow-500' :
          'border-blue-500'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold">{alert.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
              <p className="text-xs text-gray-500 mt-2">{new Date(alert.detectedAt).toLocaleString()}</p>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${
              alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
              alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {alert.severity}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Policies View Component
const PoliciesView = ({ data, onToggle }) => {
  if (!data || data.length === 0) return <div className="text-center py-12 text-gray-500">No policies</div>;
  
  return (
    <div className="space-y-4">
      {data.map((policy) => (
        <div key={policy._id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold">{policy.policyName}</h4>
              <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                <span>Type: {policy.policyType}</span>
                <span>Scope: {policy.scope}</span>
                <span>Start: {new Date(policy.startTime).toLocaleString()}</span>
                <span>End: {new Date(policy.endTime).toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => onToggle(policy._id, policy.isActive ? 'deactivate' : 'activate')}
              className={`px-4 py-2 rounded-lg font-medium ${
                policy.isActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {policy.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StateCommandDashboard;
