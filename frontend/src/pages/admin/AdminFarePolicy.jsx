import React, { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search, 
  RefreshCw,
  Settings
} from 'lucide-react';

const AdminFarePolicy = () => {
  const [farePolicies, setFarePolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    busType: '',
    routeType: '',
    ratePerKm: 0,
    minimumFare: 0,
    maximumFare: 0,
    distanceBrackets: [
      { fromKm: 0, toKm: 50, ratePerKm: 0, description: '' }
    ],
    timeBasedPricing: {
      morning: 1.0,
      afternoon: 1.0,
      evening: 1.0,
      night: 1.0
    },
    peakHourMultiplier: 1.0,
    isActive: true
  });

  const fetchFarePolicies = useCallback(async () => {
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
        setFarePolicies(data.data || []);
      } else {
        console.error('❌ Fare policies failed:', response.status);
        // Initialize default policies if none exist
        await initializeDefaultPolicies();
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
  }, []);

  useEffect(() => {
    fetchFarePolicies();
  }, [fetchFarePolicies]);

  const initializeDefaultPolicies = async () => {
    try {
      console.log('🚀 Initializing default fare policies...');
      const response = await fetch('/api/fare-policy/initialize-defaults', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        console.log('✅ Default fare policies initialized');
        return true;
      }
    } catch (error) {
      console.error('❌ Error initializing default policies:', error);
    }
    return false;
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
      busType: '',
      routeType: '',
      ratePerKm: 0,
      minimumFare: 0,
      maximumFare: 0,
      distanceBrackets: [
        { fromKm: 0, toKm: 50, ratePerKm: 0, description: '' }
      ],
      timeBasedPricing: {
        morning: 1.0,
        afternoon: 1.0,
        evening: 1.0,
        night: 1.0
      },
      peakHourMultiplier: 1.0,
      isActive: true
    });
  };

  const openEditModal = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      busType: policy.busType || '',
      routeType: policy.routeType || '',
      baseFarePerKm: policy.baseFarePerKm || 0,
      minimumFare: policy.minimumFare || 0,
      maximumFare: policy.maximumFare || 0,
      distanceBrackets: policy.distanceBrackets || [{ fromKm: 0, toKm: 50, ratePerKm: 0, description: '' }],
      timeBasedPricing: policy.timeBasedPricing || {
        morning: 1.0,
        afternoon: 1.0,
        evening: 1.0,
        night: 1.0
      },
      peakHourMultiplier: policy.peakHourMultiplier || 1.0,
      isActive: policy.isActive !== undefined ? policy.isActive : true
    });
  };

  const filteredPolicies = farePolicies.filter(policy => {
    const matchesSearch = (policy.busType && policy.busType.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (policy.routeType && policy.routeType.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && policy.isActive) ||
                         (filterStatus === 'inactive' && !policy.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const calculateTotalFare = (policy, distance = 10, isPeakHour = false) => {
    let total = (policy.ratePerKm || 0) * distance;
    
    // Apply minimum fare
    total = Math.max(total, policy.minimumFare || 0);
    
    // Apply peak hour multiplier
    if (isPeakHour) total *= (policy.peakHourMultiplier || 1.0);
    
    // Apply maximum fare cap if set
    if (policy.maximumFare && policy.maximumFare > 0) {
      total = Math.min(total, policy.maximumFare);
    }
    
    return Math.round(total);
  };

  const getBusTypeLabel = (busType) => {
    const labels = {
      'ordinary': 'Ordinary',
      'lspf': 'Limited Stop Fast Passenger',
      'fast_passenger': 'Fast Passenger',
      'venad': 'Venad',
      'super_fast': 'Super Fast',
      'super_deluxe': 'Super Deluxe',
      'deluxe_express': 'Deluxe Express',
      'ananthapuri_fast': 'Ananthapuri Fast',
      'rajadhani': 'Rajadhani',
      'minnal': 'Minnal',
      'garuda_king_long': 'Garuda King Long',
      'garuda_volvo': 'Garuda Volvo',
      'garuda_scania': 'Garuda Scania',
      'garuda_maharaja': 'Garuda Maharaja',
      'low_floor_non_ac': 'Low Floor Non-AC',
      'low_floor_ac': 'Low Floor AC',
      'jnnurm_city': 'JNNURM City Circular'
    };
    return labels[busType] || busType;
  };

  const getRouteTypeLabel = (routeType) => {
    const labels = {
      'local': 'Local',
      'city': 'City',
      'intercity': 'Intercity',
      'district': 'District',
      'long_distance': 'Long Distance',
      'interstate': 'Interstate'
    };
    return labels[routeType] || routeType;
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
                onClick={async () => {
                  if (window.confirm('This will create default fare policies for all KSRTC bus types. Continue?')) {
                    try {
                      setLoading(true);
                      const success = await initializeDefaultPolicies();
                      if (success) {
                        alert('Default fare policies initialized successfully!');
                        fetchFarePolicies();
                      } else {
                        alert('Failed to initialize default policies');
                      }
                    } catch (error) {
                      alert('Error initializing default policies: ' + error.message);
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Settings className="w-5 h-5" />
                <span>Initialize Defaults</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <h3 className="text-lg font-semibold text-gray-900">{getBusTypeLabel(policy.busType)}</h3>
                  <p className="text-sm text-gray-600 mt-1">{getRouteTypeLabel(policy.routeType)} Route</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {policy.busType}
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {policy.routeType}
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
                    <p className="text-xs text-gray-500">Base Rate</p>
                    <p className="text-lg font-semibold text-gray-900">₹{policy.ratePerKm}/km</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Minimum Fare</p>
                    <p className="text-lg font-semibold text-gray-900">₹{policy.minimumFare}</p>
                  </div>
                </div>

                {policy.maximumFare && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Maximum Fare</p>
                      <p className="text-lg font-semibold text-gray-900">₹{policy.maximumFare}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Peak Multiplier</p>
                      <p className="text-sm font-medium text-orange-600">{policy.peakHourMultiplier}x</p>
                    </div>
                  </div>
                )}

                {/* Sample Fare Calculation */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Sample Fare (10km, Peak Hour)</p>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{calculateTotalFare(policy, 10, true)}
                  </p>
                </div>
              </div>

              {/* Policy Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Distance Brackets: {policy.distanceBrackets?.length || 0}</span>
                  <span>Created: {new Date(policy.createdAt || Date.now()).toLocaleDateString()}</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type</label>
                  <select
                    value={formData.busType}
                    onChange={(e) => setFormData({...formData, busType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Bus Type</option>
                    <option value="ordinary">Ordinary</option>
                    <option value="lspf">Limited Stop Fast Passenger</option>
                    <option value="fast_passenger">Fast Passenger</option>
                    <option value="venad">Venad</option>
                    <option value="super_fast">Super Fast</option>
                    <option value="super_deluxe">Super Deluxe</option>
                    <option value="deluxe_express">Deluxe Express</option>
                    <option value="ananthapuri_fast">Ananthapuri Fast</option>
                    <option value="rajadhani">Rajadhani</option>
                    <option value="minnal">Minnal</option>
                    <option value="garuda_king_long">Garuda King Long</option>
                    <option value="garuda_volvo">Garuda Volvo</option>
                    <option value="garuda_scania">Garuda Scania</option>
                    <option value="garuda_maharaja">Garuda Maharaja</option>
                    <option value="low_floor_non_ac">Low Floor Non-AC</option>
                    <option value="low_floor_ac">Low Floor AC</option>
                    <option value="jnnurm_city">JNNURM City Circular</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Route Type</label>
                  <select
                    value={formData.routeType}
                    onChange={(e) => setFormData({...formData, routeType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Route Type</option>
                    <option value="local">Local</option>
                    <option value="city">City</option>
                    <option value="intercity">Intercity</option>
                    <option value="district">District</option>
                    <option value="long_distance">Long Distance</option>
                    <option value="interstate">Interstate</option>
                  </select>
                </div>
              </div>

              {/* Fare Structure */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fare Structure</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base Fare/Km (₹)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.baseFarePerKm}
                      onChange={(e) => setFormData({...formData, baseFarePerKm: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Fare (₹)</label>
                    <input
                      type="number"
                      value={formData.minimumFare}
                      onChange={(e) => setFormData({...formData, minimumFare: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Fare (₹) - Optional</label>
                    <input
                      type="number"
                      value={formData.maximumFare}
                      onChange={(e) => setFormData({...formData, maximumFare: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Time-based Pricing */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Time-based Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Morning (6AM-12PM)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.timeBasedPricing.morning}
                      onChange={(e) => setFormData({
                        ...formData,
                        timeBasedPricing: { ...formData.timeBasedPricing, morning: parseFloat(e.target.value) || 1.0 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Afternoon (12PM-6PM)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.timeBasedPricing.afternoon}
                      onChange={(e) => setFormData({
                        ...formData,
                        timeBasedPricing: { ...formData.timeBasedPricing, afternoon: parseFloat(e.target.value) || 1.0 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Evening (6PM-10PM)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.timeBasedPricing.evening}
                      onChange={(e) => setFormData({
                        ...formData,
                        timeBasedPricing: { ...formData.timeBasedPricing, evening: parseFloat(e.target.value) || 1.0 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Night (10PM-6AM)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.timeBasedPricing.night}
                      onChange={(e) => setFormData({
                        ...formData,
                        timeBasedPricing: { ...formData.timeBasedPricing, night: parseFloat(e.target.value) || 1.0 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Peak Hour Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.peakHourMultiplier}
                    onChange={(e) => setFormData({...formData, peakHourMultiplier: parseFloat(e.target.value) || 1.0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status */}
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