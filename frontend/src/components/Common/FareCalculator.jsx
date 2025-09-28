import React, { useState, useEffect } from 'react';
import { Calculator, Route, Clock, MapPin, DollarSign, TrendingUp, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const FareCalculator = ({ 
  busType, 
  routeType, 
  distance, 
  departureTime, 
  onFareCalculated,
  className = "" 
}) => {
  const [fareData, setFareData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (busType && routeType && distance > 0) {
      calculateFare();
    }
  }, [busType, routeType, distance, departureTime]);

  const calculateFare = async () => {
    setLoading(true);
    try {
      const options = {};
      
      // Determine time of day based on departure time
      if (departureTime) {
        const hour = new Date(departureTime).getHours();
        if (hour >= 6 && hour < 12) options.timeOfDay = 'morning';
        else if (hour >= 12 && hour < 18) options.timeOfDay = 'afternoon';
        else if (hour >= 18 && hour < 22) options.timeOfDay = 'evening';
        else options.timeOfDay = 'night';
      }

      const response = await apiFetch('/api/fare-policy/calculate', {
        method: 'POST',
        body: JSON.stringify({
          busType,
          routeType,
          distance,
          options
        })
      });

      if (response.success) {
        setFareData(response.data);
        if (onFareCalculated) {
          onFareCalculated(response.data);
        }
      } else {
        toast.error('Failed to calculate fare');
      }
    } catch (error) {
      console.error('Fare calculation error:', error);
      toast.error('Error calculating fare');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getBusTypeLabel = (type) => {
    const labels = {
      'ordinary': 'Ordinary',
      'lspf': 'Limited Stop Fast Passenger',
      'fast_passenger': 'Fast Passenger',
      'venad': 'Venad',
      'super_fast': 'Super Fast',
      'super_deluxe': 'Super Deluxe',
      'deluxe_express': 'Deluxe Express',
      'ananthapuri_fast': 'Ananthapuri Fast',
      'rajadhani': 'Rajadhani',
      'minnal': 'Minnal',
      'garuda_king_long': 'Garuda King Long',
      'garuda_volvo': 'Garuda Volvo',
      'garuda_scania': 'Garuda Scania',
      'garuda_maharaja': 'Garuda Maharaja',
      'low_floor_non_ac': 'Low Floor Non-AC',
      'low_floor_ac': 'Low Floor AC',
      'jnnurm_city': 'JNNURM City Circular'
    };
    return labels[type] || type;
  };

  const getRouteTypeLabel = (type) => {
    const labels = {
      'local': 'Local',
      'city': 'City',
      'intercity': 'Intercity',
      'district': 'District',
      'long_distance': 'Long Distance',
      'interstate': 'Interstate'
    };
    return labels[type] || type;
  };

  const getTimeOfDayLabel = (timeOfDay) => {
    const labels = {
      'morning': 'Morning (6AM-12PM)',
      'afternoon': 'Afternoon (12PM-6PM)',
      'evening': 'Evening (6PM-10PM)',
      'night': 'Night (10PM-6AM)'
    };
    return labels[timeOfDay] || timeOfDay;
  };

  if (!busType || !routeType || distance <= 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <Calculator className="w-5 h-5" />
          <span className="text-sm">Fare calculator will appear when route details are available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calculator className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Fare Calculation</h3>
            <p className="text-sm text-gray-600">
              {getBusTypeLabel(busType)} • {getRouteTypeLabel(routeType)}
            </p>
          </div>
        </div>
        {fareData && (
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Info className="w-4 h-4" />
            {showBreakdown ? 'Hide' : 'Show'} Breakdown
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Calculating fare...</span>
        </div>
      ) : fareData ? (
        <div className="space-y-4">
          {/* Main Fare Display */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Fare</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(fareData.finalFare)}
                </p>
                <p className="text-xs text-gray-500">
                  {distance} km • {getTimeOfDayLabel(fareData.breakdown?.timeOfDay || 'afternoon')}
                </p>
              </div>
              <div className="text-right">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Fare Breakdown */}
          {showBreakdown && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Fare Breakdown
              </h4>
              
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-medium">{fareData.breakdown?.distanceKm} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rate per km:</span>
                  <span className="font-medium">₹{fareData.breakdown?.ratePerKm}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base fare:</span>
                  <span className="font-medium">{formatCurrency(fareData.baseFare)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Time multiplier:</span>
                  <span className="font-medium">{fareData.breakdown?.timeMultiplier}x</span>
                </div>
                {fareData.breakdown?.seasonalMultiplier !== 1 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Seasonal multiplier:</span>
                    <span className="font-medium">{fareData.breakdown?.seasonalMultiplier}x</span>
                  </div>
                )}
                {fareData.breakdown?.peakHourMultiplier !== 1 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Peak hour multiplier:</span>
                    <span className="font-medium">{fareData.breakdown?.peakHourMultiplier}x</span>
                  </div>
                )}
                
                {fareData.appliedDiscounts && fareData.appliedDiscounts.length > 0 && (
                  <div className="border-t border-gray-200 pt-2">
                    <p className="text-sm font-medium text-gray-900 mb-1">Applied Discounts:</p>
                    {fareData.appliedDiscounts.map((discount, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-green-600">- {discount.name}:</span>
                        <span className="font-medium text-green-600">
                          {discount.type === 'percentage' ? `${discount.value}%` : formatCurrency(discount.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Fare Policy Info</span>
                </div>
                <div className="text-xs text-blue-800">
                  <p>Policy: {fareData.farePolicy?.name}</p>
                  <p>Min Fare: {formatCurrency(fareData.farePolicy?.minimumFare || 0)}</p>
                  {fareData.farePolicy?.maximumFare && (
                    <p>Max Fare: {formatCurrency(fareData.farePolicy?.maximumFare)}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Route Information */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Route className="w-4 h-4" />
              <span>{getRouteTypeLabel(routeType)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{distance} km</span>
            </div>
            {departureTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(departureTime).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No fare policy found for this bus type and route</p>
        </div>
      )}
    </div>
  );
};

export default FareCalculator;
