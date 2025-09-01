import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PaymentService from '../utils/paymentService';
import { apiFetch } from '../utils/api';
import { 
  Bus, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  CreditCard, 
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  QrCode,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const Booking = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedRoute, setSelectedRoute] = useState(location.state?.selectedRoute || null);
  const [selectedDate, setSelectedDate] = useState(location.state?.selectedDate || '');
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerDetails, setPassengerDetails] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: '',
    gender: 'male'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingData, setBookingData] = useState(null);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    if (!selectedRoute) {
      navigate('/kerala-routes');
      return;
    }
    
    if (selectedDate) {
      fetchTrips();
    }
  }, [selectedRoute, selectedDate]);

  const fetchTrips = async () => {
    try {
      const response = await apiFetch(`/api/booking/route/${selectedRoute.id}/trips?date=${selectedDate}`);
      if (response.ok) {
        setTrips(response.data);
      } else {
        toast.error('Failed to fetch trips');
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Failed to fetch trips');
    }
  };

  const fetchSeats = async (tripId) => {
    try {
      const response = await apiFetch(`/api/booking/trip/${tripId}/seats`);
      if (response.ok) {
        setSeats(response.data.seats);
        setSelectedTrip(response.data.trip);
      } else {
        toast.error('Failed to fetch seat availability');
      }
    } catch (error) {
      console.error('Error fetching seats:', error);
      toast.error('Failed to fetch seat availability');
    }
  };

  const handleTripSelection = async (trip) => {
    await fetchSeats(trip.id);
    setBookingStep(2);
  };

  const handleSeatSelection = (seatNumber) => {
    setSelectedSeats(prev => 
      prev.includes(seatNumber) 
        ? prev.filter(seat => seat !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const handlePassengerDetailsChange = (field, value) => {
    setPassengerDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotalAmount = () => {
    if (!selectedTrip || selectedSeats.length === 0) return 0;
    return selectedTrip.baseFare * selectedSeats.length;
  };

  const handleCreateBooking = async () => {
    if (!selectedTrip || selectedSeats.length === 0) {
      toast.error('Please select a trip and seats');
      return;
    }

    if (!passengerDetails.name || !passengerDetails.email || !passengerDetails.phone) {
      toast.error('Please fill in all passenger details');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiFetch('/api/booking/create', {
        method: 'POST',
        body: JSON.stringify({
          tripId: selectedTrip.id,
          seatNumbers: selectedSeats,
          passengerDetails: passengerDetails,
          paymentMethod: 'razorpay'
        })
      });

      if (response.ok) {
        setBookingData(response.data);
        setBookingStep(4);
      } else {
        toast.error(response.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!bookingData?.paymentOrder) {
      toast.error('No payment order available');
      return;
    }

    try {
      await PaymentService.processPayment(bookingData.paymentOrder, passengerDetails);
      
      // Confirm booking after payment
      const confirmResponse = await apiFetch(`/api/booking/${bookingData.booking.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          paymentId: 'test_payment_id', // This would come from Razorpay response
          paymentSignature: 'test_signature'
        })
      });

      if (confirmResponse.ok) {
        setTickets(confirmResponse.data.tickets);
        setBookingStep(5);
        toast.success('Booking confirmed! Payment successful.');
      } else {
        toast.error('Failed to confirm booking');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    }
  };

  const downloadTicketPDF = async (ticketId) => {
    try {
      const response = await fetch(`/api/booking/tickets/${ticketId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket_${ticketId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error('Failed to download ticket');
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error('Failed to download ticket');
    }
  };

  const renderTripSelection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Select Your Trip</h2>
        <button
          onClick={() => navigate('/kerala-routes')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Routes</span>
        </button>
      </div>

      {/* Route Info */}
      {selectedRoute && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">{selectedRoute.routeName}</h3>
          <div className="flex items-center space-x-4 text-sm text-blue-700">
            <span>{selectedRoute.from} → {selectedRoute.to}</span>
            <span>•</span>
            <span>{selectedRoute.distance} km</span>
            <span>•</span>
            <span>₹{selectedRoute.baseFare} starting fare</span>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {trips.map((trip) => (
          <div 
            key={trip.id}
            className="border rounded-lg p-4 hover:border-pink-500 cursor-pointer transition-colors"
            onClick={() => handleTripSelection(trip)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Bus className="w-5 h-5 text-pink-500" />
                  <span className="font-semibold">{trip.busType}</span>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    {trip.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{trip.from} → {trip.to}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(trip.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{trip.time}</span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Bus: {trip.busNumber} • Capacity: {trip.capacity} seats
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-pink-600">
                  ₹{trip.baseFare}
                </div>
                <div className="text-sm text-gray-500">
                  per seat
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {trips.length === 0 && (
        <div className="text-center py-8">
          <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trips available</h3>
          <p className="text-gray-500">No trips found for the selected date.</p>
        </div>
      )}
    </div>
  );

  const renderSeatSelection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Select Seats</h2>
        <button
          onClick={() => setBookingStep(1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Trips</span>
        </button>
      </div>

      {/* Trip Info */}
      {selectedTrip && (
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-green-900 mb-2">{selectedTrip.routeName}</h3>
          <div className="flex items-center space-x-4 text-sm text-green-700">
            <span>{selectedTrip.from} → {selectedTrip.to}</span>
            <span>•</span>
            <span>{new Date(selectedTrip.date).toLocaleDateString()}</span>
            <span>•</span>
            <span>{selectedTrip.time}</span>
            <span>•</span>
            <span>Bus: {selectedTrip.busNumber}</span>
          </div>
        </div>
      )}

      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
          {seats.map((seat) => (
            <button
              key={seat.seatNumber}
              disabled={seat.isBooked}
              className={`p-2 rounded text-sm font-medium transition-colors ${
                seat.isBooked
                  ? 'bg-red-500 text-white cursor-not-allowed'
                  : selectedSeats.includes(seat.seatNumber)
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-pink-100'
              }`}
              onClick={() => handleSeatSelection(seat.seatNumber)}
            >
              {seat.seatNumber}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Selected seats: {selectedSeats.join(', ') || 'None'}
        </p>
        <div className="flex justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-white rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-pink-500 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Booked</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPassengerDetails = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Passenger Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={passengerDetails.name}
            onChange={(e) => handlePassengerDetailsChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Enter full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={passengerDetails.email}
            onChange={(e) => handlePassengerDetailsChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Enter email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={passengerDetails.phone}
            onChange={(e) => handlePassengerDetailsChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age
          </label>
          <input
            type="number"
            value={passengerDetails.age}
            onChange={(e) => handlePassengerDetailsChange('age', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Enter age"
          />
        </div>
      </div>
    </div>
  );

  const renderPaymentSummary = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Payment Summary</h2>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>From:</span>
            <span className="font-medium">{selectedTrip?.from}</span>
          </div>
          <div className="flex justify-between">
            <span>To:</span>
            <span className="font-medium">{selectedTrip?.to}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span className="font-medium">
              {selectedTrip ? new Date(selectedTrip.departure).toLocaleDateString() : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Seats:</span>
            <span className="font-medium">{selectedSeats.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span>Price per seat:</span>
            <span className="font-medium">₹{selectedTrip?.price}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total Amount:</span>
            <span className="text-pink-600">₹{calculateTotalAmount()}</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay ₹{calculateTotalAmount()}
          </>
        )}
      </button>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Payment</h2>
        <button
          onClick={() => setBookingStep(3)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Details</span>
        </button>
      </div>

      {renderPaymentSummary()}
      
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay ₹{calculateTotalAmount()}
          </>
        )}
      </button>
    </div>
  );

  const renderTicketConfirmation = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-600">
          Your payment has been processed successfully. Your tickets are ready!
        </p>
      </div>

      {/* Tickets */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Your Tickets</h3>
        {tickets.map((ticket, index) => (
          <div key={ticket.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">Ticket #{ticket.ticketNumber}</h4>
                <p className="text-sm text-gray-600">PNR: {ticket.pnr}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-pink-600">₹{ticket.fareAmount}</p>
                <p className="text-sm text-gray-500">Seat {ticket.seatNumber}</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded">
                  <img 
                    src={ticket.qrCode} 
                    alt="QR Code" 
                    className="w-16 h-16"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Scan QR code for validation</p>
                  <p className="text-xs text-gray-500">Valid until trip completion</p>
                </div>
              </div>
              <button
                onClick={() => downloadTicketPDF(ticket.id)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-semibold text-green-900 mb-2">What's Next?</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Present your QR code at boarding</li>
          <li>• Keep your ticket safe during the journey</li>
          <li>• You can view your tickets anytime in your dashboard</li>
        </ul>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => navigate('/kerala-routes')}
          className="flex-1 bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700"
        >
          Book Another Trip
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Book Tickets</h1>
      
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                bookingStep >= step 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 5 && (
                <div className={`w-16 h-1 mx-2 ${
                  bookingStep > step ? 'bg-pink-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {bookingStep === 1 && renderTripSelection()}
        {bookingStep === 2 && (
          <div className="space-y-6">
            {renderSeatSelection()}
            <div className="flex justify-between">
              <button
                onClick={() => setBookingStep(1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
              <button
                onClick={() => setBookingStep(3)}
                disabled={selectedSeats.length === 0}
                className="px-6 py-2 bg-pink-600 text-white rounded-lg disabled:opacity-50"
              >
                Continue →
              </button>
            </div>
          </div>
        )}
        {bookingStep === 3 && (
          <div className="space-y-6">
            {renderPassengerDetails()}
            <div className="flex justify-between">
              <button
                onClick={() => setBookingStep(2)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
              <button
                onClick={handleCreateBooking}
                disabled={isProcessing}
                className="px-6 py-2 bg-pink-600 text-white rounded-lg disabled:opacity-50"
              >
                {isProcessing ? 'Creating Booking...' : 'Create Booking'}
              </button>
            </div>
          </div>
        )}
        {bookingStep === 4 && renderPaymentStep()}
        {bookingStep === 5 && renderTicketConfirmation()}
      </div>
    </div>
  );
};

export default Booking;
