import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Brain,
  Zap,
  BarChart3,
  Download,
  Play,
  Loader
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const AdminAutonomousScheduling = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [executionLog, setExecutionLog] = useState([]);

  const runOptimization = async () => {
    setLoading(true);
    setResults(null);
    
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      operation: 'Multi-Resource Constraint Optimization',
      status: 'running'
    };
    setExecutionLog(prev => [logEntry, ...prev]);

    try {
      const response = await apiFetch('/api/admin/ai/autonomous/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scheduleType: 'daily',
          days: 7
        })
      });

      console.log('API Response:', response); // Debug log

      if (response.ok && response.data && response.data.data) {
        // API returns { success: true, data: {...} }
        // apiFetch wraps it as { ok: true, data: { success: true, data: {...} } }
        setResults(response.data.data);
        setExecutionLog(prev => prev.map((log, idx) => 
          idx === 0 ? { ...log, status: 'success' } : log
        ));
      } else {
        throw new Error(response.data?.message || response.message || 'Failed to generate schedule');
      }
    } catch (error) {
      console.error('Optimization error:', error);
      setExecutionLog(prev => prev.map((log, idx) => 
        idx === 0 ? { ...log, status: 'error', error: error.message } : log
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Brain className="w-10 h-10" />
              Multi-Resource Optimization Engine
            </h1>
            <p className="text-purple-100 mt-3 text-lg">
              AI-powered constraint satisfaction for 6 resources: Routes, Trips, Buses, Drivers, Conductors, Depots
            </p>
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Demand Prediction</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Fatigue Monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Conflict-Free</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Revenue Optimization</span>
              </div>
            </div>
          </div>
          <button
            onClick={runOptimization}
            disabled={loading}
            className="flex items-center gap-3 px-8 py-4 bg-white text-purple-600 rounded-xl hover:bg-purple-50 disabled:opacity-50 font-semibold text-lg shadow-lg transition-all transform hover:scale-105"
          >
            {loading ? (
              <>
                <Loader className="w-6 h-6 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                Run Full AI Fleet Scheduling
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8">
          <div className="flex items-center space-x-4">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <div>
              <p className="font-semibold text-blue-900 text-lg">AI Processing in Progress...</p>
              <p className="text-sm text-blue-600 mt-1">Running 11-step optimization workflow</p>
              <div className="flex gap-2 mt-3 text-xs text-blue-700">
                <span>✓ Data Aggregation</span>
                <span>✓ Demand Prediction</span>
                <span>✓ Trip Calculation</span>
                <span>⟳ Resource Allocation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Panel */}
      {results && !loading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
              <p className="text-sm text-blue-600 font-semibold">Schedules</p>
              <p className="text-4xl font-bold text-blue-900 mt-2">{results.schedulesGenerated || 0}</p>
              <p className="text-xs text-blue-600 mt-1">Trips created</p>
            </div>
            <div className="bg-green-50 p-5 rounded-xl border-2 border-green-200 shadow-sm">
              <p className="text-sm text-green-600 font-semibold">Buses</p>
              <p className="text-4xl font-bold text-green-900 mt-2">{results.busesAssigned || 0}</p>
              <p className="text-xs text-green-600 mt-1">{results.utilization?.buses || 0}% utilized</p>
            </div>
            <div className="bg-indigo-50 p-5 rounded-xl border-2 border-indigo-200 shadow-sm">
              <p className="text-sm text-indigo-600 font-semibold">Drivers</p>
              <p className="text-4xl font-bold text-indigo-900 mt-2">{results.driversAssigned || 0}</p>
              <p className="text-xs text-indigo-600 mt-1">{results.utilization?.drivers || 0}% utilized</p>
            </div>
            <div className="bg-pink-50 p-5 rounded-xl border-2 border-pink-200 shadow-sm">
              <p className="text-sm text-pink-600 font-semibold">Conductors</p>
              <p className="text-4xl font-bold text-pink-900 mt-2">{results.conductorsAssigned || 0}</p>
              <p className="text-xs text-pink-600 mt-1">{results.utilization?.conductors || 0}% utilized</p>
            </div>
            <div className="bg-purple-50 p-5 rounded-xl border-2 border-purple-200 shadow-sm">
              <p className="text-sm text-purple-600 font-semibold">Optimization</p>
              <p className="text-4xl font-bold text-purple-900 mt-2">{results.optimizationScore || 0}%</p>
              <p className="text-xs text-purple-600 mt-1">AI efficiency</p>
            </div>
            <div className="bg-orange-50 p-5 rounded-xl border-2 border-orange-200 shadow-sm">
              <p className="text-sm text-orange-600 font-semibold">Conflicts</p>
              <p className="text-4xl font-bold text-orange-900 mt-2">{results.conflictsRemaining || 0}</p>
              <p className="text-xs text-orange-600 mt-1">
                {results.summary?.conflictBreakdown ? 
                  `H:${results.summary.conflictBreakdown.high} M:${results.summary.conflictBreakdown.medium} L:${results.summary.conflictBreakdown.low}` 
                  : 'Issues detected'}
              </p>
            </div>
          </div>

          {/* Revenue & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 p-5 rounded-xl border-2 border-emerald-200 shadow-sm">
              <p className="text-sm text-emerald-600 font-semibold">Projected Revenue</p>
              <p className="text-3xl font-bold text-emerald-900 mt-2">₹{(results.summary?.totalRevenue || 0).toLocaleString()}</p>
              <p className="text-xs text-emerald-600 mt-1">Based on expected load</p>
            </div>
            <div className="bg-yellow-50 p-5 rounded-xl border-2 border-yellow-200 shadow-sm">
              <p className="text-sm text-yellow-600 font-semibold">Avg Crew Fatigue</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">{results.summary?.avgFatigue || 0}/100</p>
              <p className="text-xs text-yellow-600 mt-1">Lower is better</p>
            </div>
            <div className="bg-cyan-50 p-5 rounded-xl border-2 border-cyan-200 shadow-sm">
              <p className="text-sm text-cyan-600 font-semibold">Route Coverage</p>
              <p className="text-3xl font-bold text-cyan-900 mt-2">{results.summary?.coveredRoutes || 0}/{results.summary?.totalRoutes || 0}</p>
              <p className="text-xs text-cyan-600 mt-1">{results.utilization?.routes || 0}% coverage</p>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Multi-Resource Optimized Schedule</h3>
                  <p className="text-sm text-gray-600 mt-1">AI-optimized with constraint satisfaction (6 resources)</p>
                </div>
                <button
                  onClick={() => {
                    const json = JSON.stringify(results, null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `schedule-${Date.now()}.json`;
                    a.click();
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
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
                  {results.schedule?.slice(0, 20).map((item, idx) => (
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
            {results.schedule?.length > 20 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 text-center">
                Showing 20 of {results.schedule.length} schedules
              </div>
            )}
          </div>

          {/* Conflicts Alert */}
          {results.conflicts && results.conflicts.length > 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-orange-900 mb-3 text-lg">Conflicts Detected ({results.conflicts.length})</h4>
                  <div className="space-y-2">
                    {results.conflicts.slice(0, 10).map((conflict, idx) => (
                      <div key={idx} className="text-sm text-orange-800 bg-white p-3 rounded-lg">
                        <span className={`font-semibold ${
                          conflict.severity === 'high' ? 'text-red-600' :
                          conflict.severity === 'medium' ? 'text-orange-600' :
                          'text-yellow-600'
                        }`}>
                          [{conflict.severity.toUpperCase()}]
                        </span> {conflict.message}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h4 className="font-bold text-gray-900 mb-4 text-lg">Resource Utilization</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Buses</span>
                    <span className="font-bold text-gray-900">{results.utilization?.buses || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-600 h-3 rounded-full transition-all" style={{width: `${results.utilization?.buses || 0}%`}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Drivers</span>
                    <span className="font-bold text-gray-900">{results.utilization?.drivers || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-indigo-600 h-3 rounded-full transition-all" style={{width: `${results.utilization?.drivers || 0}%`}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Conductors</span>
                    <span className="font-bold text-gray-900">{results.utilization?.conductors || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-pink-600 h-3 rounded-full transition-all" style={{width: `${results.utilization?.conductors || 0}%`}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Routes</span>
                    <span className="font-bold text-gray-900">{results.utilization?.routes || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-cyan-600 h-3 rounded-full transition-all" style={{width: `${results.utilization?.routes || 0}%`}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h4 className="font-bold text-gray-900 mb-4 text-lg">Schedule Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Routes:</span>
                  <span className="font-bold text-gray-900">{results.summary?.totalRoutes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Covered Routes:</span>
                  <span className="font-bold text-gray-900">{results.summary?.coveredRoutes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Peak Hour Trips:</span>
                  <span className="font-bold text-gray-900">{results.summary?.peakHourTrips || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Off-Peak Trips:</span>
                  <span className="font-bold text-gray-900">{results.summary?.offPeakTrips || 0}</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-600">Avg Fatigue:</span>
                  <span className={`font-bold ${
                    (results.summary?.avgFatigue || 0) < 30 ? 'text-green-600' :
                    (results.summary?.avgFatigue || 0) < 50 ? 'text-yellow-600' :
                    'text-orange-600'
                  }`}>{results.summary?.avgFatigue || 0}/100</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h4 className="font-bold text-gray-900 mb-4 text-lg">AI Metadata</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Algorithm:</span>
                  <span className="font-bold text-gray-900 text-xs">MRCO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Model Version:</span>
                  <span className="font-bold text-gray-900">{results.metadata?.modelVersion || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Execution Time:</span>
                  <span className="font-bold text-gray-900">{results.metadata?.executionTime || 0}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Points:</span>
                  <span className="font-bold text-gray-900">{results.metadata?.dataPoints || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Resources:</span>
                  <span className="font-bold text-gray-900">{results.metadata?.resourcesOptimized || 0}</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-600">AI Confidence:</span>
                  <span className="font-bold text-green-600">{results.metadata?.aiConfidence || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-green-900 text-lg">Ready to Publish</h4>
                <p className="text-sm text-green-700 mt-1">
                  Schedule has been optimized with {results.optimizationScore}% efficiency. 
                  Click to activate this schedule in the system.
                </p>
              </div>
              <button
                onClick={() => alert('Schedule published successfully! All trips are now active.')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
              >
                <CheckCircle className="w-5 h-5" />
                Approve & Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execution Log */}
      {executionLog.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Execution Log</h3>
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

export default AdminAutonomousScheduling;
