import React, { useState, useEffect } from 'react';
import { Calculator, Info, AlertCircle } from 'lucide-react';
import { calculateFare, calculateFareWithFactors, formatFare, validateFareInput, getAvailableBusTypes } from '../services/farePolicyService';

const FareCalculator = ({ 
  busType, 
  distanceKm, 
  onFareCalculated, 
  showAdvanced = false,
  className = "" 
}) => {
  const [calculatedFare, setCalculatedFare] = useState(null);
  const [advancedOptions, setAdvancedOptions] = useState({
    peakHourMultiplier: 1.0,
    weekendMultiplier: 1.0,
    holidayMultiplier: 1.0,
    studentDiscount: 0,
    seniorDiscount: 0
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (busType && distanceKm && distanceKm > 0) {
      calculateFareNow();
    } else {
      setCalculatedFare(null);
    }
  }, [busType, distanceKm, advancedOptions, showAdvanced]);

  const calculateFareNow = () => {
    const validation = validateFareInput(busType, distanceKm);
    
    if (!validation.isValid) {
      setCalculatedFare({
        error: validation.errors.join(', ')
      });
      return;
    }

    try {
      const result = showAdvanced 
        ? calculateFareWithFactors(busType, distanceKm, advancedOptions)
        : calculateFare(busType, distanceKm);

      setCalculatedFare(result);
      
      // Notify parent component
      if (onFareCalculated) {
        onFareCalculated(result);
      }
    } catch (error) {
      setCalculatedFare({
        error: `Calculation error: ${error.message}`
      });
    }
  };

  const handleAdvancedOptionChange = (option, value) => {
    setAdvancedOptions(prev => ({
      ...prev,
      [option]: parseFloat(value) || 0
    }));
  };

  if (!busType || !distanceKm || distanceKm <= 0) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <Calculator className="w-4 h-4" />
          <span className="text-sm">Select bus type and enter distance to calculate fare</span>
        </div>
      </div>
    );
  }

  if (calculatedFare?.error) {
    return (
      <div className={`p-4 bg-red-50 rounded-lg border border-red-200 ${className}`}>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Error</span>
        </div>
        <p className="text-sm text-red-600 mt-1">{calculatedFare.error}</p>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-blue-50 rounded-lg border border-blue-200 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Fare Calculation</span>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Info className="w-3 h-3" />
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Main Fare Display */}
      <div className="text-center mb-3">
        <div className="text-2xl font-bold text-blue-900">
          {formatFare(calculatedFare?.finalFare || calculatedFare?.adjustedFare || 0)}
        </div>
        <div className="text-xs text-blue-600">
          {calculatedFare?.busType} • {distanceKm} km
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2 rounded">
              <div className="text-gray-600">Minimum Fare</div>
              <div className="font-medium">{formatFare(calculatedFare?.minimumFare || 0)}</div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="text-gray-600">Rate/km</div>
              <div className="font-medium">₹{calculatedFare?.ratePerKm || 0}</div>
            </div>
          </div>
          
          <div className="bg-white p-2 rounded">
            <div className="text-gray-600">Base Calculation</div>
            <div className="font-medium">
              {distanceKm} km × ₹{calculatedFare?.ratePerKm || 0} = {formatFare(calculatedFare?.calculatedFare || 0)}
            </div>
          </div>

          {showAdvanced && calculatedFare?.adjustedFare && (
            <div className="bg-white p-2 rounded">
              <div className="text-gray-600">Adjusted Fare</div>
              <div className="font-medium">{formatFare(calculatedFare?.adjustedFare || 0)}</div>
              {calculatedFare?.discountAmount > 0 && (
                <div className="text-green-600 text-xs">
                  Discount: -{formatFare(calculatedFare?.discountAmount || 0)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="text-xs font-medium text-blue-800 mb-2">Advanced Options</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600">Peak Hour</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="2"
                value={advancedOptions.peakHourMultiplier}
                onChange={(e) => handleAdvancedOptionChange('peakHourMultiplier', e.target.value)}
                className="w-full px-2 py-1 text-xs border rounded"
                placeholder="1.0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Weekend</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="2"
                value={advancedOptions.weekendMultiplier}
                onChange={(e) => handleAdvancedOptionChange('weekendMultiplier', e.target.value)}
                className="w-full px-2 py-1 text-xs border rounded"
                placeholder="1.0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Student Discount</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={advancedOptions.studentDiscount}
                onChange={(e) => handleAdvancedOptionChange('studentDiscount', e.target.value)}
                className="w-full px-2 py-1 text-xs border rounded"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Senior Discount</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={advancedOptions.seniorDiscount}
                onChange={(e) => handleAdvancedOptionChange('seniorDiscount', e.target.value)}
                className="w-full px-2 py-1 text-xs border rounded"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FareCalculator;
