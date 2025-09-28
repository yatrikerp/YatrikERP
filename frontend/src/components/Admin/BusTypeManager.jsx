import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, Plus, Edit, Trash2, Save, X, Settings, 
  Users, Wifi, Zap, Coffee, Shield, Star,
  CheckCircle, AlertTriangle, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BusTypeManager = ({ isOpen, onClose, onSave }) => {
  const [busTypes, setBusTypes] = useState([
    // KSRTC Bus Types
    {
      id: 'ordinary',
      name: 'Ordinary Service',
      description: 'Basic service, stops at all points, Non-AC simple seats',
      capacity: { total: 50, sleeper: 0, seater: 50 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 12,
        maxSpeed: 60,
        length: 11,
        width: 2.5,
        height: 3.2
      },
      features: ['Basic seats', 'All stops', 'Local service'],
      priceCategory: 'budget',
      isActive: true
    },
    {
      id: 'lspf',
      name: 'Limited Stop Fast Passenger',
      description: 'Fewer stops, Non-AC 2+3 seater, medium-distance travel',
      capacity: { total: 45, sleeper: 0, seater: 45 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 11,
        maxSpeed: 70,
        length: 11,
        width: 2.5,
        height: 3.2
      },
      features: ['2+3 seating', 'Limited stops', 'Medium distance'],
      priceCategory: 'economy',
      isActive: true
    },
    {
      id: 'super_fast',
      name: 'Super Fast',
      description: 'Popular category, limited stops, better cushioning, long-distance',
      capacity: { total: 45, sleeper: 0, seater: 45 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 10,
        maxSpeed: 80,
        length: 11,
        width: 2.5,
        height: 3.2
      },
      features: ['Better cushioning', 'Limited stops', 'Long distance'],
      priceCategory: 'standard',
      isActive: true
    },
    {
      id: 'super_deluxe',
      name: 'Super Deluxe',
      description: 'Fewer stops, 2+2 cushioned seats, Non-AC, long routes',
      capacity: { total: 40, sleeper: 0, seater: 40 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 9,
        maxSpeed: 85,
        length: 11,
        width: 2.5,
        height: 3.2
      },
      features: ['2+2 cushioned', 'Fewer stops', 'Long routes'],
      priceCategory: 'premium',
      isActive: true
    },
    {
      id: 'deluxe_express',
      name: 'Deluxe Express',
      description: 'Fast Passenger Deluxe, 2+2 pushback seats, intercity routes',
      capacity: { total: 40, sleeper: 0, seater: 40 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 9,
        maxSpeed: 85,
        length: 11,
        width: 2.5,
        height: 3.2
      },
      features: ['2+2 pushback', 'Intercity routes', 'Fast service'],
      priceCategory: 'premium',
      isActive: true
    },
    {
      id: 'garuda_king_long',
      name: 'Garuda King Long',
      description: 'AC semi-sleeper, premium interstate service',
      capacity: { total: 32, sleeper: 32, seater: 0 },
      amenities: ['ac', 'charging', 'entertainment'],
      specifications: {
        fuelType: 'diesel',
        mileage: 7,
        maxSpeed: 90,
        length: 12,
        width: 2.5,
        height: 3.5
      },
      features: ['AC semi-sleeper', 'Premium service', 'Interstate'],
      priceCategory: 'luxury',
      isActive: true
    },
    {
      id: 'garuda_volvo',
      name: 'Garuda Volvo/Scania',
      description: 'AC luxury, pushback, curtains, charging ports',
      capacity: { total: 30, sleeper: 30, seater: 0 },
      amenities: ['ac', 'charging', 'entertainment'],
      specifications: {
        fuelType: 'diesel',
        mileage: 6,
        maxSpeed: 100,
        length: 12,
        width: 2.6,
        height: 3.5
      },
      features: ['AC luxury', 'Pushback seats', 'Curtains', 'Charging ports'],
      priceCategory: 'luxury',
      isActive: true
    },
    {
      id: 'garuda_maharaja',
      name: 'Garuda Maharaja',
      description: 'Premium long-distance, AC pushback, large leg space',
      capacity: { total: 28, sleeper: 28, seater: 0 },
      amenities: ['ac', 'charging', 'entertainment', 'refreshments'],
      specifications: {
        fuelType: 'diesel',
        mileage: 6,
        maxSpeed: 100,
        length: 13,
        width: 2.6,
        height: 3.8
      },
      features: ['Premium luxury', 'Large leg space', 'AC pushback', 'Long distance'],
      priceCategory: 'super_luxury',
      isActive: true
    },
    {
      id: 'ananthapuri_fast',
      name: 'Ananthapuri Fast',
      description: 'Special Trivandrum-based branded service',
      capacity: { total: 45, sleeper: 0, seater: 45 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 10,
        maxSpeed: 80,
        length: 11,
        width: 2.5,
        height: 3.2
      },
      features: ['Trivandrum branded', 'Fast service', 'Limited stops'],
      priceCategory: 'standard',
      isActive: true
    },
    {
      id: 'minnal_lightning',
      name: 'Minnal Lightning',
      description: 'Overnight services, AC/Non-AC semi-sleeper, night journeys',
      capacity: { total: 35, sleeper: 35, seater: 0 },
      amenities: ['ac', 'charging', 'entertainment'],
      specifications: {
        fuelType: 'diesel',
        mileage: 8,
        maxSpeed: 85,
        length: 12,
        width: 2.5,
        height: 3.5
      },
      features: ['Overnight service', 'Semi-sleeper', 'Night journeys'],
      priceCategory: 'premium',
      isActive: true
    },
    {
      id: 'low_floor_non_ac',
      name: 'Low Floor Non-AC',
      description: 'Modern city service, wide doors, GPS-enabled',
      capacity: { total: 45, sleeper: 0, seater: 45 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 11,
        maxSpeed: 70,
        length: 11,
        width: 2.5,
        height: 3.0
      },
      features: ['Low floor', 'Wide doors', 'GPS enabled', 'City service'],
      priceCategory: 'standard',
      isActive: true
    },
    {
      id: 'low_floor_ac',
      name: 'Low Floor AC',
      description: 'Volvo AC city service, Trivandrum/Kochi',
      capacity: { total: 40, sleeper: 0, seater: 40 },
      amenities: ['ac', 'charging', 'entertainment'],
      specifications: {
        fuelType: 'diesel',
        mileage: 9,
        maxSpeed: 80,
        length: 11,
        width: 2.5,
        height: 3.0
      },
      features: ['Low floor AC', 'Volvo service', 'City routes'],
      priceCategory: 'premium',
      isActive: true
    },
    {
      id: 'jnnurm_city',
      name: 'JNNURM City Circular',
      description: 'Special city buses, funded under JNNURM scheme',
      capacity: { total: 50, sleeper: 0, seater: 50 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 12,
        maxSpeed: 60,
        length: 11,
        width: 2.5,
        height: 3.2
      },
      features: ['JNNURM funded', 'City circular', 'Short routes'],
      priceCategory: 'budget',
      isActive: true
    },
    {
      id: 'venad_ordinary',
      name: 'Venad Ordinary',
      description: 'Ordinary long-distance service, south Kerala',
      capacity: { total: 50, sleeper: 0, seater: 50 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 12,
        maxSpeed: 60,
        length: 11,
        width: 2.5,
        height: 3.2
      },
      features: ['South Kerala', 'Long distance', 'Ordinary service'],
      priceCategory: 'budget',
      isActive: true
    },
    {
      id: 'rajadhani_ac',
      name: 'Rajadhani AC',
      description: 'AC long-distance service with premium comfort',
      capacity: { total: 35, sleeper: 35, seater: 0 },
      amenities: ['ac', 'charging', 'entertainment'],
      specifications: {
        fuelType: 'diesel',
        mileage: 8,
        maxSpeed: 90,
        length: 12,
        width: 2.5,
        height: 3.5
      },
      features: ['AC long distance', 'Premium comfort', 'Interstate'],
      priceCategory: 'luxury',
      isActive: true
    },
    {
      id: 'city_fast',
      name: 'Thiruvananthapuram City Fast',
      description: 'Branded city services, fast local transport',
      capacity: { total: 45, sleeper: 0, seater: 45 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 10,
        maxSpeed: 70,
        length: 11,
        width: 2.5,
        height: 3.2
      },
      features: ['City branded', 'Fast local', 'Thiruvananthapuram'],
      priceCategory: 'standard',
      isActive: true
    },
    
    // Legacy Types
    {
      id: 'ac_sleeper',
      name: 'AC Sleeper',
      description: 'Air-conditioned sleeper bus with berths',
      capacity: { total: 35, sleeper: 35, seater: 0 },
      amenities: ['ac', 'wifi', 'charging', 'entertainment'],
      specifications: {
        fuelType: 'diesel',
        mileage: 8,
        maxSpeed: 80,
        length: 12,
        width: 2.5,
        height: 3.5
      },
      features: ['Luxury berths', 'AC', 'WiFi', 'Charging points'],
      priceCategory: 'premium',
      isActive: true
    },
    {
      id: 'ac_seater',
      name: 'AC Seater',
      description: 'Air-conditioned seater bus with comfortable seats',
      capacity: { total: 45, sleeper: 0, seater: 45 },
      amenities: ['ac', 'wifi', 'charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 10,
        maxSpeed: 90,
        length: 11,
        width: 2.5,
        height: 3.2
      },
      features: ['Comfortable seats', 'AC', 'WiFi', 'Charging points'],
      priceCategory: 'standard',
      isActive: true
    },
    {
      id: 'non_ac_sleeper',
      name: 'Non-AC Sleeper',
      description: 'Non-air-conditioned sleeper bus with berths',
      capacity: { total: 40, sleeper: 40, seater: 0 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 12,
        maxSpeed: 75,
        length: 12,
        width: 2.5,
        height: 3.5
      },
      features: ['Economical berths', 'Charging points'],
      priceCategory: 'economy',
      isActive: true
    },
    {
      id: 'non_ac_seater',
      name: 'Non-AC Seater',
      description: 'Non-air-conditioned seater bus',
      capacity: { total: 50, sleeper: 0, seater: 50 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 14,
        maxSpeed: 80,
        length: 11,
        width: 2.5,
        height: 3.2
      },
      features: ['Economical seats', 'Charging points'],
      priceCategory: 'budget',
      isActive: true
    },
    {
      id: 'volvo',
      name: 'Volvo Multi-Axle',
      description: 'Premium Volvo multi-axle bus for long distances',
      capacity: { total: 30, sleeper: 30, seater: 0 },
      amenities: ['ac', 'wifi', 'charging', 'entertainment', 'refreshments'],
      specifications: {
        fuelType: 'diesel',
        mileage: 6,
        maxSpeed: 100,
        length: 13,
        width: 2.6,
        height: 3.8
      },
      features: ['Premium berths', 'AC', 'WiFi', 'Entertainment', 'Refreshments'],
      priceCategory: 'luxury',
      isActive: true
    },
    {
      id: 'mini',
      name: 'Mini Bus',
      description: 'Small capacity bus for short routes',
      capacity: { total: 25, sleeper: 0, seater: 25 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 15,
        maxSpeed: 70,
        length: 8,
        width: 2.3,
        height: 2.8
      },
      features: ['Compact design', 'Fuel efficient'],
      priceCategory: 'budget',
      isActive: true
    }
  ]);

  const [editingType, setEditingType] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBusType, setNewBusType] = useState({
    name: '',
    description: '',
    capacity: { total: 0, sleeper: 0, seater: 0 },
    amenities: [],
    specifications: {
      fuelType: 'diesel',
      mileage: 10,
      maxSpeed: 80,
      length: 11,
      width: 2.5,
      height: 3.2
    },
    features: [],
    priceCategory: 'standard',
    isActive: true
  });

  const availableAmenities = [
    { id: 'ac', name: 'Air Conditioning', icon: '❄️' },
    { id: 'wifi', name: 'WiFi', icon: '📶' },
    { id: 'charging', name: 'Charging Points', icon: '🔌' },
    { id: 'entertainment', name: 'Entertainment', icon: '📺' },
    { id: 'refreshments', name: 'Refreshments', icon: '🍿' },
    { id: 'toilet', name: 'Toilet', icon: '🚻' },
    { id: 'heating', name: 'Heating', icon: '🔥' }
  ];

  const priceCategories = [
    { id: 'budget', name: 'Budget', color: 'bg-green-100 text-green-800' },
    { id: 'economy', name: 'Economy', color: 'bg-blue-100 text-blue-800' },
    { id: 'standard', name: 'Standard', color: 'bg-purple-100 text-purple-800' },
    { id: 'premium', name: 'Premium', color: 'bg-orange-100 text-orange-800' },
    { id: 'luxury', name: 'Luxury', color: 'bg-red-100 text-red-800' }
  ];

  const handleAddBusType = () => {
    if (!newBusType.name.trim()) {
      toast.error('Bus type name is required');
      return;
    }

    const id = newBusType.name.toLowerCase().replace(/\s+/g, '_');
    const busType = {
      id,
      ...newBusType,
      capacity: {
        ...newBusType.capacity,
        total: newBusType.capacity.sleeper + newBusType.capacity.seater
      }
    };

    setBusTypes([...busTypes, busType]);
    setNewBusType({
      name: '',
      description: '',
      capacity: { total: 0, sleeper: 0, seater: 0 },
      amenities: [],
      specifications: {
        fuelType: 'diesel',
        mileage: 10,
        maxSpeed: 80,
        length: 11,
        width: 2.5,
        height: 3.2
      },
      features: [],
      priceCategory: 'standard',
      isActive: true
    });
    setShowAddForm(false);
    toast.success('Bus type added successfully');
  };

  const handleEditBusType = (type) => {
    setEditingType(type);
  };

  const handleSaveEdit = () => {
    setBusTypes(buses => buses.map(bus => 
      bus.id === editingType.id ? editingType : bus
    ));
    setEditingType(null);
    toast.success('Bus type updated successfully');
  };

  const handleDeleteBusType = (typeId) => {
    if (window.confirm('Are you sure you want to delete this bus type?')) {
      setBusTypes(buses => buses.filter(bus => bus.id !== typeId));
      toast.success('Bus type deleted successfully');
    }
  };

  const handleToggleActive = (typeId) => {
    setBusTypes(buses => buses.map(bus => 
      bus.id === typeId ? { ...bus, isActive: !bus.isActive } : bus
    ));
  };

  const handleAmenityToggle = (amenityId) => {
    if (editingType) {
      const amenities = editingType.amenities.includes(amenityId)
        ? editingType.amenities.filter(a => a !== amenityId)
        : [...editingType.amenities, amenityId];
      setEditingType({ ...editingType, amenities });
    }
  };

  const handleFeatureAdd = (feature) => {
    if (editingType && feature.trim()) {
      setEditingType({
        ...editingType,
        features: [...editingType.features, feature.trim()]
      });
    }
  };

  const handleFeatureRemove = (index) => {
    if (editingType) {
      setEditingType({
        ...editingType,
        features: editingType.features.filter((_, i) => i !== index)
      });
    }
  };

  const getPriceCategoryColor = (category) => {
    return priceCategories.find(pc => pc.id === category)?.color || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bus Type Manager</h2>
                <p className="text-gray-500">Manage bus types, configurations, and assignments</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex">
              {/* Left Panel - Bus Types List */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Bus Types ({busTypes.length})</h3>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Type
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {busTypes.map((type) => (
                    <motion.div
                      key={type.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mb-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        editingType?.id === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => handleEditBusType(type)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bus className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-gray-900">{type.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriceCategoryColor(type.priceCategory)}`}>
                            {type.priceCategory}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleActive(type.id);
                            }}
                            className={`p-1 rounded ${
                              type.isActive ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            {type.isActive ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBusType(type.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{type.capacity.total} seats</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4" />
                          <span>{type.specifications.mileage} km/l</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {type.amenities.slice(0, 3).map(amenity => {
                          const amenityData = availableAmenities.find(a => a.id === amenity);
                          return (
                            <span key={amenity} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {amenityData?.icon} {amenityData?.name}
                            </span>
                          );
                        })}
                        {type.amenities.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            +{type.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right Panel - Edit Form */}
              <div className="w-1/2 flex flex-col">
                {editingType ? (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Edit Bus Type</h3>
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">Basic Information</h4>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                          <input
                            type="text"
                            value={editingType.name}
                            onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                          <textarea
                            value={editingType.description}
                            onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Price Category</label>
                          <select
                            value={editingType.priceCategory}
                            onChange={(e) => setEditingType({ ...editingType, priceCategory: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {priceCategories.map(category => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Capacity */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">Capacity</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sleeper Seats</label>
                            <input
                              type="number"
                              value={editingType.capacity.sleeper}
                              onChange={(e) => setEditingType({
                                ...editingType,
                                capacity: {
                                  ...editingType.capacity,
                                  sleeper: parseInt(e.target.value) || 0,
                                  total: (parseInt(e.target.value) || 0) + editingType.capacity.seater
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Seater Seats</label>
                            <input
                              type="number"
                              value={editingType.capacity.seater}
                              onChange={(e) => setEditingType({
                                ...editingType,
                                capacity: {
                                  ...editingType.capacity,
                                  seater: parseInt(e.target.value) || 0,
                                  total: editingType.capacity.sleeper + (parseInt(e.target.value) || 0)
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">Amenities</h4>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {availableAmenities.map(amenity => (
                            <label key={amenity.id} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={editingType.amenities.includes(amenity.id)}
                                onChange={() => handleAmenityToggle(amenity.id)}
                                className="rounded"
                              />
                              <span className="text-sm">{amenity.icon} {amenity.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">Features</h4>
                        
                        <div className="space-y-2">
                          {editingType.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm">{feature}</span>
                              <button
                                onClick={() => handleFeatureRemove(index)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add feature..."
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleFeatureAdd(e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={(e) => {
                                const input = e.target.previousElementSibling;
                                handleFeatureAdd(input.value);
                                input.value = '';
                              }}
                              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Specifications */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">Specifications</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                            <select
                              value={editingType.specifications.fuelType}
                              onChange={(e) => setEditingType({
                                ...editingType,
                                specifications: { ...editingType.specifications, fuelType: e.target.value }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="diesel">Diesel</option>
                              <option value="petrol">Petrol</option>
                              <option value="cng">CNG</option>
                              <option value="electric">Electric</option>
                              <option value="hybrid">Hybrid</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mileage (km/l)</label>
                            <input
                              type="number"
                              value={editingType.specifications.mileage}
                              onChange={(e) => setEditingType({
                                ...editingType,
                                specifications: { ...editingType.specifications, mileage: parseInt(e.target.value) || 0 }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Bus Type</h3>
                      <p className="text-gray-500">Choose a bus type from the list to edit its configuration</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BusTypeManager;
