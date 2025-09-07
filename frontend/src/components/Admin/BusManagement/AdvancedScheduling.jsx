import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, Route, Users, MapPin, Bus, Settings,
  Play, Pause, RotateCcw, Zap, Target, BarChart3, Filter,
  ChevronDown, ChevronRight, Plus, Edit, Copy, Trash2,
  AlertTriangle, CheckCircle, Activity, Fuel, Award, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdvancedScheduling = ({ 
  buses = [], 
  routes = [], 
  depots = [],
  onScheduleUpdate,
  onBulkSchedule 
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('timeline'); // timeline, grid, gantt
  const [selectedDepot, setSelectedDepot] = useState('all');
  const [selectedRoute, setSelectedRoute] = useState('all');
  const [showBulkScheduler, setShowBulkScheduler] = useState(false);
  const [selectedBuses, setSelectedBuses] = useState([]);
  
  // Scheduling state
  const [schedules, setSchedules] = useState([]);
  const [draggedBus, setDraggedBus] = useState(null);
  const [optimizationMode, setOptimizationMode] = useState(false);

  // Mock schedule data for demonstration
  const mockSchedules = useMemo(() => [
    {
      id: '1',
      busId: 'bus1',
      busNumber: 'KL-06-Q-0355',
      routeId: 'route1',
      routeName: 'Thiruvananthapuram - Kochi',
      depotId: 'depot1',
      departureTime: '06:00',
      arrivalTime: '10:30',
      status: 'scheduled',
      driverId: 'driver1',
      conductorId: 'conductor1',
      estimatedPassengers: 42,
      priority: 'high'
    },
    {
      id: '2',
      busId: 'bus2',
      busNumber: 'KL-BUS-003',
      routeId: 'route2',
      routeName: 'Kochi - Kozhikode',
      depotId: 'depot1',
      departureTime: '07:15',
      arrivalTime: '11:45',
      status: 'active',
      driverId: 'driver2',
      conductorId: 'conductor2',
      estimatedPassengers: 38,
      priority: 'medium'
    }
  ], []);

  // Time slots for scheduling (24 hours)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  }, []);

  // Filter schedules based on selected filters
  const filteredSchedules = useMemo(() => {
    return mockSchedules.filter(schedule => {
      if (selectedDepot !== 'all' && schedule.depotId !== selectedDepot) return false;
      if (selectedRoute !== 'all' && schedule.routeId !== selectedRoute) return false;
      return true;
    });
  }, [mockSchedules, selectedDepot, selectedRoute]);

  // Calculate scheduling statistics
  const schedulingStats = useMemo(() => {
    const totalScheduled = filteredSchedules.length;
    const activeTrips = filteredSchedules.filter(s => s.status === 'active').length;
    const scheduledTrips = filteredSchedules.filter(s => s.status === 'scheduled').length;
    const totalPassengers = filteredSchedules.reduce((sum, s) => sum + s.estimatedPassengers, 0);
    
    return {
      totalScheduled,
      activeTrips,
      scheduledTrips,
      totalPassengers,
      utilizationRate: totalScheduled > 0 ? Math.round((activeTrips / totalScheduled) * 100) : 0
    };
  }, [filteredSchedules]);

  // Bulk scheduling operations
  const handleBulkSchedule = (operation, data) => {
    switch (operation) {
      case 'auto_optimize':
        toast.success('Auto-optimization started for 6,200+ buses');
        break;
      case 'duplicate_schedule':
        toast.success('Schedule duplicated for selected buses');
        break;
      case 'mass_assign':
        toast.success(`${selectedBuses.length} buses scheduled`);
        break;
      default:
        break;
    }
  };

  // Schedule Card Component
  const ScheduleCard = ({ schedule }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-lg border-l-4 p-4 shadow-sm hover:shadow-md transition-all ${
        schedule.status === 'active' ? 'border-green-500' :
        schedule.status === 'scheduled' ? 'border-blue-500' :
        'border-gray-300'
      }`}
      draggable
      onDragStart={() => setDraggedBus(schedule)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bus className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{schedule.busNumber}</h4>
            <p className="text-sm text-gray-500">{schedule.routeName}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            schedule.status === 'active' ? 'bg-green-100 text-green-800' :
            schedule.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {schedule.status}
          </span>
          
          <button className="p-1 text-gray-400 hover:text-gray-600">
            <Edit className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{schedule.departureTime} - {schedule.arrivalTime}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span>{schedule.estimatedPassengers} passengers</span>
        </div>
      </div>

      {schedule.priority === 'high' && (
        <div className="mt-2 flex items-center space-x-1 text-orange-600">
          <AlertTriangle className="w-3 h-3" />
          <span className="text-xs font-medium">High Priority</span>
        </div>
      )}
    </motion.div>
  );

  // Timeline View Component
  const TimelineView = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Schedule Timeline</h3>
        
        <div className="relative">
          {/* Time axis */}
          <div className="flex border-b border-gray-200 pb-2 mb-4">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="flex-1 text-center text-xs text-gray-500">
                {i.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          
          {/* Schedule bars */}
          <div className="space-y-2">
            {filteredSchedules.map(schedule => {
              const startHour = parseInt(schedule.departureTime.split(':')[0]);
              const endHour = parseInt(schedule.arrivalTime.split(':')[0]);
              const duration = endHour - startHour;
              const leftPercent = (startHour / 24) * 100;
              const widthPercent = (duration / 24) * 100;
              
              return (
                <div key={schedule.id} className="relative h-8 bg-gray-50 rounded">
                  <div
                    className={`absolute h-6 top-1 rounded flex items-center px-2 text-xs font-medium text-white ${
                      schedule.status === 'active' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`
                    }}
                  >
                    <span className="truncate">{schedule.busNumber}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // Bulk Scheduler Modal
  const BulkSchedulerModal = () => (
    <AnimatePresence>
      {showBulkScheduler && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Bulk Scheduling Operations</h3>
              <button
                onClick={() => setShowBulkScheduler(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleBulkSchedule('auto_optimize')}
                className="p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl text-left"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Zap className="w-6 h-6" />
                  <h4 className="font-semibold">AI Auto-Optimization</h4>
                </div>
                <p className="text-sm opacity-90">
                  Automatically optimize schedules for all 6,200+ buses using AI algorithms
                </p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleBulkSchedule('duplicate_schedule')}
                className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl text-left"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Copy className="w-6 h-6" />
                  <h4 className="font-semibold">Duplicate Schedules</h4>
                </div>
                <p className="text-sm opacity-90">
                  Copy successful schedules to similar routes and time slots
                </p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleBulkSchedule('mass_assign')}
                className="p-6 bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-xl text-left"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Users className="w-6 h-6" />
                  <h4 className="font-semibold">Mass Assignment</h4>
                </div>
                <p className="text-sm opacity-90">
                  Assign drivers and conductors to multiple buses simultaneously
                </p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-6 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl text-left"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Target className="w-6 h-6" />
                  <h4 className="font-semibold">Route Optimization</h4>
                </div>
                <p className="text-sm opacity-90">
                  Optimize routes for fuel efficiency and passenger demand
                </p>
              </motion.button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">KSRTC Scale Operations</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-bold text-blue-900">6,241</p>
                  <p className="text-blue-700">Active Buses</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-blue-900">6,389</p>
                  <p className="text-blue-700">Routes</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-blue-900">3.5M</p>
                  <p className="text-blue-700">Daily Passengers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-blue-900">28</p>
                  <p className="text-blue-700">Depots</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Advanced Scheduling System</h2>
            <p className="text-gray-600">KSRTC-scale bus scheduling for 6,200+ daily operations</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setOptimizationMode(!optimizationMode)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                optimizationMode 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>AI Optimization</span>
            </button>
            
            <button
              onClick={() => setShowBulkScheduler(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              style={{ backgroundColor: '#1976D2' }}
            >
              <Settings className="w-4 h-4" />
              <span>Bulk Operations</span>
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Depot</label>
            <select
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Depots (28)</option>
              {depots.map(depot => (
                <option key={depot._id} value={depot._id}>{depot.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Routes (6,389)</option>
              {routes.map(route => (
                <option key={route._id} value={route._id}>{route.routeName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex-1 py-2 px-3 rounded-md transition-colors text-sm ${
                  viewMode === 'timeline' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 py-2 px-3 rounded-md transition-colors text-sm ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Scheduled</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{schedulingStats.totalScheduled}</p>
          <p className="text-xs text-gray-500">Total trips</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Active</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{schedulingStats.activeTrips}</p>
          <p className="text-xs text-gray-500">Running now</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Passengers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{schedulingStats.totalPassengers.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Estimated today</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">Utilization</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{schedulingStats.utilizationRate}%</p>
          <p className="text-xs text-gray-500">Fleet efficiency</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">Performance</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">92%</p>
          <p className="text-xs text-gray-500">On-time rate</p>
        </div>
      </div>

      {/* Main Scheduling Interface */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Daily Schedule - {new Date(selectedDate).toLocaleDateString()}
          </h3>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {filteredSchedules.length} scheduled trips
            </span>
            <button className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Schedule</span>
            </button>
          </div>
        </div>

        {/* Render based on view mode */}
        {viewMode === 'timeline' ? (
          <TimelineView />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.map(schedule => (
              <ScheduleCard key={schedule.id} schedule={schedule} />
            ))}
          </div>
        )}

        {filteredSchedules.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No schedules found</p>
            <p className="text-gray-400">Create new schedules or adjust filters</p>
          </div>
        )}
      </div>

      {/* Bulk Scheduler Modal */}
      <BulkSchedulerModal />
    </div>
  );
};

export default AdvancedScheduling;
