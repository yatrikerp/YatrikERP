import React, { useState, useEffect } from 'react';
import {
  Bus,
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  Activity,
  RefreshCw,
  Brain,
  MapPin,
  Clock,
  Zap,
  Shield
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const AICommandDashboard = () => {
  const [kpis, setKpis] = useState({
    activeBuses: 0,
    runningTrips: 0,
    passengerLoad: 0,
    revenue: 0
  });
  const [aiAlerts, setAiAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 15000); // Refresh every 15 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [kpisRes, alertsRes] = await Promise.all([
        apiFetch('/api/admin/command-dashboard/kpis'),
        apiFetch('/api/admin/command-dashboard/ai-alerts')
      ]);

      if (kpisRes.ok) {
        setKpis(kpisRes.data);
      }

      if (alertsRes.ok) {
        setAiAlerts(alertsRes.data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const KPICard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-4 rounded-lg ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI-Powered Command Dashboard</h1>
              <p className="text-gray-600">Real-time visibility and AI-driven insights</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Real-time KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Active Buses"
          value={kpis.activeBuses}
          icon={Bus}
          color="bg-blue-500"
          subtitle="Currently in operation"
        />
        <KPICard
          title="Running Trips"
          value={kpis.runningTrips}
          icon={Activity}
          color="bg-green-500"
          subtitle="Trips in progress"
        />
        <KPICard
          title="Passenger Load"
          value={kpis.passengerLoad}
          icon={Users}
          color="bg-purple-500"
          subtitle="Passengers today"
        />
        <KPICard
          title="Revenue"
          value={`₹${kpis.revenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-yellow-500"
          subtitle="Today's revenue"
        />
      </div>

      {/* AI Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI Alerts</h2>
            {aiAlerts.length > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {aiAlerts.length} Active
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {aiAlerts.length > 0 ? (
            aiAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{alert.title}</h3>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs mt-2 opacity-75">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-medium capitalize">
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No active alerts</p>
              <p className="text-sm text-gray-400">All systems operating normally</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Fleet Monitoring</h3>
          </div>
          <p className="text-blue-700 text-sm mb-4">View real-time GPS tracking and fleet status</p>
          <a
            href="/admin/fleet-monitoring"
            className="text-blue-600 font-medium text-sm hover:underline"
          >
            View Dashboard →
          </a>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">Autonomous Scheduling</h3>
          </div>
          <p className="text-green-700 text-sm mb-4">View AI-generated schedules and assignments</p>
          <a
            href="/admin/autonomous-scheduling"
            className="text-green-600 font-medium text-sm hover:underline"
          >
            View Dashboard →
          </a>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-900">Predictive Analytics</h3>
          </div>
          <p className="text-purple-700 text-sm mb-4">Access ML predictions and forecasts</p>
          <a
            href="/admin/predictive-analytics"
            className="text-purple-600 font-medium text-sm hover:underline"
          >
            View Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
};

export default AICommandDashboard;
