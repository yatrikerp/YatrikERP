import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  BarChart3,
  Activity,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  LineChart,
  Users,
  Bus,
  DollarSign,
  Clock,
  Target,
  Cpu,
  Shield,
  Play,
  Pause,
  Download
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const ComprehensiveAIDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const [kpis, setKpis] = useState({
    activeBuses: 0,
    runningTrips: 0,
    passengerLoad: 0,
    revenue: 0
  });
  
  const [aiAlerts, setAiAlerts] = useState([]);
  const [mlModels, setMlModels] = useState([]);
  const [insights, setInsights] = useState(null);
  const [autonomousStatus, setAutonomousStatus] = useState(null);
  const [demandForecast, setDemandForecast] = useState(null);
  const [revenueForecast, setRevenueForecast] = useState(null);

  useEffect(() => {
    fetchAllData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchKPIs(),
        fetchAIAlerts(),
        fetchMLModels(),
        fetchInsights(),
        fetchAutonomousStatus(),
        fetchDemandForecast(),
        fetchRevenueForecast()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIs = async () => {
    try {
      const res = await apiFetch('/api/admin/ai/command-dashboard/kpis');
      if (res.ok && res.data) {
        setKpis(res.data);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  };

  const fetchAIAlerts = async () => {
    try {
      const res = await apiFetch('/api/admin/ai/command-dashboard/ai-alerts');
      if (res.ok && res.data) {
        setAiAlerts(res.data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching AI alerts:', error);
    }
  };

  const fetchMLModels = async () => {
    try {
      const res = await apiFetch('/api/admin/ai/ml/models');
      if (res.ok && res.data) {
        setMlModels(res.data.models || []);
      }
    } catch (error) {
      console.error('Error fetching ML models:', error);
    }
  };

  const fetchInsights = async () => {
    try {
      const res = await apiFetch('/api/admin/ai/insights');
      if (res.ok && res.data) {
        setInsights(res.data);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const fetchAutonomousStatus = async () => {
    try {
      const res = await apiFetch('/api/admin/ai/autonomous/status');
      if (res.ok && res.data) {
        setAutonomousStatus(res.data);
      }
    } catch (error) {
      console.error('Error fetching autonomous status:', error);
    }
  };

  const fetchDemandForecast = async () => {
    try {
      const res = await apiFetch('/api/admin/ai/predictive/demand?range=7d');
      if (res.ok && res.data) {
        setDemandForecast(res.data);
      }
    } catch (error) {
      console.error('Error fetching demand forecast:', error);
    }
  };

  const fetchRevenueForecast = async () => {
    try {
      const res = await apiFetch('/api/admin/ai/predictive/revenue?range=30d');
      if (res.ok && res.data) {
        setRevenueForecast(res.data);
      }
    } catch (error) {
      console.error('Error fetching revenue forecast:', error);
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

  const handleResolveAlert = (alertId) => {
    setAiAlerts(prev => prev.filter(alert => alert.id !== alertId));
    alert('Alert resolved!');
  };

  const handleExportAlerts = () => {
    const json = JSON.stringify(aiAlerts, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-alerts-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Alerts exported!');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Active Buses"
          value={kpis.activeBuses || 0}
          icon={Bus}
          color="bg-blue-500"
          subtitle="Currently in operation"
        />
        <KPICard
          title="Running Trips"
          value={kpis.runningTrips || 0}
          icon={Activity}
          color="bg-green-500"
          subtitle="Trips in progress"
        />
        <KPICard
          title="Passenger Load"
          value={`${kpis.passengerLoad || 0}%`}
          icon={Users}
          color="bg-purple-500"
          subtitle="Average occupancy"
        />
        <KPICard
          title="Revenue"
          value={`₹${(kpis.revenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="bg-yellow-500"
          subtitle="Today's revenue"
        />
      </div>

      {aiAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {aiAlerts.length}
              </span>
            </div>
            <button
              onClick={handleExportAlerts}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export Alerts
            </button>
          </div>
          <div className="space-y-3">
            {aiAlerts.slice(0, 5).map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{alert.title}</h4>
                      <p className="text-sm">{alert.message}</p>
                      {alert.actions && (
                        <div className="flex gap-2 mt-3">
                          {alert.actions.slice(0, 2).map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleResolveAlert(alert.id)}
                              className="px-3 py-1 bg-white bg-opacity-70 hover:bg-opacity-100 rounded text-xs font-medium transition-colors"
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-medium capitalize">
                      {alert.severity}
                    </span>
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="text-xs text-gray-600 hover:text-gray-900 underline"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setActiveTab('ml-models')}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Cpu className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-900">ML Models</h3>
          </div>
          <p className="text-purple-700 text-sm mb-4">View and run 9 AI models with predictions</p>
          <span className="text-purple-600 font-medium text-sm">View Models →</span>
        </button>

        <button
          onClick={() => setActiveTab('predictive')}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Predictive Analytics</h3>
          </div>
          <p className="text-blue-700 text-sm mb-4">Demand and revenue forecasting with AI</p>
          <span className="text-blue-600 font-medium text-sm">View Forecasts →</span>
        </button>

        <button
          onClick={() => setActiveTab('autonomous')}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">Autonomous Operations</h3>
          </div>
          <p className="text-green-700 text-sm mb-4">AI-powered scheduling and optimization</p>
          <span className="text-green-600 font-medium text-sm">View Status →</span>
        </button>
      </div>
    </div>
  );

  const handleRunModel = async (modelId) => {
    try {
      const res = await apiFetch('/api/admin/ai/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, parameters: {} })
      });
      if (res.ok && res.data) {
        alert(`Model ${modelId} executed successfully!\nAccuracy: ${res.data.prediction?.confidence || 'N/A'}%`);
      }
    } catch (error) {
      console.error('Error running model:', error);
      alert('Failed to run model');
    }
  };

  const handleTrainModel = async (modelId) => {
    try {
      const res = await apiFetch('/api/admin/ai/ml/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId })
      });
      if (res.ok) {
        alert(`Training initiated for ${modelId}!\nEstimated time: 15-30 minutes`);
      }
    } catch (error) {
      console.error('Error training model:', error);
      alert('Failed to initiate training');
    }
  };

  const renderMLModels = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mlModels.map((model) => (
          <div key={model.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Cpu className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{model.name}</h3>
                  <p className="text-xs text-gray-500">{model.type}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                model.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {model.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">{model.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Accuracy</span>
                <span className="font-semibold text-gray-900">{model.accuracy}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${model.accuracy}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Last trained: {model.lastTrained}</span>
                <span>{(model.trainingDataSize / 1000).toFixed(0)}K samples</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleRunModel(model.id)}
                  className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Run
                </button>
                <button
                  onClick={() => handleTrainModel(model.id)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Train
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const handleRefreshForecast = async (type) => {
    if (type === 'demand') {
      await fetchDemandForecast();
      alert('Demand forecast refreshed!');
    } else if (type === 'revenue') {
      await fetchRevenueForecast();
      alert('Revenue forecast refreshed!');
    }
  };

  const handleExportForecast = (type, data) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-forecast-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`${type} forecast exported!`);
  };

  const renderPredictive = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {demandForecast && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Demand Forecast</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRefreshForecast('demand')}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleExportForecast('demand', demandForecast)}
                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  title="Export"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Historical</span>
                <span className="text-2xl font-bold text-gray-900">{demandForecast.historical}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Predicted</span>
                <span className="text-2xl font-bold text-green-600">{demandForecast.predicted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Growth</span>
                <span className="text-lg font-semibold text-blue-600">+{demandForecast.growth}%</span>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Peak Periods</h4>
                <div className="space-y-2">
                  {demandForecast.peakPeriods?.map((period, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">{period.period}</span>
                      <span className="font-medium">{period.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {revenueForecast && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Revenue Forecast</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRefreshForecast('revenue')}
                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleExportForecast('revenue', revenueForecast)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Export"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Historical</span>
                <span className="text-2xl font-bold text-gray-900">₹{revenueForecast.historical?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Predicted</span>
                <span className="text-2xl font-bold text-green-600">₹{revenueForecast.predicted?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Growth</span>
                <span className="text-lg font-semibold text-blue-600">+{revenueForecast.growth}%</span>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Revenue Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ticket Sales</span>
                    <span className="font-medium">₹{revenueForecast.breakdown?.ticketSales?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Premium Services</span>
                    <span className="font-medium">₹{revenueForecast.breakdown?.premiumServices?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Other</span>
                    <span className="font-medium">₹{revenueForecast.breakdown?.other?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const handleGenerateSchedule = async () => {
    try {
      const res = await apiFetch('/api/admin/ai/autonomous/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleType: 'daily' })
      });
      if (res.ok) {
        alert('Autonomous schedule generated successfully!');
        fetchAutonomousStatus();
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      alert('Failed to generate schedule');
    }
  };

  const handleViewRecommendations = async () => {
    try {
      const res = await apiFetch('/api/admin/ai/recommendations');
      if (res.ok && res.data) {
        const recs = res.data.recommendations || [];
        alert(`Found ${recs.length} AI recommendations!\nCheck console for details.`);
        console.log('AI Recommendations:', recs);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const renderAutonomous = () => (
    <div className="space-y-6">
      {autonomousStatus && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Schedules Generated</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{autonomousStatus.schedulesGenerated}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Conflicts Resolved</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{autonomousStatus.conflictsResolved}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-gray-600">Fatigue Alerts</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{autonomousStatus.fatigueAlertsIssued}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Optimization Score</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{autonomousStatus.optimizationScore}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Modules</h3>
              <div className="space-y-3">
                {autonomousStatus.activeModules?.map((module, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">{module.name}</p>
                        <p className="text-sm text-gray-500">Uptime: {module.uptime}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {module.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleGenerateSchedule}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Zap className="w-5 h-5" />
                  Generate Autonomous Schedule
                </button>
                <button
                  onClick={handleViewRecommendations}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Brain className="w-5 h-5" />
                  View AI Recommendations
                </button>
                <button
                  onClick={fetchAutonomousStatus}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comprehensive AI Dashboard</h1>
            <p className="text-gray-600">AI-powered insights and analytics</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              autoRefresh
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{autoRefresh ? 'Live' : 'Paused'}</span>
          </button>
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'ml-models', label: 'ML Models', icon: Cpu },
            { id: 'predictive', label: 'Predictive Analytics', icon: LineChart },
            { id: 'autonomous', label: 'Autonomous Operations', icon: Zap }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'ml-models' && renderMLModels()}
        {activeTab === 'predictive' && renderPredictive()}
        {activeTab === 'autonomous' && renderAutonomous()}
      </div>
    </div>
  );
};

export default ComprehensiveAIDashboard;
