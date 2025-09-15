import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import SeatSelectionComponent from '../../components/SeatSelection';
import { useAuth } from '../../context/AuthContext';

const PassengerSeatSelection = () => {
  const { tripId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const trip = useMemo(() => state?.trip || null, [state?.trip]);
  const boarding = useMemo(() => state?.boarding || null, [state?.boarding]);
  const dropping = useMemo(() => state?.dropping || null, [state?.dropping]);
  const [selectedSeats, setSelectedSeats] = useState(state?.selectedSeats || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load trip details if not provided
  useEffect(() => {
    const loadTripDetails = async () => {
      if (trip) return; // Already have trip data
      
      try {
        setLoading(true);
        const tripRes = await apiFetch(`/api/trips/${tripId}`);
        if (tripRes.ok) {
          const tripData = tripRes.data?.data || tripRes.data;
          // Update the trip in state if needed
        }
      } catch (err) {
        console.error('Error loading trip details:', err);
        setError('Failed to load trip details');
      } finally {
        setLoading(false);
      }
    };

    if (!trip && tripId) {
      loadTripDetails();
    }
  }, [tripId, trip]);

  const handleSeatSelect = (seatNumber) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(seat => seat !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handleBack = () => {
    navigate(`/passenger/boarddrop/${tripId}`, {
      state: { trip, selectedSeats, boarding, dropping }
    });
  };

  const handleContinue = () => {
    navigate(`/passenger/booking/${tripId}`, {
      state: { 
        trip, 
        selectedSeats, 
        boarding, 
        dropping 
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading seat selection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Trip not found</p>
          <button
            onClick={() => navigate('/passenger/search')}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stepper */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="font-medium text-gray-900">1. Select seats</div>
            <div className="font-semibold text-pink-600">2. Board/Drop point</div>
            <div className="font-semibold text-pink-600">3. Passenger Info</div>
            <div>4. Payment</div>
          </div>
        </div>
      </div>

      {/* Seat Selection Component */}
      <SeatSelectionComponent
        trip={trip}
        selectedSeats={selectedSeats}
        onSeatSelect={handleSeatSelect}
        onBack={handleBack}
        onContinue={handleContinue}
        passengerGender={user?.gender || 'male'}
      />
    </div>
  );
};

export default PassengerSeatSelection;
