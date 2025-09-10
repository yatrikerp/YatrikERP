import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const OptionRow = ({ time, title, subtitle, selected, onSelect }) => (
  <button
    onClick={onSelect}
    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex items-center justify-between ${selected ? 'bg-pink-50' : ''}`}
  >
    <div>
      <div className="text-sm text-gray-900 font-medium">{title}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
    <div className={`w-5 h-5 rounded-full border ${selected ? 'bg-pink-500 border-pink-500' : 'border-gray-300'}`}></div>
  </button>
);

const Panel = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="px-4 py-3 text-sm font-semibold text-gray-800 border-b border-gray-100">{title}</div>
    <div className="divide-y divide-gray-100">
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
    navigate(`/pax/booking/${tripId}`, {
      state: { trip, selectedSeats: state?.selectedSeats || [], boarding, dropping }
    });
  };

  // Auto-redirect once both points are selected
  useEffect(() => {
    if (canContinue) {
      const t = setTimeout(handleContinue, 400);
      return () => clearTimeout(t);
    }
  }, [canContinue]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
          <div className="font-medium text-gray-900">1. Select seats</div>
          <div className="font-semibold text-pink-600">2. Board/Drop point</div>
          <div>3. Passenger Info</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="Boarding points">
            {boardingPoints.map((bp) => (
              <OptionRow
                key={bp.id}
                time={bp.time}
                title={`${bp.time}  ${bp.title}`}
                subtitle={bp.subtitle}
                selected={boarding?.id === bp.id}
                onSelect={() => setBoarding(bp)}
              />
            ))}
          </Panel>

          <Panel title="Dropping points">
            {droppingPoints.map((dp) => (
              <OptionRow
                key={dp.id}
                time={dp.time}
                title={`${dp.time}  ${dp.title}`}
                subtitle={dp.subtitle}
                selected={dropping?.id === dp.id}
                onSelect={() => setDropping(dp)}
              />
            ))}
          </Panel>
        </div>

        {!canContinue && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="px-6 py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-semibold disabled:bg-pink-300 disabled:cursor-not-allowed"
            >
              Continue to Passenger Info
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


