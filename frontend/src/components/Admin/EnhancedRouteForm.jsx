import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, MapPin, DollarSign, Calculator, Eye, 
  Save, RefreshCw, AlertTriangle, CheckCircle,
  Route, Clock, Navigation, Trash2, Edit
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const EnhancedRouteForm = ({ 
  route = null, 
  onSave, 
  onCancel, 
  depots = [], 
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    routeNumber: '',
    routeName: '',
    startingPoint: {
      city: '',
      location: '',
      coordinates: { latitude: 0, longitude: 0 }
    },
    endingPoint: {
      city: '',
      location: '',
      coordinates: { latitude: 0, longitude: 0 }
    },
    totalDistance: 0,
    estimatedDuration: 0,
    stops: [],
    depot: {
      depotId: '',
      depotName: ''
    },
    baseFare: 0,
    farePerKm: 0,
    status: 'active',
    features: [],
    notes: ''
  });

  const [fareMatrix, setFareMatrix] = useState({});
  const [showFareMatrix, setShowFareMatrix] = useState(false);
  const [calculatingFare, setCalculatingFare] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route) {
      setFormData({
        routeNumber: route.routeNumber || '',
        routeName: route.routeName || '',
        startingPoint: route.startingPoint || { city: '', location: '', coordinates: { latitude: 0, longitude: 0 } },
        endingPoint: route.endingPoint || { city: '', location: '', coordinates: { latitude: 0, longitude: 0 } },
        totalDistance: route.totalDistance || 0,
        estimatedDuration: route.estimatedDuration || 0,
        stops: route.stops || [],
        depot: route.depot || { depotId: '', depotName: '' },
        baseFare: route.baseFare || 0,
        farePerKm: route.farePerKm || 0,
        status: route.status || 'active',
        features: route.features || [],
        notes: route.notes || ''
      });

      // Load existing fare matrix if available
      if (route.fareMatrix) {
        setFareMatrix(route.fareMatrix);
      }
    }
  }, [route]);

  const addStop = () => {
    const newStop = {
      stopName: '',
      city: '',
      location: '',
      stopNumber: formData.stops.length + 1,
      distanceFromPrev: 0,
      distanceFromStart: 0,
      estimatedArrival: 0,
      coordinates: { latitude: 0, longitude: 0 },
      isActive: true
    };

    setFormData(prev => ({
      ...prev,
      stops: [...prev.stops, newStop]
    }));
  };

  const updateStop = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      stops: prev.stops.map((stop, i) => {
        if (i === index) {
          const updatedStop = { ...stop, [field]: value };
          
          // Auto-calculate distance from start
          if (field === 'distanceFromPrev') {
            const prevStopDistance = index > 0 ? prev.stops[index - 1].distanceFromStart : 0;
            updatedStop.distanceFromStart = prevStopDistance + parseFloat(value || 0);
          }
          
          return updatedStop;
        }
        return stop;
      })
    }));
  };

  const removeStop = (index) => {
    setFormData(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index).map((stop, i) => ({
        ...stop,
        stopNumber: i + 1
      }))
    }));
  };

  const calculateFareMatrix = async () => {
    if (!formData.farePerKm || formData.farePerKm <= 0) {
      toast.error('Please set fare per km before calculating fare matrix');
      return;
    }

    if (formData.stops.length === 0) {
      toast.error('Please add at least one stop before calculating fare matrix');
      return;
    }

    setCalculatingFare(true);
    try {
      const response = await apiFetch(`/api/admin/routes/${route?._id}/fare-matrix`, {
        method: 'POST',
        body: JSON.stringify({
          farePerKm: formData.farePerKm
        })
      });

      if (response.success) {
        setFareMatrix(response.data.fareMatrix);
        toast.success('Fare matrix calculated successfully');
        setShowFareMatrix(true);
      } else {
        toast.error(response.message || 'Failed to calculate fare matrix');
      }
    } catch (error) {
      console.error('Error calculating fare matrix:', error);
      toast.error('Failed to calculate fare matrix');
    } finally {
      setCalculatingFare(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // First save the route
      const routeData = {
        ...formData,
        intermediateStops: formData.stops.map(stop => ({
          city: stop.city,
          location: stop.location,
          stopNumber: stop.stopNumber,
          distanceFromStart: stop.distanceFromStart,
          estimatedArrival: stop.estimatedArrival,
          coordinates: stop.coordinates
        }))
      };

      await onSave(routeData);

      // If fare per km is set, calculate fare matrix
      if (formData.farePerKm > 0 && formData.stops.length > 0) {
        await calculateFareMatrix();
      }

      toast.success(isEdit ? 'Route updated successfully' : 'Route created successfully');
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error('Failed to save route');
    } finally {
      setLoading(false);
    }
  };

  const FareMatrixPreview = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          Fare Matrix Preview
        </h3>
        <button
          onClick={() => setShowFareMatrix(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {Object.keys(fareMatrix).length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-medium text-gray-700">From</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-700">To</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-700">Distance (km)</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-700">Fare (₹)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(fareMatrix).map(([fromStop, toStops]) =>
                Object.entries(toStops).map(([toStop, fareData]) => (
                  <tr key={`${fromStop}-${toStop}`} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-900">{fromStop}</td>
                    <td className="py-2 pr-4 text-gray-900">{toStop}</td>
                    <td className="py-2 pr-4 text-gray-600">{fareData.distance}</td>
                    <td className="py-2 pr-4 font-medium text-green-600">₹{fareData.fare}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No fare matrix calculated yet</p>
          <p className="text-sm text-gray-400">Click "Calculate Fare Matrix" to generate pricing</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Basic Route Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Route Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Route Number *</label>
            <input
              type="text"
              value={formData.routeNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, routeNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="R001"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Route Name *</label>
            <input
              type="text"
              value={formData.routeName}
              onChange={(e) => setFormData(prev => ({ ...prev, routeName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mumbai to Pune"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Starting Point *</label>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.startingPoint.city}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  startingPoint: { ...prev.startingPoint, city: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City"
              />
              <input
                type="text"
                value={formData.startingPoint.location}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  startingPoint: { ...prev.startingPoint, location: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Specific Location"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ending Point *</label>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.endingPoint.city}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  endingPoint: { ...prev.endingPoint, city: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City"
              />
              <input
                type="text"
                value={formData.endingPoint.location}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  endingPoint: { ...prev.endingPoint, location: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Specific Location"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Distance (km) *</label>
            <input
              type="number"
              value={formData.totalDistance}
              onChange={(e) => setFormData(prev => ({ ...prev, totalDistance: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="150"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Duration (minutes) *</label>
            <input
              type="number"
              value={formData.estimatedDuration}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="180"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Depot *</label>
            <select
              value={formData.depot.depotId}
              onChange={(e) => {
                const selectedDepot = depots.find(d => d._id === e.target.value);
                setFormData(prev => ({ 
                  ...prev, 
                  depot: { 
                    depotId: e.target.value, 
                    depotName: selectedDepot?.depotName || selectedDepot?.name || ''
                  }
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Depot</option>
              {depots.map(depot => (
                <option key={depot._id} value={depot._id}>
                  {depot.depotName || depot.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fare Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          Fare Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base Fare (₹)</label>
            <input
              type="number"
              value={formData.baseFare}
              onChange={(e) => setFormData(prev => ({ ...prev, baseFare: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fare per KM (₹) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.farePerKm}
              onChange={(e) => setFormData(prev => ({ ...prev, farePerKm: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="2.50"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={calculateFareMatrix}
            disabled={calculatingFare || !formData.farePerKm || formData.stops.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {calculatingFare ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            <span>{calculatingFare ? 'Calculating...' : 'Calculate Fare Matrix'}</span>
          </button>
        </div>
      </div>

      {/* Stops Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
            Route Stops
          </h3>
          <button
            onClick={addStop}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stop</span>
          </button>
        </div>

        {formData.stops.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No stops added yet</p>
            <p className="text-sm text-gray-400">Click "Add Stop" to add intermediate stops</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.stops.map((stop, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Stop {stop.stopNumber}</h4>
                  <button
                    onClick={() => removeStop(index)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stop Name *</label>
                    <input
                      type="text"
                      value={stop.stopName}
                      onChange={(e) => updateStop(index, 'stopName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Stop Name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={stop.city}
                      onChange={(e) => updateStop(index, 'city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                    <input
                      type="text"
                      value={stop.location}
                      onChange={(e) => updateStop(index, 'location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Specific Location"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distance from Previous (km) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={stop.distanceFromPrev}
                      onChange={(e) => updateStop(index, 'distanceFromPrev', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="25.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Distance from Start (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={stop.distanceFromStart}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Arrival (minutes)</label>
                    <input
                      type="number"
                      value={stop.estimatedArrival}
                      onChange={(e) => updateStop(index, 'estimatedArrival', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fare Matrix Preview */}
      <AnimatePresence>
        {showFareMatrix && <FareMatrixPreview />}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !formData.routeNumber || !formData.routeName}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{loading ? 'Saving...' : (isEdit ? 'Update Route' : 'Create Route')}</span>
        </button>
      </div>
    </div>
  );
};

export default EnhancedRouteForm;
































