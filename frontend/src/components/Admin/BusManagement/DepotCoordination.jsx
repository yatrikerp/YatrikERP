import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, MapPin, Bus, Users, Activity, BarChart3,
  TrendingUp, TrendingDown, RefreshCw, Settings, Zap,
  CheckCircle, AlertTriangle, Clock, Fuel, Route
} from 'lucide-react';

const DepotCoordination = ({ buses = [], depots = [] }) => {
  const [selectedDepot, setSelectedDepot] = useState('all');
  const [coordinationMode, setCoordinationMode] = useState('overview'); // overview, transfer, optimization

  // Calculate depot statistics
  const depotStats = useMemo(() => {
    const stats = {};
    
    depots.forEach(depot => {
      const depotBuses = buses.filter(bus => bus.depotId === depot._id);
      const activeBuses = depotBuses.filter(bus => bus.status === 'active');
      const maintenanceBuses = depotBuses.filter(bus => bus.status === 'maintenance');
      
      stats[depot._id] = {
        ...depot,
        totalBuses: depotBuses.length,
        activeBuses: activeBuses.length,
        maintenanceBuses: maintenanceBuses.length,
        utilization: depotBuses.length > 0 ? Math.round((activeBuses.length / depotBuses.length) * 100) : 0,
        avgFuelLevel: depotBuses.length > 0 ? 
          Math.round(depotBuses.reduce((sum, bus) => sum + (bus.fuel?.currentLevel || 0), 0) / depotBuses.length) : 0
      };
    });

    return stats;
  }, [buses, depots]);

  // KSRTC depot distribution
  const ksrtcDepots = [
    { name: 'Thiruvananthapuram', buses: 450, routes: 120, efficiency: 92 },
    { name: 'Kollam', buses: 280, routes: 85, efficiency: 88 },
    { name: 'Kottayam', buses: 320, routes: 95, efficiency: 90 },
    { name: 'Ernakulam', buses: 520, routes: 150, efficiency: 94 },
    { name: 'Thrissur', buses: 380, routes: 110, efficiency: 87 },
    { name: 'Palakkad', buses: 350, routes: 105, efficiency: 89 },
    { name: 'Malappuram', buses: 290, routes: 80, efficiency: 85 },
    { name: 'Kozhikode', buses: 420, routes: 125, efficiency: 91 },
    { name: 'Wayanad', buses: 180, routes: 55, efficiency: 83 },
    { name: 'Kannur', buses: 310, routes: 90, efficiency: 86 },
    { name: 'Kasaragod', buses: 220, routes: 65, efficiency: 84 }
  ];

  // Depot performance card
  const DepotCard = ({ depot, stats }) => (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{depot.name}</h3>
            <p className="text-sm text-gray-500">{depot.code}</p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          stats.utilization >= 90 ? 'bg-green-100 text-green-800' :
          stats.utilization >= 70 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {stats.utilization}% utilization
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.totalBuses}</p>
          <p className="text-xs text-gray-500">Total Buses</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.activeBuses}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.maintenanceBuses}</p>
          <p className="text-xs text-gray-500">Maintenance</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.avgFuelLevel}%</p>
          <p className="text-xs text-gray-500">Avg Fuel</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
        <span className="text-xs text-gray-500">Last updated: 2 min ago</span>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Multi-Depot Coordination</h2>
            <p className="text-gray-600">Coordinate operations across 28 KSRTC depots</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Depots (28)</option>
              {depots.map(depot => (
                <option key={depot._id} value={depot._id}>{depot.name}</option>
              ))}
            </select>
            
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Auto-Balance</span>
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setCoordinationMode('overview')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm ${
              coordinationMode === 'overview' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setCoordinationMode('transfer')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm ${
              coordinationMode === 'transfer' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
            }`}
          >
            Inter-Depot Transfer
          </button>
          <button
            onClick={() => setCoordinationMode('optimization')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm ${
              coordinationMode === 'optimization' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
            }`}
          >
            Load Balancing
          </button>
        </div>
      </div>

      {/* KSRTC State-wide Overview */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-4">Kerala State Transport Overview</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {ksrtcDepots.slice(0, 10).map((depot, index) => (
            <div key={index} className="bg-white bg-opacity-10 rounded-lg p-3">
              <h4 className="font-semibold text-sm mb-2">{depot.name}</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Buses:</span>
                  <span className="font-medium">{depot.buses}</span>
                </div>
                <div className="flex justify-between">
                  <span>Routes:</span>
                  <span className="font-medium">{depot.routes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Efficiency:</span>
                  <span className={`font-medium ${depot.efficiency >= 90 ? 'text-green-200' : 'text-yellow-200'}`}>
                    {depot.efficiency}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Depot Grid */}
      {coordinationMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {depots.map(depot => (
            <DepotCard 
              key={depot._id} 
              depot={depot} 
              stats={depotStats[depot._id] || {}} 
            />
          ))}
        </div>
      )}

      {/* Inter-Depot Transfer Interface */}
      {coordinationMode === 'transfer' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Inter-Depot Bus Transfer</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Source Depot</h4>
              <div className="space-y-3">
                {depots.map(depot => {
                  const stats = depotStats[depot._id] || {};
                  return (
                    <div key={depot._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{depot.name}</p>
                        <p className="text-sm text-gray-500">{stats.totalBuses} buses</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{stats.utilization}%</p>
                        <p className="text-xs text-gray-500">utilization</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">Transfer Recommendations</h4>
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">High Demand Route</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Transfer 15 buses from Kollam to Ernakulam for festival season
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">Optimization Opportunity</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Redistribute 25 buses to balance workload across northern depots
                  </p>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-yellow-900">Maintenance Alert</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    8 buses need transfer to maintenance depot in Thrissur
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Balancing Interface */}
      {coordinationMode === 'optimization' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">AI-Powered Load Balancing</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Current Distribution</h4>
              <div className="space-y-3">
                {Object.values(depotStats).map(depot => (
                  <div key={depot._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">{depot.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${depot.utilization}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{depot.utilization}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">Optimization Suggestions</h4>
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-900">AI Recommendation</span>
                  </div>
                  <p className="text-sm text-purple-700 mb-3">
                    Redistribute 120 buses to achieve 85% optimal utilization across all depots
                  </p>
                  <button className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                    Apply Optimization
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Route className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Route Efficiency</span>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Optimize inter-depot routes to reduce deadhead kilometers by 12%
                  </p>
                  <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    Optimize Routes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Coordination Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Real-time Coordination Status</h3>
          <div className="flex items-center space-x-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">All depots online</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">28</p>
            <p className="text-xs text-gray-500">Depots Online</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Bus className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">5,890</p>
            <p className="text-xs text-gray-500">Active Buses</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Route className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">6,389</p>
            <p className="text-xs text-gray-500">Active Routes</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">3.5M</p>
            <p className="text-xs text-gray-500">Daily Passengers</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Fuel className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">78%</p>
            <p className="text-xs text-gray-500">Avg Fuel Level</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Activity className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">92%</p>
            <p className="text-xs text-gray-500">System Efficiency</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepotCoordination;

