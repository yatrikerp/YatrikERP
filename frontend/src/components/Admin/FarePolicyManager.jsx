import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Plus, Edit, Trash2, Save, X, Settings,
  Calculator, Route, Clock, TrendingUp, Users, MapPin,
  CheckCircle, AlertTriangle, Info, Filter, Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const FarePolicyManager = ({ isOpen, onClose, onSave }) => {
  const [farePolicies, setFarePolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBusType, setFilterBusType] = useState('all');
  const [filterRouteType, setFilterRouteType] = useState('all');

  const [formData, setFormData] = useState({
    busType: '',
    routeType: '',
    baseFarePerKm: 0,
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

  const busTypes = [
    { value: 'ordinary', label: 'Ordinary', category: 'Budget' },
    { value: 'lspf', label: 'Limited Stop Fast Passenger', category: 'Economy' },
    { value: 'fast_passenger', label: 'Fast Passenger', category: 'Standard' },
    { value: 'venad', label: 'Venad', category: 'Budget' },
    { value: 'super_fast', label: 'Super Fast', category: 'Standard' },
    { value: 'super_deluxe', label: 'Super Deluxe', category: 'Premium' },
    { value: 'deluxe_express', label: 'Deluxe Express', category: 'Premium' },
    { value: 'ananthapuri_fast', label: 'Ananthapuri Fast', category: 'Standard' },
    { value: 'rajadhani', label: 'Rajadhani', category: 'Luxury' },
    { value: 'minnal', label: 'Minnal', category: 'Premium' },
    { value: 'garuda_king_long', label: 'Garuda King Long', category: 'Luxury' },
    { value: 'garuda_volvo', label: 'Garuda Volvo', category: 'Luxury' },
    { value: 'garuda_scania', label: 'Garuda Scania', category: 'Luxury' },
    { value: 'garuda_maharaja', label: 'Garuda Maharaja', category: 'Super Luxury' },
    { value: 'low_floor_non_ac', label: 'Low Floor Non-AC', category: 'Standard' },
    { value: 'low_floor_ac', label: 'Low Floor AC', category: 'Premium' },
    { value: 'jnnurm_city', label: 'JNNURM City Circular', category: 'Budget' }
  ];

  const routeTypes = [
    { value: 'local', label: 'Local', description: 'Within city limits' },
    { value: 'city', label: 'City', description: 'City routes' },
    { value: 'intercity', label: 'Intercity', description: 'Between cities' },
    { value: 'district', label: 'District', description: 'Within district' },
    { value: 'long_distance', label: 'Long Distance', description: '50-100 km' },
    { value: 'interstate', label: 'Interstate', description: 'Beyond state borders' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchFarePolicies();
    }
  }, [isOpen]);

  const fetchFarePolicies = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/fare-policy');
      if (response.success) {
        setFarePolicies(response.data || []);
        console.log('✅ Fare policies fetched:', response.data?.length || 0);
      } else {
        console.warn('⚠️ No fare policies found, initializing empty list');
        setFarePolicies([]);
      }
    } catch (error) {
      console.error('❌ Error fetching fare policies:', error);
      toast.error('Failed to fetch fare policies. Please ensure backend server is running.');
      setFarePolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    try {
      console.log('💰 [Step 1] Form data:', formData);

      // Validate required fields
      if (!formData.busType) {
        console.error('💰 Validation failed: No bus type');
        toast.error('Please select a bus type');
        return;
      }
      if (!formData.baseFarePerKm || formData.baseFarePerKm <= 0) {
        console.error('💰 Validation failed: Invalid base fare per km:', formData.baseFarePerKm);
        toast.error('Please enter a valid base fare per km');
        return;
      }
      if (!formData.minimumFare || formData.minimumFare <= 0) {
        console.error('💰 Validation failed: Invalid minimum fare:', formData.minimumFare);
        toast.error('Please enter a valid minimum fare');
        return;
      }

      console.log('💰 [Step 2] Validation passed, mapping bus type:', formData.busType);

      // Map frontend bus type values to backend enum values
      const busTypeMapping = {
        'ordinary': 'City / Ordinary',
        'lspf': 'Fast Passenger / LSFP',
        'fast_passenger': 'Fast Passenger / LSFP',
        'venad': 'City / Ordinary',
        'super_fast': 'Super Fast Passenger',
        'super_deluxe': 'Super Deluxe',
        'deluxe_express': 'Super Express',
        'ananthapuri_fast': 'Fast Passenger / LSFP',
        'rajadhani': 'Luxury / Hi-tech & AC',
        'minnal': 'Super Express',
        'garuda_king_long': 'Garuda Maharaja / Garuda King / Multi-axle Premium',
        'garuda_volvo': 'Luxury / Hi-tech & AC',
        'garuda_scania': 'Garuda Maharaja / Garuda King / Multi-axle Premium',
        'garuda_maharaja': 'Garuda Maharaja / Garuda King / Multi-axle Premium',
        'low_floor_non_ac': 'Non A/C Low Floor',
        'low_floor_ac': 'A/C Low Floor',
        'jnnurm_city': 'City Fast',
        // Additional KSRTC types
        'city_ordinary': 'City / Ordinary',
        'city_fast': 'City Fast',
        'garuda_sanchari': 'Garuda Sanchari / Biaxle Premium'
      };

      // Try to map, if not found, use the value as-is
      let mappedBusType = busTypeMapping[formData.busType];
      
      // If no mapping found, check if the value is already a valid backend enum
      if (!mappedBusType) {
        const validBackendTypes = [
          'City / Ordinary',
          'City Fast',
          'Fast Passenger / LSFP',
          'Super Fast Passenger',
          'Super Express',
          'Super Deluxe',
          'Luxury / Hi-tech & AC',
          'Garuda Sanchari / Biaxle Premium',
          'Garuda Maharaja / Garuda King / Multi-axle Premium',
          'A/C Low Floor',
          'Non A/C Low Floor'
        ];
        
        if (validBackendTypes.includes(formData.busType)) {
          mappedBusType = formData.busType;
          console.log('💰 [Step 3] Bus type is already valid backend enum');
        } else {
          // Last resort - try to match partially
          const lowerBusType = formData.busType.toLowerCase();
          console.log('💰 [Step 3] Attempting partial match for:', lowerBusType);
          if (lowerBusType.includes('garuda')) {
            if (lowerBusType.includes('maharaja') || lowerBusType.includes('king') || lowerBusType.includes('scania')) {
              mappedBusType = 'Garuda Maharaja / Garuda King / Multi-axle Premium';
            } else if (lowerBusType.includes('volvo')) {
              mappedBusType = 'Luxury / Hi-tech & AC';
            } else {
              mappedBusType = 'Garuda Sanchari / Biaxle Premium';
            }
          } else {
            mappedBusType = formData.busType; // Use as-is and let backend validate
          }
        }
      }

      console.log('💰 [Step 4] Mapped bus type:', formData.busType, '→', mappedBusType);

      // Generate policy name
      const policyName = `${getBusTypeLabel(formData.busType)} - ${formData.routeType ? getRouteTypeLabel(formData.routeType) : 'General'}`;
      console.log('💰 [Step 5] Generated policy name:', policyName);

      const policyData = {
        name: policyName,
        busType: mappedBusType,
        ratePerKm: formData.baseFarePerKm,
        minimumFare: formData.minimumFare,
        description: `Fare policy for ${getBusTypeLabel(formData.busType)} buses`,
        peakHourMultiplier: formData.peakHourMultiplier || 1.0,
        isActive: formData.isActive !== false
      };

      console.log('💰 [Step 6] Creating fare policy with data:', policyData);

      let response;
      if (editingPolicy) {
        console.log('💰 [Step 7] Updating existing policy:', editingPolicy._id);
        response = await apiFetch(`/api/fare-policy/${editingPolicy._id}`, {
          method: 'PUT',
          body: JSON.stringify(policyData)
        });
      } else {
        console.log('💰 [Step 7] Creating new policy via POST /api/fare-policy');
        response = await apiFetch('/api/fare-policy', {
          method: 'POST',
          body: JSON.stringify(policyData)
        });
      }

      console.log('💰 [Step 8] Fare policy API response:', response);

      if (response.success) {
        console.log('💰 [Step 9] Success! Policy created/updated');
        toast.success(editingPolicy ? 'Fare policy updated' : 'Fare policy created');
        setShowAddForm(false);
        setEditingPolicy(null);
        resetForm();
        fetchFarePolicies();
      } else {
        const errorMsg = response.error || response.message || 'Failed to save fare policy';
        console.error('💰 [Step 9] Fare policy save failed:', errorMsg, response);
        toast.error(`Failed: ${errorMsg}`);
      }
    } catch (error) {
      console.error('💰 [ERROR] Exception caught:', error);
      console.error('💰 [ERROR] Stack trace:', error.stack);
      toast.error(`Error: ${error.message || 'Failed to save fare policy'}`);
    }
  };

  const handleDeletePolicy = async (policyId) => {
    if (window.confirm('Are you sure you want to delete this fare policy?')) {
      try {
        const response = await apiFetch(`/api/fare-policy/${policyId}`, {
          method: 'DELETE'
        });

        if (response.success) {
          toast.success('Fare policy deleted');
          fetchFarePolicies();
        }
      } catch (error) {
        toast.error('Failed to delete fare policy');
      }
    }
  };

  const initializeDefaultPolicies = async () => {
    if (window.confirm('This will create default fare policies for all KSRTC bus types. Continue?')) {
      try {
        setLoading(true);
        const response = await apiFetch('/api/fare-policy/initialize-defaults', {
          method: 'POST'
        });

        if (response.success) {
          toast.success('Default fare policies initialized successfully!');
          fetchFarePolicies();
        } else {
          toast.error(response.error || 'Failed to initialize default policies');
        }
      } catch (error) {
        console.error('Error initializing default policies:', error);
        toast.error('Failed to initialize default policies');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      ...policy,
      distanceBrackets: policy.distanceBrackets || [{ fromKm: 0, toKm: 50, ratePerKm: 0, description: '' }]
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      busType: '',
      routeType: '',
      baseFarePerKm: 0,
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

  const addDistanceBracket = () => {
    setFormData({
      ...formData,
      distanceBrackets: [
        ...formData.distanceBrackets,
        { fromKm: '', toKm: '', ratePerKm: '', description: '' }
      ]
    });
  };

  const removeDistanceBracket = (index) => {
    setFormData({
      ...formData,
      distanceBrackets: formData.distanceBrackets.filter((_, i) => i !== index)
    });
  };

  const updateDistanceBracket = (index, field, value) => {
    const updatedBrackets = [...formData.distanceBrackets];
    updatedBrackets[index][field] = value;
    setFormData({
      ...formData,
      distanceBrackets: updatedBrackets
    });
  };

  const filteredPolicies = farePolicies.filter(policy => {
    const matchesSearch = policy.busType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.routeType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBusType = filterBusType === 'all' || policy.busType === filterBusType;
    const matchesRouteType = filterRouteType === 'all' || policy.routeType === filterRouteType;
    
    return matchesSearch && matchesBusType && matchesRouteType;
  });

  const getBusTypeLabel = (busType) => {
    const found = busTypes.find(bt => bt.value === busType);
    if (!found) {
      console.warn(`Bus type not found for value: ${busType}`);
      return busType || 'Unknown';
    }
    return found.label;
  };

  const getRouteTypeLabel = (routeType) => {
    const found = routeTypes.find(rt => rt.value === routeType);
    if (!found) {
      return routeType || 'General';
    }
    return found.label;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          top: 0,
          left: '280px',
          right: 0,
          bottom: 0,
          width: 'calc(100vw - 280px)',
          height: '100vh'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col relative"
          style={{ 
            zIndex: 10000,
            position: 'relative',
            margin: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Fare Policy Manager</h2>
                <p className="text-gray-600">Manage bus fare policies and pricing rules</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {showAddForm ? (
              // Add/Edit Form
              <div className="h-full overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {editingPolicy ? 'Edit Fare Policy' : 'Add New Fare Policy'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingPolicy(null);
                          resetForm();
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSavePolicy}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        {editingPolicy ? 'Update Policy' : 'Create Policy'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900">Basic Information</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type</label>
                        <select
                          value={formData.busType}
                          onChange={(e) => setFormData({ ...formData, busType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Bus Type</option>
                          {busTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label} ({type.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Route Type</label>
                        <select
                          value={formData.routeType}
                          onChange={(e) => setFormData({ ...formData, routeType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Route Type</option>
                          {routeTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label} - {type.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Base Fare/Km (₹)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.baseFarePerKm}
                            onChange={(e) => setFormData({ ...formData, baseFarePerKm: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Fare (₹)</label>
                          <input
                            type="number"
                            value={formData.minimumFare}
                            onChange={(e) => setFormData({ ...formData, minimumFare: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Fare (₹) - Optional</label>
                        <input
                          type="number"
                          value={formData.maximumFare}
                          onChange={(e) => setFormData({ ...formData, maximumFare: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Time-based Pricing */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900">Time-based Pricing</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Peak Hour Multiplier</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.peakHourMultiplier}
                          onChange={(e) => setFormData({ ...formData, peakHourMultiplier: parseFloat(e.target.value) || 1.0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Distance Brackets */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Distance Brackets</h4>
                      <button
                        onClick={addDistanceBracket}
                        className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Bracket
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.distanceBrackets.map((bracket, index) => (
                        <div key={index} className="grid grid-cols-5 gap-3 items-end">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">From (km)</label>
                            <input
                              type="number"
                              value={bracket.fromKm}
                              onChange={(e) => updateDistanceBracket(index, 'fromKm', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">To (km)</label>
                            <input
                              type="number"
                              value={bracket.toKm}
                              onChange={(e) => updateDistanceBracket(index, 'toKm', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rate/km (₹)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={bracket.ratePerKm}
                              onChange={(e) => updateDistanceBracket(index, 'ratePerKm', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <input
                              type="text"
                              value={bracket.description}
                              onChange={(e) => updateDistanceBracket(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g., Short distance"
                            />
                          </div>
                          <div>
                            <button
                              onClick={() => removeDistanceBracket(index)}
                              className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // List View
              <div className="h-full flex flex-col">
                {/* Filters */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search fare policies..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <select
                      value={filterBusType}
                      onChange={(e) => setFilterBusType(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Bus Types</option>
                      {busTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <select
                      value={filterRouteType}
                      onChange={(e) => setFilterRouteType(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Route Types</option>
                      {routeTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={initializeDefaultPolicies}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Initialize Defaults
                      </button>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Policy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Policies List */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                  ) : filteredPolicies.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fare Policies Found</h3>
                      <p className="text-gray-600 mb-4">Create your first fare policy to get started</p>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Add Fare Policy
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPolicies.map((policy) => (
                        <motion.div
                          key={policy._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Route className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{getBusTypeLabel(policy.busType)}</h3>
                                <p className="text-sm text-gray-600">{getRouteTypeLabel(policy.routeType)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditPolicy(policy)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePolicy(policy._id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Base Fare/Km:</span>
                              <span className="font-medium">₹{policy.baseFarePerKm}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Minimum Fare:</span>
                              <span className="font-medium">₹{policy.minimumFare}</span>
                            </div>
                            {policy.maximumFare && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Maximum Fare:</span>
                                <span className="font-medium">₹{policy.maximumFare}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Peak Multiplier:</span>
                              <span className="font-medium">{policy.peakHourMultiplier}x</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Distance Brackets:</span>
                              <span className="text-sm font-medium">{policy.distanceBrackets?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Status:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                policy.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {policy.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FarePolicyManager;
