import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Bus, MapPin, Clock, Calendar, 
  Users, CreditCard, CheckCircle, AlertCircle 
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { toast } from 'react-hot-toast';
import useMobileDetection from '../../hooks/useMobileDetection';
import MobileTripBooking from './MobileTripBooking';

const TripBooking = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();
  
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerDetails, setPassengerDetails] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: '',
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    }
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [specialRequirements, setSpecialRequirements] = useState([]);

  useEffect(() => {
    fetchTripDetails();
  }, [tripId]);

  const fetchTripDetails = async () => {
    try {
      const response = await apiFetch(`/api/booking/trip/${tripId}`);
      if (response.ok) {
        setTrip(response.data.trip);
      } else {
        toast.error('Failed to load trip details');
        navigate('/booking');
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
      toast.error('Failed to load trip details');
      navigate('/booking');
    } finally {
      setLoading(false);
    }
  };

  const generateSeats = (capacity) => {
    const seats = [];
    const rows = Math.ceil(capacity / 4);
    
    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= 4; col++) {
        const seatNumber = `${row}${String.fromCharCode(64 + col)}`;
        if (seats.length < capacity) {
          seats.push({
            number: seatNumber,
            row,
            col,
            available: Math.random() > 0.3 // Random availability for demo
          });
        }
      }
    }
    
    return seats;
  };

  const handleSeatSelect = (seatNumber) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatNumber));
    } else {
      if (selectedSeats.length < 1) { // Allow only 1 seat for now
        setSelectedSeats([...selectedSeats, seatNumber]);
      } else {
        toast.error('You can only select 1 seat');
      }
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (selectedSeats.length === 0) {
      toast.error('Please select a seat');
      return;
    }

    if (!passengerDetails.name || !passengerDetails.phone) {
      toast.error('Please fill in required passenger details');
      return;
    }

    setBookingLoading(true);
    try {
      const bookingData = {
        tripId,
        seatNumber: selectedSeats[0],
        passengerDetails,
        paymentMethod,
        specialRequirements
      };

      const response = await apiFetch('/api/booking/book', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        toast.success('Booking successful!');
        navigate(`/booking/confirmation/${response.data.booking._id}`);
      } else {
        toast.error(response.message || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Not Found</h2>
          <p className="text-gray-600 mb-4">The trip you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/booking')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const seats = generateSeats(trip.capacity?.total || trip.capacity || 35);
  const totalAmount = (trip?.fare || 250) * selectedSeats.length;

  // Use mobile booking component on mobile devices
  if (isMobile) {
    return <MobileTripBooking />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/booking')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Book Your Trip</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trip Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* RedBus Style Route Display */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
              
              <div className="relative z-10">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Bus className="w-6 h-6" />
                  Route Details
                </h2>
                
                {/* Route Display */}
                <div className="bg-white bg-opacity-15 rounded-lg p-4 backdrop-blur-sm border border-white border-opacity-20">
                  {/* From Location */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    <div>
                      <div className="text-lg font-semibold">{trip.routeId?.startingPoint}</div>
                      <div className="text-sm text-white text-opacity-80">Departure</div>
                    </div>
                  </div>

                  {/* Route Line */}
                  <div className="flex items-center gap-3 mb-3 ml-1">
                    <div className="w-0.5 h-5 bg-gradient-to-b from-green-500 to-yellow-500 rounded"></div>
                    <div className="text-sm text-white text-opacity-80 font-medium">
                      {trip.routeId?.distance} km • {trip.duration}
                    </div>
                  </div>

                  {/* To Location */}
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                    <div>
                      <div className="text-lg font-semibold">{trip.routeId?.endingPoint}</div>
                      <div className="text-sm text-white text-opacity-80">Arrival</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Trip Information */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Trip Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Bus className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{trip.routeId?.routeName}</p>
                    <p className="text-sm text-gray-600">
                      {trip.routeId?.startingPoint} → {trip.routeId?.endingPoint}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatDate(trip.serviceDate)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatTime(trip.startTime)} - {formatTime(trip.endTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {trip.availableSeats} seats available
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Bus: {trip.busId?.busNumber} ({trip.busId?.busType})
                  </span>
                </div>
              </div>
            </motion.div>

            {/* RedBus Style Route Display in Seat Selection */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl shadow-lg p-4 text-white relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full transform translate-x-4 -translate-y-4"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-semibold">{trip.routeId?.startingPoint}</span>
                  </div>
                  <div className="text-xs text-white text-opacity-80">
                    {trip.departureTime}
                  </div>
                </div>
                
                <div className="flex items-center justify-center my-2">
                  <div className="w-full h-0.5 bg-white bg-opacity-30 relative">
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-pink-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      {trip.routeId?.distance} km
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-semibold">{trip.routeId?.endingPoint}</span>
                  </div>
                  <div className="text-xs text-white text-opacity-80">
                    {trip.arrivalTime}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Seat Selection */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Seat className="w-5 h-5 text-pink-600" />
                Select Your Seat
              </h2>

              {/* Seat Legend */}
              <div className="flex justify-around mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                  <span className="text-sm text-gray-600">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-pink-600 text-white rounded flex items-center justify-center text-xs font-semibold">
                    ✓
                  </div>
                  <span className="text-sm text-gray-600">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  <span className="text-sm text-gray-600">Occupied</span>
                </div>
              </div>
              
              {/* Bus Layout */}
              <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto">
                {/* Driver Section */}
                <div className="text-center mb-6">
                  <div className="w-12 h-8 bg-gray-700 rounded mx-auto mb-2 flex items-center justify-center text-white text-xs font-semibold">
                    🚌
                  </div>
                  <div className="text-xs text-gray-500">Driver</div>
                </div>

                {/* Seat Grid */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {seats.map((seat) => (
                    <button
                      key={seat.number}
                      onClick={() => handleSeatSelect(seat.number)}
                      disabled={!seat.available}
                      className={`w-12 h-12 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        selectedSeats.includes(seat.number)
                          ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30 transform scale-105'
                          : seat.available
                          ? 'bg-white text-gray-700 hover:bg-pink-50 hover:border-pink-300 border border-gray-200 hover:shadow-md'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {seat.number}
                    </button>
                  ))}
                </div>

                {/* Door Section */}
                <div className="text-center">
                  <div className="w-16 h-10 bg-gray-600 rounded mx-auto mb-2 flex items-center justify-center text-white text-sm font-semibold">
                    DOOR
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Passenger Details */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Passenger Details</h2>
              
              <form onSubmit={handleBooking} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={passengerDetails.name}
                      onChange={(e) => setPassengerDetails({
                        ...passengerDetails,
                        name: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={passengerDetails.phone}
                      onChange={(e) => setPassengerDetails({
                        ...passengerDetails,
                        phone: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={passengerDetails.email}
                      onChange={(e) => setPassengerDetails({
                        ...passengerDetails,
                        email: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={passengerDetails.age}
                      onChange={(e) => setPassengerDetails({
                        ...passengerDetails,
                        age: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={passengerDetails.gender}
                    onChange={(e) => setPassengerDetails({
                      ...passengerDetails,
                      gender: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['card', 'upi', 'netbanking', 'wallet'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          paymentMethod === method
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs font-medium capitalize">{method}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading || selectedSeats.length === 0}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {bookingLoading ? 'Processing...' : `Book Now - ₹${totalAmount}`}
                </button>
              </form>
            </motion.div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6 sticky top-8"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
              
              {/* RedBus Style Route Display in Summary */}
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg p-4 mb-4 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white bg-opacity-10 rounded-full transform translate-x-4 -translate-y-4"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-semibold">{trip.routeId?.startingPoint}</span>
                    </div>
                    <div className="text-xs text-white text-opacity-80">
                      {trip.departureTime}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center my-2">
                    <div className="w-full h-0.5 bg-white bg-opacity-30 relative">
                      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-pink-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        {trip.routeId?.distance} km
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-semibold">{trip.routeId?.endingPoint}</span>
                    </div>
                    <div className="text-xs text-white text-opacity-80">
                      {trip.arrivalTime}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Trip Fare</span>
                  <span className="font-medium">₹{trip?.fare || 250}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Seats</span>
                  <span className="font-medium">{selectedSeats.length}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & Fees</span>
                  <span className="font-medium">₹0</span>
                </div>
                
                <hr className="my-3" />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-pink-600">₹{totalAmount}</span>
                </div>
              </div>

              {selectedSeats.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Seat {selectedSeats[0]} selected</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripBooking;
