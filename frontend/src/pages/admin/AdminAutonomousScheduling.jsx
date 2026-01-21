import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  Brain,
  Zap,
  BarChart3
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const AdminAutonomousScheduling = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mlPredictions, setMlPredictions] = useState(null);
  const [scheduleType, setScheduleType] = useState('daily'); // daily, weekly, monthly
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/scheduling/auto-schedules?scheduleType=${scheduleType}`);
      
      if (res.ok) {
        setSchedules(res.data.schedules || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMLPredictions = async () => {
    try {
      const res = await apiFetch('/api/ai/analytics/predictions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'scheduling',
          includeDemand: true,
          includeFatigue: true,
          includeRoutePerformance: true
        })
      });

      if (res.ok) {
        setMlPredictions(res.data);
      }
    } catch (error) {
      console.error('Error fetching ML predictions:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchMLPredictions();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSchedules();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [scheduleType]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-600" />
              Autonomous Scheduling Engine
            </h1>
            <p className="text-gray-600 mt-2">
              Fully automatic scheduling with AI-based crew assignment, fatigue monitoring, and conflict-free validation
            </p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={fetchSchedules}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* ML Predictions Panel */}
      {mlPredictions && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            ML Predictions & Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Passenger Demand</div>
              <div className="text-2xl font-bold text-purple-600">
                {mlPredictions.demandPrediction?.peakHours?.length || 0} Peak Hours
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Next 7 days forecast
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Crew Fatigue Score</div>
              <div className="text-2xl font-bold text-orange-600">
                {mlPredictions.fatiguePrediction?.averageScore?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Current crew status
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Route Performance</div>
              <div className="text-2xl font-bold text-green-600">
                {mlPredictions.routePerformance?.optimizedRoutes || 0} Routes
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Optimized for efficiency
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Type Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">View Schedules</h2>
        <div className="flex gap-4 mb-4">
          {['daily', 'weekly', 'monthly'].map((type) => (
            <button
              key={type}
              onClick={() => setScheduleType(type)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                scheduleType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600">
          Schedules are automatically generated daily at midnight. The system assigns drivers and conductors based on fatigue scores and availability.
        </p>
      </div>

      {/* Auto-Generated Schedules */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Auto-Generated Schedules ({scheduleType.charAt(0).toUpperCase() + scheduleType.slice(1)})
        </h2>
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="text-gray-600 mt-4">Loading schedules...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No schedules found for the selected period.</p>
            <p className="text-sm text-gray-500 mt-2">Schedules are automatically generated daily at midnight.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule, idx) => (
              <div key={schedule._id || idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{schedule.routeName}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {schedule.routeNumber && <span className="mr-4">Route: {schedule.routeNumber}</span>}
                      <span>Date: {schedule.date || schedule.serviceDate}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {schedule.departureTime || schedule.startTime} - {schedule.arrivalTime || schedule.endTime}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-600 font-medium">Bus:</span>
                      <div className="font-semibold">{schedule.busNumber}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Driver:</span>
                      <div className="font-semibold">{schedule.driverName}</div>
                      {schedule.driverFatigueScore !== undefined && (
                        <div className={`text-xs mt-1 ${
                          schedule.driverFatigueScore > 70 ? 'text-red-600' :
                          schedule.driverFatigueScore > 50 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          Fatigue: {schedule.driverFatigueScore}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Conductor:</span>
                      <div className="font-semibold">{schedule.conductorName}</div>
                      {schedule.conductorFatigueScore !== undefined && (
                        <div className={`text-xs mt-1 ${
                          schedule.conductorFatigueScore > 70 ? 'text-red-600' :
                          schedule.conductorFatigueScore > 50 ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          Fatigue: {schedule.conductorFatigueScore}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        schedule.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        schedule.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {schedule.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAutonomousScheduling;
