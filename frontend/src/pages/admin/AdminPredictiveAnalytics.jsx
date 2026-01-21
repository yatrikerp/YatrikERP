import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  DollarSign,
  Users,
  Fuel,
  AlertCircle,
  Clock
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const AdminPredictiveAnalytics = () => {
  const [predictions, setPredictions] = useState({
    demand: null,
    revenue: null,
    fuel: null,
    profitability: null
  });
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, 1y
  const [loading, setLoading] = useState(false);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/analytics/predictive?range=${timeRange}`, {
        method: 'GET'
      });
      if (res.ok) {
        setPredictions(res.data);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [timeRange]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              Predictive Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Future insights and forecasts for data-driven decision making
            </p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="7d">Next 7 Days</option>
            <option value="30d">Next 30 Days</option>
            <option value="90d">Next 90 Days</option>
            <option value="1y">Next Year</option>
          </select>
        </div>
      </div>

      {/* Key Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-600" />
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-sm text-gray-600">Passenger Demand Forecast</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {predictions.demand?.total || '0'}
          </div>
          <div className="text-sm text-green-600 mt-2">
            +{predictions.demand?.growth || 0}% vs previous period
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-600" />
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-sm text-gray-600">Revenue Projection</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            ₹{predictions.revenue?.total?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-green-600 mt-2">
            +{predictions.revenue?.growth || 0}% vs previous period
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Fuel className="w-8 h-8 text-orange-600" />
            <TrendingUp className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-sm text-gray-600">Fuel Consumption Forecast</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {predictions.fuel?.total || '0'}L
          </div>
          <div className="text-sm text-red-600 mt-2">
            {predictions.fuel?.optimization || 0}% optimization potential
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-sm text-gray-600">Route Profitability</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {predictions.profitability?.topRoutes || 0}
          </div>
          <div className="text-sm text-green-600 mt-2">
            High-profit routes identified
          </div>
        </div>
      </div>

      {/* Peak Hour Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Peak Hour Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-2">Morning Peak</div>
            <div className="text-2xl font-bold">{predictions.demand?.peakHours?.morning || '6:00-9:00'}</div>
            <div className="text-sm text-gray-500">Expected demand: {predictions.demand?.peakDemand?.morning || 'High'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Evening Peak</div>
            <div className="text-2xl font-bold">{predictions.demand?.peakHours?.evening || '17:00-20:00'}</div>
            <div className="text-sm text-gray-500">Expected demand: {predictions.demand?.peakDemand?.evening || 'High'}</div>
          </div>
        </div>
      </div>

      {/* Route Profitability Forecast */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Route Profitability Forecast</h2>
        <div className="space-y-4">
          {predictions.profitability?.routes?.map((route, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-semibold">{route.name}</div>
                <div className="text-sm text-gray-600">{route.distance} km</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">₹{route.projectedRevenue}</div>
                <div className="text-sm text-gray-600">Profit: {route.profitMargin}%</div>
              </div>
            </div>
          )) || (
            <div className="text-center text-gray-500 py-8">No route data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPredictiveAnalytics;
