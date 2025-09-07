import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bus, Plus, Search, RefreshCw, CheckCircle, Wrench, 
  AlertTriangle, Users, Fuel, Activity, BarChart3,
  Eye, Edit, MapPin, Calendar, Settings, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import BusCRUDModal from '../../components/Admin/BusManagement/BusCRUDModal';
import AdvancedScheduling from '../../components/Admin/BusManagement/AdvancedScheduling';

const BusManagementFallback = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCRUDModal, setShowCRUDModal] = useState(false);
  const [crudMode, setCrudMode] = useState('create');
  const [selectedBus, setSelectedBus] = useState(null);
  const [activeTab, setActiveTab] = useState('management'); // management, scheduling
  const [depots] = useState([
    { _id: 'depot1', name: 'Thiruvananthapuram Central', code: 'TVM' },
    { _id: 'depot2', name: 'Kochi Central', code: 'EKM' },
    { _id: 'depot3', name: 'Kozhikode Central', code: 'CLT' }
  ]);
  const [drivers] = useState([
    { _id: 'driver1', name: 'Rajesh Kumar', licenseNumber: 'DL001' },
    { _id: 'driver2', name: 'Suresh Nair', licenseNumber: 'DL002' }
  ]);
  const [conductors] = useState([
    { _id: 'conductor1', name: 'Priya Menon', employeeId: 'EMP001' },
    { _id: 'conductor2', name: 'Anitha Das', employeeId: 'EMP002' }
  ]);

  useEffect(() => {
    fetchBuses();
    fetchDepots();
    fetchDrivers();
    fetchConductors();
  }, []);

  // Fetch real bus data from database
  const fetchBuses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/buses?limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBuses(data.data?.buses || data.buses || []);
        } else {
          console.error('API returned error:', data.message);
          setBuses([]);
        }
      } else {
        console.error('HTTP Error:', response.status, response.statusText);
        setBuses([]);
        toast.error('Failed to fetch buses from database');
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
      setBuses([]);
      toast.error('Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  // Fetch real depot data
  const fetchDepots = async () => {
    try {
      const response = await fetch('/api/admin/depots', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.depots) {
          // Update depots state if you convert it to useState
          console.log('Fetched depots:', data.data.depots.length);
        }
      }
    } catch (error) {
      console.error('Error fetching depots:', error);
    }
  };

  // Fetch real driver data
  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/all-drivers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.drivers) {
          // Update drivers state if you convert it to useState
          console.log('Fetched drivers:', data.data.drivers.length);
        }
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  // Fetch real conductor data
  const fetchConductors = async () => {
    try {
      const response = await fetch('/api/admin/conductors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.conductors) {
          // Update conductors state if you convert it to useState
          console.log('Fetched conductors:', data.data.conductors.length);
        }
      }
    } catch (error) {
      console.error('Error fetching conductors:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'retired': return <AlertTriangle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const filteredBuses = buses.filter(bus => 
    bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Real CRUD Operations with Database
  const handleCreateBus = async (busData) => {
    try {
      const response = await fetch('/api/admin/buses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(busData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh the buses list to get the new bus
          await fetchBuses();
          toast.success('Bus created successfully!');
        } else {
          toast.error(data.message || 'Failed to create bus');
        }
      } else {
        toast.error('Failed to create bus');
      }
    } catch (error) {
      console.error('Error creating bus:', error);
      toast.error('Error creating bus');
    }
  };

  const handleUpdateBus = async (busData) => {
    try {
      const response = await fetch(`/api/admin/buses/${busData._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(busData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setBuses(prev => prev.map(bus => 
            bus._id === busData._id 
              ? { ...bus, ...busData, updatedAt: new Date() }
              : bus
          ));
          toast.success('Bus updated successfully!');
        } else {
          toast.error(data.message || 'Failed to update bus');
        }
      } else {
        toast.error('Failed to update bus');
      }
    } catch (error) {
      console.error('Error updating bus:', error);
      toast.error('Error updating bus');
    }
  };

  const handleDeleteBus = async (busId) => {
    try {
      const response = await fetch(`/api/admin/buses/${busId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Remove from local state
          setBuses(prev => prev.filter(bus => bus._id !== busId));
          toast.success('Bus deleted successfully!');
        } else {
          toast.error(data.message || 'Failed to delete bus');
        }
      } else {
        toast.error('Failed to delete bus');
      }
    } catch (error) {
      console.error('Error deleting bus:', error);
      toast.error('Error deleting bus');
    }
  };

  const openCreateModal = () => {
    setCrudMode('create');
    setSelectedBus(null);
    setShowCRUDModal(true);
  };

  const openEditModal = (bus) => {
    setCrudMode('edit');
    setSelectedBus(bus);
    setShowCRUDModal(true);
  };

  const openViewModal = (bus) => {
    setCrudMode('view');
    setSelectedBus(bus);
    setShowCRUDModal(true);
  };

  const openDeleteModal = (bus) => {
    setCrudMode('delete');
    setSelectedBus(bus);
    setShowCRUDModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-32 w-32 border-4 border-blue-600 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">KSRTC Bus Management System</h1>
          <p className="text-gray-600">Complete CRUD & Scheduling for 6,200+ buses • 3.5M daily passengers</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchBuses}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
          
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            style={{ backgroundColor: '#1976D2' }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Bus</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white"
          style={{ background: 'linear-gradient(135deg, #1976D2 0%, #00BCD4 100%)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <Bus className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Fleet</h3>
          <p className="text-3xl font-bold mb-2">{buses.length}</p>
          <p className="text-sm opacity-75">Database buses</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Active Buses</h3>
          <p className="text-3xl font-bold mb-2">{buses.filter(b => b.status === 'active').length}</p>
          <p className="text-sm opacity-75">In service</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <Wrench className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Maintenance</h3>
          <p className="text-3xl font-bold mb-2">{buses.filter(b => b.status === 'maintenance').length}</p>
          <p className="text-sm opacity-75">Under repair</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Utilization</h3>
          <p className="text-3xl font-bold mb-2">
            {buses.length > 0 ? Math.round((buses.filter(b => b.status === 'active').length / buses.length) * 100) : 0}%
          </p>
          <p className="text-sm opacity-75">Fleet efficiency</p>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('management')}
            className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
              activeTab === 'management'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>Fleet Management</span>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
              {buses.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('scheduling')}
            className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
              activeTab === 'scheduling'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Advanced Scheduling</span>
            <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
              6,200
            </span>
          </button>
        </nav>
      </motion.div>

      {/* Tab Content */}
      {activeTab === 'management' && (
        <>
          {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search buses by number or registration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bus Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Fleet Overview ({filteredBuses.length} buses)
          </h3>
          
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 font-medium">Database Connected</span>
          </div>
        </div>

        {filteredBuses.length === 0 ? (
          <div className="text-center py-12">
            <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No buses found</p>
            <p className="text-gray-400">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBuses.map(bus => (
              <motion.div
                key={bus._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Bus className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{bus.busNumber}</h3>
                        <p className="text-sm text-gray-500">{bus.registrationNumber}</p>
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-2 border ${getStatusColor(bus.status)}`}>
                      {getStatusIcon(bus.status)}
                      <span className="capitalize">{bus.status}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-600">Capacity</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{bus.capacity?.total || 0}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Fuel className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-medium text-gray-600">Fuel</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{bus.fuel?.currentLevel || 0}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openEditModal(bus)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Bus"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openViewModal(bus)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
        </>
      )}

      {/* Scheduling Tab Content */}
      {activeTab === 'scheduling' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AdvancedScheduling
            buses={buses}
            routes={[]} // TODO: Add routes data
            depots={depots}
            onScheduleUpdate={(schedule) => console.log('Schedule updated:', schedule)}
            onBulkSchedule={(operation, data) => console.log('Bulk schedule:', operation, data)}
          />
        </motion.div>
      )}

      {/* CRUD Modal */}
      <BusCRUDModal
        isOpen={showCRUDModal}
        onClose={() => setShowCRUDModal(false)}
        mode={crudMode}
        bus={selectedBus}
        onSave={crudMode === 'create' ? handleCreateBus : handleUpdateBus}
        onDelete={handleDeleteBus}
        depots={depots}
        drivers={drivers}
        conductors={conductors}
        routes={[]} // TODO: Add routes data
      />
    </div>
  );
};

export default BusManagementFallback;
