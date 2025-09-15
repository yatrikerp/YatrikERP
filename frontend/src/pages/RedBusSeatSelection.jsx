import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, CheckCircle, MapPin, Clock } from 'lucide-react';
import { apiFetch } from '../utils/api';

const RedBusSeatSelection = () => {
  const { tripId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const trip = state?.trip || {};
  const searchData = state?.searchData || {};
  const boardingPoint = state?.boardingPoint || {};
  const dropPoint = state?.dropPoint || {};
  
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seatPrice, setSeatPrice] = useState(499);

  useEffect(() => {
    fetchSeats();
  }, [tripId]);

  const fetchSeats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tripDate = trip.serviceDate || trip.date || new Date().toISOString().split('T')[0];
      const tripIdToUse = trip.id || trip._id || tripId;
      
      console.log('🔍 Fetching seats for trip:', tripIdToUse, 'Date:', tripDate);
      const response = await apiFetch(`/api/seats/trip/${tripIdToUse}?date=${tripDate}`);
      
      if (response.ok) {
        console.log('✅ Seat data received:', response.data);
        setSeats(response.data.seats || []);
        setSeatPrice(response.data.seatPrice || trip.fare || 499);
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
      setSelectedSeats(prev => {
        if (prev.includes(seat.seatNumber)) {
          return prev.filter(s => s !== seat.seatNumber);
        } else {
          return [...prev, seat.seatNumber];
        }
      });
    }
  };

  const getSeatClasses = (seat) => {
    const baseClasses = "relative w-12 h-12 rounded-lg border-2 transition-all duration-200 flex items-center justify-center text-sm font-bold cursor-pointer shadow-sm hover:shadow-md";
    
    if (selectedSeats.includes(seat.seatNumber)) {
      return `${baseClasses} bg-red-500 border-red-600 text-white shadow-lg transform scale-105`;
    }
    
    switch (seat.status) {
      case 'available':
        return `${baseClasses} bg-green-500 border-green-600 text-white hover:bg-green-600`;
      case 'available_male':
        return `${baseClasses} bg-blue-500 border-blue-600 text-white hover:bg-blue-600`;
      case 'available_female':
        return `${baseClasses} bg-pink-500 border-pink-600 text-white hover:bg-pink-600`;
      case 'booked':
      case 'booked_male':
      case 'booked_female':
        return `${baseClasses} bg-gray-300 border-gray-400 text-gray-600 cursor-not-allowed opacity-75`;
      default:
        return `${baseClasses} bg-gray-100 border-gray-300 text-gray-600`;
    }
  };

  // Professional Bus Seat Icon Component (U-shaped from above)
  const SeatIcon = ({ status, seatStatus }) => {
    const iconColor = status === 'selected' ? 'text-white' : 
                     status === 'available' ? 'text-green-600' :
                     status === 'booked' ? 'text-gray-500' : 'text-gray-400';
    
    return (
      <svg 
        className={`w-8 h-8 ${iconColor}`} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        {/* U-shaped bus seat outline (view from above) - rounded top, flat bottom */}
        <path d="M4 6c0-1 1-2 2-2h12c1 0 2 1 2 2v10c0 1-1 2-2 2H6c-1 0-2-1-2-2V6z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 6c0-1 1-2 2-2h12c1 0 2 1 2 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  const getSeatIcon = (seat) => {
    if (selectedSeats.includes(seat.seatNumber)) {
      return <User className="w-5 h-5 text-white" />;
    }
    
    if (seat.status === 'available_male' || seat.status === 'booked_male') {
      return (
        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-bold text-sm">♂</span>
        </div>
      );
    }
    
    if (seat.status === 'available_female' || seat.status === 'booked_female') {
      return (
        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
          <span className="text-pink-600 font-bold text-sm">♀</span>
        </div>
      );
    }
    
    // For available seats, show seat icon
    if (seat.status === 'available') {
      return <SeatIcon status="available" seatStatus={seat.status} />;
    }
    
    return <SeatIcon status="booked" seatStatus={seat.status} />;
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    navigate(`/redbus/passenger-details/${tripId}`, {
      state: {
        trip,
        searchData,
        boardingPoint,
        dropPoint,
        selectedSeats,
        seatPrice
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

  // Group seats by rows
  const seatsPerRow = seats.length <= 35 ? 5 : seats.length <= 45 ? 5 : 4;
  const rows = [];
  for (let i = 0; i < seats.length; i += seatsPerRow) {
    rows.push(seats.slice(i, i + seatsPerRow));
  }

  const totalAmount = selectedSeats.length * seatPrice;

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/redbus/board-drop/${tripId}`, { state: { trip, searchData, boardingPoint, dropPoint } })}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Boarding Points</span>
            </button>
            <div className="text-sm text-gray-600">
              Step 3 of 4
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
              <div className="text-2xl font-bold text-gray-900">₹{seatPrice}</div>
              <div className="text-sm text-gray-600">per seat</div>
            </div>
          </div>
        </div>

        {/* Seat Legend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seat Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 border-2 border-green-600 rounded-lg flex items-center justify-center">
                <SeatIcon status="available" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Available</p>
                <p className="text-xs text-gray-500">₹{seatPrice}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 border-2 border-blue-600 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">♂</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Male Only</p>
                <p className="text-xs text-gray-500">₹{seatPrice}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-pink-500 border-2 border-pink-600 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-pink-600 font-bold text-sm">♀</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Female Only</p>
                <p className="text-xs text-gray-500">₹{seatPrice}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 border-2 border-gray-400 rounded-lg flex items-center justify-center opacity-75">
                <span className="text-gray-600 text-sm font-bold">01</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Sold</p>
                <p className="text-xs text-gray-500">Unavailable</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bus Layout */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Select Seats</h3>
            <div className="text-sm text-gray-500">
              Total Seats: {seats.length} | Available: {seats.filter(s => s.status === 'available' || s.status === 'available_male' || s.status === 'available_female').length}
            </div>
          </div>

          {/* Driver Area with Steering Wheel */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
              <span className="text-sm font-medium text-gray-600">Front of Bus</span>
            </div>
          </div>

          {/* Seat Layout */}
          <div className="space-y-4">
            {rows.map((rowSeats, rowIndex) => {
              const leftSeats = seatsPerRow === 5 ? rowSeats.slice(0, 3) : rowSeats.slice(0, 2);
              const rightSeats = seatsPerRow === 5 ? rowSeats.slice(3, 5) : rowSeats.slice(2, 4);
              
              return (
                <div key={rowIndex} className="flex items-center justify-center space-x-6">
                  {/* Left side seats */}
                  <div className="flex space-x-3">
                    {leftSeats.map((seat) => (
                      <div key={seat.seatNumber} className="text-center">
                        <button
                          onClick={() => handleSeatClick(seat)}
                          className={getSeatClasses(seat)}
                          disabled={seat.status === 'booked' || seat.status === 'booked_male' || seat.status === 'booked_female'}
                          title={`Seat ${seat.seatNumber} - ${seat.status}`}
                        >
                          {getSeatIcon(seat) || seat.seatNumber}
                        </button>
                        <div className="text-xs text-gray-600 mt-1 font-medium">
                          {seat.status === 'booked' || seat.status === 'booked_male' || seat.status === 'booked_female' 
                            ? 'Sold' 
                            : `₹${seatPrice}`
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Aisle */}
                  <div className="w-12 h-8 flex items-center justify-center">
                    <div className="w-full h-1 bg-gray-200 rounded"></div>
                  </div>
                  
                  {/* Right side seats */}
                  <div className="flex space-x-3">
                    {rightSeats.map((seat) => (
                      <div key={seat.seatNumber} className="text-center">
                        <button
                          onClick={() => handleSeatClick(seat)}
                          className={getSeatClasses(seat)}
                          disabled={seat.status === 'booked' || seat.status === 'booked_male' || seat.status === 'booked_female'}
                          title={`Seat ${seat.seatNumber} - ${seat.status}`}
                        >
                          {getSeatIcon(seat) || seat.seatNumber}
                        </button>
                        <div className="text-xs text-gray-600 mt-1 font-medium">
                          {seat.status === 'booked' || seat.status === 'booked_male' || seat.status === 'booked_female' 
                            ? 'Sold' 
                            : `₹${seatPrice}`
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selection Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-800">Selected Seats</h4>
              <p className="text-sm text-gray-600">
                {selectedSeats.length > 0 
                  ? `Seats: ${selectedSeats.join(', ')}` 
                  : 'No seats selected'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-800">
                Total: ₹{totalAmount}
              </div>
              <div className="text-sm text-gray-500">
                {selectedSeats.length} {selectedSeats.length === 1 ? 'seat' : 'seats'}
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-end">
          <button
            onClick={handleContinue}
            disabled={selectedSeats.length === 0}
            className="bg-pink-600 text-white px-8 py-3 rounded-lg hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            Continue to Passenger Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedBusSeatSelection;
