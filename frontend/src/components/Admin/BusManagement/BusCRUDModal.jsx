import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Bus, Save, Eye, Edit, Users, MapPin, Wrench, 
  Fuel, Calendar, FileText, AlertTriangle, CheckCircle,
  Camera, Upload, Download, Star, Zap
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const BusCRUDModal = ({ 
  mode = 'create', // 'create', 'edit', 'view', 'assign'
  bus = null,
  onClose,
  onSave
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [previewImage, setPreviewImage] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    defaultValues: {
      busNumber: '',
      registrationNumber: '',
      depotId: '',
      busType: 'ac_seater',
      capacity: {
        total: 0,
        sleeper: 0,
        seater: 0,
        ladies: 0,
        disabled: 0
      },
      amenities: [],
      specifications: {
        manufacturer: '',
        model: '',
        year: new Date().getFullYear(),
        engine: '',
        fuelType: 'diesel',
        mileage: 0,
        maxSpeed: 0,
        length: 0,
        width: 0,
        height: 0
      },
      status: 'active',
      currentLocation: {
        latitude: 0,
        longitude: 0,
        stopName: ''
      },
      assignedDriver: '',
      assignedConductor: '',
      maintenance: {
        lastService: '',
        nextService: '',
        totalDistance: 0,
        engineHours: 0
      },
      fuel: {
        currentLevel: 0,
        lastRefuel: '',
        averageConsumption: 0,
        tankCapacity: 0
      },
      documents: {
        permit: {
          number: '',
          expiryDate: '',
          status: 'valid'
        },
        insurance: {
          number: '',
          expiryDate: '',
          company: ''
        },
        fitness: {
          number: '',
          expiryDate: '',
          status: 'valid'
        },
        puc: {
          number: '',
          expiryDate: '',
          status: 'valid'
        }
      },
      notes: ''
    }
  });

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Bus },
    { id: 'specifications', label: 'Specifications', icon: Wrench },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'maintenance', label: 'Maintenance', icon: Calendar },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'staff', label: 'Staff Assignment', icon: Users }
  ];

  useEffect(() => {
    if (bus && (mode === 'edit' || mode === 'view')) {
      reset({
        ...bus,
        maintenance: {
          ...bus.maintenance,
          lastService: bus.maintenance?.lastService ? new Date(bus.maintenance.lastService).toISOString().split('T')[0] : '',
          nextService: bus.maintenance?.nextService ? new Date(bus.maintenance.nextService).toISOString().split('T')[0] : ''
        },
        fuel: {
          ...bus.fuel,
          lastRefuel: bus.fuel?.lastRefuel ? new Date(bus.fuel.lastRefuel).toISOString().split('T')[0] : ''
        },
        documents: {
          permit: {
            ...bus.documents?.permit,
            expiryDate: bus.documents?.permit?.expiryDate ? new Date(bus.documents.permit.expiryDate).toISOString().split('T')[0] : ''
          },
          insurance: {
            ...bus.documents?.insurance,
            expiryDate: bus.documents?.insurance?.expiryDate ? new Date(bus.documents.insurance.expiryDate).toISOString().split('T')[0] : ''
          },
          fitness: {
            ...bus.documents?.fitness,
            expiryDate: bus.documents?.fitness?.expiryDate ? new Date(bus.documents.fitness.expiryDate).toISOString().split('T')[0] : ''
          },
          puc: {
            ...bus.documents?.puc,
            expiryDate: bus.documents?.puc?.expiryDate ? new Date(bus.documents.puc.expiryDate).toISOString().split('T')[0] : ''
          }
        }
      });
    }
  }, [bus, mode, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Process amenities array
      const processedData = {
        ...data,
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        capacity: {
          ...data.capacity,
          total: parseInt(data.capacity.total) || 0,
          sleeper: parseInt(data.capacity.sleeper) || 0,
          seater: parseInt(data.capacity.seater) || 0,
          ladies: parseInt(data.capacity.ladies) || 0,
          disabled: parseInt(data.capacity.disabled) || 0
        },
        specifications: {
          ...data.specifications,
          year: parseInt(data.specifications.year) || new Date().getFullYear(),
          mileage: parseFloat(data.specifications.mileage) || 0,
          maxSpeed: parseInt(data.specifications.maxSpeed) || 0,
          length: parseFloat(data.specifications.length) || 0,
          width: parseFloat(data.specifications.width) || 0,
          height: parseFloat(data.specifications.height) || 0
        },
        currentLocation: {
          ...data.currentLocation,
          latitude: parseFloat(data.currentLocation.latitude) || 0,
          longitude: parseFloat(data.currentLocation.longitude) || 0
        },
        maintenance: {
          ...data.maintenance,
          totalDistance: parseFloat(data.maintenance.totalDistance) || 0,
          engineHours: parseFloat(data.maintenance.engineHours) || 0
        },
        fuel: {
          ...data.fuel,
          currentLevel: parseInt(data.fuel.currentLevel) || 0,
          averageConsumption: parseFloat(data.fuel.averageConsumption) || 0,
          tankCapacity: parseFloat(data.fuel.tankCapacity) || 0
        }
      };

      await onSave(processedData);
      toast.success(`Bus ${mode === 'create' ? 'created' : 'updated'} successfully`);
      onClose();
    } catch (error) {
      toast.error(`Failed to ${mode === 'create' ? 'create' : 'update'} bus: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {mode === 'create' && 'Add New Bus'}
                  {mode === 'edit' && 'Edit Bus Details'}
                  {mode === 'view' && 'Bus Details'}
                  {mode === 'assign' && 'Assign Staff'}
                </h3>
                <p className="text-sm text-gray-600">
                  {mode === 'create' && 'Enter bus information to add to the fleet'}
                  {mode === 'edit' && 'Update bus information and specifications'}
                  {mode === 'view' && 'View comprehensive bus information'}
                  {mode === 'assign' && 'Assign driver and conductor to this bus'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Basic Information Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bus Number *
                        </label>
                        <input
                          type="text"
                          {...register('busNumber', { required: 'Bus number is required' })}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="e.g., KL-01-AB-1234"
                        />
                        {errors.busNumber && (
                          <p className="text-red-500 text-sm mt-1">{errors.busNumber.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Registration Number *
                        </label>
                        <input
                          type="text"
                          {...register('registrationNumber', { required: 'Registration number is required' })}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="e.g., KL-01-AB-1234"
                        />
                        {errors.registrationNumber && (
                          <p className="text-red-500 text-sm mt-1">{errors.registrationNumber.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Depot *
                        </label>
                        <select
                          {...register('depotId', { required: 'Depot is required' })}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">Select Depot</option>
                          <option value="depot1">Thiruvananthapuram</option>
                          <option value="depot2">Kochi</option>
                          <option value="depot3">Kozhikode</option>
                        </select>
                        {errors.depotId && (
                          <p className="text-red-500 text-sm mt-1">{errors.depotId.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bus Type *
                        </label>
                        <select
                          {...register('busType', { required: 'Bus type is required' })}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="ac_sleeper">AC Sleeper</option>
                          <option value="ac_seater">AC Seater</option>
                          <option value="non_ac_sleeper">Non-AC Sleeper</option>
                          <option value="non_ac_seater">Non-AC Seater</option>
                          <option value="volvo">Volvo</option>
                          <option value="mini">Mini Bus</option>
                        </select>
                        {errors.busType && (
                          <p className="text-red-500 text-sm mt-1">{errors.busType.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          {...register('status')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="active">Active</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="suspended">Suspended</option>
                          <option value="retired">Retired</option>
                        </select>
                      </div>
                    </div>

                    {/* Capacity Section */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Capacity Configuration</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Total</label>
                          <input
                            type="number"
                            {...register('capacity.total', { min: 1 })}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sleeper</label>
                          <input
                            type="number"
                            {...register('capacity.sleeper', { min: 0 })}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Seater</label>
                          <input
                            type="number"
                            {...register('capacity.seater', { min: 0 })}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ladies</label>
                          <input
                            type="number"
                            {...register('capacity.ladies', { min: 0 })}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Disabled</label>
                          <input
                            type="number"
                            {...register('capacity.disabled', { min: 0 })}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Amenities Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['wifi', 'charging', 'entertainment', 'refreshments', 'toilet', 'ac', 'heating'].map((amenity) => (
                          <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              {...register('amenities')}
                              value={amenity}
                              disabled={isReadOnly}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className="text-sm text-gray-700 capitalize">{amenity}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        {...register('notes')}
                        disabled={isReadOnly}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="Additional notes about this bus..."
                      />
                    </div>
                  </div>
                )}

                {/* Specifications Tab */}
                {activeTab === 'specifications' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                        <input
                          type="text"
                          {...register('specifications.manufacturer')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="e.g., Tata, Ashok Leyland"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                        <input
                          type="text"
                          {...register('specifications.model')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="e.g., Marcopolo, Starbus"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                        <input
                          type="number"
                          {...register('specifications.year', { min: 1990, max: new Date().getFullYear() + 1 })}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Engine</label>
                        <input
                          type="text"
                          {...register('specifications.engine')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="e.g., 4.2L Turbo Diesel"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                        <select
                          {...register('specifications.fuelType')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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
                          step="0.1"
                          {...register('specifications.mileage')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Speed (km/h)</label>
                        <input
                          type="number"
                          {...register('specifications.maxSpeed')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    {/* Dimensions */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Dimensions (meters)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                          <input
                            type="number"
                            step="0.1"
                            {...register('specifications.length')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                          <input
                            type="number"
                            step="0.1"
                            {...register('specifications.width')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                          <input
                            type="number"
                            step="0.1"
                            {...register('specifications.height')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Location Tab */}
                {activeTab === 'location' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          {...register('currentLocation.latitude')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="e.g., 8.5241"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          {...register('currentLocation.longitude')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="e.g., 76.9366"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Stop/Location</label>
                        <input
                          type="text"
                          {...register('currentLocation.stopName')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          placeholder="e.g., Thiruvananthapuram Central"
                        />
                      </div>
                    </div>

                    {/* Map Preview Placeholder */}
                    <div className="bg-gray-100 rounded-lg p-8 text-center">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Map preview will be displayed here</p>
                      <p className="text-sm text-gray-400">GPS coordinates will be shown on the map</p>
                    </div>
                  </div>
                )}

                {/* Maintenance Tab */}
                {activeTab === 'maintenance' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Service Date</label>
                        <input
                          type="date"
                          {...register('maintenance.lastService')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Next Service Date</label>
                        <input
                          type="date"
                          {...register('maintenance.nextService')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Distance (km)</label>
                        <input
                          type="number"
                          {...register('maintenance.totalDistance')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Engine Hours</label>
                        <input
                          type="number"
                          {...register('maintenance.engineHours')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    {/* Fuel Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Fuel Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Current Level (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            {...register('fuel.currentLevel')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Refuel Date</label>
                          <input
                            type="date"
                            {...register('fuel.lastRefuel')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Average Consumption (km/l)</label>
                          <input
                            type="number"
                            step="0.1"
                            {...register('fuel.averageConsumption')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tank Capacity (liters)</label>
                          <input
                            type="number"
                            {...register('fuel.tankCapacity')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    {/* Permit */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Permit</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Number</label>
                          <input
                            type="text"
                            {...register('documents.permit.number')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                          <input
                            type="date"
                            {...register('documents.permit.expiryDate')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            {...register('documents.permit.status')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          >
                            <option value="valid">Valid</option>
                            <option value="expired">Expired</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Insurance */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Insurance</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Number</label>
                          <input
                            type="text"
                            {...register('documents.insurance.number')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                          <input
                            type="date"
                            {...register('documents.insurance.expiryDate')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                          <input
                            type="text"
                            {...register('documents.insurance.company')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fitness Certificate */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Fitness Certificate</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Number</label>
                          <input
                            type="text"
                            {...register('documents.fitness.number')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                          <input
                            type="date"
                            {...register('documents.fitness.expiryDate')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            {...register('documents.fitness.status')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          >
                            <option value="valid">Valid</option>
                            <option value="expired">Expired</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* PUC Certificate */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">PUC Certificate</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Number</label>
                          <input
                            type="text"
                            {...register('documents.puc.number')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                          <input
                            type="date"
                            {...register('documents.puc.expiryDate')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            {...register('documents.puc.status')}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                          >
                            <option value="valid">Valid</option>
                            <option value="expired">Expired</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Staff Assignment Tab */}
                {activeTab === 'staff' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Driver</label>
                        <select
                          {...register('assignedDriver')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">Select Driver</option>
                          <option value="driver1">John Doe - License: KL-123456</option>
                          <option value="driver2">Jane Smith - License: KL-789012</option>
                          <option value="driver3">Mike Johnson - License: KL-345678</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Conductor</label>
                        <select
                          {...register('assignedConductor')}
                          disabled={isReadOnly}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="">Select Conductor</option>
                          <option value="conductor1">Alice Brown - ID: C001</option>
                          <option value="conductor2">Bob Wilson - ID: C002</option>
                          <option value="conductor3">Carol Davis - ID: C003</option>
                        </select>
                      </div>
                    </div>

                    {/* Staff Information Display */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Current Assignment</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">Driver Information</h5>
                          <p className="text-sm text-gray-600">No driver assigned</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">Conductor Information</h5>
                          <p className="text-sm text-gray-600">No conductor assigned</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </form>

        {/* Footer */}
        {mode !== 'view' && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {mode === 'create' && 'All fields marked with * are required'}
                {mode === 'edit' && 'Changes will be saved to the database'}
                {mode === 'assign' && 'Staff assignment will be updated immediately'}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>
                        {mode === 'create' && 'Create Bus'}
                        {mode === 'edit' && 'Update Bus'}
                        {mode === 'assign' && 'Assign Staff'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default BusCRUDModal;