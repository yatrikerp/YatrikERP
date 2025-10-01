import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Users, 
  CreditCard, 
  CheckCircle, 
  ArrowRight,
  Clock,
  User,
  Mail,
  Phone,
  Home
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const CompleteBookingFlow = () => {
  const { tripId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Board/Drop, 2: Seats, 3: Contact, 4: Payment, 5: Ticket
  const [trip, setTrip] = useState(location.state?.trip || null);
  const [loading, setLoading] = useState(false);

  // Booking data
  const [boardingPoint, setBoardingPoint] = useState(null);
  const [droppingPoint, setDroppingPoint] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerDetails, setPassengerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'male'
  });
  const [bookingId, setBookingId] = useState(null);

  // Mock boarding/dropping points (in real app, fetch from API)
  const boardingPoints = [
    { id: 1, name: 'Central Bus Stand', address: 'Main Road, City Center', time: '06:00 AM', landmark: 'Near Railway Station' },
    { id: 2, name: 'Airport Junction', address: 'Airport Road', time: '06:30 AM', landmark: 'Airport Terminal 1' },
    { id: 3, name: 'Tech Park', address: 'IT Corridor', time: '07:00 AM', landmark: 'Opposite Mall' }
  ];

  const droppingPoints = [
    { id: 4, name: 'City Center', address: 'Downtown Area', time: '10:00 AM', landmark: 'Near Shopping Complex' },
    { id: 5, name: 'Railway Station', address: 'Station Road', time: '10:30 AM', landmark: 'Platform 1' },
    { id: 6, name: 'Bus Terminal', address: 'Terminal Road', time: '11:00 AM', landmark: 'Main Terminal' }
  ];

  // Mock seats (in real app, fetch from API)
  const allSeats = Array.from({ length: 40 }, (_, i) => ({
    id: i + 1,
    seatNumber: `${String.fromCharCode(65 + Math.floor(i / 4))}${(i % 4) + 1}`,
    type: i < 8 ? 'sleeper' : 'seater',
    price: trip?.fare || 500,
    status: Math.random() > 0.7 ? 'booked' : 'available'
  }));

  const handleSeatClick = (seat) => {
    if (seat.status === 'booked') return;
    
    setSelectedSeats(prev => {
      if (prev.find(s => s.id === seat.id)) {
        return prev.filter(s => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  };

  const handleContinueToSeats = () => {
    if (!boardingPoint || !droppingPoint) {
      toast.error('Please select both boarding and dropping points');
      return;
    }
    setCurrentStep(2);
  };

  const handleContinueToContact = () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }
    setCurrentStep(3);
  };

  const handleContinueToPayment = () => {
    if (!passengerDetails.name || !passengerDetails.email || !passengerDetails.phone) {
      toast.error('Please fill all contact details');
      return;
    }
    setCurrentStep(4);
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create booking
      const bookingData = {
        tripId: tripId,
        boardingPoint: boardingPoint,
        droppingPoint: droppingPoint,
        seats: selectedSeats,
        passengerDetails: passengerDetails,
        totalAmount: selectedSeats.reduce((sum, seat) => sum + seat.price, 0)
      };

      // In real app, call API to create booking
      // const response = await apiFetch('/api/bookings/create', {
      //   method: 'POST',
      //   body: JSON.stringify(bookingData)
      // });

      setBookingId('BK' + Date.now());
      setCurrentStep(5);
      toast.success('Booking confirmed!');
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Board/Drop Points', icon: MapPin },
              { num: 2, label: 'Select Seats', icon: Users },
              { num: 3, label: 'Contact Info', icon: User },
              { num: 4, label: 'Payment', icon: CreditCard },
              { num: 5, label: 'Ticket', icon: CheckCircle }
            ].map((step, index) => (
              <div key={step.num} className="flex items-center">
                <div className={`flex items-center ${currentStep >= step.num ? 'text-pink-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= step.num ? 'border-pink-600 bg-pink-50' : 'border-gray-300'
                  }`}>
                    {currentStep > step.num ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium hidden md:inline">{step.label}</span>
                </div>
                {index < 4 && (
                  <ArrowRight className={`mx-2 w-4 h-4 ${currentStep > step.num ? 'text-pink-600' : 'text-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Step 1: Board/Drop Points */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Select Boarding & Dropping Points</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Boarding Points */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-green-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  Boarding Point
                </h3>
                <div className="space-y-3">
                  {boardingPoints.map(point => (
                    <button
                      key={point.id}
                      onClick={() => setBoardingPoint(point)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        boardingPoint?.id === point.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="font-medium">{point.name}</div>
                      <div className="text-sm text-gray-600">{point.address}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {point.time} • {point.landmark}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dropping Points */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-red-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  Dropping Point
                </h3>
                <div className="space-y-3">
                  {droppingPoints.map(point => (
                    <button
                      key={point.id}
                      onClick={() => setDroppingPoint(point)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        droppingPoint?.id === point.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <div className="font-medium">{point.name}</div>
                      <div className="text-sm text-gray-600">{point.address}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {point.time} • {point.landmark}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleContinueToSeats}
              disabled={!boardingPoint || !droppingPoint}
              className="w-full md:w-auto px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Continue to Seat Selection <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}

        {/* Step 2: Seat Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Select Your Seats</h2>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                {allSeats.map(seat => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    disabled={seat.status === 'booked'}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      selectedSeats.find(s => s.id === seat.id)
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : seat.status === 'booked'
                        ? 'border-gray-300 bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 hover:border-pink-300'
                    }`}
                  >
                    <div className="text-xs font-medium">{seat.seatNumber}</div>
                    <div className="text-xs">₹{seat.price}</div>
                  </button>
                ))}
              </div>

              {selectedSeats.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-600">Selected Seats:</div>
                      <div className="font-semibold">{selectedSeats.map(s => s.seatNumber).join(', ')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total Amount:</div>
                      <div className="text-2xl font-bold text-pink-600">₹{totalAmount}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleContinueToContact}
                disabled={selectedSeats.length === 0}
                className="flex-1 px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                Continue to Contact Info <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={passengerDetails.name}
                    onChange={(e) => setPassengerDetails({...passengerDetails, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={passengerDetails.email}
                    onChange={(e) => setPassengerDetails({...passengerDetails, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={passengerDetails.phone}
                    onChange={(e) => setPassengerDetails({...passengerDetails, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={passengerDetails.age}
                    onChange={(e) => setPassengerDetails({...passengerDetails, age: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="Age"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <div className="flex gap-4">
                    {['male', 'female', 'other'].map(gender => (
                      <label key={gender} className="flex items-center">
                        <input
                          type="radio"
                          value={gender}
                          checked={passengerDetails.gender === gender}
                          onChange={(e) => setPassengerDetails({...passengerDetails, gender: e.target.value})}
                          className="mr-2"
                        />
                        <span className="capitalize">{gender}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleContinueToPayment}
                className="flex-1 px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center justify-center"
              >
                Continue to Payment <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Boarding:</span>
                    <span className="font-medium">{boardingPoint?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dropping:</span>
                    <span className="font-medium">{droppingPoint?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seats:</span>
                    <span className="font-medium">{selectedSeats.map(s => s.seatNumber).join(', ')}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-pink-600">₹{totalAmount}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Select Payment Method</h4>
                <div className="grid gap-3">
                  {['UPI', 'Credit/Debit Card', 'Net Banking', 'Wallet'].map(method => (
                    <button
                      key={method}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-pink-300 text-left transition-all"
                    >
                      <div className="flex items-center">
                        <CreditCard className="w-5 h-5 mr-3 text-pink-600" />
                        <span className="font-medium">{method}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1 px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-400 flex items-center justify-center"
              >
                {loading ? 'Processing...' : `Pay ₹${totalAmount}`}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Ticket/Confirmation */}
        {currentStep === 5 && (
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-600 mb-6">Your ticket has been booked successfully</p>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Booking ID</h3>
                  <span className="text-2xl font-bold text-pink-600">{bookingId}</span>
                </div>
                <div className="border-t pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Route:</span>
                    <span className="font-medium">{trip?.fromCity} → {trip?.toCity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Boarding:</span>
                    <span className="font-medium">{boardingPoint?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dropping:</span>
                    <span className="font-medium">{droppingPoint?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seats:</span>
                    <span className="font-medium">{selectedSeats.map(s => s.seatNumber).join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Passenger:</span>
                    <span className="font-medium">{passengerDetails.name}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg">
                    <span className="font-semibold">Total Paid:</span>
                    <span className="font-bold text-pink-600">₹{totalAmount}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-6">
                A confirmation email has been sent to <strong>{passengerDetails.email}</strong>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    localStorage.removeItem('pendingBooking');
                    navigate('/passenger/dashboard');
                  }}
                  className="flex-1 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center justify-center"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Print Ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteBookingFlow;

