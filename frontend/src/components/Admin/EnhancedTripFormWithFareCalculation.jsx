import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Bus, Users, Calendar, Clock, MapPin, 
  Save, RefreshCw, AlertTriangle, CheckCircle,
  Route, DollarSign, Eye, Settings, Zap, Calculator
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';
import FareCalculationService from '../../services/fareCalculationService';

const EnhancedTripFormWithFareCalculation = ({ 
  trip = null, 
  onSave, 
  onCancel, 
  routes = [], 
  buses = [], 
  drivers = [], 
  conductors = [],
  isEdit = false 
}) => {
  const [formData, setFormData] = useState({
    routeId: '',
    busId: '',
    busType: '',
    driverId: '',
    conductorId: '',
    serviceDate: '',
    startTime: '',
    endTime: '',
    fare: 0,
    capacity: 0,
    depotId: '',
    status: 'scheduled',
    notes: ''
  });

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedBusType, setSelectedBusType] = useState(null);
  const [seatLayout, setSeatLayout] = useState(null);
  const [fareMap, setFareMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatingSeatLayout, setGeneratingSeatLayout] = useState(false);
  const [calculatingFare, setCalculatingFare] = useState(false);
  const [fareCalculation, setFareCalculation] = useState(null);
  const [busTypeOptions, setBusTypeOptions] = useState([]);

  useEffect(() => {
    // Load bus type options
    const options = FareCalculationService.getBusTypeOptions();
    setBusTypeOptions(options);

    if (trip) {
      setFormData({
        routeId: trip.routeId || '',
        busId: trip.busId || '',
        busType: trip.busType || '',
        driverId: trip.driverId || '',
        conductorId: trip.conductorId || '',
        serviceDate: trip.serviceDate ? new Date(trip.serviceDate).toISOString().split('T')[0] : '',
        startTime: trip.startTime || '',
        endTime: trip.endTime || '',
        fare: trip.fare || 0,
        capacity: trip.capacity || 0,
        depotId: trip.depotId || '',
        status: trip.status || 'scheduled',
        notes: trip.notes || ''
      });

      if (trip.seatLayout) {
        setSeatLayout(trip.seatLayout);
      }

      // Load existing fare map if available
      if (trip.stopFareMap) {
        setFareMap(trip.stopFareMap);
      }
    }
  }, [trip]);

  // Handle route selection
  const handleRouteChange = (routeId) => {
    const route = routes.find(r => r._id === routeId);
    setSelectedRoute(route);
    setFormData(prev => ({ ...prev, routeId }));
    
    if (route) {
      setFormData(prev => ({ 
        ...prev, 
        depotId: route.depotId || '',
        capacity: route.capacity || 0
      }));
    }
  };

  // Handle bus selection
  const handleBusChange = (busId) => {
    const bus = buses.find(b => b._id === busId);
    setSelectedBus(bus);
    setFormData(prev => ({ ...prev, busId }));
    
    if (bus) {
      setFormData(prev => ({ 
        ...prev, 
        busType: bus.busType,
        capacity: bus.capacity?.total || bus.capacity || 0,
        depotId: bus.depotId || ''
      }));
      
      // Set the selected bus type for fare calculation
      const busTypeOption = busTypeOptions.find(option => option.value === bus.busType);
      setSelectedBusType(busTypeOption);
    }
  };

  // Handle bus type selection (independent of bus selection)
  const handleBusTypeChange = (busType) => {
    const busTypeOption = busTypeOptions.find(option => option.value === busType);
    setSelectedBusType(busTypeOption);
    setFormData(prev => ({ ...prev, busType }));
  };

  // Calculate fare automatically
  const calculateFare = async () => {
    if (!selectedRoute || !selectedBusType) {
      toast.error('Please select both route and bus type to calculate fare');
      return;
    }

    setCalculatingFare(true);
    try {
      const distance = selectedRoute.distance || selectedRoute.totalDistance || 0;
      const fareData = await FareCalculationService.calculateFare(
        distance, 
        selectedBusType.value
      );

      setFareCalculation(fareData);
      setFormData(prev => ({ 
        ...prev, 
        fare: fareData.totalFare 
      }));

      toast.success(`Fare calculated: ₹${fareData.totalFare} for ${distance}km`);
    } catch (error) {
      console.error('Error calculating fare:', error);
      toast.error('Failed to calculate fare');
    } finally {
      setCalculatingFare(false);
    }
  };

  // Generate seat layout
  const generateSeatLayout = async () => {
    if (!selectedBus) {
      toast.error('Please select a bus first');
      return;
    }

    setGeneratingSeatLayout(true);
    try {
      const response = await apiFetch('/api/admin/trips/generate-seat-layout', {
        method: 'POST',
        body: JSON.stringify({
          busCapacity: selectedBus.capacity?.total || selectedBus.capacity,
          busType: selectedBus.busType
        })
      });

      if (response.success) {
        setSeatLayout(response.data.seatLayout);
        toast.success('Seat layout generated successfully');
      } else {
        toast.error(response.message || 'Failed to generate seat layout');
      }
    } catch (error) {
      console.error('Error generating seat layout:', error);
      toast.error('Failed to generate seat layout');
    } finally {
      setGeneratingSeatLayout(false);
    }
  };

  // Populate fare map
  const populateFareMap = async () => {
    if (!selectedRoute) {
      toast.error('Please select a route first');
      return;
    }

    try {
      const response = await apiFetch(`/api/admin/trips/${trip?._id}/populate-fare-map`, {
        method: 'POST'
      });

      if (response.success) {
        setFareMap(response.data.stopFareMap);
        toast.success('Fare map populated successfully');
      } else {
        toast.error(response.message || 'Failed to populate fare map');
      }
    } catch (error) {
      console.error('Error populating fare map:', error);
      toast.error('Failed to populate fare map');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tripData = {
        ...formData,
        seatLayout,
        stopFareMap: fareMap
      };

      const response = await apiFetch(
        isEdit ? `/api/admin/trips/${trip._id}` : '/api/admin/trips',
        {
          method: isEdit ? 'PUT' : 'POST',
          body: JSON.stringify(tripData)
        }
      );

      if (response.success) {
        toast.success(isEdit ? 'Trip updated successfully' : 'Trip created successfully');
        onSave(response.data);
      } else {
        toast.error(response.message || 'Failed to save trip');
      }
    } catch (error) {
      console.error('Error saving trip:', error);
      toast.error('Failed to save trip');
    } finally {
      setLoading(false);
    }
  };

  // Fare Map Preview Component
  const FareMapPreview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          Fare Map Preview
        </h3>
        <button
          onClick={populateFareMap}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          Refresh Map
        </button>
      </div>

      {Object.keys(fareMap).length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-medium text-gray-700">From</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-700">To</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-700">Distance</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-700">Fare</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(fareMap).map(([fromStop, toStops]) =>
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
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No fare map loaded yet</p>
          <p className="text-sm text-gray-400">Click "Populate Fare Map" to load stop-to-stop pricing</p>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Bus className="w-6 h-6 mr-2 text-blue-600" />
          {isEdit ? 'Edit Trip' : 'Create New Trip'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Route Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Route *</label>
            <select
              value={formData.routeId}
              onChange={(e) => handleRouteChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Route</option>
              {routes.map(route => (
                <option key={route._id} value={route._id}>
                  {route.routeName} ({route.routeNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type *</label>
            <select
              value={formData.busType}
              onChange={(e) => handleBusTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Bus Type</option>
              {busTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} (₹{option.ratePerKm}/km, Min: ₹{option.minimumFare})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bus Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bus *</label>
          <select
            value={formData.busId}
            onChange={(e) => handleBusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select Bus</option>
            {buses.map(bus => (
              <option key={bus._id} value={bus._id}>
                {bus.busNumber} - {bus.busType} ({bus.capacity?.total || bus.capacity} seats)
              </option>
            ))}
          </select>
        </div>

        {/* Automatic Fare Calculation */}
        {selectedRoute && selectedBusType && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Automatic Fare Calculation
              </h3>
              <button
                type="button"
                onClick={calculateFare}
                disabled={calculatingFare}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {calculatingFare ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4 mr-2" />
                )}
                Calculate Fare
              </button>
            </div>

            {fareCalculation && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-600">Distance</p>
                  <p className="font-semibold text-gray-900">{selectedRoute.distance || selectedRoute.totalDistance || 0} km</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-600">Rate per KM</p>
                  <p className="font-semibold text-gray-900">₹{fareCalculation.ratePerKm}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-600">Base Fare</p>
                  <p className="font-semibold text-gray-900">₹{fareCalculation.baseFare}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-600">Total Fare</p>
                  <p className="font-semibold text-green-600">₹{fareCalculation.totalFare}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Fare Override */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Manual Fare Override (₹)</label>
          <input
            type="number"
            value={formData.fare}
            onChange={(e) => setFormData(prev => ({ ...prev, fare: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter fare amount"
          />
          <p className="text-sm text-gray-500 mt-1">
            Leave as 0 to use automatic calculation, or override with custom amount
          </p>
        </div>

        {/* Driver and Conductor Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Driver</label>
            <select
              value={formData.driverId}
              onChange={(e) => setFormData(prev => ({ ...prev, driverId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Driver</option>
              {drivers.map(driver => (
                <option key={driver._id} value={driver._id}>
                  {driver.name} ({driver.licenseNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Conductor</label>
            <select
              value={formData.conductorId}
              onChange={(e) => setFormData(prev => ({ ...prev, conductorId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Conductor</option>
              {conductors.map(conductor => (
                <option key={conductor._id} value={conductor._id}>
                  {conductor.name} ({conductor.employeeId})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Date *</label>
            <input
              type="date"
              value={formData.serviceDate}
              onChange={(e) => setFormData(prev => ({ ...prev, serviceDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
          <input
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="50"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            placeholder="Additional notes about this trip..."
          />
        </div>

        {/* Fare Map Preview */}
        <AnimatePresence>
          {Object.keys(fareMap).length > 0 && <FareMapPreview />}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEdit ? 'Update Trip' : 'Create Trip'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedTripFormWithFareCalculation;
