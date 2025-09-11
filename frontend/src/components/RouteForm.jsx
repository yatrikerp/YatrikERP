import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { X, Plus, MapPin, Clock, DollarSign, Bus } from 'lucide-react';
import { routeSchema } from '../schemas/routeSchema';
import { useCreateRoute, useUpdateRoute } from '../hooks/useRoutes';

const RouteForm = ({ isOpen, onClose, route = null, mode = 'create' }) => {
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      routeNumber: '',
      routeName: '',
      startingPoint: '',
      endingPoint: '',
      distance: 0,
      duration: 0,
      baseFare: 0,
      type: 'ordinary',
      status: 'active',
      features: [],
      stops: [],
      schedule: {
        startTime: '06:00',
        endTime: '18:00',
        frequency: 30,
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
    },
  });

  const watchedFeatures = watch('features') || [];
  const watchedStops = watch('stops') || [];

  useEffect(() => {
    if (route && mode === 'edit') {
      reset({
        ...route,
        schedule: route.schedule || {
          startTime: '06:00',
          endTime: '18:00',
          frequency: 30,
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
      });
    }
  }, [route, mode, reset]);

  const onSubmit = async (data) => {
    try {
      if (mode === 'create') {
        await createRoute.mutateAsync(data);
      } else {
        await updateRoute.mutateAsync({ id: route._id, data });
      }
      onClose();
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const addFeature = () => {
    const newFeature = prompt('Enter feature name:');
    if (newFeature) {
      setValue('features', [...watchedFeatures, newFeature]);
    }
  };

  const removeFeature = (index) => {
    setValue('features', watchedFeatures.filter((_, i) => i !== index));
  };

  const addStop = () => {
    setValue('stops', [
      ...watchedStops,
      { name: '', distance: 0, fare: 0 }
    ]);
  };

  const removeStop = (index) => {
    setValue('stops', watchedStops.filter((_, i) => i !== index));
  };

  const updateStop = (index, field, value) => {
    const updatedStops = [...watchedStops];
    updatedStops[index] = { ...updatedStops[index], [field]: value };
    setValue('stops', updatedStops);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="modal-content route-form-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{mode === 'create' ? 'Add New Route' : 'Edit Route'}</h2>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="route-form">
          <div className="form-grid">
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Route Number *</label>
                  <input
                    {...register('routeNumber')}
                    type="text"
                    placeholder="e.g., RT001"
                    className={errors.routeNumber ? 'error' : ''}
                  />
                  {errors.routeNumber && (
                    <span className="error-message">{errors.routeNumber.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Route Name *</label>
                  <input
                    {...register('routeName')}
                    type="text"
                    placeholder="e.g., Kochi to Kollam"
                    className={errors.routeName ? 'error' : ''}
                  />
                  {errors.routeName && (
                    <span className="error-message">{errors.routeName.message}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Starting Point *</label>
                  <div className="input-with-icon">
                    <MapPin size={18} />
                    <input
                      {...register('startingPoint')}
                      type="text"
                      placeholder="e.g., Kochi"
                      className={errors.startingPoint ? 'error' : ''}
                    />
                  </div>
                  {errors.startingPoint && (
                    <span className="error-message">{errors.startingPoint.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Ending Point *</label>
                  <div className="input-with-icon">
                    <MapPin size={18} />
                    <input
                      {...register('endingPoint')}
                      type="text"
                      placeholder="e.g., Kollam"
                      className={errors.endingPoint ? 'error' : ''}
                    />
                  </div>
                  {errors.endingPoint && (
                    <span className="error-message">{errors.endingPoint.message}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Route Details */}
            <div className="form-section">
              <h3>Route Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Distance (km) *</label>
                  <div className="input-with-icon">
                    <Bus size={18} />
                    <input
                      {...register('distance', { valueAsNumber: true })}
                      type="number"
                      placeholder="157"
                      className={errors.distance ? 'error' : ''}
                    />
                  </div>
                  {errors.distance && (
                    <span className="error-message">{errors.distance.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <div className="input-with-icon">
                    <Clock size={18} />
                    <input
                      {...register('duration', { valueAsNumber: true })}
                      type="number"
                      placeholder="150"
                      className={errors.duration ? 'error' : ''}
                    />
                  </div>
                  {errors.duration && (
                    <span className="error-message">{errors.duration.message}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Base Fare (₹) *</label>
                  <div className="input-with-icon">
                    <DollarSign size={18} />
                    <input
                      {...register('baseFare', { valueAsNumber: true })}
                      type="number"
                      placeholder="200"
                      className={errors.baseFare ? 'error' : ''}
                    />
                  </div>
                  {errors.baseFare && (
                    <span className="error-message">{errors.baseFare.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Route Type *</label>
                  <select
                    {...register('type')}
                    className={errors.type ? 'error' : ''}
                  >
                    <option value="ordinary">Ordinary</option>
                    <option value="semi-deluxe">Semi-Deluxe</option>
                    <option value="deluxe">Deluxe</option>
                  </select>
                  {errors.type && (
                    <span className="error-message">{errors.type.message}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    {...register('status')}
                    className={errors.status ? 'error' : ''}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                  {errors.status && (
                    <span className="error-message">{errors.status.message}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="form-section">
              <h3>Features</h3>
              <div className="features-container">
                {watchedFeatures.map((feature, index) => (
                  <div key={index} className="feature-tag">
                    <span>{feature}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="remove-feature-btn"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="add-feature-btn"
                >
                  <Plus size={16} />
                  Add Feature
                </button>
              </div>
            </div>

            {/* Stops */}
            <div className="form-section">
              <h3>Route Stops</h3>
              {watchedStops.map((stop, index) => (
                <div key={index} className="stop-item">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Stop Name</label>
                      <input
                        type="text"
                        value={stop.name}
                        onChange={(e) => updateStop(index, 'name', e.target.value)}
                        placeholder="Stop name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Distance (km)</label>
                      <input
                        type="number"
                        value={stop.distance}
                        onChange={(e) => updateStop(index, 'distance', Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Fare (₹)</label>
                      <input
                        type="number"
                        value={stop.fare}
                        onChange={(e) => updateStop(index, 'fare', Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStop(index)}
                      className="remove-stop-btn"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addStop}
                className="add-stop-btn"
              >
                <Plus size={16} />
                Add Stop
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="submit-btn"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Route' : 'Update Route'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default RouteForm;
