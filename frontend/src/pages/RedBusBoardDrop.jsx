import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, CheckCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';

const RedBusBoardDrop = () => {
  const { tripId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const trip = state?.trip || {};
  const searchData = state?.searchData || {};
  
  const [boardingPoint, setBoardingPoint] = useState(null);
  const [dropPoint, setDropPoint] = useState(null);
  const [boardingPoints, setBoardingPoints] = useState([]);
  const [dropPoints, setDropPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBoardingDropPoints();
  }, [tripId]);

  const loadBoardingDropPoints = async () => {
    try {
      setLoading(true);
      
      // Mock boarding and drop points (in real app, fetch from API)
      const mockBoardingPoints = [
        {
          id: 'central',
          name: 'Central Bus Station',
          address: 'Near Railway Station, Kochi',
          time: '08:00',
          landmark: 'Opposite Metro Station'
        },
        {
          id: 'airport',
          name: 'Airport Bus Stop',
          address: 'Cochin International Airport',
          time: '08:15',
          landmark: 'Terminal 1'
        },
        {
          id: 'marine',
          name: 'Marine Drive',
          address: 'Marine Drive, Kochi',
          time: '08:30',
          landmark: 'Near Tourist Information Center'
        }
      ];

      const mockDropPoints = [
        {
          id: 'central_tvm',
          name: 'Central Bus Station',
          address: 'Thampanoor, Thiruvananthapuram',
          time: '14:00',
          landmark: 'Near Railway Station'
        },
        {
          id: 'airport_tvm',
          name: 'Airport Bus Stop',
          address: 'Trivandrum International Airport',
          time: '14:15',
          landmark: 'Terminal Building'
        },
        {
          id: 'kovalam',
          name: 'Kovalam Beach',
          address: 'Kovalam Beach Road',
          time: '14:30',
          landmark: 'Near Lighthouse'
        }
      ];

      setBoardingPoints(mockBoardingPoints);
      setDropPoints(mockDropPoints);
    } catch (error) {
      console.error('Error loading boarding/drop points:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!boardingPoint || !dropPoint) {
      alert('Please select both boarding and drop points');
      return;
    }

    navigate(`/redbus/seats/${tripId}`, {
      state: {
        trip,
        searchData,
        boardingPoint,
        dropPoint
      }
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/redbus')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Search</span>
            </button>
            <div className="text-sm text-gray-600">
              Step 2 of 4
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Trip Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {searchData.from} → {searchData.to}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(trip.startTime)} - {formatTime(trip.endTime)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{formatDate(searchData.date)}</span>
                </div>
                <span>{searchData.passengers} {searchData.passengers === '1' ? 'Passenger' : 'Passengers'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">₹{trip.fare}</div>
              <div className="text-sm text-gray-600">per seat</div>
            </div>
          </div>
        </div>

        {/* Boarding Points */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select Boarding Point
            </h3>
            <p className="text-sm text-gray-600">
              Choose your preferred boarding point in {searchData.from}
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {boardingPoints.map((point) => (
              <button
                key={point.id}
                onClick={() => setBoardingPoint(point)}
                className={`w-full text-left p-6 hover:bg-gray-50 transition-colors ${
                  boardingPoint?.id === point.id ? 'bg-red-50 border-r-4 border-red-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">{point.name}</h4>
                      {boardingPoint?.id === point.id && (
                        <CheckCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{point.address}</p>
                    <p className="text-xs text-gray-500">{point.landmark}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {point.time}
                    </div>
                    <div className="text-xs text-gray-500">Pickup time</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Drop Points */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select Drop Point
            </h3>
            <p className="text-sm text-gray-600">
              Choose your preferred drop point in {searchData.to}
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {dropPoints.map((point) => (
              <button
                key={point.id}
                onClick={() => setDropPoint(point)}
                className={`w-full text-left p-6 hover:bg-gray-50 transition-colors ${
                  dropPoint?.id === point.id ? 'bg-red-50 border-r-4 border-red-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">{point.name}</h4>
                      {dropPoint?.id === point.id && (
                        <CheckCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{point.address}</p>
                    <p className="text-xs text-gray-500">{point.landmark}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {point.time}
                    </div>
                    <div className="text-xs text-gray-500">Drop time</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!boardingPoint || !dropPoint}
            className="bg-pink-600 text-white px-8 py-3 rounded-lg hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            Continue to Seat Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedBusBoardDrop;
