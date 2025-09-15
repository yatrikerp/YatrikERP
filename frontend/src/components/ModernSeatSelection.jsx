import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { ArrowLeft, X } from 'lucide-react';
import './ModernSeatSelection.css';

const ModernSeatSelection = ({ 
  trip, 
  selectedSeats, 
  onSeatSelect, 
  onBack, 
  onContinue,
  passengerGender = 'male' 
}) => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seatPrice, setSeatPrice] = useState(trip?.fare || 499);

  useEffect(() => {
    console.log('🎫 ModernSeatSelection received trip:', trip);
    if (trip?.fare) {
      setSeatPrice(trip.fare);
    }
    if (trip?.id || trip?._id) {
      fetchSeats();
    } else {
      console.warn('⚠️ No trip ID found in trip object:', trip);
    }
  }, [trip?.id, trip?._id, trip?.fare]);

  const fetchSeats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tripDate = trip.serviceDate || trip.date || new Date().toISOString().split('T')[0];
      const tripId = trip.id || trip._id;
      console.log('🔍 Fetching seats for trip:', tripId, 'Date:', tripDate);
      const response = await apiFetch(`/api/seats/trip/${tripId}?date=${tripDate}`);
      
      if (response.ok) {
        console.log('✅ Seat data received:', response.data);
        setSeats(response.data.seats || []);
        // Use trip fare if available, otherwise fall back to API response
        const price = trip?.fare || response.data.tripFare || response.data.seatPrice || 499;
        setSeatPrice(price);
        console.log('💰 Seat price set to:', price, 'from trip fare:', trip?.fare, 'API tripFare:', response.data.tripFare);
      } else {
        console.error('❌ Seat API error:', response);
        setError(`Failed to load seat information: ${response.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error fetching seats:', err);
      setError('Failed to load seat information');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.status === 'available' || seat.status === 'available_male' || seat.status === 'available_female') {
      onSeatSelect(seat.seatNumber);
    }
  };

  const getSeatStatus = (seat) => {
    if (seat.status === 'booked' || seat.status === 'booked_male' || seat.status === 'booked_female') return 'booked';
    if (selectedSeats.includes(seat.seatNumber)) return 'selected';
    if (seat.status === 'available_male') return passengerGender === 'male' ? 'available' : 'restricted_male';
    if (seat.status === 'available_female') return passengerGender === 'female' ? 'available' : 'restricted_female';
    return 'available';
  };

  const getSeatClasses = (seat) => {
    const status = getSeatStatus(seat);
    const baseClasses = "w-12 h-12 rounded border-2 flex items-center justify-center text-sm font-bold cursor-pointer relative transition-all duration-200";
    
    switch (status) {
      case 'available':
        if (seat.status === 'available_male') return `${baseClasses} bg-white border-blue-400 text-blue-700 hover:bg-blue-50`;
        if (seat.status === 'available_female') return `${baseClasses} bg-white border-pink-400 text-pink-700 hover:bg-pink-50`;
        return `${baseClasses} bg-white border-gray-300 text-gray-700 hover:bg-gray-50`;
      case 'selected':
        // Gender-based selection colors
        if (passengerGender === 'male') {
          return `${baseClasses} bg-blue-600 border-blue-700 text-white`;
        } else {
          return `${baseClasses} bg-pink-600 border-pink-700 text-white`;
        }
      case 'booked':
        return `${baseClasses} bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed`;
      case 'restricted_male':
      case 'restricted_female':
        return `${baseClasses} bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50`;
      default:
        return `${baseClasses} bg-white border-gray-300 text-gray-700 hover:bg-gray-50`;
    }
  };

  const getSeatIcon = (seat) => {
    const status = getSeatStatus(seat);
    
    // Simple seat number display - more professional
    if (seat.status === 'available_male' || seat.status === 'booked_male') {
      return (
        <div className="flex items-center justify-center relative">
          <span className="text-sm font-semibold">{seat.seatNumber}</span>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">♂</span>
          </div>
        </div>
      );
    }
    
    if (seat.status === 'available_female' || seat.status === 'booked_female') {
      return (
        <div className="flex items-center justify-center relative">
          <span className="text-sm font-semibold">{seat.seatNumber}</span>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">♀</span>
          </div>
        </div>
      );
    }
    
    // Default - just show seat number
    return <span className="text-sm font-semibold">{seat.seatNumber}</span>;
  };

  const renderBusLayout = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <span className="ml-3 text-gray-600">Loading seats...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-20 text-red-600">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-medium">{error}</p>
          </div>
        </div>
      );
    }

    // Group seats by rows (2+2 configuration)
    const rows = [];
    for (let i = 0; i < seats.length; i += 4) {
      rows.push(seats.slice(i, i + 4));
    }

    return (
      <div className="p-6">
        {/* Driver area */}
        <div className="flex justify-end mb-8 pr-8">
          <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            <span className="text-sm font-medium text-gray-600">Driver</span>
          </div>
        </div>

        {/* Seat Layout */}
        <div className="space-y-4">
          {rows.map((rowSeats, rowIndex) => {
            const leftSeats = rowSeats.slice(0, 2);
            const rightSeats = rowSeats.slice(2, 4);
            
            return (
              <div key={rowIndex} className="flex items-center justify-center">
                <div className="flex space-x-6">
                  {/* Left side seats (2 seats) */}
                  <div className="flex space-x-3">
                    {leftSeats.map((seat) => (
                      <div key={seat.seatNumber} className="text-center">
                        <button
                          onClick={() => handleSeatClick(seat)}
                          className={getSeatClasses(seat)}
                          disabled={seat.status === 'booked' || seat.status === 'booked_male' || seat.status === 'booked_female'}
                          title={`Seat ${seat.seatNumber} - ${seat.status}`}
                        >
                          {getSeatIcon(seat)}
                        </button>
                        <div className="seat-price">
                          {seat.status === 'booked' || seat.status === 'booked_male' || seat.status === 'booked_female' 
                            ? 'Sold' 
                            : `₹${seatPrice}`
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Aisle */}
                  <div className="aisle-separator w-16"></div>
                  
                  {/* Right side seats (2 seats) */}
                  <div className="flex space-x-3">
                    {rightSeats.map((seat) => (
                      <div key={seat.seatNumber} className="text-center">
                        <button
                          onClick={() => handleSeatClick(seat)}
                          className={getSeatClasses(seat)}
                          disabled={seat.status === 'booked' || seat.status === 'booked_male' || seat.status === 'booked_female'}
                          title={`Seat ${seat.seatNumber} - ${seat.status}`}
                        >
                          {getSeatIcon(seat)}
                        </button>
                        <div className="seat-price">
                          {seat.status === 'booked' || seat.status === 'booked_male' || seat.status === 'booked_female' 
                            ? 'Sold' 
                            : `₹${seatPrice}`
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const totalAmount = selectedSeats.length * seatPrice;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {trip?.fromCity || trip?.routeName || 'Kottayam'} → {trip?.toCity || 'Thiruvananthapuram'}
                </h1>
              </div>
            </div>
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Trip Info & Seat Legend */}
          <div className="lg:col-span-1 space-y-6">
            {/* Trip Information */}
            {trip && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">4.4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Madhavi Travels</h3>
                    <p className="text-sm text-gray-500">A Rising Star on redBus</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">04:50 - 07:30</span>
                    <span>Wed 17 Sep</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Volvo A/C Semi Sleeper (2+2)
                  </div>
                </div>
              </div>
            )}

            {/* Seat Legend */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Seat Types</h3>
              <div className="space-y-4">
                <div className="legend-item flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">01</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Available</p>
                    <p className="text-xs text-gray-500">₹{seatPrice}</p>
                  </div>
                </div>
                
                <div className="legend-item flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white border-2 border-blue-400 rounded flex items-center justify-center relative">
                    <span className="text-xs font-bold text-blue-700">02</span>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">♂</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Male Only</p>
                    <p className="text-xs text-gray-500">₹{seatPrice}</p>
                  </div>
                </div>
                
                <div className="legend-item flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white border-2 border-pink-400 rounded flex items-center justify-center relative">
                    <span className="text-xs font-bold text-pink-700">03</span>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">♀</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Female Only</p>
                    <p className="text-xs text-gray-500">₹{seatPrice}</p>
                  </div>
                </div>

                {/* Selection Colors */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-800 mb-3">Selection Colors</p>
                  
                  <div className="legend-item flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-600 border-2 border-blue-700 rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-white">M</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Male Selection</p>
                      <p className="text-xs text-gray-500">Blue when male selects</p>
                    </div>
                  </div>
                  
                  <div className="legend-item flex items-center space-x-3">
                    <div className="w-8 h-8 bg-pink-600 border-2 border-pink-700 rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-white">F</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Female Selection</p>
                      <p className="text-xs text-gray-500">Pink when female selects</p>
                    </div>
                  </div>
                </div>
                
                <div className="legend-item flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 border-2 border-gray-300 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-500">04</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Sold</p>
                    <p className="text-xs text-gray-500">Unavailable</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Seat Layout */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-8">
                    <div className="text-pink-600 font-semibold border-b-2 border-pink-600 pb-2">
                      1. Select seats
                    </div>
                    <div className="text-gray-500 font-medium">2. Board/Drop point</div>
                    <div className="text-gray-500 font-medium">3. Passenger Info</div>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {seats.filter(s => s.status === 'available' || s.status === 'available_male' || s.status === 'available_female').length} seats available
                  </div>
                </div>
              </div>
              
              {renderBusLayout()}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedSeats.length > 0 
                    ? `${selectedSeats.length} seats selected` 
                    : 'No seats selected'
                  }
                </p>
                {selectedSeats.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Seats: {selectedSeats.join(', ')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">
                  ₹{totalAmount}
                </div>
                {selectedSeats.length > 0 && (
                  <div className="text-sm text-gray-500">
                    {selectedSeats.length} × ₹{seatPrice}
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={onContinue}
              disabled={selectedSeats.length === 0}
              className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Select boarding & dropping points
            </button>
          </div>
        </div>
      </div>

      {/* Add bottom padding to account for fixed action bar */}
      <div className="h-20"></div>
    </div>
  );
};

export default ModernSeatSelection;
