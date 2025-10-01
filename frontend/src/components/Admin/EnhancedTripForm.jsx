import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Bus, Users, Calendar, Clock, MapPin, 
  Save, RefreshCw, AlertTriangle, CheckCircle,
  Route, DollarSign, Eye, Settings, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const EnhancedTripForm = ({ 
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
  const [seatLayout, setSeatLayout] = useState(null);
  const [fareMap, setFareMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatingSeatLayout, setGeneratingSeatLayout] = useState(false);

  useEffect(() => {
    if (trip) {
      setFormData({
        routeId: trip.routeId || '',
        busId: trip.busId || '',
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

      // Load existing seat layout if available
      if (trip.seatLayout) {
        setSeatLayout(trip.seatLayout);
      }

      // Load existing fare map if available
      if (trip.stopFareMap) {
        setFareMap(trip.stopFareMap);
      }
    }
  }, [trip]);

  useEffect(() => {
    // When route changes, load route details
    if (formData.routeId) {
      const route = routes.find(r => r._id === formData.routeId);
      setSelectedRoute(route);
    }
  }, [formData.routeId, routes]);

  useEffect(() => {
    // When bus changes, load bus details
    if (formData.busId) {
      const bus = buses.find(b => b._id === formData.busId);
      setSelectedBus(bus);
      
      // Update capacity from bus
      if (bus && bus.capacity) {
        setFormData(prev => ({ ...prev, capacity: bus.capacity.total || bus.capacity }));
      }
    }
  }, [formData.busId, buses]);

  const generateSeatLayout = async () => {
    if (!formData.busId || !selectedBus) {
      toast.error('Please select a bus first');
      return;
    }

    setGeneratingSeatLayout(true);
    try {
      const response = await apiFetch(`/api/admin/trips/${trip?._id}/generate-seat-layout`, {
        method: 'POST',
        body: JSON.stringify({
          busCapacity: selectedBus.capacity?.total || selectedBus.capacity,
          busType: selectedBus.busType
        })
      });

      if (response.success) {
        setSeatLayout(response.data.seatLayout);
        setFormData(prev => ({ 
          ...prev, 
          capacity: response.data.busCapacity 
        }));
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

  const populateFareMap = async () => {
    if (!formData.routeId) {
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

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(formData);
      toast.success(isEdit ? 'Trip updated successfully' : 'Trip created successfully');
    } catch (error) {
      console.error('Error saving trip:', error);
      toast.error('Failed to save trip');
    } finally {
      setLoading(false);
    }
  };

  const SeatLayoutPreview = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Bus className="w-5 h-5 mr-2 text-blue-600" />
          Seat Layout Preview
        </h3>
        <button
          onClick={() => setSeatLayout(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {seatLayout ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-medium text-blue-900">Total Seats</div>
              <div className="text-2xl font-bold text-blue-600">{seatLayout.totalSeats}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="font-medium text-green-900">Ladies Seats</div>
              <div className="text-2xl font-bold text-green-600">{seatLayout.ladiesSeats}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="font-medium text-purple-900">Disabled Seats</div>
              <div className="text-2xl font-bold text-purple-600">{seatLayout.disabledSeats}</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="font-medium text-orange-900">Sleeper Seats</div>
              <div className="text-2xl font-bold text-orange-600">{seatLayout.sleeperSeats}</div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Seat Map ({seatLayout.rows} rows × {seatLayout.seatsPerRow} seats per row)</h4>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${seatLayout.seatsPerRow}, 1fr)` }}>
              {seatLayout.layout.map((seat, index) => (
                <div
                  key={index}
                  className={`p-2 text-xs text-center rounded border ${
                    seat.seatType === 'ladies' ? 'bg-pink-100 border-pink-300 text-pink-800' :
                    seat.seatType === 'disabled' ? 'bg-purple-100 border-purple-300 text-purple-800' :
                    seat.seatType === 'sleeper' ? 'bg-orange-100 border-orange-300 text-orange-800' :
                    'bg-gray-100 border-gray-300 text-gray-800'
                  }`}
                >
                  {seat.seatNumber}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                <span>Regular</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-pink-100 border border-pink-300 rounded"></div>
                <span>Ladies</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
                <span>Disabled</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
                <span>Sleeper</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Bus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No seat layout generated yet</p>
          <p className="text-sm text-gray-400">Click "Generate Seat Layout" to create seating arrangement</p>
        </div>
      )}
    </div>
  );

  const FareMapPreview = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          Stop-to-Stop Fare Map
        </h3>
        <button
          onClick={() => setFareMap({})}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {Object.keys(fareMap).length > 0 ? (
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
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Basic Trip Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Trip Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Route *</label>
            <select
              value={formData.routeId}
              onChange={(e) => setFormData(prev => ({ ...prev, routeId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Route</option>
              {routes.map(route => (
                <option key={route._id} value={route._id}>
                  {route.routeNumber} - {route.routeName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bus *</label>
            <select
              value={formData.busId}
              onChange={(e) => setFormData(prev => ({ ...prev, busId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Bus</option>
              {buses.map(bus => (
                <option key={bus._id} value={bus._id}>
                  {bus.busNumber} - {bus.busType} ({bus.capacity?.total || bus.capacity} seats)
                </option>
              ))}
            </select>
          </div>

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
                  {driver.name} - {driver.licenseNumber}
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
                  {conductor.name} - {conductor.employeeId}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Date *</label>
            <input
              type="date"
              value={formData.serviceDate}
              onChange={(e) => setFormData(prev => ({ ...prev, serviceDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base Fare (₹)</label>
            <input
              type="number"
              value={formData.fare}
              onChange={(e) => setFormData(prev => ({ ...prev, fare: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="150"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="45"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="scheduled">Scheduled</option>
              <option value="boarding">Boarding</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Route Information */}
      {selectedRoute && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Route className="w-5 h-5 mr-2 text-blue-600" />
            Route Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Route</p>
              <p className="font-medium text-gray-900">{selectedRoute.routeNumber} - {selectedRoute.routeName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Distance</p>
              <p className="font-medium text-gray-900">{selectedRoute.totalDistance} km</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-medium text-gray-900">{selectedRoute.estimatedDuration} minutes</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fare per KM</p>
              <p className="font-medium text-gray-900">₹{selectedRoute.farePerKm}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bus Information */}
      {selectedBus && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bus className="w-5 h-5 mr-2 text-green-600" />
            Bus Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Bus Number</p>
              <p className="font-medium text-gray-900">{selectedBus.busNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium text-gray-900">{selectedBus.busType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Capacity</p>
              <p className="font-medium text-gray-900">{selectedBus.capacity?.total || selectedBus.capacity} seats</p>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Generation Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-purple-600" />
          Auto-Generation Actions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={generateSeatLayout}
            disabled={generatingSeatLayout || !formData.busId}
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center space-x-3"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              {generatingSeatLayout ? (
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <Bus className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-blue-900">Generate Seat Layout</h4>
              <p className="text-sm text-blue-700">Auto-generate seating arrangement based on bus capacity</p>
            </div>
          </button>

          <button
            onClick={populateFareMap}
            disabled={!formData.routeId}
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center space-x-3"
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-green-900">Populate Fare Map</h4>
              <p className="text-sm text-green-700">Load stop-to-stop pricing from route</p>
            </div>
          </button>
        </div>
      </div>

      {/* Seat Layout Preview */}
      <AnimatePresence>
        {seatLayout && <SeatLayoutPreview />}
      </AnimatePresence>

      {/* Fare Map Preview */}
      <AnimatePresence>
        {Object.keys(fareMap).length > 0 && <FareMapPreview />}
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
          disabled={loading || !formData.routeId || !formData.busId || !formData.serviceDate}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{loading ? 'Saving...' : (isEdit ? 'Update Trip' : 'Create Trip')}</span>
        </button>
      </div>
    </div>
  );
};

export default EnhancedTripForm;



















