import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  Bus, Plus, Edit, Trash2, Save, X, Settings, 
  Users, Wifi, Zap, Coffee, Shield, Star,
  CheckCircle, AlertTriangle, Info, Clock, Route,
  Calendar, MapPin, TrendingUp, BarChart3, Filter,
  Copy, Download, Upload, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const EnhancedBusTypeManager = ({ isOpen, onClose, onSave, onScheduleUpdate }) => {
  const [busTypes, setBusTypes] = useState([
    // Official KSRTC Bus Types
    {
      id: 'ordinary',
      name: 'Ordinary',
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
      isActive: true,
      schedulingRules: {
        maxDistance: 100,
        preferredRoutes: ['local', 'city'],
        timeSlots: ['morning', 'afternoon', 'evening'],
        frequency: 'high'
      }
    },
    {
      id: 'lspf',
      name: 'Limited Stop Fast Passenger (LSFP)',
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
      isActive: true,
      schedulingRules: {
        maxDistance: 200,
        preferredRoutes: ['intercity', 'district'],
        timeSlots: ['morning', 'afternoon'],
        frequency: 'medium'
      }
    },
    {
      id: 'fast_passenger',
      name: 'Fast Passenger',
      description: 'Limited stops, better speed, Non-AC comfortable seats',
      capacity: { total: 45, sleeper: 0, seater: 45 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 10,
        maxSpeed: 75,
        length: 11,
        width: 2.5,
        height: 3.2
      },
      features: ['Fast service', 'Limited stops', 'Comfortable seats'],
      priceCategory: 'standard',
      isActive: true,
      schedulingRules: {
        maxDistance: 250,
        preferredRoutes: ['intercity', 'district'],
        timeSlots: ['morning', 'afternoon', 'evening'],
        frequency: 'high'
      }
    },
    {
      id: 'venad',
      name: 'Venad',
      description: 'Ordinary long-distance service, south Kerala routes',
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
      isActive: true,
      schedulingRules: {
        maxDistance: 300,
        preferredRoutes: ['long_distance', 'south_kerala'],
        timeSlots: ['morning', 'afternoon'],
        frequency: 'medium'
      }
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
      isActive: true,
      schedulingRules: {
        maxDistance: 300,
        preferredRoutes: ['long_distance', 'intercity'],
        timeSlots: ['morning', 'afternoon', 'evening'],
        frequency: 'high'
      }
    },
    {
      id: 'garuda_volvo',
      name: 'Garuda Volvo',
      description: 'AC luxury Volvo, pushback, curtains, charging ports',
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
      isActive: true,
      schedulingRules: {
        maxDistance: 500,
        preferredRoutes: ['interstate', 'premium'],
        timeSlots: ['morning', 'evening'],
        frequency: 'low'
      }
    },
    {
      id: 'garuda_scania',
      name: 'Garuda Scania',
      description: 'AC luxury Scania, premium interstate service',
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
      features: ['AC luxury', 'Premium service', 'Interstate', 'Scania'],
      priceCategory: 'luxury',
      isActive: true,
      schedulingRules: {
        maxDistance: 500,
        preferredRoutes: ['interstate', 'premium'],
        timeSlots: ['morning', 'evening'],
        frequency: 'low'
      }
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
      isActive: true,
      schedulingRules: {
        maxDistance: 800,
        preferredRoutes: ['interstate', 'luxury'],
        timeSlots: ['evening', 'night'],
        frequency: 'very_low'
      }
    },
    {
      id: 'fast_passenger',
      name: 'Fast Passenger',
      description: 'Limited stops, better speed, Non-AC comfortable seats',
      capacity: { total: 45, sleeper: 0, seater: 45 },
      amenities: ['charging'],
      specifications: {
        fuelType: 'diesel',
        mileage: 10,
        maxSpeed: 75,
        length: 11,
        width: 2.5,
        height: 3.2
      },
      features: ['Fast service', 'Limited stops', 'Comfortable seats'],
      priceCategory: 'standard',
      isActive: true,
      schedulingRules: {
        maxDistance: 250,
        preferredRoutes: ['intercity', 'district'],
        timeSlots: ['morning', 'afternoon', 'evening'],
        frequency: 'high'
      }
    },
    {
      id: 'venad',
      name: 'Venad',
      description: 'Ordinary long-distance service, south Kerala routes',
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
      isActive: true,
      schedulingRules: {
        maxDistance: 300,
        preferredRoutes: ['long_distance', 'south_kerala'],
        timeSlots: ['morning', 'afternoon'],
        frequency: 'medium'
      }
    },
    {
      id: 'rajadhani',
      name: 'Rajadhani',
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
      isActive: true,
      schedulingRules: {
        maxDistance: 400,
        preferredRoutes: ['interstate', 'long_distance'],
        timeSlots: ['morning', 'evening'],
        frequency: 'low'
      }
    },
    {
      id: 'minnal',
      name: 'Minnal',
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
      isActive: true,
      schedulingRules: {
        maxDistance: 350,
        preferredRoutes: ['long_distance', 'interstate'],
        timeSlots: ['evening', 'night'],
        frequency: 'medium'
      }
    },
    {
      id: 'ananthapuri_fast',
      name: 'Ananthapuri (Fast / Superfast / Deluxe)',
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
      isActive: true,
      schedulingRules: {
        maxDistance: 300,
        preferredRoutes: ['intercity', 'district'],
        timeSlots: ['morning', 'afternoon', 'evening'],
        frequency: 'high'
      }
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
      isActive: true,
      schedulingRules: {
        maxDistance: 50,
        preferredRoutes: ['city', 'local'],
        timeSlots: ['morning', 'afternoon', 'evening'],
        frequency: 'high'
      }
    },
    {
      id: 'low_floor_ac',
      name: 'Low Floor AC (Volvo)',
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
      isActive: true,
      schedulingRules: {
        maxDistance: 50,
        preferredRoutes: ['city', 'premium'],
        timeSlots: ['morning', 'afternoon', 'evening'],
        frequency: 'medium'
      }
    },
    {
      id: 'jnnurm_city',
      name: 'JNNURM / City Circular',
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
      isActive: true,
      schedulingRules: {
        maxDistance: 30,
        preferredRoutes: ['city', 'circular'],
        timeSlots: ['morning', 'afternoon', 'evening'],
        frequency: 'high'
      }
    }
  ]);

  const [editingType, setEditingType] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSchedulingRules, setShowSchedulingRules] = useState(false);
  const [selectedTypeForScheduling, setSelectedTypeForScheduling] = useState(null);
  const [activeTab, setActiveTab] = useState('types'); // types, scheduling, analytics
  
  const [newBusType, setNewBusType] = useState({
    id: '',
    name: '',
    description: '',
    capacity: { total: 45, sleeper: 0, seater: 45 },
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
    isActive: true,
    schedulingRules: {
      maxDistance: 200,
      preferredRoutes: ['intercity'],
      timeSlots: ['morning', 'afternoon'],
      frequency: 'medium'
    }
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
    { id: 'luxury', name: 'Luxury', color: 'bg-red-100 text-red-800' },
    { id: 'super_luxury', name: 'Super Luxury', color: 'bg-indigo-100 text-indigo-800' }
  ];

  const routeTypes = [
    { id: 'local', name: 'Local Routes' },
    { id: 'city', name: 'City Routes' },
    { id: 'intercity', name: 'Intercity Routes' },
    { id: 'district', name: 'District Routes' },
    { id: 'long_distance', name: 'Long Distance' },
    { id: 'interstate', name: 'Interstate' },
    { id: 'premium', name: 'Premium Routes' },
    { id: 'luxury', name: 'Luxury Routes' }
  ];

  const timeSlots = [
    { id: 'morning', name: 'Morning (6AM-12PM)', icon: '🌅' },
    { id: 'afternoon', name: 'Afternoon (12PM-6PM)', icon: '☀️' },
    { id: 'evening', name: 'Evening (6PM-10PM)', icon: '🌆' },
    { id: 'night', name: 'Night (10PM-6AM)', icon: '🌙' }
  ];

  const frequencyOptions = [
    { id: 'very_low', name: 'Very Low', color: 'bg-red-100 text-red-800' },
    { id: 'low', name: 'Low', color: 'bg-orange-100 text-orange-800' },
    { id: 'medium', name: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'high', name: 'High', color: 'bg-green-100 text-green-800' }
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
      isActive: true,
      schedulingRules: {
        maxDistance: 200,
        preferredRoutes: [],
        timeSlots: [],
        frequency: 'medium'
      }
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

  const handleDuplicateBusType = (type) => {
    const duplicated = {
      ...type,
      id: `${type.id}_copy_${Date.now()}`,
      name: `${type.name} (Copy)`,
      isActive: false
    };
    setBusTypes([...busTypes, duplicated]);
    toast.success('Bus type duplicated successfully');
  };

  const handleScheduleUpdate = () => {
    if (onScheduleUpdate) {
      onScheduleUpdate(busTypes.filter(type => type.isActive));
    }
    toast.success('Scheduling rules updated successfully');
  };

  const getPriceCategoryColor = (category) => {
    return priceCategories.find(pc => pc.id === category)?.color || 'bg-gray-100 text-gray-800';
  };

  const getFrequencyColor = (frequency) => {
    return frequencyOptions.find(f => f.id === frequency)?.color || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed bg-black bg-opacity-70 flex items-center justify-center z-[9999]"
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          top: 0,
          left: '280px', // Offset to account for sidebar width
          right: 0,
          bottom: 0,
          width: 'calc(100vw - 280px)', // Full width minus sidebar
          height: '100vh'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col relative"
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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Enhanced Bus Type Manager</h2>
                <p className="text-gray-500">Manage bus types, scheduling rules, and analytics</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'types', label: 'Bus Types', icon: Bus },
                { id: 'scheduling', label: 'Scheduling Rules', icon: Calendar },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'types' && (
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
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(type.schedulingRules?.frequency)}`}>
                              {type.schedulingRules?.frequency || 'medium'}
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
                                handleDuplicateBusType(type);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            >
                              <Copy className="w-4 h-4" />
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
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{type.capacity.total} seats</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Route className="w-4 h-4" />
                            <span>Max: {type.schedulingRules?.maxDistance || 200}km</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
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
                  {showAddForm ? (
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900">Add New Bus Type</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setShowAddForm(false);
                              setNewBusType({
                                id: '',
                                name: '',
                                description: '',
                                capacity: { total: 45, sleeper: 0, seater: 45 },
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
                                isActive: true,
                                schedulingRules: {
                                  maxDistance: 200,
                                  preferredRoutes: ['intercity'],
                                  timeSlots: ['morning', 'afternoon'],
                                  frequency: 'medium'
                                }
                              });
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddBusType}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Type
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-medium text-gray-900">Basic Information</h4>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                              type="text"
                              value={newBusType.name}
                              onChange={(e) => setNewBusType({ ...newBusType, name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter bus type name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                              value={newBusType.description}
                              onChange={(e) => setNewBusType({ ...newBusType, description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                              placeholder="Enter bus type description"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Total Capacity</label>
                              <input
                                type="number"
                                value={newBusType.capacity.total}
                                onChange={(e) => setNewBusType({ ...newBusType, capacity: { ...newBusType.capacity, total: parseInt(e.target.value) || 0 } })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Total seats"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Price Category</label>
                              <select
                                value={newBusType.priceCategory}
                                onChange={(e) => setNewBusType({ ...newBusType, priceCategory: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {priceCategories.map(category => (
                                  <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Amenities */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-medium text-gray-900">Amenities</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {availableAmenities.map(amenity => (
                              <label key={amenity.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={newBusType.amenities.includes(amenity.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewBusType({ ...newBusType, amenities: [...newBusType.amenities, amenity.id] });
                                    } else {
                                      setNewBusType({ ...newBusType, amenities: newBusType.amenities.filter(id => id !== amenity.id) });
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-sm text-gray-700">{amenity.icon} {amenity.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : editingType ? (
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

                        {/* Scheduling Rules */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-medium text-gray-900">Scheduling Rules</h4>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Distance (km)</label>
                            <input
                              type="number"
                              value={editingType.schedulingRules?.maxDistance || 200}
                              onChange={(e) => setEditingType({
                                ...editingType,
                                schedulingRules: {
                                  ...editingType.schedulingRules,
                                  maxDistance: parseInt(e.target.value) || 200
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Routes</label>
                            <div className="grid grid-cols-2 gap-2">
                              {routeTypes.map(route => (
                                <label key={route.id} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                                  <input
                                    type="checkbox"
                                    checked={editingType.schedulingRules?.preferredRoutes?.includes(route.id) || false}
                                    onChange={(e) => {
                                      const routes = editingType.schedulingRules?.preferredRoutes || [];
                                      const newRoutes = e.target.checked
                                        ? [...routes, route.id]
                                        : routes.filter(r => r !== route.id);
                                      setEditingType({
                                        ...editingType,
                                        schedulingRules: {
                                          ...editingType.schedulingRules,
                                          preferredRoutes: newRoutes
                                        }
                                      });
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{route.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Time Slots</label>
                            <div className="grid grid-cols-2 gap-2">
                              {timeSlots.map(slot => (
                                <label key={slot.id} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                                  <input
                                    type="checkbox"
                                    checked={editingType.schedulingRules?.timeSlots?.includes(slot.id) || false}
                                    onChange={(e) => {
                                      const slots = editingType.schedulingRules?.timeSlots || [];
                                      const newSlots = e.target.checked
                                        ? [...slots, slot.id]
                                        : slots.filter(s => s !== slot.id);
                                      setEditingType({
                                        ...editingType,
                                        schedulingRules: {
                                          ...editingType.schedulingRules,
                                          timeSlots: newSlots
                                        }
                                      });
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{slot.icon} {slot.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                            <select
                              value={editingType.schedulingRules?.frequency || 'medium'}
                              onChange={(e) => setEditingType({
                                ...editingType,
                                schedulingRules: {
                                  ...editingType.schedulingRules,
                                  frequency: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {frequencyOptions.map(option => (
                                <option key={option.id} value={option.id}>{option.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Bus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Bus Type</h3>
                        <p className="text-gray-500">Choose a bus type from the list to edit its configuration and scheduling rules</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'scheduling' && (
              <div className="h-full overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Scheduling Rules Overview</h3>
                  <button
                    onClick={handleScheduleUpdate}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Update Scheduling
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {busTypes.filter(type => type.isActive).map(type => (
                    <div key={type.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{type.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriceCategoryColor(type.priceCategory)}`}>
                          {type.priceCategory}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Route className="w-4 h-4 text-blue-600" />
                          <span>Max Distance: {type.schedulingRules?.maxDistance || 200}km</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-600" />
                          <span>Frequency: {type.schedulingRules?.frequency || 'medium'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-purple-600" />
                          <span>Routes: {type.schedulingRules?.preferredRoutes?.join(', ') || 'Any'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          <span>Time Slots: {type.schedulingRules?.timeSlots?.join(', ') || 'Any'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="h-full overflow-y-auto p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Bus Type Analytics</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Bus className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold text-blue-900">{busTypes.length}</p>
                        <p className="text-blue-700">Total Bus Types</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-green-900">{busTypes.filter(t => t.isActive).length}</p>
                        <p className="text-green-700">Active Types</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold text-purple-900">{priceCategories.length}</p>
                        <p className="text-purple-700">Price Categories</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Bus Types by Category</h4>
                    <div className="space-y-2">
                      {priceCategories.map(category => {
                        const count = busTypes.filter(t => t.priceCategory === category.id).length;
                        return (
                          <div key={category.id} className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                              {category.name}
                            </span>
                            <span className="font-medium">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Capacity Distribution</h4>
                    <div className="space-y-2">
                      {busTypes.map(type => (
                        <div key={type.id} className="flex items-center justify-between text-sm">
                          <span>{type.name}</span>
                          <span className="font-medium">{type.capacity.total} seats</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default EnhancedBusTypeManager;
