import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  MapPin, 
  Bus, 
  Save, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Navigation,
  Clock,
  Route
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const ConductorPricingDashboard = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stopPrices, setStopPrices] = useState({});
  const [originalPrices, setOriginalPrices] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [priceHistory, setPriceHistory] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Fetch conductor routes
  const fetchConductorRoutes = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/conductor/routes');
      
      if (response.data && response.data.success) {
        setRoutes(response.data.data.routes);
      } else {
        toast.error('Failed to fetch routes');
      }
    } catch (error) {
      console.error('Error fetching conductor routes:', error);
      toast.error('Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConductorRoutes();
  }, []);

  // Initialize prices when route changes
  useEffect(() => {
    if (selectedRoute && selectedRoute.intermediateStops) {
      const initialPrices = {};
      const original = {};
      
      selectedRoute.intermediateStops.forEach((stop, index) => {
        initialPrices[`stop_${index}`] = stop.price || 0;
        original[`stop_${index}`] = stop.price || 0;
      });
      
      setStopPrices(initialPrices);
      setOriginalPrices(original);
      calculateTotalRevenue(initialPrices);
    }
  }, [selectedRoute]);

  // Calculate total revenue
  const calculateTotalRevenue = (prices) => {
    const total = Object.values(prices).reduce((sum, price) => sum + (price || 0), 0);
    setTotalRevenue(total);
  };

  // Update stop price
  const updateStopPrice = (stopIndex, newPrice) => {
    const price = parseFloat(newPrice) || 0;
    const updatedPrices = {
      ...stopPrices,
      [`stop_${stopIndex}`]: price
    };
    
    setStopPrices(updatedPrices);
    calculateTotalRevenue(updatedPrices);
    
    // Track price changes
    const stopKey = `stop_${stopIndex}`;
    const oldPrice = originalPrices[stopKey] || 0;
    const change = price - oldPrice;
    
    setPriceHistory(prev => ({
      ...prev,
      [stopKey]: {
        oldPrice,
        newPrice: price,
        change,
        timestamp: new Date().toISOString()
      }
    }));
  };

  // Save price changes
  const handleSavePrices = async () => {
    try {
      setLoading(true);
      
      const updatedStops = selectedRoute.intermediateStops.map((stop, index) => ({
        ...stop,
        price: stopPrices[`stop_${index}`] || 0
      }));

      const response = await apiFetch(`/api/admin/routes/${selectedRoute._id}/prices`, {
        method: 'PUT',
        body: JSON.stringify({
          intermediateStops: updatedStops
        })
      });

      if (response.data && response.data.success) {
        toast.success('Prices updated successfully');
        setOriginalPrices({ ...stopPrices });
        setPriceHistory({});
        setIsEditing(false);
        
        // Refresh routes list
        fetchConductorRoutes();
      } else {
        toast.error(response.data?.error || 'Failed to update prices');
      }
    } catch (error) {
      console.error('Error updating conductor prices:', error);
      toast.error('Failed to update conductor prices');
    } finally {
      setLoading(false);
    }
  };

  // Reset prices to original
  const resetPrices = () => {
    setStopPrices({ ...originalPrices });
    calculateTotalRevenue(originalPrices);
    setPriceHistory({});
    setIsEditing(false);
    toast.success('Prices reset to original values');
  };

  // Get price change indicator
  const getPriceChangeIndicator = (stopIndex) => {
    const stopKey = `stop_${stopIndex}`;
    const history = priceHistory[stopKey];
    
    if (!history || history.change === 0) return null;
    
    if (history.change > 0) {
      return (
        <div className="flex items-center text-green-600 text-xs">
          <TrendingUp className="w-3 h-3 mr-1" />
          +₹{history.change.toFixed(2)}
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-red-600 text-xs">
          <TrendingDown className="w-3 h-3 mr-1" />
          -₹{Math.abs(history.change).toFixed(2)}
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Conductor Pricing Dashboard</h1>
              <p className="text-gray-600">Manage stop prices for your assigned routes</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Role: CONDUCTOR • {routes.length} routes available
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Routes List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Available Routes</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">Loading routes...</p>
                </div>
              ) : routes.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Route className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No routes available</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {routes.map((route) => (
                    <button
                      key={route._id}
                      onClick={() => setSelectedRoute(route)}
                      className={`w-full p-3 text-left transition-colors ${
                        selectedRoute?._id === route._id
                          ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-900'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{route.routeNumber}</p>
                          <p className="text-xs text-gray-600">{route.routeName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-green-600">
                            ₹{route.pricingSummary?.totalRevenue?.toFixed(2) || '0.00'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {route.pricingSummary?.stopsWithPrices || 0}/{route.pricingSummary?.totalStops || 0} priced
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Interface */}
        <div className="lg:col-span-2">
          {selectedRoute ? (
            <div className="space-y-6">
              {/* Route Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedRoute.routeNumber}</h2>
                    <p className="text-gray-600">{selectedRoute.routeName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">Total Revenue</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedRoute.totalDistance || 0} km</div>
                    <div className="text-sm text-gray-600">Distance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{Math.round(selectedRoute.estimatedDuration || 0)} min</div>
                    <div className="text-sm text-gray-600">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{selectedRoute.intermediateStops?.length || 0}</div>
                    <div className="text-sm text-gray-600">Stops</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      ₹{selectedRoute.intermediateStops?.length > 0 
                        ? (totalRevenue / selectedRoute.intermediateStops.length).toFixed(2)
                        : '0.00'}
                    </div>
                    <div className="text-sm text-gray-600">Avg Price</div>
                  </div>
                </div>
              </div>

              {/* Pricing Controls */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Stop Pricing</h3>
                  <div className="flex items-center space-x-3">
                    {isEditing && (
                      <button
                        onClick={resetPrices}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Reset</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                        isEditing 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>{isEditing ? 'Cancel Edit' : 'Edit Prices'}</span>
                    </button>
                  </div>
                </div>

                {/* Stop Prices List */}
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {selectedRoute.intermediateStops?.map((stop, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isEditing 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Stop {index + 1}: {stop.name || stop.city}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {stop.location || `${stop.coordinates?.lat?.toFixed(4)}, ${stop.coordinates?.lng?.toFixed(4)}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {getPriceChangeIndicator(index)}
                          
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            {isEditing ? (
                              <input
                                type="number"
                                value={stopPrices[`stop_${index}`] || 0}
                                onChange={(e) => updateStopPrice(index, e.target.value)}
                                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="0"
                                step="0.1"
                                placeholder="0.00"
                              />
                            ) : (
                              <span className="text-lg font-bold text-gray-900">
                                ₹{(stopPrices[`stop_${index}`] || 0).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {(!selectedRoute.intermediateStops || selectedRoute.intermediateStops.length === 0) && (
                    <div className="text-center py-12 text-gray-500">
                      <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No intermediate stops found</p>
                      <p className="text-sm">This route has no intermediate stops to price</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-2 text-orange-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>Editing mode - Changes will be saved</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleSavePrices}
                      disabled={loading}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      <span>Save Prices</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Route className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Route</h3>
              <p className="text-gray-600">Choose a route from the list to manage stop prices</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConductorPricingDashboard;

