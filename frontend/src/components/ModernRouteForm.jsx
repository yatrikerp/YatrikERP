import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  X, 
  Plus, 
  MapPin, 
  Clock, 
  DollarSign, 
  Bus, 
  Route,
  Navigation,
  Zap,
  Wifi,
  Snowflake,
  Coffee,
  Shield,
  Accessibility,
  Smartphone,
  Monitor,
  Check,
  AlertCircle,
  Search,
  Map,
  Calendar,
  Users,
  Star,
  ArrowRight,
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Info,
  HelpCircle,
  TrendingUp,
  Activity,
  Target,
  Layers,
  Compass
} from 'lucide-react';
import { z } from 'zod';
import { useCreateRoute, useUpdateRoute } from '../hooks/useRoutes';
import { useAuth } from '../context/AuthContext';

// Enhanced validation schema with modern features
const modernRouteSchema = z.object({
  // Basic Information
  routeNumber: z.string()
    .min(2, 'Route number must be at least 2 characters')
    .max(20, 'Route number must be less than 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Route number must contain only uppercase letters, numbers, and hyphens'),
  routeName: z.string()
    .min(3, 'Route name must be at least 3 characters')
    .max(100, 'Route name must be less than 100 characters'),
  
  // Location Information with enhanced validation
  startingPoint: z.object({
    city: z.string().min(1, 'Starting city is required'),
    location: z.string().min(1, 'Starting location is required'),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }).optional()
  }),
  endingPoint: z.object({
    city: z.string().min(1, 'Ending city is required'),
    location: z.string().min(1, 'Ending location is required'),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }).optional()
  }),
  
  // Route Details
  totalDistance: z.number()
    .min(1, 'Distance must be at least 1 km')
    .max(5000, 'Distance must be less than 5000 km'),
  estimatedDuration: z.number()
    .min(15, 'Duration must be at least 15 minutes')
    .max(1440, 'Duration must be less than 24 hours'),
  baseFare: z.number()
    .min(1, 'Base fare must be at least ₹1')
    .max(10000, 'Base fare must be less than ₹10,000'),
  
  // Enhanced Features
  busType: z.enum(['ac_sleeper', 'ac_seater', 'non_ac_sleeper', 'non_ac_seater', 'volvo', 'mini']),
  features: z.array(z.string()).default([]),
  amenities: z.array(z.object({
    name: z.string(),
    icon: z.string(),
    description: z.string().optional()
  })).default([]),
  
  // Intermediate Stops
  intermediateStops: z.array(z.object({
    city: z.string().min(1, 'City is required'),
    location: z.string().min(1, 'Location is required'),
    stopNumber: z.number().min(1),
    distanceFromStart: z.number().min(0),
    estimatedArrival: z.number().min(0),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number()
    }).optional(),
    fare: z.number().min(0).optional()
  })).default([]),
  
  // Scheduling
  schedules: z.array(z.object({
    departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    arrivalTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),
    daysOfWeek: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).default([]),
    isActive: z.boolean().default(true)
  })).default([]),
  
  // Pricing
  fareStructure: z.array(z.object({
    fromStop: z.string(),
    toStop: z.string(),
    fare: z.number().min(0)
  })).default([]),
  
  // Status and Metadata
  status: z.enum(['active', 'inactive', 'maintenance', 'suspended']).default('active'),
  priority: z.enum(['low', 'medium', 'high', 'premium']).default('medium'),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  
  // Advanced Features
  dynamicPricing: z.object({
    enabled: z.boolean().default(false),
    peakMultiplier: z.number().min(1).max(3).default(1.5),
    offPeakMultiplier: z.number().min(0.5).max(1).default(0.8)
  }).default({ enabled: false, peakMultiplier: 1.5, offPeakMultiplier: 0.8 }),
  
  accessibility: z.object({
    wheelchairAccessible: z.boolean().default(false),
    seniorFriendly: z.boolean().default(true),
    childFriendly: z.boolean().default(true)
  }).default({ wheelchairAccessible: false, seniorFriendly: true, childFriendly: true })
});

