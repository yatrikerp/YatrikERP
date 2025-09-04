import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search, 
  Filter, 
  Download, 
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Bus,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Percent,
  Calculator,
  Settings,
  Eye,
  EyeOff,
  Copy,
  Archive,
  Zap,
  Target,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

const AdminFarePolicy = () => {
  const [farePolicies, setFarePolicies] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepot, setFilterDepot] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [selectedPolicies, setSelectedPolicies] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    routeId: '',
    depotId: '',
    baseFare: '',
    distanceFare: '',
    timeFare: '',
    peakHourMultiplier: 1.2,
    weekendMultiplier: 1.1,
    holidayMultiplier: 1.3,
    studentDiscount: 0.1,
    seniorDiscount: 0.15,
    groupDiscount: 0.05,
    advanceBookingDiscount: 0.05,
    cancellationFee: 0.1,
    refundPolicy: 'partial',
    validityStart: '',
    validityEnd: '',
    isActive: true,
    conditions: []
  });

  useEffect(() => {
    fetchFarePolicies();
    fetchRoutes();
    fetchDepots();
  }, []);

  const fetchFarePolicies = async () => {
    try {
      setLoading(true);
      console.log('💰 Fetching fare policies...');
      
      const response = await fetch('/api/admin/fare-policies', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      console.log('📡 Fare policies response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Fare policies data:', data);
        setFarePolicies(data.policies || []);
      } else {
        console.error('❌ Fare policies failed:', response.status);
        // Set mock data for demonstration
        setFarePolicies([
          {
            _id: '1',
            name: 'City Center to Airport',
            description: 'Standard fare policy for city to airport route',
            routeId: 'route1',
            routeName: 'City Center - Airport',
            depotId: 'depot1',
            depotName: 'Central Depot',
            baseFare: 150,
            distanceFare: 5,
            timeFare: 2,
            peakHourMultiplier: 1.2,
            weekendMultiplier: 1.1,
            holidayMultiplier: 1.3,
            studentDiscount: 0.1,
            seniorDiscount: 0.15,
            groupDiscount: 0.05,
            advanceBookingDiscount: 0.05,
            cancellationFee: 0.1,
            refundPolicy: 'partial',
            validityStart: '2024-01-01',
            validityEnd: '2024-12-31',
            isActive: true,
            conditions: ['Valid ID required for discounts', 'Advance booking 24 hours'],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: '2',
            name: 'Intercity Express',
            description: 'Premium fare policy for intercity routes',
            routeId: 'route2',
            routeName: 'City A - City B',
            depotId: 'depot2',
            depotName: 'North Depot',
            baseFare: 300,
            distanceFare: 8,
            timeFare: 3,
            peakHourMultiplier: 1.3,
            weekendMultiplier: 1.2,
            holidayMultiplier: 1.5,
            studentDiscount: 0.15,
            seniorDiscount: 0.2,
            groupDiscount: 0.1,
            advanceBookingDiscount: 0.08,
            cancellationFee: 0.15,
            refundPolicy: 'full',
            validityStart: '2024-01-01',
            validityEnd: '2024-12-31',
            isActive: true,
            conditions: ['Minimum 2 passengers for group discount', 'Refund within 2 hours'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('💥 Error fetching fare policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/routes', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoutes(data.data || []);
      } else {
        // Mock routes
        setRoutes([
          { _id: 'route1', routeNumber: 'R001', startingPoint: { city: 'City Center' }, endingPoint: { city: 'Airport' } },
          { _id: 'route2', routeNumber: 'R002', startingPoint: { city: 'City A' }, endingPoint: { city: 'City B' } }
        ]);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchDepots = async () => {
    try {
      const response = await fetch('/api/admin/depots', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepots(data.depots || []);
      } else {
        // Mock depots
        setDepots([
          { _id: 'depot1', depotName: 'Central Depot', depotCode: 'CD' },
          { _id: 'depot2', depotName: 'North Depot', depotCode: 'ND' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching depots:', error);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      setLoading(true);
      console.log('💰 Creating fare policy:', formData);
      
      const response = await fetch('/api/admin/fare-policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fare policy created:', data);
        setFarePolicies([...farePolicies, data.policy]);
        setShowCreateModal(false);
        resetForm();
        alert('Fare policy created successfully!');
      } else {
        console.error('❌ Create failed:', response.status);
        alert('Failed to create fare policy');
      }
    } catch (error) {
      console.error('💥 Create error:', error);
      alert('Error creating fare policy: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePolicy = async () => {
    try {
      setLoading(true);
      console.log('💰 Updating fare policy:', editingPolicy._id, formData);
      
      const response = await fetch(`/api/admin/fare-policies/${editingPolicy._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fare policy updated:', data);
        setFarePolicies(farePolicies.map(p => p._id === editingPolicy._id ? data.policy : p));
        setEditingPolicy(null);
        resetForm();
        alert('Fare policy updated successfully!');
      } else {
        console.error('❌ Update failed:', response.status);
        alert('Failed to update fare policy');
      }
    } catch (error) {
      console.error('💥 Update error:', error);
      alert('Error updating fare policy: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (policyId) => {
    if (!window.confirm('Are you sure you want to delete this fare policy?')) return;
    
    try {
      setLoading(true);
      console.log('💰 Deleting fare policy:', policyId);
      
      const response = await fetch(`/api/admin/fare-policies/${policyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        console.log('✅ Fare policy deleted');
        setFarePolicies(farePolicies.filter(p => p._id !== policyId));
        alert('Fare policy deleted successfully!');
      } else {
        console.error('❌ Delete failed:', response.status);
        alert('Failed to delete fare policy');
      }
    } catch (error) {
      console.error('💥 Delete error:', error);
      alert('Error deleting fare policy: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      routeId: '',
      depotId: '',
      baseFare: '',
      distanceFare: '',
      timeFare: '',
      peakHourMultiplier: 1.2,
      weekendMultiplier: 1.1,
      holidayMultiplier: 1.3,
      studentDiscount: 0.1,
      seniorDiscount: 0.15,
      groupDiscount: 0.05,
      advanceBookingDiscount: 0.05,
      cancellationFee: 0.1,
      refundPolicy: 'partial',
      validityStart: '',
      validityEnd: '',
      isActive: true,
      conditions: []
    });
  };

  const openEditModal = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description,
      routeId: policy.routeId,
      depotId: policy.depotId,
      baseFare: policy.baseFare,
      distanceFare: policy.distanceFare,
      timeFare: policy.timeFare,
      peakHourMultiplier: policy.peakHourMultiplier,
      weekendMultiplier: policy.weekendMultiplier,
      holidayMultiplier: policy.holidayMultiplier,
      studentDiscount: policy.studentDiscount,
      seniorDiscount: policy.seniorDiscount,
      groupDiscount: policy.groupDiscount,
      advanceBookingDiscount: policy.advanceBookingDiscount,
      cancellationFee: policy.cancellationFee,
      refundPolicy: policy.refundPolicy,
      validityStart: policy.validityStart,
      validityEnd: policy.validityEnd,
      isActive: policy.isActive,
      conditions: policy.conditions || []
    });
  };

  const filteredPolicies = farePolicies.filter(policy => {
    const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepot = filterDepot === 'all' || policy.depotId === filterDepot;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && policy.isActive) ||
                         (filterStatus === 'inactive' && !policy.isActive);
    
    return matchesSearch && matchesDepot && matchesStatus;
  });

  const calculateTotalFare = (policy, distance = 10, isPeakHour = false, isWeekend = false, isHoliday = false) => {
    let total = parseFloat(policy.baseFare) + (parseFloat(policy.distanceFare) * distance);
    
    if (isPeakHour) total *= policy.peakHourMultiplier;
    if (isWeekend) total *= policy.weekendMultiplier;
    if (isHoliday) total *= policy.holidayMultiplier;
    
    return Math.round(total);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fare Policy Management</h1>
              <p className="text-gray-600 mt-1">Manage pricing rules and fare policies for all routes</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchFarePolicies}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log('🧪 Testing Fare Policy API...');
                    const response = await fetch('/api/admin/fare-policies', {
                      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    console.log('📡 Fare Policy API response:', response.status);
                    if (response.ok) {
                      const data = await response.json();
                      console.log('📊 Fare Policy data:', data);
                      alert(`Fare Policy API working! Found ${data.policies?.length || 0} policies.`);
                    } else {
                      alert(`Fare Policy API failed: ${response.status}`);
                    }
                  } catch (error) {
                    console.error('❌ Fare Policy API error:', error);
                    alert('Fare Policy API error: ' + error.message);
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <DollarSign className="w-5 h-5" />
                <span>Test API</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>New Policy</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filterDepot}
              onChange={(e) => setFilterDepot(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Depots</option>
              {depots.map(depot => (
                <option key={depot._id} value={depot._id}>
                  {depot.depotName}
                </option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <button
              onClick={() => setShowBulkEdit(!showBulkEdit)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Bulk Edit</span>
            </button>
          </div>
        </div>

        {/* Fare Policies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPolicies.map((policy) => (
            <div key={policy._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{policy.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {policy.routeName || 'Route'}
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {policy.depotName || 'Depot'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      policy.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {policy.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(policy)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePolicy(policy._id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Fare Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Base Fare</p>
                    <p className="text-lg font-semibold text-gray-900">₹{policy.baseFare}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Distance Rate</p>
                    <p className="text-lg font-semibold text-gray-900">₹{policy.distanceFare}/km</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Peak Hour</p>
                    <p className="text-sm font-medium text-orange-600">+{Math.round((policy.peakHourMultiplier - 1) * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Weekend</p>
                    <p className="text-sm font-medium text-blue-600">+{Math.round((policy.weekendMultiplier - 1) * 100)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Student Discount</p>
                    <p className="text-sm font-medium text-green-600">-{Math.round(policy.studentDiscount * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Senior Discount</p>
                    <p className="text-sm font-medium text-green-600">-{Math.round(policy.seniorDiscount * 100)}%</p>
                  </div>
                </div>

                {/* Sample Fare Calculation */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Sample Fare (10km, Peak Hour)</p>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{calculateTotalFare(policy, 10, true, false, false)}
                  </p>
                </div>
              </div>

              {/* Validity Period */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Valid From: {new Date(policy.validityStart).toLocaleDateString()}</span>
                  <span>To: {new Date(policy.validityEnd).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPolicies.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No fare policies found</h3>
            <p className="text-gray-600 mb-4">Create your first fare policy to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Fare Policy
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingPolicy) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingPolicy ? 'Edit Fare Policy' : 'Create New Fare Policy'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPolicy(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Policy Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter policy name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
                  <select
                    value={formData.routeId}
                    onChange={(e) => setFormData({...formData, routeId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Route</option>
                    {routes.map(route => (
                      <option key={route._id} value={route._id}>
                        {route.routeNumber} - {route.startingPoint?.city} to {route.endingPoint?.city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter policy description"
                />
              </div>

              {/* Fare Structure */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fare Structure</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base Fare (₹)</label>
                    <input
                      type="number"
                      value={formData.baseFare}
                      onChange={(e) => setFormData({...formData, baseFare: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Distance Rate (₹/km)</label>
                    <input
                      type="number"
                      value={formData.distanceFare}
                      onChange={(e) => setFormData({...formData, distanceFare: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Rate (₹/min)</label>
                    <input
                      type="number"
                      value={formData.timeFare}
                      onChange={(e) => setFormData({...formData, timeFare: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Multipliers */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fare Multipliers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Peak Hour Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.peakHourMultiplier}
                      onChange={(e) => setFormData({...formData, peakHourMultiplier: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weekend Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weekendMultiplier}
                      onChange={(e) => setFormData({...formData, weekendMultiplier: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Holiday Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.holidayMultiplier}
                      onChange={(e) => setFormData({...formData, holidayMultiplier: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Discounts */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Discounts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Student Discount (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.studentDiscount * 100}
                      onChange={(e) => setFormData({...formData, studentDiscount: parseFloat(e.target.value) / 100})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Senior Discount (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.seniorDiscount * 100}
                      onChange={(e) => setFormData({...formData, seniorDiscount: parseFloat(e.target.value) / 100})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Discount (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.groupDiscount * 100}
                      onChange={(e) => setFormData({...formData, groupDiscount: parseFloat(e.target.value) / 100})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Advance Booking Discount (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.advanceBookingDiscount * 100}
                      onChange={(e) => setFormData({...formData, advanceBookingDiscount: parseFloat(e.target.value) / 100})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Validity and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
                  <input
                    type="date"
                    value={formData.validityStart}
                    onChange={(e) => setFormData({...formData, validityStart: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
                  <input
                    type="date"
                    value={formData.validityEnd}
                    onChange={(e) => setFormData({...formData, validityEnd: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Policy</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingPolicy(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingPolicy ? handleUpdatePolicy : handleCreatePolicy}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{editingPolicy ? 'Update' : 'Create'} Policy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFarePolicy;