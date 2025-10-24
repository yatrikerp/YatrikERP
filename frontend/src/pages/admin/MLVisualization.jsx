import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  PlayCircle, RefreshCw, Activity, TrendingUp, 
  AlertCircle, CheckCircle, Clock, Zap 
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MLVisualization = () => {
  const [metrics, setMetrics] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState('all');
  const [mlServiceStatus, setMlServiceStatus] = useState('unknown');

  const modelNames = {
    knn_demand_prediction: 'KNN - Passenger Demand',
    nb_route_performance: 'Naive Bayes - Route Performance',
    dt_delay_prediction: 'Decision Tree - Trip Delay',
    svm_route_optimization: 'SVM - Route Optimization',
    nn_crew_load_balancing: 'Neural Network - Crew Load'
  };

  // Check ML service health
  const checkMLServiceHealth = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/ai/health`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMlServiceStatus(response.data.success ? 'online' : 'offline');
    } catch (err) {
      setMlServiceStatus('offline');
    }
  };

  // Fetch all metrics
  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/ai/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setMetrics(response.data.data.reports);
        fetchComparison();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch ML metrics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch comparison data
  const fetchComparison = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/ai/analytics/comparison`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setComparison(response.data.data.comparison);
      }
    } catch (err) {
      console.error('Failed to fetch comparison:', err);
    }
  };

  // Run all models
  const runAllModels = async () => {
    setRunning(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/ai/analytics/run-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTimeout(fetchMetrics, 2000); // Wait for models to finish
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run ML models');
    } finally {
      setRunning(false);
    }
  };

  // Run specific model
  const runSpecificModel = async (modelName) => {
    setRunning(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/ai/analytics/run/${modelName}`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setTimeout(fetchMetrics, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to run ${modelName}`);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    checkMLServiceHealth();
    fetchMetrics();
  }, []);

  // Render metric card
  const MetricCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <Icon className="w-10 h-10" style={{ color }} />
      </div>
    </div>
  );

  // Render comparison table
  const ComparisonTable = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <h3 className="text-xl font-bold text-white">Model Performance Comparison</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accuracy / R²</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MSE / F1</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comparison.map((model, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {modelNames[model.model]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {model.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(model.metrics?.Accuracy || model.metrics?.R2_Score || 'N/A').toFixed?.(4) || model.metrics?.Accuracy || model.metrics?.R2_Score || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(model.metrics?.MSE || model.metrics?.F1_Score || 'N/A').toFixed?.(4) || model.metrics?.MSE || model.metrics?.F1_Score || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Completed
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render visualization for specific model
  const ModelVisualization = ({ modelKey, modelData }) => {
    if (!modelData || !modelData.metrics) return null;

    const { visualization } = modelData.metrics;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">{modelNames[modelKey]}</h3>
        
        {visualization && (
          <div className="mb-4">
            <img src={visualization} alt={`${modelKey} visualization`} className="w-full rounded-lg" />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {Object.entries(modelData.metrics.test_metrics || {}).map(([key, value]) => (
            <div key={key} className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">{key.replace('_', ' ')}</p>
              <p className="text-lg font-bold text-gray-900">
                {typeof value === 'number' ? value.toFixed(4) : value}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                ML Analytics Dashboard
              </h1>
              <p className="text-blue-100">
                AI-Powered Insights for Bus Transport Management
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-full ${mlServiceStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}>
                <span className="text-white text-sm font-medium">
                  ML Service: {mlServiceStatus === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={runAllModels}
            disabled={running || loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
            {running ? 'Running Models...' : 'Run All Models'}
          </button>
          
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !metrics && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <p className="ml-3 text-gray-600">Loading ML metrics...</p>
          </div>
        )}

        {/* Metrics Summary */}
        {metrics && Object.keys(metrics).length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <MetricCard
                title="Total Models"
                value={Object.keys(metrics).length}
                icon={Activity}
                color="#3b82f6"
              />
              <MetricCard
                title="Models Completed"
                value={comparison.length}
                icon={CheckCircle}
                color="#10b981"
              />
              <MetricCard
                title="Avg Accuracy"
                value={
                  comparison.length > 0
                    ? ((comparison.reduce((sum, m) => sum + (m.metrics?.Accuracy || m.metrics?.R2_Score || 0), 0) / comparison.length) * 100).toFixed(1) + '%'
                    : 'N/A'
                }
                icon={TrendingUp}
                color="#f59e0b"
              />
              <MetricCard
                title="Last Updated"
                value={
                  comparison[0]?.timestamp
                    ? new Date(comparison[0].timestamp).toLocaleTimeString()
                    : 'N/A'
                }
                icon={Clock}
                color="#8b5cf6"
              />
            </div>

            {/* Comparison Table */}
            {comparison.length > 0 && (
              <div className="mb-6">
                <ComparisonTable />
              </div>
            )}

            {/* Individual Model Visualizations */}
            <div className="mt-6">
              <h2 className="text-2xl font-bold mb-4">Model Visualizations</h2>
              {Object.entries(metrics).map(([key, data]) => (
                <ModelVisualization key={key} modelKey={key} modelData={data} />
              ))}
            </div>
          </>
        )}

        {/* No Data State */}
        {!loading && metrics && Object.keys(metrics).length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No ML Reports Available</h3>
            <p className="text-gray-600 mb-6">
              Run the ML models to generate analytics and visualizations
            </p>
            <button
              onClick={runAllModels}
              disabled={running}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50"
            >
              Run All Models Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MLVisualization;
