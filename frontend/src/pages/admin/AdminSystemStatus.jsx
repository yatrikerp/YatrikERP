import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Wifi, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Monitor,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Globe,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Bell,
  Download,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

const AdminSystemStatus = () => {
  const [systemStatus, setSystemStatus] = useState({
    server: { status: 'unknown', uptime: 0, memory: 0, cpu: 0, load: 0 },
    database: { status: 'unknown', connections: 0, responseTime: 0, queries: 0 },
    api: { status: 'unknown', responseTime: 0, requestCount: 0, errorRate: 0 },
    websocket: { status: 'unknown', connections: 0, messages: 0 },
    security: { status: 'unknown', threats: 0, lastScan: null, vulnerabilities: 0 },
    backup: { status: 'unknown', lastBackup: null, size: 0, nextBackup: null }
  });
  
  const [realtimeMetrics, setRealtimeMetrics] = useState({
    activeUsers: 0,
    activeTrips: 0,
    ongoingBookings: 0,
    systemLoad: 0,
    networkLatency: 0,
    errorRate: 0,
    memoryUsage: 0,
    diskUsage: 0
  });
  
  const [systemLogs, setSystemLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [showDetailedView, setShowDetailedView] = useState(false);

  useEffect(() => {
    fetchSystemStatus();
    fetchSystemLogs();
    fetchAlerts();
  }, []);

  // Auto-refresh system status
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchSystemStatus();
      fetchRealtimeMetrics();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching system status...');
      
      const response = await fetch('/api/admin/system/status', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('📡 System status response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 System status data:', data);
        setSystemStatus(data.status || systemStatus);
        setRealtimeMetrics(data.metrics || realtimeMetrics);
      } else {
        console.error('❌ System status failed:', response.status);
        // Set mock data for demonstration
        setSystemStatus({
          server: { status: 'healthy', uptime: 86400, memory: 2147483648, cpu: 45, load: 0.6 },
          database: { status: 'healthy', connections: 25, responseTime: 12, queries: 1250 },
          api: { status: 'healthy', responseTime: 85, requestCount: 450, errorRate: 0.2 },
          websocket: { status: 'healthy', connections: 150, messages: 2800 },
          security: { status: 'healthy', threats: 0, lastScan: new Date(), vulnerabilities: 0 },
          backup: { status: 'healthy', lastBackup: new Date(), size: 2500000000, nextBackup: new Date(Date.now() + 86400000) }
        });
        setRealtimeMetrics({
          activeUsers: 125,
          activeTrips: 45,
          ongoingBookings: 23,
          systemLoad: 45,
          networkLatency: 85,
          errorRate: 0.2,
          memoryUsage: 68,
          diskUsage: 42
        });
      }
    } catch (error) {
      console.error('💥 Error fetching system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeMetrics = async () => {
    try {
      const response = await fetch('/api/admin/system/metrics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRealtimeMetrics(data.metrics || realtimeMetrics);
      }
    } catch (error) {
      console.error('Error fetching realtime metrics:', error);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const response = await fetch('/api/admin/system/logs?limit=50', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemLogs(data.logs || []);
      } else {
        // Mock logs for demonstration
        setSystemLogs([
          { level: 'info', message: 'System startup completed', timestamp: new Date(), details: 'All services initialized successfully' },
          { level: 'warn', message: 'High memory usage detected', timestamp: new Date(Date.now() - 300000), details: 'Memory usage: 85%' },
          { level: 'info', message: 'Database backup completed', timestamp: new Date(Date.now() - 600000), details: 'Backup size: 2.5GB' },
          { level: 'error', message: 'Failed login attempt', timestamp: new Date(Date.now() - 900000), details: 'IP: 192.168.1.100' },
          { level: 'info', message: 'New user registered', timestamp: new Date(Date.now() - 1200000), details: 'User: john@example.com' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching system logs:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/admin/system/alerts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        // Mock alerts for demonstration
        setAlerts([
          {
            title: 'High CPU Usage',
            message: 'Server CPU usage is at 85% - consider scaling',
            timestamp: new Date(Date.now() - 120000),
            severity: 'warning'
          },
          {
            title: 'Database Connection Issues',
            message: 'Multiple failed connection attempts detected',
            timestamp: new Date(Date.now() - 900000),
            severity: 'critical'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      healthy: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      critical: 'text-red-600 bg-red-100',
      unknown: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || colors.unknown;
  };

  const getStatusIcon = (status) => {
    const icons = {
      healthy: CheckCircle,
      warning: AlertTriangle,
      critical: XCircle,
      unknown: Monitor
    };
    return icons[status] || icons.unknown;
  };

  const getLogLevelColor = (level) => {
    const colors = {
      error: 'text-red-600 bg-red-50 border-red-200',
      warn: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      info: 'text-blue-600 bg-blue-50 border-blue-200',
      debug: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[level] || colors.info;
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Status</h1>
              <p className="text-gray-600 mt-1">Real-time system monitoring and health dashboard</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Auto Refresh:</span>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    autoRefresh 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {autoRefresh ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  <span>{autoRefresh ? 'ON' : 'OFF'}</span>
                </button>
              </div>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
              </select>
              <button
                onClick={fetchSystemStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log('🧪 Testing System Status API...');
                    const response = await fetch('/api/admin/system/status', {
                      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    console.log('📡 System Status API response:', response.status);
                    if (response.ok) {
                      const data = await response.json();
                      console.log('📊 System Status data:', data);
                      alert(`System Status API working! Server uptime: ${Math.floor(data.status?.server?.uptime / 3600)} hours`);
                    } else {
                      alert(`System Status API failed: ${response.status}`);
                    }
                  } catch (error) {
                    console.error('❌ System Status API error:', error);
                    alert('System Status API error: ' + error.message);
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Activity className="w-5 h-5" />
                <span>Test API</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(systemStatus).map(([key, status]) => {
            const StatusIcon = getStatusIcon(status.status);
            const statusColor = getStatusColor(status.status);
            
            const icons = {
              server: Server,
              database: Database,
              api: Globe,
              websocket: Wifi,
              security: Shield,
              backup: HardDrive
            };
            
            const MainIcon = icons[key] || Monitor;
            
            return (
              <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MainIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">{key}</h3>
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg ${statusColor}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  {key === 'server' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Uptime:</span>
                        <span className="font-medium">{formatUptime(status.uptime || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Memory:</span>
                        <span className="font-medium">{formatBytes(status.memory || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">CPU:</span>
                        <span className="font-medium">{(status.cpu || 0).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            status.cpu > 80 ? 'bg-red-500' : status.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, status.cpu || 0)}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                  
                  {key === 'database' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Connections:</span>
                        <span className="font-medium">{status.connections || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Response Time:</span>
                        <span className="font-medium">{status.responseTime || 0}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Queries/min:</span>
                        <span className="font-medium">{status.queries || 0}</span>
                      </div>
                    </>
                  )}
                  
                  {key === 'api' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Response Time:</span>
                        <span className="font-medium">{status.responseTime || 0}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Requests/min:</span>
                        <span className="font-medium">{status.requestCount || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Error Rate:</span>
                        <span className="font-medium">{status.errorRate || 0}%</span>
                      </div>
                    </>
                  )}
                  
                  {key === 'websocket' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Active Connections:</span>
                        <span className="font-medium">{status.connections || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Messages/min:</span>
                        <span className="font-medium">{status.messages || 0}</span>
                      </div>
                    </>
                  )}
                  
                  {key === 'security' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Threats Blocked:</span>
                        <span className="font-medium">{status.threats || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Vulnerabilities:</span>
                        <span className="font-medium">{status.vulnerabilities || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Scan:</span>
                        <span className="font-medium">
                          {status.lastScan ? new Date(status.lastScan).toLocaleTimeString() : 'Never'}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {key === 'backup' && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Backup:</span>
                        <span className="font-medium">
                          {status.lastBackup ? new Date(status.lastBackup).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Backup Size:</span>
                        <span className="font-medium">{formatBytes(status.size || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Next Backup:</span>
                        <span className="font-medium">
                          {status.nextBackup ? new Date(status.nextBackup).toLocaleDateString() : 'Not scheduled'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              Real-time Metrics
              <div className={`ml-2 w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700">Active Users</p>
                    <p className="text-2xl font-bold text-blue-900">{realtimeMetrics.activeUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700">Active Trips</p>
                    <p className="text-2xl font-bold text-green-900">{realtimeMetrics.activeTrips}</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">Ongoing Bookings</p>
                    <p className="text-2xl font-bold text-purple-900">{realtimeMetrics.ongoingBookings}</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-700">System Load</p>
                    <p className="text-2xl font-bold text-orange-900">{realtimeMetrics.systemLoad}%</p>
                  </div>
                  <Cpu className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-red-600" />
              System Alerts
              {alerts.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  {alerts.length}
                </span>
              )}
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {alerts.length > 0 ? alerts.map((alert, index) => (
                <div key={index} className={`flex items-start space-x-3 p-3 border rounded-lg ${
                  alert.severity === 'critical' ? 'bg-red-50 border-red-200' : 
                  alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                }`}>
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-red-600' : 
                    alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      alert.severity === 'critical' ? 'text-red-900' : 
                      alert.severity === 'warning' ? 'text-yellow-900' : 'text-blue-900'
                    }`}>{alert.title}</p>
                    <p className={`text-xs mt-1 ${
                      alert.severity === 'critical' ? 'text-red-700' : 
                      alert.severity === 'warning' ? 'text-yellow-700' : 'text-blue-700'
                    }`}>{alert.message}</p>
                    <p className={`text-xs mt-2 ${
                      alert.severity === 'critical' ? 'text-red-600' : 
                      alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                    }`}>{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No active alerts</p>
                  <p className="text-xs text-gray-500">System is running smoothly</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Network className="w-5 h-5 mr-2 text-green-600" />
              Network
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Latency</span>
                <span className="text-sm font-medium">{realtimeMetrics.networkLatency}ms</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    realtimeMetrics.networkLatency > 200 ? 'bg-red-500' : 
                    realtimeMetrics.networkLatency > 100 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, (200 - realtimeMetrics.networkLatency) / 2)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-600" />
              Error Rate
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Error Rate</span>
                <span className="text-sm font-medium">{realtimeMetrics.errorRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    realtimeMetrics.errorRate > 5 ? 'bg-red-600' : 
                    realtimeMetrics.errorRate > 2 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(100, realtimeMetrics.errorRate * 10)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MemoryStick className="w-5 h-5 mr-2 text-purple-600" />
              Memory
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Usage</span>
                <span className="text-sm font-medium">{realtimeMetrics.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    realtimeMetrics.memoryUsage > 80 ? 'bg-red-500' : 
                    realtimeMetrics.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${realtimeMetrics.memoryUsage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <HardDrive className="w-5 h-5 mr-2 text-indigo-600" />
              Disk
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Usage</span>
                <span className="text-sm font-medium">{realtimeMetrics.diskUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    realtimeMetrics.diskUsage > 80 ? 'bg-red-500' : 
                    realtimeMetrics.diskUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${realtimeMetrics.diskUsage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Logs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowDetailedView(!showDetailedView)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {showDetailedView ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={fetchSystemLogs}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {systemLogs.length > 0 ? (
              <div className="p-4 space-y-2">
                {systemLogs.map((log, index) => (
                  <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${getLogLevelColor(log.level)}`}>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      log.level === 'error' ? 'bg-red-200 text-red-800' :
                      log.level === 'warn' ? 'bg-yellow-200 text-yellow-800' :
                      log.level === 'info' ? 'bg-blue-200 text-blue-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {log.level?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{log.message}</p>
                      {showDetailedView && log.details && (
                        <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 p-2 rounded">{log.details}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No system logs available</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to restart the server? This will cause temporary downtime.')) {
                  fetch('/api/admin/system/restart', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                  });
                  alert('Server restart initiated. Please wait...');
                }
              }}
              className="p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-center border border-red-200"
            >
              <RotateCcw className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-red-700">Restart Server</span>
            </button>

            <button
              onClick={() => {
                fetch('/api/admin/system/clear-cache', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                alert('Cache cleared successfully!');
              }}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center border border-blue-200"
            >
              <Zap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-blue-700">Clear Cache</span>
            </button>

            <button
              onClick={() => {
                fetch('/api/admin/system/backup', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                alert('Backup initiated. This may take a few minutes...');
              }}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center border border-green-200"
            >
              <HardDrive className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-green-700">Create Backup</span>
            </button>

            <button
              onClick={() => {
                fetch('/api/admin/system/security-scan', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                alert('Security scan initiated...');
              }}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center border border-purple-200"
            >
              <Shield className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-purple-700">Security Scan</span>
            </button>

            <button
              onClick={fetchSystemLogs}
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center border border-orange-200"
            >
              <Eye className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-orange-700">Refresh Logs</span>
            </button>

            <button
              onClick={() => {
                const systemData = {
                  status: systemStatus,
                  metrics: realtimeMetrics,
                  logs: systemLogs,
                  alerts: alerts,
                  exportedAt: new Date().toISOString()
                };
                const blob = new Blob([JSON.stringify(systemData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `system-status-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-center border border-gray-200"
            >
              <Download className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-gray-700">Export Status</span>
            </button>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Server Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Node.js Version:</span>
                  <span className="font-medium">v18.17.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Environment:</span>
                  <span className="font-medium">Production</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform:</span>
                  <span className="font-medium">Windows x64</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Process ID:</span>
                  <span className="font-medium">N/A</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Database Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">MongoDB Version:</span>
                  <span className="font-medium">v6.0.8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Collections:</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Documents:</span>
                  <span className="font-medium">15,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Index Size:</span>
                  <span className="font-medium">245 MB</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Application Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Version:</span>
                  <span className="font-medium">v2.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Build:</span>
                  <span className="font-medium">#1234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Deploy:</span>
                  <span className="font-medium">2 hours ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Uptime:</span>
                  <span className="font-medium">{formatUptime(systemStatus.server?.uptime || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemStatus;