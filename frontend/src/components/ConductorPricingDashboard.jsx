import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  DollarSign, 
  MapPin, 
  Bus, 
  Save, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ConductorPricingDashboard = ({ 
  isOpen, 
  onClose, 
  route, 
  onUpdatePrices,
  conductorRole = 'CONDUCTOR'
}) => {
  const [stopPrices, setStopPrices] = useState({});
  const [originalPrices, setOriginalPrices] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState({});
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Initialize prices when route changes
  useEffect(() => {
    if (route && route.intermediateStops) {
      const initialPrices = {};
      const original = {};
      
      route.intermediateStops.forEach((stop, index) => {
        initialPrices[`stop_${index}`] = stop.price || 0;
        original[`stop_${index}`] = stop.price || 0;
      });
      
      setStopPrices(initialPrices);
      setOriginalPrices(original);
      calculateTotalRevenue(initialPrices);
    }
  }, [route]);

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
      
      const updatedStops = route.intermediateStops.map((stop, index) => ({
        ...stop,
        price: stopPrices[`stop_${index}`] || 0
      }));

      const updatedRoute = {
        ...route,
        intermediateStops: updatedStops
      };

      await onUpdatePrices(updatedRoute);
      
      // Update original prices
      setOriginalPrices({ ...stopPrices });
      
      toast.success('Prices updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating prices:', error);
      toast.error('Failed to update prices');
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Conductor Pricing Dashboard</h2>
                <p className="text-gray-600">{route?.routeName || 'Set Stop Prices'}</p>
                <p className="text-sm text-blue-600 font-medium">
                  Role: {conductorRole} • Route: {route?.routeNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {/* Route Info */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{route?.totalDistance || 0} km</div>
                  <div className="text-sm text-gray-600">Total Distance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{Math.round(route?.estimatedDuration || 0)} min</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{route?.intermediateStops?.length || 0}</div>
                  <div className="text-sm text-gray-600">Stops</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">₹{totalRevenue.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
              </div>
            </div>

            {/* Pricing Controls */}
            <div className="p-6">
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
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {route?.intermediateStops?.map((stop, index) => (
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
                    
                    {/* Price validation */}
                    {isEditing && (stopPrices[`stop_${index}`] || 0) < 0 && (
                      <div className="mt-2 flex items-center space-x-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Price cannot be negative</span>
                      </div>
                    )}
                  </motion.div>
                ))}

                {(!route?.intermediateStops || route.intermediateStops.length === 0) && (
                  <div className="text-center py-12 text-gray-500">
                    <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No intermediate stops found</p>
                    <p className="text-sm">This route has no intermediate stops to price</p>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              {route?.intermediateStops?.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Price Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        ₹{(totalRevenue / (route.intermediateStops.length || 1)).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Average Price per Stop</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        ₹{Math.max(...Object.values(stopPrices)).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Highest Price</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        ₹{Math.min(...Object.values(stopPrices).filter(p => p > 0)).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Lowest Price</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {isEditing ? (
                  <div className="flex items-center space-x-2 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>Editing mode - Changes will be saved</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>View mode - Click "Edit Prices" to modify</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                
                {isEditing && (
                  <button
                    onClick={handleSavePrices}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Prices</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConductorPricingDashboard;

