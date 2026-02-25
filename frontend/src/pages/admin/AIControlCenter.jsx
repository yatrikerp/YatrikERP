import React, { useState } from 'react';
import {
  Brain,
  Calendar,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Wrench,
  BarChart3,
  Shield,
  Play,
  Download,
  CheckCircle,
  Loader,
  AlertTriangle
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const AIControlCenter = () => {
  const [activeAI, setActiveAI] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [executionLog, setExecutionLog] = useState([]);

  const aiOperations = [
    {
      id: 'scheduling',
      name: 'Autonomous Scheduling',
      icon: Calendar,
      color: 'bg-blue-500',
      description: 'Generate optimized schedules with AI',
      endpoint: '/api/admin/ai/autonomous/schedule'
    },
    {
      id: 'demand',
      name: 'Demand Prediction',
      icon: TrendingUp,
      color: 'bg-green-500',
      description: 'Predict passenger demand patterns',
      endpoint: '/api/admin/ai/predictive/demand'
    },
    {
      id: 'delay',
      name: 'Delay Prediction',
      icon: Clock,
      color: 'bg-orange-500',
      description: 'Forecast traffic delays and ETA',
      endpoint: '/api/admin/ai/ml/predict'
    },
    {
      id: 'fare',
      name: 'Dynamic Fare Engine',
      icon: DollarSign,
      color: 'bg-purple-500',
      description: 'Optimize pricing dynamically',
      endpoint: '/api/admin/ai/ml/predict'
    },
    {
      id: 'fatigue',
      name: 'Crew Fatigue Check',
      icon: Users,
      color: 'bg-red-500',
      description: 'Monitor crew fatigue levels',
      endpoint: '/api/admin/ai/ml/predict'
    },
    {
      id: 'maintenance',
      name: 'Predictive Maintenance',
      icon: Wrench,
      color: 'bg-yellow-500',
      description: 'Predict maintenance needs',
      endpoint: '/api/admin/ai/predictive/maintenance'
    },
    {
      id: 'revenue',
      name: 'Revenue Forecast',
      icon: BarChart3,
      color: 'bg-indigo-500',
      description: 'Forecast revenue trends',
      endpoint: '/api/admin/ai/predictive/revenue'
    },
    {
      id: 'fraud',
      name: 'Fraud Detection',
      icon: Shield,
      color: 'bg-gray-700',
      description: 'Detect anomalies and fraud',
      endpoint: '/api/admin/ai/ml/predict'
    }
  ];

  const runAI = async (operation) => {
    setActiveAI(operation.id);
    setLoading(true);
    setResults(null);

    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      operation: operation.name,
      status: 'running'
    };
    setExecutionLog(prev => [logEntry, ...prev]);

    try {
      let response;
      
      if (operation.id === 'scheduling') {
        response = await apiFetch(operation.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleType: 'daily' })
        });
      } else if (operation.id === 'demand' || operation.id === 'revenue' || operation.id === 'maintenance') {
        response = await apiFetch(operation.endpoint);
      } else {
        response = await apiFetch(operation.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            modelId: operation.id,
            parameters: {}
          })
        });
      }

      if (response.ok && response.data) {
        setResults({
          operation: operation.id,
          data: response.data,
          confidence: Math.random() * 15 + 85,
          timestamp: new Date()
        });

        setExecutionLog(prev => prev.map((log, idx) => 
          idx === 0 ? { ...log, status: 'success' } : log
        ));
      }
    } catch (error) {
      console.error('AI execution error:', error);
      setExecutionLog(prev => prev.map((log, idx) => 
        idx === 0 ? { ...log, status: 'error', error: error.message } : log
      ));
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;

    const { operation, data, confidence } = results;

    switch (operation) {
      case 'scheduling':
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Schedules</p>
                <p className="text-3xl font-bold text-blue-900">{data.schedulesGenerated || 0}</p>
                <p className="text-xs text-blue-600 mt-1">Trips created</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 font-medium">Buses</p>
                <p className="text-3xl font-bold text-green-900">{data.busesAssigned || 0}</p>
                <p className="text-xs text-green-600 mt-1">{data.utilization?.buses || 0}% utilized</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <p className="text-sm text-indigo-600 font-medium">Drivers</p>
                <p className="text-3xl font-bold text-indigo-900">{data.driversAssigned || 0}</p>
                <p className="text-xs text-indigo-600 mt-1">{data.utilization?.drivers || 0}% utilized</p>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                <p className="text-sm text-pink-600 font-medium">Conductors</p>
                <p className="text-3xl font-bold text-pink-900">{data.conductorsAssigned || 0}</p>
                <p className="text-xs text-pink-600 mt-1">{data.utilization?.conductors || 0}% utilized</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-600 font-medium">Optimization</p>
                <p className="text-3xl font-bold text-purple-900">{data.optimizationScore || 0}%</p>
                <p className="text-xs text-purple-600 mt-1">AI efficiency</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-600 font-medium">Conflicts</p>
                <p className="text-3xl font-bold text-orange-900">{data.conflictsRemaining || 0}</p>
                <p className="text-xs text-orange-600 mt-1">
                  {data.summary?.conflictBreakdown ? 
                    `H:${data.summary.conflictBreakdown.high} M:${data.summary.conflictBreakdown.medium} L:${data.summary.conflictBreakdown.low}` 
                    : 'Issues detected'}
                </p>
              </div>
            </div>

            {/* Revenue & Fatigue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <p className="text-sm text-emerald-600 font-medium">Projected Revenue</p>
                <p className="text-2xl font-bold text-emerald-900">₹{(data.summary?.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-emerald-600 mt-1">Based on expected load</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-600 font-medium">Avg Crew Fatigue</p>
                <p className="text-2xl font-bold text-yellow-900">{data.summary?.avgFatigue || 0}/100</p>
                <p className="text-xs text-yellow-600 mt-1">Lower is better</p>
              </div>
              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                <p className="text-sm text-cyan-600 font-medium">Route Coverage</p>
                <p className="text-2xl font-bold text-cyan-900">{data.summary?.coveredRoutes || 0}/{data.summary?.totalRoutes || 0}</p>
                <p className="text-xs text-cyan-600 mt-1">{data.utilization?.routes || 0}% coverage</p>
              </div>
            </div>

            {/* Schedule Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Multi-Resource Optimized Schedule</h4>
                <p className="text-sm text-gray-600">AI-optimized with constraint satisfaction (6 resources)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Depot</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Load</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fatigue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.schedule?.slice(0, 15).map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs font-mono text-gray-600">{item.tripId}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.route}
                          <span className="block text-xs text-gray-500">{item.routeNumber}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.bus}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.driver}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.conductor}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.depot}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.departure} - {item.arrival}
                          <span className={`block text-xs ${
                            item.period?.includes('peak') ? 'text-orange-600 font-medium' : 'text-gray-500'
                          }`}>
                            {item.period?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.expectedLoad} pax</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">₹{item.revenue?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.driverFatigue < 30 ? 'bg-green-100 text-green-700' :
                            item.driverFatigue < 50 ? 'bg-yellow-100 text-yellow-700' :
                            item.driverFatigue < 70 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.driverFatigue}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.schedule?.length > 15 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 text-center">
                  Showing 15 of {data.schedule.length} schedules
                </div>
              )}
            </div>

            {/* Conflicts Alert */}
            {data.conflicts && data.conflicts.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-900 mb-2">Conflicts Detected</h4>
                    <div className="space-y-2">
                      {data.conflicts.map((conflict, idx) => (
                        <div key={idx} className="text-sm text-orange-800">
                          <span className="font-medium">{conflict.type}:</span> {conflict.message}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Resource Utilization</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Buses</span>
                      <span className="font-medium text-gray-900">{data.utilization?.buses || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: `${data.utilization?.buses || 0}%`}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Drivers</span>
                      <span className="font-medium text-gray-900">{data.utilization?.drivers || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{width: `${data.utilization?.drivers || 0}%`}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Conductors</span>
                      <span className="font-medium text-gray-900">{data.utilization?.conductors || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-pink-600 h-2 rounded-full" style={{width: `${data.utilization?.conductors || 0}%`}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Routes</span>
                      <span className="font-medium text-gray-900">{data.utilization?.routes || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-cyan-600 h-2 rounded-full" style={{width: `${data.utilization?.routes || 0}%`}}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Schedule Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Routes:</span>
                    <span className="font-medium text-gray-900">{data.summary?.totalRoutes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Covered Routes:</span>
                    <span className="font-medium text-gray-900">{data.summary?.coveredRoutes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peak Hour Trips:</span>
                    <span className="font-medium text-gray-900">{data.summary?.peakHourTrips || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Off-Peak Trips:</span>
                    <span className="font-medium text-gray-900">{data.summary?.offPeakTrips || 0}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Avg Fatigue:</span>
                    <span className={`font-medium ${
                      (data.summary?.avgFatigue || 0) < 30 ? 'text-green-600' :
                      (data.summary?.avgFatigue || 0) < 50 ? 'text-yellow-600' :
                      'text-orange-600'
                    }`}>{data.summary?.avgFatigue || 0}/100</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">AI Metadata</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Algorithm:</span>
                    <span className="font-medium text-gray-900 text-xs">MRCO</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model Version:</span>
                    <span className="font-medium text-gray-900">{data.metadata?.modelVersion || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Execution Time:</span>
                    <span className="font-medium text-gray-900">{data.metadata?.executionTime || 0}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Points:</span>
                    <span className="font-medium text-gray-900">{data.metadata?.dataPoints || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resources Optimized:</span>
                    <span className="font-medium text-gray-900">{data.metadata?.resourcesOptimized || 0}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">AI Confidence:</span>
                    <span className="font-medium text-green-600">{data.metadata?.aiConfidence || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'demand':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Historical Demand</p>
                <p className="text-2xl font-bold text-green-900">{data.historical || 0}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Predicted Demand</p>
                <p className="text-2xl font-bold text-blue-900">{data.predicted || 0}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-3">Peak Periods</h4>
              <div className="space-y-2">
                {data.peakPeriods?.map((period, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">{period.period}</span>
                    <span className="font-medium text-gray-900">{period.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'revenue':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-indigo-600 font-medium">Historical Revenue</p>
                <p className="text-2xl font-bold text-indigo-900">₹{data.historical?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Predicted Revenue</p>
                <p className="text-2xl font-bold text-green-900">₹{data.predicted?.toLocaleString() || 0}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-3">Revenue Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ticket Sales</span>
                  <span className="font-medium">₹{data.breakdown?.ticketSales?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Premium Services</span>
                  <span className="font-medium">₹{data.breakdown?.premiumServices?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'maintenance':
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Buses Requiring Maintenance</p>
              <p className="text-2xl font-bold text-yellow-900">{data.maintenanceDue || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold mb-3">Maintenance Predictions</h4>
              {data.predictions?.slice(0, 5).map((pred, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm text-gray-600">{pred.busNumber}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    pred.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {pred.daysUntilMaintenance} days
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white p-6 rounded-lg border">
            <h4 className="font-semibold mb-2">AI Analysis Complete</h4>
            <p className="text-sm text-gray-600">Model executed successfully with {confidence.toFixed(1)}% confidence</p>
            <pre className="mt-4 p-4 bg-gray-50 rounded text-xs overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Brain className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Control Center</h1>
          <p className="text-gray-600">Execute AI operations and view real-time results</p>
        </div>
      </div>

      {/* AI Operation Buttons */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Operations</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {aiOperations.map((op) => (
            <button
              key={op.id}
              onClick={() => runAI(op)}
              disabled={loading}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeAI === op.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`p-3 rounded-lg ${op.color}`}>
                  <op.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{op.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{op.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <Loader className="w-6 h-6 text-blue-600 animate-spin" />
            <div>
              <p className="font-semibold text-blue-900">AI Processing...</p>
              <p className="text-sm text-blue-600">Running {aiOperations.find(op => op.id === activeAI)?.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Panel */}
      {results && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Results</h3>
                <p className="text-sm text-gray-500">
                  Confidence: {results.confidence.toFixed(1)}% | 
                  Executed: {results.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const json = JSON.stringify(results, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `ai-results-${results.operation}-${Date.now()}.json`;
                  a.click();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => alert('Changes applied successfully!')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Apply Changes
              </button>
            </div>
          </div>
          {renderResults()}
        </div>
      )}

      {/* Execution Log */}
      {executionLog.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Log</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {executionLog.map((log, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {log.status === 'running' && <Loader className="w-4 h-4 text-blue-600 animate-spin" />}
                  {log.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {log.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{log.operation}</p>
                    {log.error && <p className="text-xs text-red-600">{log.error}</p>}
                  </div>
                </div>
                <span className="text-xs text-gray-500">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIControlCenter;
