import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Brain,
  RefreshCw,
  BarChart3,
  Activity
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const AdminCrewFatigueManagement = () => {
  const [crewData, setCrewData] = useState([]);
  const [fatigueAlerts, setFatigueAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mlPredictions, setMlPredictions] = useState(null);
  const [selectedCrew, setSelectedCrew] = useState(null);

  const fetchCrewData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/crew/fatigue-analysis');
      if (res.ok) {
        setCrewData(res.data.crew || []);
        setFatigueAlerts(res.data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching crew data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMLPredictions = async () => {
    try {
      const res = await apiFetch('/api/ai/analytics/predictions', {
        method: 'POST',
        body: JSON.stringify({ type: 'fatigue' })
      });
      if (res.ok) {
        setMlPredictions(res.data);
      }
    } catch (error) {
      console.error('Error fetching ML predictions:', error);
    }
  };

  const generateSchedule = async () => {
    try {
      const res = await apiFetch('/api/admin/crew/generate-schedule', {
        method: 'POST',
        body: JSON.stringify({
          useML: true,
          balanceDuties: true,
          preventFatigue: true
        })
      });
      if (res.ok) {
        fetchCrewData();
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
    }
  };

  useEffect(() => {
    fetchCrewData();
    fetchMLPredictions();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Crew Duty & Fatigue Management
            </h1>
            <p className="text-gray-600 mt-2">
              AI-based crew duty balancing with fatigue prevention alerts and fair rotation system
            </p>
          </div>
          <button
            onClick={generateSchedule}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-5 h-5" />
            Generate Schedule
          </button>
        </div>
      </div>

      {/* ML Fatigue Predictions */}
      {mlPredictions && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6 text-orange-600" />
            AI-Based Fatigue Predictions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Average Fatigue Score</div>
              <div className="text-2xl font-bold text-orange-600">
                {mlPredictions.averageFatigue?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-xs text-gray-500 mt-1">Crew status</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">High Risk Crew</div>
              <div className="text-2xl font-bold text-red-600">
                {mlPredictions.highRiskCount || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">Require rest</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Optimal Crew</div>
              <div className="text-2xl font-bold text-green-600">
                {mlPredictions.optimalCount || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">Available</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Rest Hours Needed</div>
              <div className="text-2xl font-bold text-blue-600">
                {mlPredictions.restHoursNeeded || 0}h
              </div>
              <div className="text-xs text-gray-500 mt-1">Recommended</div>
            </div>
          </div>
        </div>
      )}

      {/* Fatigue Alerts */}
      {fatigueAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-6 h-6" />
            Fatigue Prevention Alerts
          </h2>
          <div className="space-y-3">
            {fatigueAlerts.map((alert, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-red-800">{alert.crewName}</div>
                    <div className="text-sm text-gray-600 mt-1">{alert.message}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{alert.fatigueScore}</div>
                    <div className="text-xs text-gray-600">Fatigue Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crew List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Crew Duty & Fatigue Status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Shift</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rest Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fatigue Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {crewData.map((crew) => (
                <tr key={crew._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{crew.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{crew.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{crew.currentShift || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{crew.restHours || 0}h</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{crew.distanceCovered || 0} km</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      crew.fatigueScore < 30 ? 'bg-green-100 text-green-800' :
                      crew.fatigueScore < 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {crew.fatigueScore || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      crew.status === 'available' ? 'bg-green-100 text-green-800' :
                      crew.status === 'on_duty' ? 'bg-blue-100 text-blue-800' :
                      crew.status === 'resting' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {crew.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedCrew(crew)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCrewFatigueManagement;
