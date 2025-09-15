import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ModernSeatSelection from '../../components/ModernSeatSelection';

const PaxSeatSelection = () => {
  const { tripId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const trip = useMemo(() => state?.trip || null, [state?.trip]);
  const boarding = useMemo(() => state?.boarding || null, [state?.boarding]);
  const dropping = useMemo(() => state?.dropping || null, [state?.dropping]);
  const passengerDetails = useMemo(() => state?.passengerDetails || null, [state?.passengerDetails]);
  const passengerGender = useMemo(() => state?.passengerGender || 'male', [state?.passengerGender]);
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
        return prev.filter(s => s !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handleBack = () => {
    navigate(`/pax/passenger-details/${tripId}`, {
      state: { trip, selectedSeats, boarding, dropping, passengerDetails }
    });
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    navigate(`/pax/booking/${tripId}`, {
      state: { 
        trip, 
        selectedSeats, 
        boarding, 
        dropping,
        passengerDetails
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seat selection...</p>
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
            onClick={() => navigate('/pax/search')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <ModernSeatSelection
      trip={trip}
      selectedSeats={selectedSeats}
      onSeatSelect={handleSeatSelect}
      onBack={handleBack}
      onContinue={handleContinue}
      passengerGender={passengerGender}
    />
  );
};

export default PaxSeatSelection;
