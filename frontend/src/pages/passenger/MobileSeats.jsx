import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowUp, 
  Bus, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  ArrowRight,
  CheckCircle,
  User,
  UserCheck
} from 'lucide-react';

const MobilePassengerSeats = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSeats, setSelectedSeats] = useState([]);

  // Get trip data from navigation state
  const trip = location.state?.trip || null;

  // Seat pricing based on position
  const seatPricing = {
    "1A": 550, "1B": 550, "1C": 550, "1D": 550,
    "2A": 550, "2B": 550, "2C": 550, "2D": 550,
    "3A": 499, "3B": 499, "3C": 499, "3D": 499,
    "4A": 499, "4B": 499, "4C": 499, "4D": 499,
    "5A": 499, "5B": 499, "5C": 499, "5D": 499,
    "6A": 499, "6B": 499, "6C": 499, "6D": 499,
    "7A": 499, "7B": 499, "7C": 499, "7D": 499,
    "8A": 499, "8B": 499, "8C": 499, "8D": 499,
    "9A": 450, "9B": 450, "9C": 450, "9D": 450,
    "10A": 450, "10B": 450, "10C": 450, "10D": 450,
    "11A": 450, "11B": 450, "11C": 450, "11D": 450,
  };

  // Example seats data with different statuses
  const seats = [
    { id: '1A', seatNumber: '1A', status: 'available', price: 550 },
    { id: '1B', seatNumber: '1B', status: 'available', price: 550 },
    { id: '1C', seatNumber: '1C', status: 'available', price: 550 },
    { id: '1D', seatNumber: '1D', status: 'available', price: 550 },
    
    { id: '2A', seatNumber: '2A', status: 'available', price: 550 },
    { id: '2B', seatNumber: '2B', status: 'available', price: 550 },
    { id: '2C', seatNumber: '2C', status: 'available', price: 550 },
    { id: '2D', seatNumber: '2D', status: 'available', price: 550 },
    
    { id: '3A', seatNumber: '3A', status: 'sold', price: 499 },
    { id: '3B', seatNumber: '3B', status: 'available_male', price: 499 },
    { id: '3C', seatNumber: '3C', status: 'available', price: 499 },
    { id: '3D', seatNumber: '3D', status: 'available', price: 499 },
    
    { id: '4A', seatNumber: '4A', status: 'available', price: 499 },
    { id: '4B', seatNumber: '4B', status: 'available', price: 499 },
    { id: '4C', seatNumber: '4C', status: 'sold', price: 499 },
    { id: '4D', seatNumber: '4D', status: 'available', price: 499 },
    
    { id: '5A', seatNumber: '5A', status: 'available', price: 499 },
    { id: '5B', seatNumber: '5B', status: 'available', price: 499 },
    { id: '5C', seatNumber: '5C', status: 'available', price: 499 },
    { id: '5D', seatNumber: '5D', status: 'available', price: 499 },
    
    { id: '6A', seatNumber: '6A', status: 'available', price: 499 },
    { id: '6B', seatNumber: '6B', status: 'sold', price: 499 },
    { id: '6C', seatNumber: '6C', status: 'available', price: 499 },
    { id: '6D', seatNumber: '6D', status: 'available', price: 499 },
    
    { id: '7A', seatNumber: '7A', status: 'available', price: 499 },
    { id: '7B', seatNumber: '7B', status: 'available', price: 499 },
    { id: '7C', seatNumber: '7C', status: 'available', price: 499 },
    { id: '7D', seatNumber: '7D', status: 'available', price: 499 },
    
    { id: '8A', seatNumber: '8A', status: 'available', price: 499 },
    { id: '8B', seatNumber: '8B', status: 'available', price: 499 },
    { id: '8C', seatNumber: '8C', status: 'available', price: 499 },
    { id: '8D', seatNumber: '8D', status: 'available', price: 499 },
    
    { id: '9A', seatNumber: '9A', status: 'available', price: 450 },
    { id: '9B', seatNumber: '9B', status: 'available', price: 450 },
    { id: '9C', seatNumber: '9C', status: 'available', price: 450 },
    { id: '9D', seatNumber: '9D', status: 'available', price: 450 },
    
    { id: '10A', seatNumber: '10A', status: 'available', price: 450 },
    { id: '10B', seatNumber: '10B', status: 'available', price: 450 },
    { id: '10C', seatNumber: '10C', status: 'available', price: 450 },
    { id: '10D', seatNumber: '10D', status: 'available', price: 450 },
    
    { id: '11A', seatNumber: '11A', status: 'available', price: 450 },
    { id: '11B', seatNumber: '11B', status: 'available', price: 450 },
    { id: '11C', seatNumber: '11C', status: 'available', price: 450 },
    { id: '11D', seatNumber: '11D', status: 'available', price: 450 },
  ];

  const handleSeatClick = (seat) => {
    if (seat.status === 'sold') return;
    
    if (selectedSeats.includes(seat.id)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat.id]);
    }
  };

  const getSeatStatusColor = (seat) => {
    if (selectedSeats.includes(seat.id)) {
      return 'bg-pink-500 text-white border-pink-500';
    }
    
    switch (seat.status) {
      case 'sold':
        return 'bg-gray-300 text-gray-600 border-gray-300 cursor-not-allowed';
      case 'available_male':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'available_female':
        return 'bg-pink-100 text-pink-700 border-pink-300';
      default:
        return 'bg-white text-gray-700 border-gray-300 hover:border-pink-500';
    }
  };

  const getTotalPrice = () => {
    return selectedSeats.reduce((total, seatId) => {
      const seat = seats.find(s => s.id === seatId);
      return total + (seat?.price || 0);
    }, 0);
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    navigate('/passenger/booking', {
      state: {
        trip: trip,
        selectedSeats: selectedSeats,
        boarding: null,
        dropping: null
      }
    });
  };

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
              <h1 className="text-lg font-bold text-gray-900">Select Seats</h1>
              <p className="text-sm text-gray-600">Choose your preferred seats</p>
            </div>
            <div className="w-8"></div>
          </div>
        </div>
      </div>

      {/* Trip Info */}
      {trip && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{trip.route?.from} → {trip.route?.to}</p>
              <p className="text-sm text-gray-600">{formatDate(trip.departureDate)}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{trip.bus?.busNumber}</p>
              <p className="text-sm text-gray-600">{formatTime(trip.departureTime)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Bus Layout */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bus Layout</h2>
          
          {/* Driver */}
          <div className="text-center mb-4">
            <div className="w-12 h-8 bg-gray-400 rounded mx-auto flex items-center justify-center">
              <span className="text-white text-xs font-medium">DRIVER</span>
            </div>
          </div>

          {/* Seats Grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {seats.map((seat) => (
              <button
                key={seat.id}
                onClick={() => handleSeatClick(seat)}
                disabled={seat.status === 'sold'}
                className={`
                  w-full h-12 rounded-lg border-2 text-xs font-medium transition-all
                  ${getSeatStatusColor(seat)}
                  ${seat.status === 'sold' ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex flex-col items-center justify-center">
                  <span>{seat.seatNumber}</span>
                  <span className="text-xs">₹{seat.price}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-pink-500 rounded border-2 border-pink-500"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white rounded border-2 border-gray-300"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 rounded border-2 border-blue-300"></div>
              <span>Male</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-300 rounded border-2 border-gray-300"></div>
              <span>Sold</span>
            </div>
          </div>
        </div>

        {/* Selected Seats Summary */}
        {selectedSeats.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Selected Seats</h2>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Seats:</span>
                <span className="font-medium text-gray-900">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Price:</span>
                <span className="text-lg font-bold text-pink-600">₹{getTotalPrice()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={selectedSeats.length === 0}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
        >
          <span>Continue to Booking</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Tap on available seats to select them. Selected seats will be highlighted in pink.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobilePassengerSeats;

