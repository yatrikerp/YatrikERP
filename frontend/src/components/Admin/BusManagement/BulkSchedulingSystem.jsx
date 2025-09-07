import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Users, MapPin, Route, Settings, Zap,
  Play, Pause, RotateCcw, Target, BarChart3, Activity,
  CheckCircle, AlertTriangle, Fuel, Award, TrendingUp,
  Copy, Download, Upload, RefreshCw, Filter, Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BulkSchedulingSystem = ({
  buses = [],
  routes = [],
  depots = [],
  onBulkSchedule
}) => {
  const [selectedOperation, setSelectedOperation] = useState('optimize');
  const [schedulingParams, setSchedulingParams] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    depotIds: [],
    routeIds: [],
    busTypes: [],
    priority: 'balanced', // fuel_efficient, passenger_optimized, balanced
    constraints: {
      maxWorkingHours: 10,
      minRestTime: 8,
      fuelThreshold: 20,
      maintenanceBuffer: 2
    }
  });

  const [optimizationResults, setOptimizationResults] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // KSRTC Scale Statistics
  const ksrtcStats = {
    totalBuses: 6241,
    dailySchedules: 6200,
    totalRoutes: 6389,
    dailyPassengers: 3500000,
    depots: 28,
    employees: 35000
  };

  // Optimization algorithms
  const optimizationAlgorithms = [
    {
      id: 'ai_genetic',
      name: 'AI Genetic Algorithm',
      description: 'Advanced AI optimization using genetic algorithms for maximum efficiency',
      estimatedTime: '15-20 minutes',
      efficiency: 95,
      icon: Zap,
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'route_clustering',
      name: 'Route Clustering',
      description: 'Group similar routes for optimal bus allocation and fuel efficiency',
      estimatedTime: '5-8 minutes',
      efficiency: 85,
      icon: Target,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'demand_prediction',
      name: 'Demand Prediction',
      description: 'ML-based passenger demand prediction for optimal capacity utilization',
      estimatedTime: '10-12 minutes',
      efficiency: 90,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'fuel_optimization',
      name: 'Fuel Optimization',
      description: 'Minimize fuel consumption through intelligent route and timing optimization',
      estimatedTime: '8-10 minutes',
      efficiency: 88,
      icon: Fuel,
      color: 'from-orange-500 to-red-500'
    }
  ];

  // Handle bulk optimization
  const handleOptimization = async (algorithmId) => {
    setIsOptimizing(true);
    setOptimizationResults(null);
    
    try {
      // Simulate optimization process
      toast.loading('Starting optimization for 6,200+ buses...', { id: 'optimization' });
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      
      const mockResults = {
        algorithm: algorithmId,
        processedBuses: ksrtcStats.totalBuses,
        optimizedRoutes: Math.floor(ksrtcStats.totalRoutes * 0.85),
        fuelSavings: '₹2,50,000/day',
        efficiencyGain: '15%',
        passengerSatisfaction: '+8%',
        processingTime: '12 minutes',
        recommendations: [
          'Reassign 450 buses to high-demand routes',
          'Optimize 1,200 departure times for fuel efficiency',
          'Implement dynamic pricing on 800 routes',
          'Schedule preventive maintenance for 150 buses'
        ]
      };
      
      setOptimizationResults(mockResults);
      toast.success('Optimization completed successfully!', { id: 'optimization' });
      
    } catch (error) {
      toast.error('Optimization failed', { id: 'optimization' });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Bulk operations
  const bulkOperations = [
    {
      id: 'mass_schedule',
      name: 'Mass Schedule Creation',
      description: 'Create schedules for multiple buses across selected routes',
      icon: Calendar,
      action: () => toast.success('Mass scheduling initiated for selected buses')
    },
    {
      id: 'route_rebalance',
      name: 'Route Rebalancing',
      description: 'Redistribute buses across routes based on demand patterns',
      icon: Route,
      action: () => toast.success('Route rebalancing started')
    },
    {
      id: 'maintenance_schedule',
      name: 'Maintenance Scheduling',
      description: 'Schedule maintenance for buses based on usage and condition',
      icon: Settings,
      action: () => toast.success('Maintenance scheduling optimized')
    },
    {
      id: 'staff_assignment',
      name: 'Staff Auto-Assignment',
      description: 'Automatically assign drivers and conductors based on availability',
      icon: Users,
      action: () => toast.success('Staff auto-assignment completed')
    }
  ];

  return (
    <div className="space-y-6">
      {/* KSRTC Scale Overview */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">KSRTC Scale Operations</h2>
            <p className="opacity-90">Managing India's largest state transport corporation</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{ksrtcStats.totalBuses.toLocaleString()}</p>
            <p className="text-sm opacity-75">Active Buses</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{ksrtcStats.dailySchedules.toLocaleString()}</p>
            <p className="text-sm opacity-75">Daily Schedules</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{ksrtcStats.totalRoutes.toLocaleString()}</p>
            <p className="text-sm opacity-75">Total Routes</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{(ksrtcStats.dailyPassengers / 1000000).toFixed(1)}M</p>
            <p className="text-sm opacity-75">Daily Passengers</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{ksrtcStats.depots}</p>
            <p className="text-sm opacity-75">Depots</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{(ksrtcStats.employees / 1000).toFixed(0)}K+</p>
            <p className="text-sm opacity-75">Employees</p>
          </div>
        </div>
      </div>

      {/* Optimization Algorithms */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Optimization Algorithms</h3>
            <p className="text-sm text-gray-600">Choose the best algorithm for your scheduling needs</p>
          </div>
          
          {optimizationResults && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Last optimization: {optimizationResults.processingTime}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {optimizationAlgorithms.map(algorithm => {
            const Icon = algorithm.icon;
            return (
              <motion.div
                key={algorithm.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`bg-gradient-to-br ${algorithm.color} rounded-xl p-6 text-white cursor-pointer`}
                onClick={() => handleOptimization(algorithm.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-75">Efficiency</div>
                    <div className="text-lg font-bold">{algorithm.efficiency}%</div>
                  </div>
                </div>
                
                <h4 className="text-lg font-bold mb-2">{algorithm.name}</h4>
                <p className="text-sm opacity-90 mb-3">{algorithm.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-75">Est. Time: {algorithm.estimatedTime}</span>
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium">
                    {isOptimizing ? 'Processing...' : 'Start Optimization'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Optimization Results */}
      {optimizationResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Optimization Results</h3>
              <p className="text-sm text-gray-600">
                Algorithm: {optimizationAlgorithms.find(a => a.id === optimizationResults.algorithm)?.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-900">{optimizationResults.processedBuses.toLocaleString()}</p>
              <p className="text-sm text-blue-700">Buses Optimized</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-900">{optimizationResults.fuelSavings}</p>
              <p className="text-sm text-green-700">Daily Fuel Savings</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-900">{optimizationResults.efficiencyGain}</p>
              <p className="text-sm text-purple-700">Efficiency Gain</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-900">{optimizationResults.passengerSatisfaction}</p>
              <p className="text-sm text-orange-700">Satisfaction Boost</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Key Recommendations</h4>
            <div className="space-y-2">
              {optimizationResults.recommendations.map((rec, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Bulk Operations Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bulk Operations</h3>
            <p className="text-sm text-gray-600">Streamline operations for thousands of buses</p>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Activity className="w-4 h-4" />
            <span>Ready for {ksrtcStats.totalBuses.toLocaleString()} buses</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bulkOperations.map(operation => {
            const Icon = operation.icon;
            return (
              <motion.button
                key={operation.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={operation.action}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 text-left hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center space-x-4 mb-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{operation.name}</h4>
                    <p className="text-sm text-gray-600">{operation.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Click to execute</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Real-time Processing Status */}
      {isOptimizing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-40 min-w-[300px]"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium text-gray-900">Optimizing Fleet...</span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Processing buses:</span>
              <span className="font-medium">6,241 / 6,241</span>
            </div>
            <div className="flex justify-between">
              <span>Analyzing routes:</span>
              <span className="font-medium">6,389 routes</span>
            </div>
            <div className="flex justify-between">
              <span>Expected savings:</span>
              <span className="font-medium text-green-600">₹2.5L/day</span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 10, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BulkSchedulingSystem;

