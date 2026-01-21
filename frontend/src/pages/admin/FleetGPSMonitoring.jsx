import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Bus,
  RefreshCw,
  Activity,
  Clock,
  Users,
  Route as RouteIcon
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const FleetGPSMonitoring = () => {
  const [fleetData, setFleetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchFleetData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchFleetData();
      }, 10000); // Refresh every 10 seconds for real-time tracking
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchFleetData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/fleet-monitoring/live');

      if (res.ok) {
        setFleetData(res.data.fleet || []);
      }
    } catch (error) {
      console.error('Error fetching fleet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status, delayMinutes = 0) => {
    if (delayMinutes > 30) {
      return 'bg-red-100 text-red-700 border-red-300';
    } else if (delayMinutes > 15) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'delayed':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const calculateDelay = (trip) => {
    if (!trip.scheduledDepartureTime) return 0;
    const scheduled = new Date(trip.scheduledDepartureTime);
    const now = new Date();
    const delayMs = now - scheduled;
    return Math.floor(delayMs / 60000); // Convert to minutes
  };

  const getDelayStatus = (delayMinutes) => {
    if (delayMinutes > 30) return { text: '🔴 Delayed', color: 'text-red-600' };
    if (delayMinutes > 15) return { text: '🟡 Delayed', color: 'text-yellow-600' };
    return { text: '🟢 On Time', color: 'text-green-600' };
  };

  if (loading && fleetData.length === 0) {
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-Time Fleet & GPS Monitoring</h1>
          <p className="text-gray-600">Live tracking of all buses and trips</p>
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
            onClick={fetchFleetData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Fleet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Buses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{fleetData.length}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <Bus className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Trips</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {fleetData.filter(f => f.status === 'running').length}
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">With GPS</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {fleetData.filter(f => f.location).length}
              </p>
            </div>
            <div className="p-3 bg-purple-500 rounded-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delayed Trips</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {fleetData.filter(f => {
                  const delay = calculateDelay(f);
                  return delay > 15;
                }).length}
              </p>
            </div>
            <div className="p-3 bg-red-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Fleet List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Fleet Status</h2>
        <div className="space-y-4">
          {fleetData.length > 0 ? (
            fleetData.map((vehicle, index) => {
              const delayMinutes = calculateDelay(vehicle);
              const delayStatus = getDelayStatus(delayMinutes);
              return (
                <div
                  key={index}
                  className={`p-6 rounded-lg border ${getStatusColor(vehicle.status, delayMinutes)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 bg-white bg-opacity-50 rounded-lg">
                        <Bus className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {vehicle.bus?.number || 'N/A'}
                          </h3>
                          <span className="px-3 py-1 bg-white bg-opacity-50 rounded-full text-xs font-medium capitalize">
                            {vehicle.status}
                          </span>
                          {delayMinutes > 15 && (
                            <span className={`px-3 py-1 bg-white bg-opacity-50 rounded-full text-xs font-medium ${delayStatus.color}`}>
                              {delayStatus.text} ({delayMinutes} min)
                            </span>
                          )}
                        </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm font-medium opacity-75">Route</p>
                          <p className="text-sm mt-1">{vehicle.route?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium opacity-75">Driver</p>
                          <p className="text-sm mt-1">{vehicle.driver || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium opacity-75">Conductor</p>
                          <p className="text-sm mt-1">{vehicle.conductor || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium opacity-75">Depot</p>
                          <p className="text-sm mt-1">{vehicle.depot || 'N/A'}</p>
                        </div>
                        {vehicle.location && (
                          <>
                            <div>
                              <p className="text-sm font-medium opacity-75">Speed</p>
                              <p className="text-sm mt-1">{vehicle.location.speed || 0} km/h</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium opacity-75">Last Update</p>
                              <p className="text-sm mt-1">
                                {new Date(vehicle.location.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      {vehicle.location && (
                        <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">
                              {vehicle.location.latitude.toFixed(6)}, {vehicle.location.longitude.toFixed(6)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No fleet data available</p>
              <p className="text-sm text-gray-400">Fleet tracking data will appear here when buses are active</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FleetGPSMonitoring;
