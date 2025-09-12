import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { MapPin, Clock, ArrowRight, ArrowLeft } from 'lucide-react';

const OptionRow = ({ time, title, subtitle, selected, onSelect }) => (
  <button
    onClick={onSelect}
    className={`w-full text-left px-6 py-4 border-b border-gray-100 hover:bg-gray-50 flex items-center justify-between transition-all duration-200 ${
      selected ? 'bg-pink-50 border-pink-200' : ''
    }`}
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
        <Clock className="w-5 h-5 text-gray-600" />
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900">{title}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      </div>
    </div>
    <div className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
      selected ? 'bg-pink-500 border-pink-500' : 'border-gray-300'
    }`}>
      {selected && (
        <div className="w-full h-full rounded-full bg-white scale-50"></div>
      )}
    </div>
  </button>
);

const Panel = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 text-lg font-semibold text-gray-800 border-b border-gray-100 bg-gray-50">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-pink-600" />
        {title}
      </div>
    </div>
    <div className="divide-y divide-gray-100">
      {children}
    </div>
  </div>
);

export default function PassengerBoardDrop() {
  const { tripId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(state?.trip || { _id: tripId });
  const [loading, setLoading] = useState(false);
  const [boarding, setBoarding] = useState(null);
  const [dropping, setDropping] = useState(null);

  // Helper functions for time manipulation
  const addMinutes = (timeString, minutes) => {
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  const subtractMinutes = (timeString, minutes) => {
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + mins - minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  // Load trip details if not provided
  useEffect(() => {
    if (!trip._id && tripId) {
      const loadTripDetails = async () => {
        try {
          setLoading(true);
          const tripRes = await apiFetch(`/api/trips/${tripId}`);
          if (tripRes.ok) {
            const tripData = tripRes.data?.data || tripRes.data;
            setTrip(tripData);
          }
        } catch (error) {
          console.error('Error loading trip:', error);
        } finally {
          setLoading(false);
        }
      };
      loadTripDetails();
    }
  }, [tripId, trip._id]);

  const boardingPoints = useMemo(() => {
    // Generate boarding points based on trip data
    const list = trip?.routeStops?.boardingPoints || [
      { 
        id: 'central', 
        time: trip?.startTime || '08:00', 
        title: `${trip?.fromCity || 'Origin'} Central Bus Stand`, 
        subtitle: 'Main boarding point with all facilities' 
      },
      { 
        id: 'railway', 
        time: addMinutes(trip?.startTime || '08:00', 15), 
        title: `${trip?.fromCity || 'Origin'} Railway Station`, 
        subtitle: 'Near railway station entrance' 
      },
      { 
        id: 'airport', 
        time: addMinutes(trip?.startTime || '08:00', 30), 
        title: `${trip?.fromCity || 'Origin'} Airport`, 
        subtitle: 'Airport terminal pickup point' 
      },
    ];
    return list;
  }, [trip]);

  const droppingPoints = useMemo(() => {
    // Generate dropping points based on trip data
    const list = trip?.routeStops?.droppingPoints || [
      { 
        id: 'central', 
        time: trip?.endTime || '12:00', 
        title: `${trip?.toCity || 'Destination'} Central Bus Stand`, 
        subtitle: 'Main dropping point with all facilities' 
      },
      { 
        id: 'railway', 
        time: subtractMinutes(trip?.endTime || '12:00', 15), 
        title: `${trip?.toCity || 'Destination'} Railway Station`, 
        subtitle: 'Near railway station entrance' 
      },
      { 
        id: 'airport', 
        time: subtractMinutes(trip?.endTime || '12:00', 30), 
        title: `${trip?.toCity || 'Destination'} Airport`, 
        subtitle: 'Airport terminal drop point' 
      },
    ];
    return list;
  }, [trip]);

  const canContinue = boarding && dropping;

  const handleContinue = () => {
    navigate(`/passenger/booking/${tripId}`, {
      state: { 
        trip, 
        selectedSeats: state?.selectedSeats || [], 
        boarding, 
        dropping 
      }
    });
  };

  // Auto-redirect once both points are selected
  useEffect(() => {
    if (canContinue) {
      const timer = setTimeout(handleContinue, 1000);
      return () => clearTimeout(timer);
    }
  }, [canContinue]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading trip details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/passenger/results')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Select Boarding & Dropping Points</h1>
          <p className="text-gray-600 mt-2">
            {trip?.routeName} • {new Date(trip?.serviceDate || Date.now()).toDateString()}
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-6 text-sm text-gray-600 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">1</div>
            <span>Select Trip</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white">2</div>
            <span className="font-semibold text-pink-600">Board/Drop Point</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">3</div>
            <span>Passenger Info</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">4</div>
            <span>Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Panel title="Boarding Points">
            {boardingPoints.map((bp) => (
              <OptionRow
                key={bp.id}
                time={bp.time}
                title={`${bp.time} - ${bp.title}`}
                subtitle={bp.subtitle}
                selected={boarding?.id === bp.id}
                onSelect={() => setBoarding(bp)}
              />
            ))}
          </Panel>

          <Panel title="Dropping Points">
            {droppingPoints.map((dp) => (
              <OptionRow
                key={dp.id}
                time={dp.time}
                title={`${dp.time} - ${dp.title}`}
                subtitle={dp.subtitle}
                selected={dropping?.id === dp.id}
                onSelect={() => setDropping(dp)}
              />
            ))}
          </Panel>
        </div>

        {/* Selection Summary */}
        {boarding && dropping && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Selection Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Boarding Point</h4>
                <p className="text-sm text-gray-600">{boarding.time} - {boarding.title}</p>
                <p className="text-xs text-gray-500 mt-1">{boarding.subtitle}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Dropping Point</h4>
                <p className="text-sm text-gray-600">{dropping.time} - {dropping.title}</p>
                <p className="text-xs text-gray-500 mt-1">{dropping.subtitle}</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-green-700">
                ✅ Both points selected! Proceeding to passenger details...
              </p>
            </div>
          </div>
        )}

        {/* Continue Button */}
        {!canContinue && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="px-8 py-4 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold disabled:bg-pink-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              Continue to Passenger Info
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}