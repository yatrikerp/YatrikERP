import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Bus, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  BarChart3,
  TrendingUp,
  Route,
  UserCheck,
  CalendarDays,
  Timer,
  Navigation,
  Zap
} from 'lucide-react';

const AdminTripManagement = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [depotFilter, setDepotFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [depots, setDepots] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    totalRevenue: 0,
    averageOccupancy: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [showActivities, setShowActivities] = useState(true);

  const [newTrip, setNewTrip] = useState({
    routeId: '',
    busId: '',
    driverId: '',
    conductorId: '',
    serviceDate: '',
    startTime: '',
    endTime: '',
    fare: '',
    status: 'scheduled',
    maxPassengers: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
    fetchSupportingData();
    fetchRecentActivities();
  }, [currentPage, statusFilter, depotFilter, dateFilter]);

  // Auto-refresh activities every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecentActivities();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(depotFilter !== 'all' && { depot: depotFilter }),
        ...(dateFilter && { date: dateFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/trips?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips || []);
        setTotalPages(data.pagination?.pages || 1);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportingData = async () => {
    try {
      const [depotsRes, routesRes, busesRes, driversRes, conductorsRes] = await Promise.all([
        fetch('/api/admin/depots', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/admin/routes', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/admin/buses', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/admin/drivers', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/admin/conductors', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);

      const [depotsData, routesData, busesData, driversData, conductorsData] = await Promise.all([
        depotsRes.json(),
        routesRes.json(),
        busesRes.json(),
        driversRes.json(),
        conductorsRes.json()
      ]);

      setDepots(depotsData.depots || []);
      setRoutes(routesData.routes || []);
      setBuses(busesData.buses || []);
      setDrivers(driversData.drivers || []);
      setConductors(conductorsData.conductors || []);
    } catch (error) {
      console.error('Error fetching supporting data:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await fetch('/api/admin/recent-activities', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      trip_created: { icon: Plus, color: 'text-green-600 bg-green-100' },
      trip_updated: { icon: Edit3, color: 'text-blue-600 bg-blue-100' },
      trip_cancelled: { icon: XCircle, color: 'text-red-600 bg-red-100' },
      trip_completed: { icon: CheckCircle, color: 'text-green-600 bg-green-100' },
      driver_assigned: { icon: UserCheck, color: 'text-purple-600 bg-purple-100' },
      conductor_assigned: { icon: Users, color: 'text-indigo-600 bg-indigo-100' },
      booking_created: { icon: Calendar, color: 'text-orange-600 bg-orange-100' },
      payment_received: { icon: BarChart3, color: 'text-green-600 bg-green-100' },
      bus_assigned: { icon: Bus, color: 'text-blue-600 bg-blue-100' },
      route_updated: { icon: Navigation, color: 'text-teal-600 bg-teal-100' }
    };
    return icons[type] || { icon: AlertTriangle, color: 'text-gray-600 bg-gray-100' };
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newTrip)
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewTrip({
          routeId: '',
          busId: '',
          driverId: '',
          conductorId: '',
          serviceDate: '',
          startTime: '',
          endTime: '',
          fare: '',
          status: 'scheduled',
          maxPassengers: '',
          notes: ''
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating trip:', error);
    }
  };

  const handleUpdateTrip = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/trips/${editingTrip._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editingTrip)
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingTrip(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating trip:', error);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        const response = await fetch(`/api/admin/trips/${tripId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
          fetchData();
        }
      } catch (error) {
        console.error('Error deleting trip:', error);
      }
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      scheduled: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock, label: 'Scheduled' },
      running: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Running' },
      completed: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Cancelled' },
      delayed: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle, label: 'Delayed' }
    };
    return configs[status] || configs.scheduled;
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = !searchTerm || 
      trip.routeId?.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.busId?.busNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driverId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.conductorId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    const matchesDepot = depotFilter === 'all' || trip.busId?.depotId?._id === depotFilter;
    const matchesDate = !dateFilter || trip.serviceDate?.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesDepot && matchesDate;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trip Management</h1>
              <p className="text-gray-600 mt-1">Manage bus trips, schedules, and crew assignments</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchData()}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Create Trip</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trips</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTrips}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Route className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+12% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Trips</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeTrips}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <Timer className="w-4 h-4 mr-1" />
              <span>Currently running</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-3xl font-bold text-purple-600">₹{stats.totalRevenue?.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+8% from last week</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Occupancy</p>
                <p className="text-3xl font-bold text-orange-600">{stats.averageOccupancy}%</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <UserCheck className="w-4 h-4 mr-1" />
              <span>Seat utilization</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search trips, routes, crew..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="delayed">Delayed</option>
            </select>

            <select
              value={depotFilter}
              onChange={(e) => setDepotFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Depots</option>
              {depots.map(depot => (
                <option key={depot._id} value={depot._id}>{depot.depotName}</option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Trips Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Trip Schedule</h3>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <Download className="w-5 h-5" />
                </button>
                <button className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading trips...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route & Bus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crew</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTrips.map((trip) => {
                    const statusConfig = getStatusConfig(trip.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <tr key={trip._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                              <Bus className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                Trip #{trip.tripCode || trip._id.slice(-6).toUpperCase()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {trip.fare ? `₹${trip.fare}` : 'Fare TBD'}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {trip.routeId?.routeName || 'Route TBD'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {trip.busId?.busNumber || 'Bus TBD'}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900">
                              <span className="font-medium">Driver:</span> {trip.driverId?.name || 'Unassigned'}
                            </div>
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Conductor:</span> {trip.conductorId?.name || 'Unassigned'}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900 flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {trip.serviceDate ? new Date(trip.serviceDate).toLocaleDateString() : 'TBD'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {trip.startTime || 'TBD'} - {trip.endTime || 'TBD'}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingTrip(trip);
                                setShowEditModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTrip(trip._id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredTrips.length === 0 && !loading && (
            <div className="p-8 text-center">
              <Bus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first trip</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Trip
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Trip</h3>
            </div>
            <form onSubmit={handleCreateTrip} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
                  <select
                    value={newTrip.routeId}
                    onChange={(e) => setNewTrip({...newTrip, routeId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Route</option>
                    {routes.map(route => (
                      <option key={route._id} value={route._id}>{route.routeName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bus</label>
                  <select
                    value={newTrip.busId}
                    onChange={(e) => setNewTrip({...newTrip, busId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Bus</option>
                    {buses.map(bus => (
                      <option key={bus._id} value={bus._id}>{bus.busNumber} - {bus.busType}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Driver</label>
                  <select
                    value={newTrip.driverId}
                    onChange={(e) => setNewTrip({...newTrip, driverId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(driver => (
                      <option key={driver._id} value={driver._id}>{driver.name} - {driver.employeeCode}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conductor</label>
                  <select
                    value={newTrip.conductorId}
                    onChange={(e) => setNewTrip({...newTrip, conductorId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Conductor</option>
                    {conductors.map(conductor => (
                      <option key={conductor._id} value={conductor._id}>{conductor.name} - {conductor.employeeCode}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Date</label>
                  <input
                    type="date"
                    value={newTrip.serviceDate}
                    onChange={(e) => setNewTrip({...newTrip, serviceDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={newTrip.startTime}
                    onChange={(e) => setNewTrip({...newTrip, startTime: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={newTrip.endTime}
                    onChange={(e) => setNewTrip({...newTrip, endTime: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fare (₹)</label>
                  <input
                    type="number"
                    value={newTrip.fare}
                    onChange={(e) => setNewTrip({...newTrip, fare: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter fare amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Passengers</label>
                  <input
                    type="number"
                    value={newTrip.maxPassengers}
                    onChange={(e) => setNewTrip({...newTrip, maxPassengers: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter max passengers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={newTrip.status}
                    onChange={(e) => setNewTrip({...newTrip, status: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="running">Running</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newTrip.notes}
                  onChange={(e) => setNewTrip({...newTrip, notes: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Additional notes or special instructions"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {showEditModal && editingTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Trip</h3>
            </div>
            <form onSubmit={handleUpdateTrip} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
                  <select
                    value={editingTrip.routeId}
                    onChange={(e) => setEditingTrip({...editingTrip, routeId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Route</option>
                    {routes.map(route => (
                      <option key={route._id} value={route._id}>{route.routeName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bus</label>
                  <select
                    value={editingTrip.busId}
                    onChange={(e) => setEditingTrip({...editingTrip, busId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Bus</option>
                    {buses.map(bus => (
                      <option key={bus._id} value={bus._id}>{bus.busNumber} - {bus.busType}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Driver</label>
                  <select
                    value={editingTrip.driverId}
                    onChange={(e) => setEditingTrip({...editingTrip, driverId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(driver => (
                      <option key={driver._id} value={driver._id}>{driver.name} - {driver.employeeCode}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conductor</label>
                  <select
                    value={editingTrip.conductorId}
                    onChange={(e) => setEditingTrip({...editingTrip, conductorId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Conductor</option>
                    {conductors.map(conductor => (
                      <option key={conductor._id} value={conductor._id}>{conductor.name} - {conductor.employeeCode}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Date</label>
                  <input
                    type="date"
                    value={editingTrip.serviceDate}
                    onChange={(e) => setEditingTrip({...editingTrip, serviceDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={editingTrip.startTime}
                    onChange={(e) => setEditingTrip({...editingTrip, startTime: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={editingTrip.endTime}
                    onChange={(e) => setEditingTrip({...editingTrip, endTime: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fare (₹)</label>
                  <input
                    type="number"
                    value={editingTrip.fare}
                    onChange={(e) => setEditingTrip({...editingTrip, fare: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter fare amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Passengers</label>
                  <input
                    type="number"
                    value={editingTrip.maxPassengers}
                    onChange={(e) => setEditingTrip({...editingTrip, maxPassengers: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter max passengers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingTrip.status}
                    onChange={(e) => setEditingTrip({...editingTrip, status: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="running">Running</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="delayed">Delayed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={editingTrip.notes || ''}
                  onChange={(e) => setEditingTrip({...editingTrip, notes: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Additional notes or special instructions"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTrip(null);
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTripManagement;
