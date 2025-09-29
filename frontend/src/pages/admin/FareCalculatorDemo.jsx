import React, { useState } from 'react';
import { Calculator, Bus, MapPin, DollarSign } from 'lucide-react';
import FareCalculator from '../../components/FareCalculator';
import { getAvailableBusTypes, FARE_POLICIES } from '../../services/farePolicyService';

const FareCalculatorDemo = () => {
  const [selectedBusType, setSelectedBusType] = useState('');
  const [distance, setDistance] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [calculatedFare, setCalculatedFare] = useState(null);

  const handleFareCalculated = (fareData) => {
    setCalculatedFare(fareData);
  };

  const resetForm = () => {
    setSelectedBusType('');
    setDistance('');
    setCalculatedFare(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-600" />
          Fare Calculator Demo
        </h1>
        <p className="text-gray-600">
          Automatic fare calculation based on bus type and distance using Kerala RTC fare policies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bus className="w-5 h-5 text-blue-600" />
              Route Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bus Type *
                </label>
                <select
                  value={selectedBusType}
                  onChange={(e) => setSelectedBusType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Bus Type</option>
                  {getAvailableBusTypes().map(busType => (
                    <option key={busType} value={busType}>
                      {busType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distance (km) *
                </label>
                <input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="Enter distance in kilometers"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showAdvanced"
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showAdvanced" className="text-sm text-gray-700">
                  Show advanced options (peak hours, discounts)
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Fare Calculator Component */}
          <FareCalculator
            busType={selectedBusType}
            distanceKm={parseFloat(distance)}
            onFareCalculated={handleFareCalculated}
            showAdvanced={showAdvanced}
            className="w-full"
          />
        </div>

        {/* Results and Fare Policy Table */}
        <div className="space-y-6">
          {/* Calculated Fare Result */}
          {calculatedFare && (
            <div className="bg-green-50 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Calculated Fare
              </h2>
              
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-800">
                    ₹{calculatedFare.finalFare || calculatedFare.adjustedFare || 0}
                  </div>
                  <div className="text-sm text-green-600">
                    {calculatedFare.busType} • {distance} km
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white p-3 rounded">
                    <div className="text-gray-600">Minimum Fare</div>
                    <div className="font-medium">₹{calculatedFare.minimumFare}</div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <div className="text-gray-600">Rate per km</div>
                    <div className="font-medium">₹{calculatedFare.ratePerKm}</div>
                  </div>
                </div>

                {calculatedFare.description && (
                  <div className="bg-white p-3 rounded">
                    <div className="text-gray-600 text-xs">Description</div>
                    <div className="text-sm">{calculatedFare.description}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fare Policy Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Kerala RTC Fare Policies
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Service Class</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Minimum Fare</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Rate per km</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(FARE_POLICIES).map(([busType, policy]) => (
                    <tr 
                      key={busType}
                      className={`hover:bg-gray-50 ${selectedBusType === busType ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium">{busType}</div>
                        <div className="text-xs text-gray-500">{policy.description}</div>
                      </td>
                      <td className="px-3 py-2">₹{policy.minimumFare}</td>
                      <td className="px-3 py-2">₹{policy.ratePerKm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Basic Calculation:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Select bus type from dropdown</li>
              <li>Enter distance in kilometers</li>
              <li>Fare is automatically calculated</li>
              <li>Minimum fare is always maintained</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Advanced Options:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Peak hour multiplier (1.0 - 2.0)</li>
              <li>Weekend multiplier (1.0 - 2.0)</li>
              <li>Student discount (0% - 100%)</li>
              <li>Senior discount (0% - 100%)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FareCalculatorDemo;
