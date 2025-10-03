import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import notificationService from '../../services/notificationService';
import { 
  ArrowUp, 
  Bus, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

const MobilePassengerBooking = () => {
  const { tripId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const selectedSeats = useMemo(() => state?.selectedSeats || [], [state?.selectedSeats]);
  const boarding = state?.boarding || null;
  const dropping = state?.dropping || null;
  
  const [trip, setTrip] = useState(state?.trip || null);
  const [fare, setFare] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [passengerId, setPassengerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load trip details effect
  useEffect(() => {
    const loadTripDetails = async () => {
      if (trip) { 
        setFare(trip.fare); 
        return; 
      }
      try {
        setLoading(true);
        const tripRes = await apiFetch(`/api/trips/${tripId}`);
        if (tripRes.ok) {
          const tripData = tripRes.data?.data || tripRes.data;
          setTrip(tripData);
          setFare(tripData.fare || 0);
        }
      } finally {
        setLoading(false);
      }
    };

    if (!trip && tripId) {
      loadTripDetails();
    }
  }, [tripId, trip]);

  async function createBooking(){
    if (!trip) {
      console.error('Trip details not loaded');
      return;
    }

    if (!selectedSeats.length) {
      setError('Please select at least one seat');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const bookingData = {
        tripId: trip._id,
        seats: selectedSeats,
        boardingPoint: boarding,
        droppingPoint: dropping,
        fare: fare * selectedSeats.length
      };

      console.log('🚌 Creating booking with data:', bookingData);

      const response = await apiFetch('/api/booking/create', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        const result = response.data;
        console.log('✅ Booking created successfully:', result);
        
        setBookingId(result.bookingId);
        setPassengerId(result.passengerId);
        
        // Show success notification
        notificationService.success('Booking created successfully!');
        
        // Navigate to ticket page
        navigate(`/passenger/ticket/${result.pnr}`);
      } else {
        console.error('❌ Booking creation failed:', response);
        setError(response.message || 'Booking creation failed');
      }
    } catch (error) {
      console.error('❌ Booking error:', error);
      setError('An error occurred while creating the booking');
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading && !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}>
        <div className="text-center p-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Trip not found</h2>
          <p className="text-gray-600 mb-4">The requested trip could not be found.</p>
          <button
            onClick={() => navigate('/passenger/search')}
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Search Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowUp className="w-4 h-4 text-gray-600 rotate-90" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold text-gray-900">Confirm Booking</h1>
              <p className="text-sm text-gray-600">Review your trip details</p>
            </div>
            <div className="w-8"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Trip Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Trip Details</h2>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Bus className="w-5 h-5 text-pink-500" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{trip.bus?.busNumber || 'Bus Number'}</p>
                <p className="text-sm text-gray-600">{trip.bus?.type || 'Standard'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-pink-500" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{trip.route?.from} → {trip.route?.to}</p>
                <p className="text-sm text-gray-600">Route</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-pink-500" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{formatDate(trip.departureDate)}</p>
                <p className="text-sm text-gray-600">Travel Date</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-pink-500" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {formatTime(trip.departureTime)} - {formatTime(trip.arrivalTime)}
                </p>
                <p className="text-sm text-gray-600">Duration: {trip.duration || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Seats Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Selected Seats</h2>
          
          {selectedSeats.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Seats:</span>
                <span className="font-medium text-gray-900">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Passengers:</span>
                <span className="font-medium text-gray-900">{selectedSeats.length}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No seats selected</p>
              <button
                onClick={() => navigate(-1)}
                className="text-pink-500 text-sm font-medium mt-2"
              >
                Go back to select seats
              </button>
            </div>
          )}
        </div>

        {/* Boarding Points Card */}
        {(boarding || dropping) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Boarding Points</h2>
            
            <div className="space-y-2">
              {boarding && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Boarding:</span>
                  <span className="font-medium text-gray-900">{boarding}</span>
                </div>
              )}
              {dropping && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Dropping:</span>
                  <span className="font-medium text-gray-900">{dropping}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Price Summary</h2>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Base Fare:</span>
              <span className="text-sm text-gray-900">₹{fare} × {selectedSeats.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Taxes & Fees:</span>
              <span className="text-sm text-gray-900">₹0</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total Amount:</span>
                <span className="text-lg font-bold text-pink-600">₹{fare * selectedSeats.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Booking Button */}
        <button
          onClick={createBooking}
          disabled={loading || !selectedSeats.length}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating Booking...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>Confirm & Pay ₹{fare * selectedSeats.length}</span>
            </>
          )}
        </button>

        {/* Terms */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By confirming this booking, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobilePassengerBooking;

