import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { 
  MapPin, 
  Clock, 
  ArrowRight, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const BoardingDropSelection = ({ 
  trip, 
  selectedSeats, 
  boardingPoint, 
  dropPoint,
  onBoardingSelect, 
  onDropSelect, 
  onBack, 
  onContinue 
}) => {
  const [boardingPoints, setBoardingPoints] = useState([]);
  const [dropPoints, setDropPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (trip?.id) {
      fetchRouteStops();
    }
  }, [trip?.id]);

  const fetchRouteStops = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch route stops for the trip
      const response = await apiFetch(`/api/routes/${trip.routeId}/stops`);
      
      if (response.ok) {
        const stops = response.data || [];
        setBoardingPoints(stops);
        setDropPoints(stops);
      } else {
        setError('Failed to load boarding and drop points');
      }
    } catch (err) {
      console.error('Error fetching route stops:', err);
      setError('Failed to load boarding and drop points');
    } finally {
      setLoading(false);
    }
  };

  const handleBoardingSelect = (stop) => {
    onBoardingSelect(stop);
    // Auto-select drop point if not selected
    if (!dropPoint) {
      const availableDropPoints = dropPoints.filter(dp => 
        dp.sequence > stop.sequence
      );
      if (availableDropPoints.length > 0) {
        onDropSelect(availableDropPoints[0]);
      }
    }
  };

  const handleDropSelect = (stop) => {
    onDropSelect(stop);
  };

  const calculateFare = () => {
    if (!boardingPoint || !dropPoint) return 0;
    
    const distance = Math.abs(dropPoint.sequence - boardingPoint.sequence);
    const baseFare = trip?.baseFare || 499;
    const farePerStop = 50;
    
    return baseFare + (distance * farePerStop);
  };

  const totalAmount = calculateFare() * selectedSeats.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600">Loading boarding points...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span>Back to Seats</span>
        </button>
        
        <div className="text-right">
          <h1 className="text-2xl font-bold text-gray-800">Boarding & Drop Points</h1>
          <p className="text-sm text-gray-600">Select your pickup and destination points</p>
        </div>
      </div>

      {/* Trip Information */}
      {trip && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">{trip.routeName || `${trip.from} → ${trip.to}`}</h3>
              <div className="flex items-center space-x-4 text-sm text-blue-700">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{trip.from} → {trip.to}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{trip.time || trip.departureTime}</span>
                </div>
                <span className="text-blue-600">•</span>
                <span>Selected Seats: {selectedSeats.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Boarding Points */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-green-600" />
            Boarding Point
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {boardingPoints.map((stop, index) => (
              <button
                key={stop._id || index}
                onClick={() => handleBoardingSelect(stop)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  boardingPoint?.stopName === stop.stopName
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{stop.stopName}</h4>
                    <p className="text-sm text-gray-600">{stop.address}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Stop #{stop.sequence} • Arrival: {stop.arrivalTime || '--:--'}
                    </p>
                  </div>
                  {boardingPoint?.stopName === stop.stopName && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Drop Points */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-red-600" />
            Drop Point
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {dropPoints
              .filter(stop => !boardingPoint || stop.sequence > boardingPoint.sequence)
              .map((stop, index) => (
                <button
                  key={stop._id || index}
                  onClick={() => handleDropSelect(stop)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    dropPoint?.stopName === stop.stopName
                      ? 'border-red-500 bg-red-50 text-red-800'
                      : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{stop.stopName}</h4>
                      <p className="text-sm text-gray-600">{stop.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Stop #{stop.sequence} • Departure: {stop.departureTime || '--:--'}
                      </p>
                    </div>
                    {dropPoint?.stopName === stop.stopName && (
                      <CheckCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Fare Calculation */}
      {(boardingPoint || dropPoint) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
          <h4 className="font-medium text-gray-800 mb-3">Fare Calculation</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Base Fare:</span>
              <span className="ml-2 font-medium">₹{trip?.baseFare || 499}</span>
            </div>
            <div>
              <span className="text-gray-600">Distance:</span>
              <span className="ml-2 font-medium">
                {boardingPoint && dropPoint 
                  ? `${Math.abs(dropPoint.sequence - boardingPoint.sequence)} stops`
                  : '--'
                }
              </span>
            </div>
            <div>
              <span className="text-gray-600">Seats:</span>
              <span className="ml-2 font-medium">{selectedSeats.length}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
              <span className="text-xl font-bold text-green-600">₹{totalAmount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to Seats
        </button>
        
        <button
          onClick={onContinue}
          disabled={!boardingPoint || !dropPoint}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>Continue to Passenger Details</span>
          <CheckCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default BoardingDropSelection;