const ModernRouteForm = ({ isOpen, onClose, route = null, mode = 'create' }) => {
  const { user } = useAuth();
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form configuration
  const steps = [
    { id: 'basic', title: 'Basic Info', icon: Info },
    { id: 'route', title: 'Route Details', icon: Route },
    { id: 'stops', title: 'Stops & Schedule', icon: MapPin },
    { id: 'features', title: 'Features & Pricing', icon: Star },
    { id: 'advanced', title: 'Advanced', icon: Settings },
    { id: 'preview', title: 'Preview', icon: Eye }
  ];

  // Predefined amenities with icons and descriptions
  const availableAmenities = [
    { name: 'WiFi', icon: Wifi, description: 'Free WiFi internet access' },
    { name: 'AC', icon: Snowflake, description: 'Air conditioning system' },
    { name: 'USB Charging', icon: Smartphone, description: 'USB charging ports' },
    { name: 'Entertainment', icon: Monitor, description: 'Entertainment system' },
    { name: 'Refreshments', icon: Coffee, description: 'Food and beverage service' },
    { name: 'Toilet', icon: Shield, description: 'On-board restroom' },
    { name: 'Wheelchair Accessible', icon: Accessibility, description: 'Wheelchair accessibility' },
    { name: 'GPS Tracking', icon: Navigation, description: 'Real-time GPS tracking' }
  ];

  // City suggestions for auto-complete
  const citySuggestions = [
    'Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad',
    'Malappuram', 'Kannur', 'Kasaragod', 'Wayanad', 'Idukki', 'Pathanamthitta',
    'Alappuzha', 'Kottayam', 'Ernakulam'
  ];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, isDirty },
    reset,
    watch,
    setValue,
    getValues,
    trigger
  } = useForm({
    resolver: zodResolver(modernRouteSchema),
    mode: 'onChange',
    defaultValues: {
      routeNumber: '',
      routeName: '',
      startingPoint: { city: '', location: '' },
      endingPoint: { city: '', location: '' },
      totalDistance: 0,
      estimatedDuration: 0,
      baseFare: 0,
      busType: 'ac_seater',
      features: [],
      amenities: [],
      intermediateStops: [],
      schedules: [{
        departureTime: '08:00',
        arrivalTime: '12:00',
        frequency: 'daily',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        isActive: true
      }],
      fareStructure: [],
      status: 'active',
      priority: 'medium',
      tags: [],
      notes: '',
      dynamicPricing: { enabled: false, peakMultiplier: 1.5, offPeakMultiplier: 0.8 },
      accessibility: { wheelchairAccessible: false, seniorFriendly: true, childFriendly: true }
    }
  });

  const { fields: stopFields, append: appendStop, remove: removeStop } = useFieldArray({
    control,
    name: 'intermediateStops'
  });

  const { fields: scheduleFields, append: appendSchedule, remove: removeSchedule } = useFieldArray({
    control,
    name: 'schedules'
  });

  const { fields: amenityFields, append: appendAmenity, remove: removeAmenity } = useFieldArray({
    control,
    name: 'amenities'
  });

  // Watched values for real-time updates
  const watchedStartingPoint = watch('startingPoint');
  const watchedEndingPoint = watch('endingPoint');
  const watchedDistance = watch('totalDistance');
  const watchedAmenities = watch('amenities');

  // Auto-calculate duration based on distance
  useEffect(() => {
    if (watchedDistance > 0) {
      const estimatedMinutes = Math.round(watchedDistance * 2.5); // Average 40 km/h
      setValue('estimatedDuration', estimatedMinutes);
    }
  }, [watchedDistance, setValue]);

  // City search functionality
  const handleCitySearch = useCallback((query, field) => {
    if (query.length > 1) {
      const filtered = citySuggestions.filter(city =>
        city.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, []);

  // Form submission
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const routeData = {
        ...data,
        createdBy: user._id,
        depotId: user.depotId
      };

      if (mode === 'create') {
        await createRoute.mutateAsync(routeData);
        toast.success('Route created successfully! 🎉');
      } else {
        await updateRoute.mutateAsync({ id: route._id, data: routeData });
        toast.success('Route updated successfully! ✅');
      }
      
      onClose();
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save route. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step navigation
  const nextStep = async () => {
    const fieldsToValidate = getStepFields(currentStep);
    const isValidStep = await trigger(fieldsToValidate);
    
    if (isValidStep && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepFields = (step) => {
    const fieldMap = {
      0: ['routeNumber', 'routeName', 'startingPoint', 'endingPoint'],
      1: ['totalDistance', 'estimatedDuration', 'baseFare', 'busType'],
      2: ['intermediateStops', 'schedules'],
      3: ['amenities', 'features', 'fareStructure'],
      4: ['dynamicPricing', 'accessibility', 'priority', 'tags'],
      5: [] // Preview step
    };
    return fieldMap[step] || [];
  };

  // Add new stop
  const addStop = () => {
    const stopCount = stopFields.length + 2; // +2 for start and end points
    appendStop({
      city: '',
      location: '',
      stopNumber: stopCount,
      distanceFromStart: 0,
      estimatedArrival: 0,
      fare: 0
    });
  };

  // Add new schedule
  const addSchedule = () => {
    appendSchedule({
      departureTime: '08:00',
      arrivalTime: '12:00',
      frequency: 'daily',
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      isActive: true
    });
  };

  // Add amenity
  const addAmenity = (amenity) => {
    appendAmenity({
      name: amenity.name,
      icon: amenity.name,
      description: amenity.description
    });
  };

  // Calculate estimated fare
  const calculateEstimatedFare = (distance) => {
    const baseRate = 2.5; // ₹2.5 per km
    return Math.round(distance * baseRate);
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="step-content"
          >
            <div className="step-header">
              <h3>Basic Route Information</h3>
              <p>Enter the fundamental details about your route</p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <Route size={16} />
                  Route Number *
                </label>
                <input
                  {...register('routeNumber')}
                  type="text"
                  placeholder="e.g., KL-001, RT-EXPRESS"
                  className={`form-input ${errors.routeNumber ? 'error' : ''}`}
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.routeNumber && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    {errors.routeNumber.message}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Navigation size={16} />
                  Route Name *
                </label>
                <input
                  {...register('routeName')}
                  type="text"
                  placeholder="e.g., Kochi to Thiruvananthapuram Express"
                  className={`form-input ${errors.routeName ? 'error' : ''}`}
                />
                {errors.routeName && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    {errors.routeName.message}
                  </div>
                )}
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  <MapPin size={16} />
                  Starting Point *
                </label>
                <div className="location-input-group">
                  <input
                    {...register('startingPoint.city')}
                    type="text"
                    placeholder="Starting City"
                    className={`form-input ${errors.startingPoint?.city ? 'error' : ''}`}
                    onChange={(e) => handleCitySearch(e.target.value, 'start')}
                  />
                  <input
                    {...register('startingPoint.location')}
                    type="text"
                    placeholder="Specific Location (e.g., Central Bus Station)"
                    className={`form-input ${errors.startingPoint?.location ? 'error' : ''}`}
                  />
                </div>
                {errors.startingPoint && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    {errors.startingPoint.city?.message || errors.startingPoint.location?.message}
                  </div>
                )}
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  <MapPin size={16} />
                  Ending Point *
                </label>
                <div className="location-input-group">
                  <input
                    {...register('endingPoint.city')}
                    type="text"
                    placeholder="Ending City"
                    className={`form-input ${errors.endingPoint?.city ? 'error' : ''}`}
                    onChange={(e) => handleCitySearch(e.target.value, 'end')}
                  />
                  <input
                    {...register('endingPoint.location')}
                    type="text"
                    placeholder="Specific Location (e.g., Central Bus Station)"
                    className={`form-input ${errors.endingPoint?.location ? 'error' : ''}`}
                  />
                </div>
                {errors.endingPoint && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    {errors.endingPoint.city?.message || errors.endingPoint.location?.message}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="step-content"
          >
            <div className="step-header">
              <h3>Route Details</h3>
              <p>Specify distance, duration, and pricing information</p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <Route size={16} />
                  Distance (km) *
                </label>
                <input
                  {...register('totalDistance', { valueAsNumber: true })}
                  type="number"
                  placeholder="220"
                  className={`form-input ${errors.totalDistance ? 'error' : ''}`}
                  min="1"
                  max="5000"
                />
                {errors.totalDistance && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    {errors.totalDistance.message}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Clock size={16} />
                  Duration (minutes) *
                </label>
                <input
                  {...register('estimatedDuration', { valueAsNumber: true })}
                  type="number"
                  placeholder="240"
                  className={`form-input ${errors.estimatedDuration ? 'error' : ''}`}
                  min="15"
                  max="1440"
                />
                {errors.estimatedDuration && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    {errors.estimatedDuration.message}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <DollarSign size={16} />
                  Base Fare (₹) *
                </label>
                <div className="input-with-suggestion">
                  <input
                    {...register('baseFare', { valueAsNumber: true })}
                    type="number"
                    placeholder="350"
                    className={`form-input ${errors.baseFare ? 'error' : ''}`}
                    min="1"
                    max="10000"
                  />
                  {watchedDistance > 0 && (
                    <button
                      type="button"
                      className="suggestion-btn"
                      onClick={() => setValue('baseFare', calculateEstimatedFare(watchedDistance))}
                    >
                      <Target size={14} />
                      Estimate: ₹{calculateEstimatedFare(watchedDistance)}
                    </button>
                  )}
                </div>
                {errors.baseFare && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    {errors.baseFare.message}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Bus size={16} />
                  Bus Type *
                </label>
                <select
                  {...register('busType')}
                  className={`form-select ${errors.busType ? 'error' : ''}`}
                >
                  <option value="ac_sleeper">AC Sleeper</option>
                  <option value="ac_seater">AC Seater</option>
                  <option value="non_ac_sleeper">Non-AC Sleeper</option>
                  <option value="non_ac_seater">Non-AC Seater</option>
                  <option value="volvo">Volvo (Premium)</option>
                  <option value="mini">Mini Bus</option>
                </select>
                {errors.busType && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    {errors.busType.message}
                  </div>
                )}
              </div>
            </div>

            {/* Route Preview Card */}
            {watchedStartingPoint?.city && watchedEndingPoint?.city && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="route-preview-card"
              >
                <div className="preview-header">
                  <h4>Route Preview</h4>
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="map-toggle-btn"
                  >
                    <Map size={16} />
                    {showMap ? 'Hide' : 'Show'} Map
                  </button>
                </div>
                <div className="preview-content">
                  <div className="route-path">
                    <div className="route-point start">
                      <MapPin size={14} />
                      <span>{watchedStartingPoint.city}</span>
                    </div>
                    <div className="route-line">
                      <div className="route-distance">
                        {watchedDistance > 0 ? `${watchedDistance} km` : 'Distance'}
                      </div>
                    </div>
                    <div className="route-point end">
                      <MapPin size={14} />
                      <span>{watchedEndingPoint.city}</span>
                    </div>
                  </div>
                  {showMap && (
                    <div className="map-placeholder">
                      <Map size={32} />
                      <p>Interactive map will be integrated here</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="step-content"
          >
            <div className="step-header">
              <h3>Stops & Schedule</h3>
              <p>Add intermediate stops and define schedules</p>
            </div>

            {/* Intermediate Stops */}
            <div className="section">
              <div className="section-header">
                <h4>
                  <MapPin size={16} />
                  Intermediate Stops
                </h4>
                <button
                  type="button"
                  onClick={addStop}
                  className="add-btn"
                >
                  <Plus size={16} />
                  Add Stop
                </button>
              </div>

              <div className="stops-list">
                <AnimatePresence>
                  {stopFields.map((field, index) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="stop-item"
                    >
                      <div className="stop-header">
                        <span className="stop-number">Stop {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeStop(index)}
                          className="remove-btn"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="stop-fields">
                        <input
                          {...register(`intermediateStops.${index}.city`)}
                          type="text"
                          placeholder="City"
                          className="form-input"
                        />
                        <input
                          {...register(`intermediateStops.${index}.location`)}
                          type="text"
                          placeholder="Location"
                          className="form-input"
                        />
                        <input
                          {...register(`intermediateStops.${index}.distanceFromStart`, { valueAsNumber: true })}
                          type="number"
                          placeholder="Distance (km)"
                          className="form-input"
                        />
                        <input
                          {...register(`intermediateStops.${index}.fare`, { valueAsNumber: true })}
                          type="number"
                          placeholder="Fare (₹)"
                          className="form-input"
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Schedules */}
            <div className="section">
              <div className="section-header">
                <h4>
                  <Calendar size={16} />
                  Schedules
                </h4>
                <button
                  type="button"
                  onClick={addSchedule}
                  className="add-btn"
                >
                  <Plus size={16} />
                  Add Schedule
                </button>
              </div>

              <div className="schedules-list">
                <AnimatePresence>
                  {scheduleFields.map((field, index) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="schedule-item"
                    >
                      <div className="schedule-header">
                        <span className="schedule-title">Schedule {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeSchedule(index)}
                          className="remove-btn"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="schedule-fields">
                        <input
                          {...register(`schedules.${index}.departureTime`)}
                          type="time"
                          className="form-input"
                        />
                        <input
                          {...register(`schedules.${index}.arrivalTime`)}
                          type="time"
                          className="form-input"
                        />
                        <select
                          {...register(`schedules.${index}.frequency`)}
                          className="form-select"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="step-content"
          >
            <div className="step-header">
              <h3>Features & Amenities</h3>
              <p>Configure bus features and passenger amenities</p>
            </div>

            {/* Available Amenities */}
            <div className="section">
              <div className="section-header">
                <h4>
                  <Star size={16} />
                  Available Amenities
                </h4>
              </div>
              <div className="amenities-grid">
                {availableAmenities.map((amenity) => {
                  const isSelected = watchedAmenities.some(a => a.name === amenity.name);
                  return (
                    <motion.button
                      key={amenity.name}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          const index = watchedAmenities.findIndex(a => a.name === amenity.name);
                          removeAmenity(index);
                        } else {
                          addAmenity(amenity);
                        }
                      }}
                      className={`amenity-card ${isSelected ? 'selected' : ''}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="amenity-icon">
                        <amenity.icon size={20} />
                      </div>
                      <div className="amenity-content">
                        <h5>{amenity.name}</h5>
                        <p>{amenity.description}</p>
                      </div>
                      {isSelected && (
                        <div className="amenity-check">
                          <Check size={16} />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Route Features */}
            <div className="section">
              <div className="section-header">
                <h4>
                  <Zap size={16} />
                  Route Features
                </h4>
              </div>
              <div className="features-list">
                <div className="feature-item">
                  <input
                    {...register('dynamicPricing.enabled')}
                    type="checkbox"
                    id="dynamicPricing"
                    className="feature-checkbox"
                  />
                  <label htmlFor="dynamicPricing" className="feature-label">
                    <TrendingUp size={16} />
                    <div>
                      <h5>Dynamic Pricing</h5>
                      <p>Automatically adjust fares based on demand and time</p>
                    </div>
                  </label>
                </div>

                <div className="feature-item">
                  <input
                    {...register('accessibility.wheelchairAccessible')}
                    type="checkbox"
                    id="wheelchairAccessible"
                    className="feature-checkbox"
                  />
                  <label htmlFor="wheelchairAccessible" className="feature-label">
                    <Accessibility size={16} />
                    <div>
                      <h5>Wheelchair Accessible</h5>
                      <p>Bus is equipped with wheelchair accessibility</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="step-content"
          >
            <div className="step-header">
              <h3>Advanced Settings</h3>
              <p>Configure advanced route settings and preferences</p>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <Target size={16} />
                  Priority Level
                </label>
                <select {...register('priority')} className="form-select">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Activity size={16} />
                  Route Status
                </label>
                <select {...register('status')} className="form-select">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  <Layers size={16} />
                  Tags
                </label>
                <input
                  {...register('tags')}
                  type="text"
                  placeholder="Enter tags separated by commas (e.g., express, premium, tourist)"
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  <HelpCircle size={16} />
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  placeholder="Additional notes about this route..."
                  className="form-textarea"
                  rows="3"
                />
              </div>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="step-content"
          >
            <div className="step-header">
              <h3>Route Preview</h3>
              <p>Review all information before creating the route</p>
            </div>

            <div className="preview-container">
              {/* Route Summary Card */}
              <div className="preview-card">
                <div className="preview-card-header">
                  <h4>{getValues('routeName')}</h4>
                  <span className="route-number">{getValues('routeNumber')}</span>
                </div>
                <div className="preview-card-content">
                  <div className="route-summary">
                    <div className="route-points">
                      <div className="point start">
                        <MapPin size={16} />
                        <span>{getValues('startingPoint.city')}</span>
                      </div>
                      <div className="route-line">
                        <span className="distance">{getValues('totalDistance')} km</span>
                      </div>
                      <div className="point end">
                        <MapPin size={16} />
                        <span>{getValues('endingPoint.city')}</span>
                      </div>
                    </div>
                    <div className="route-details">
                      <div className="detail">
                        <Clock size={14} />
                        <span>{getValues('estimatedDuration')} minutes</span>
                      </div>
                      <div className="detail">
                        <DollarSign size={14} />
                        <span>₹{getValues('baseFare')}</span>
                      </div>
                      <div className="detail">
                        <Bus size={14} />
                        <span>{getValues('busType').replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities Preview */}
              {watchedAmenities.length > 0 && (
                <div className="preview-card">
                  <div className="preview-card-header">
                    <h4>Amenities</h4>
                  </div>
                  <div className="amenities-preview">
                    {watchedAmenities.map((amenity, index) => (
                      <div key={index} className="amenity-preview">
                        <Check size={14} />
                        <span>{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modern-route-form-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="modern-route-form"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="form-header">
          <div className="header-content">
            <div className="header-title">
              <h2>{mode === 'create' ? 'Create New Route' : 'Edit Route'}</h2>
              <p>Configure your bus route with advanced features</p>
            </div>
            <button onClick={onClose} className="close-btn">
              <X size={24} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="steps-container">
            <div className="steps-track">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <motion.div
                    key={step.id}
                    className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    onClick={() => setCurrentStep(index)}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="step-icon">
                      {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                    </div>
                    <span className="step-title">{step.title}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="form-content">
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent()}
          </form>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <div className="footer-actions">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="nav-btn prev"
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            <div className="footer-center">
              <span className="step-indicator">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>

            {currentStep === steps.length - 1 ? (
              <button
                type="submit"
                onClick={handleSubmit(onSubmit)}
                disabled={!isValid || isLoading}
                className="submit-btn"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {mode === 'create' ? 'Create Route' : 'Update Route'}
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="nav-btn next"
              >
                Next
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModernRouteForm;
