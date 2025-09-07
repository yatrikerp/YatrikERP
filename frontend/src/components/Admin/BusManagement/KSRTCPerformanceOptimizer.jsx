import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Target, TrendingUp, BarChart3, Activity, Fuel,
  Users, Clock, MapPin, Award, CheckCircle, AlertTriangle,
  RefreshCw, Download, Settings, Calendar, Route
} from 'lucide-react';

const KSRTCPerformanceOptimizer = ({ buses = [], onOptimize }) => {
  const [optimizationRunning, setOptimizationRunning] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [optimizationHistory, setOptimizationHistory] = useState([]);

  // KSRTC Performance Benchmarks
  const ksrtcBenchmarks = {
    targetUtilization: 85,
    targetFuelEfficiency: 15, // km/l
    targetOnTimePerformance: 95,
    targetPassengerSatisfaction: 4.5,
    maxMaintenanceDowntime: 5 // percentage
  };

  // Calculate real-time performance metrics
  const realTimeMetrics = useMemo(() => {
    if (!buses.length) return null;

    const totalBuses = buses.length;
    const activeBuses = buses.filter(b => b.status === 'active').length;
    const maintenanceBuses = buses.filter(b => b.status === 'maintenance').length;
    
    // Simulate KSRTC-scale calculations
    const currentUtilization = Math.round((activeBuses / totalBuses) * 100);
    const fuelEfficiency = 12.8; // Average km/l
    const onTimePerformance = 92;
    const passengerSatisfaction = 4.2;
    const maintenanceDowntime = Math.round((maintenanceBuses / totalBuses) * 100);

    // Performance score calculation
    const utilizationScore = (currentUtilization / ksrtcBenchmarks.targetUtilization) * 100;
    const fuelScore = (fuelEfficiency / ksrtcBenchmarks.targetFuelEfficiency) * 100;
    const onTimeScore = (onTimePerformance / ksrtcBenchmarks.targetOnTimePerformance) * 100;
    const satisfactionScore = (passengerSatisfaction / ksrtcBenchmarks.targetPassengerSatisfaction) * 100;
    const maintenanceScore = ((100 - maintenanceDowntime) / (100 - ksrtcBenchmarks.maxMaintenanceDowntime)) * 100;

    const overallScore = Math.round((utilizationScore + fuelScore + onTimeScore + satisfactionScore + maintenanceScore) / 5);

    return {
      totalBuses,
      activeBuses,
      maintenanceBuses,
      currentUtilization,
      fuelEfficiency,
      onTimePerformance,
      passengerSatisfaction,
      maintenanceDowntime,
      overallScore,
      scores: {
        utilization: Math.min(100, Math.round(utilizationScore)),
        fuel: Math.min(100, Math.round(fuelScore)),
        onTime: Math.min(100, Math.round(onTimeScore)),
        satisfaction: Math.min(100, Math.round(satisfactionScore)),
        maintenance: Math.min(100, Math.round(maintenanceScore))
      }
    };
  }, [buses]);

  // Run performance optimization
  const runOptimization = async () => {
    setOptimizationRunning(true);
    
    try {
      // Simulate KSRTC-scale optimization
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const optimizationResult = {
        id: Date.now(),
        timestamp: new Date(),
        beforeScore: realTimeMetrics?.overallScore || 0,
        afterScore: Math.min(100, (realTimeMetrics?.overallScore || 0) + Math.floor(Math.random() * 10) + 5),
        improvements: {
          fuelSavings: '₹3,50,000/day',
          utilizationGain: '+8%',
          onTimeImprovement: '+5%',
          passengerSatisfactionBoost: '+0.3 points',
          maintenanceReduction: '-2%'
        },
        actions: [
          'Optimized 1,250 bus schedules',
          'Rebalanced routes across 15 depots',
          'Reduced deadhead kilometers by 12%',
          'Improved driver-bus assignments',
          'Scheduled preventive maintenance for 180 buses'
        ]
      };
      
      setOptimizationHistory(prev => [optimizationResult, ...prev.slice(0, 4)]);
      setPerformanceMetrics(optimizationResult);
      onOptimize?.(optimizationResult);
      
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setOptimizationRunning(false);
    }
  };

  const MetricCard = ({ title, current, target, score, icon: Icon, color, unit = '' }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          score >= 90 ? 'bg-green-100 text-green-800' :
          score >= 70 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {score}%
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Current:</span>
          <span className="font-bold text-gray-900">{current}{unit}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Target:</span>
          <span className="font-medium text-blue-600">{target}{unit}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              score >= 90 ? 'bg-green-500' :
              score >= 70 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, score)}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">KSRTC Performance Optimizer</h3>
            <p className="text-sm text-gray-600">Real-time optimization for 6,200+ buses across Kerala</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{realTimeMetrics?.overallScore || 0}%</p>
              <p className="text-xs text-gray-500">Overall Performance</p>
            </div>
            
            <button
              onClick={runOptimization}
              disabled={optimizationRunning}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {optimizationRunning ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{optimizationRunning ? 'Optimizing...' : 'Run Optimization'}</span>
            </button>
          </div>
        </div>

        {realTimeMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Fleet Utilization"
              current={realTimeMetrics.currentUtilization}
              target={ksrtcBenchmarks.targetUtilization}
              score={realTimeMetrics.scores.utilization}
              icon={Activity}
              color="text-blue-600"
              unit="%"
            />
            
            <MetricCard
              title="Fuel Efficiency"
              current={realTimeMetrics.fuelEfficiency}
              target={ksrtcBenchmarks.targetFuelEfficiency}
              score={realTimeMetrics.scores.fuel}
              icon={Fuel}
              color="text-green-600"
              unit=" km/l"
            />
            
            <MetricCard
              title="On-Time Performance"
              current={realTimeMetrics.onTimePerformance}
              target={ksrtcBenchmarks.targetOnTimePerformance}
              score={realTimeMetrics.scores.onTime}
              icon={Clock}
              color="text-purple-600"
              unit="%"
            />
            
            <MetricCard
              title="Passenger Rating"
              current={realTimeMetrics.passengerSatisfaction}
              target={ksrtcBenchmarks.targetPassengerSatisfaction}
              score={realTimeMetrics.scores.satisfaction}
              icon={Users}
              color="text-orange-600"
              unit="/5"
            />
            
            <MetricCard
              title="Maintenance Uptime"
              current={100 - realTimeMetrics.maintenanceDowntime}
              target={100 - ksrtcBenchmarks.maxMaintenanceDowntime}
              score={realTimeMetrics.scores.maintenance}
              icon={CheckCircle}
              color="text-red-600"
              unit="%"
            />
          </div>
        )}
      </div>

      {/* Optimization History */}
      {optimizationHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Optimizations</h3>
          
          <div className="space-y-4">
            {optimizationHistory.map(opt => (
              <div key={opt.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Performance improved from {opt.beforeScore}% to {opt.afterScore}%
                      </p>
                      <p className="text-sm text-gray-500">
                        {opt.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">+{opt.afterScore - opt.beforeScore}%</p>
                    <p className="text-xs text-gray-500">improvement</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{opt.improvements.fuelSavings}</p>
                    <p className="text-gray-500">Fuel Savings</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{opt.improvements.utilizationGain}</p>
                    <p className="text-gray-500">Utilization</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{opt.improvements.onTimeImprovement}</p>
                    <p className="text-gray-500">On-Time</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{opt.improvements.passengerSatisfactionBoost}</p>
                    <p className="text-gray-500">Satisfaction</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{opt.improvements.maintenanceReduction}</p>
                    <p className="text-gray-500">Maintenance</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Performance Monitoring */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Live Performance Monitor</h3>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fleet Status */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Fleet Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-700">Active Buses:</span>
                <span className="font-bold text-blue-900">{realTimeMetrics?.activeBuses || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">In Maintenance:</span>
                <span className="font-bold text-blue-900">{realTimeMetrics?.maintenanceBuses || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Utilization:</span>
                <span className="font-bold text-blue-900">{realTimeMetrics?.currentUtilization || 0}%</span>
              </div>
            </div>
          </div>

          {/* Efficiency Metrics */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-3">Efficiency Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-green-700">Fuel Efficiency:</span>
                <span className="font-bold text-green-900">{realTimeMetrics?.fuelEfficiency || 0} km/l</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">On-Time Rate:</span>
                <span className="font-bold text-green-900">{realTimeMetrics?.onTimePerformance || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Passenger Rating:</span>
                <span className="font-bold text-green-900">{realTimeMetrics?.passengerSatisfaction || 0}/5</span>
              </div>
            </div>
          </div>

          {/* Optimization Opportunities */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-3">Optimization Potential</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-purple-700">Fuel Savings:</span>
                <span className="font-bold text-purple-900">₹2.5L/day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Route Efficiency:</span>
                <span className="font-bold text-purple-900">+15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Cost Reduction:</span>
                <span className="font-bold text-purple-900">₹50L/month</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KSRTCPerformanceOptimizer;

