import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, CheckCircle } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const OptionRow = ({ time, title, subtitle, selected, onSelect }) => (
  <button
    onClick={onSelect}
    className={`w-full text-left p-6 hover:bg-gray-50 transition-colors ${
      selected ? 'bg-red-50 border-r-4 border-red-600' : ''
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <h4 className="font-medium text-gray-900">{title}</h4>
          {selected && (
            <CheckCircle className="w-5 h-5 text-red-600" />
          )}
        </div>
        <p className="text-sm text-gray-600 mb-1">{subtitle}</p>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-gray-900">
          {time}
        </div>
        <div className="text-xs text-gray-500">
          {selected ? 'Selected' : 'Available'}
        </div>
      </div>
    </div>
  </button>
);

const Panel = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">Choose your preferred {title.toLowerCase()}</p>
    </div>
    <div className="divide-y divide-gray-200">
      {children}
    </div>
  </div>
);

export default function BoardDrop() {
  const { tripId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(state?.trip || { _id: tripId });
  const [loading, setLoading] = useState(false);
  const [boarding, setBoarding] = useState(null);
  const [dropping, setDropping] = useState(null);

  // No backend dependency here to avoid 404s; if needed later, we can lazy load details

  const boardingPoints = useMemo(() => {
    // synthesize points if not provided by API
    const list = trip?.routeStops?.boardingPoints || [
      { id: 'majestic', time: '23:00', title: 'Majestic (Kempegowda Bus Station)', subtitle: 'Opposite Udupi Hotel Adithya' },
      { id: 'shantinagar', time: '23:15', title: 'Shanthinagar', subtitle: 'Near SRS Travels' },
      { id: 'madiwala', time: '23:25', title: 'Madiwala', subtitle: 'Front of HP Petrol Bunk' },
    ];
    return list;
  }, [trip]);

  const droppingPoints = useMemo(() => {
    const list = trip?.routeStops?.droppingPoints || [
      { id: 'kanchipuram', time: '04:40', title: 'Kanchipuram', subtitle: 'Menachi Medical College' },
      { id: 'sriperumbudur', time: '05:30', title: 'Sriperumbudur', subtitle: 'Near Toll Gate' },
      { id: 'poonamallee', time: '05:50', title: 'Poonamallee', subtitle: 'Poonamallee ByPass' },
    ];
    return list;
  }, [trip]);

  const canContinue = boarding && dropping;

  const handleContinue = () => {
    navigate(`/pax/passenger-details/${tripId}`, {
      state: { trip, selectedSeats: state?.selectedSeats || [], boarding, dropping }
    });
  };

  // Manual continue - no auto-redirect

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>;
  }

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
              onClick={() => navigate('/pax/search')}
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
                {trip.fromCity || trip.routeName} → {trip.toCity || 'Destination'}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(trip.startTime)} - {formatTime(trip.endTime)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{formatDate(trip.serviceDate)}</span>
                </div>
                <span>1 Passenger</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">₹{trip.fare || 499}</div>
              <div className="text-sm text-gray-600">per seat</div>
              {trip.routeName && (
                <div className="text-xs text-gray-500 mt-1">{trip.routeName}</div>
              )}
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
              Choose your preferred boarding point
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {boardingPoints.map((point) => (
              <button
                key={point.id}
                onClick={() => setBoarding(point)}
                className={`w-full text-left p-6 hover:bg-gray-50 transition-colors ${
                  boarding?.id === point.id ? 'bg-red-50 border-r-4 border-red-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">{point.title}</h4>
                      {boarding?.id === point.id && (
                        <CheckCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{point.subtitle}</p>
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
              Choose your preferred drop point
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {droppingPoints.map((point) => (
              <button
                key={point.id}
                onClick={() => setDropping(point)}
                className={`w-full text-left p-6 hover:bg-gray-50 transition-colors ${
                  dropping?.id === point.id ? 'bg-red-50 border-r-4 border-red-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">{point.title}</h4>
                      {dropping?.id === point.id && (
                        <CheckCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{point.subtitle}</p>
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

        {/* Selection Status */}
        {canContinue && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Both boarding and drop points selected!</span>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`px-12 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
              canContinue 
                ? 'bg-pink-600 text-white hover:bg-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canContinue ? 'Continue to Passenger Details' : 'Select Boarding & Drop Points'}
          </button>
        </div>
      </div>
    </div>
  );
}


