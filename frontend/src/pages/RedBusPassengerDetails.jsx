import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import notificationService from '../services/notificationService';

const RedBusPassengerDetails = () => {
  const { tripId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const selectedSeats = useMemo(() => state?.selectedSeats || [], [state?.selectedSeats]);
  const boarding = state?.boarding || null;
  const dropping = state?.dropping || null;
  const trip = state?.trip || null;
  
  const [contactDetails, setContactDetails] = useState({
    phone: '',
    email: '',
    countryCode: '+91',
    state: '',
    whatsappUpdates: true
  });
  
  const [passengers, setPassengers] = useState(() => {
    const count = Math.max(1, selectedSeats.length || 1);
    return Array.from({ length: count }, (_, i) => ({
      name: '',
      age: '',
      gender: '',
      seat: selectedSeats[i] || `Seat ${i + 1}`
    }));
  });
  
  const [assurance, setAssurance] = useState('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updatePassenger = (index, field, value) => {
    setPassengers(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const updateContact = (field, value) => {
    setContactDetails(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    const baseFare = trip?.fare || 0;
    const seatCount = passengers.length;
    const assuranceAmount = assurance === 'protect' ? 50 : 0;
    return (baseFare * seatCount) + assuranceAmount;
  };

  const handleContinue = async () => {
    // Validate form
    if (!contactDetails.phone || !contactDetails.email) {
      setError('Please fill in contact details');
      return;
    }

    const invalidPassengers = passengers.filter(p => !p.name || !p.age || !p.gender);
    if (invalidPassengers.length > 0) {
      setError('Please fill in all passenger details');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create booking
      const bookingData = {
        tripId: tripId,
        routeId: tripId,
        busId: tripId,
        depotId: tripId,
        customer: {
          name: passengers[0].name,
          email: contactDetails.email,
          phone: contactDetails.phone,
          age: parseInt(passengers[0].age),
          gender: passengers[0].gender
        },
        journey: {
          from: trip?.fromCity || 'Origin',
          to: trip?.toCity || 'Destination',
          departureDate: new Date(trip?.serviceDate || new Date()),
          departureTime: trip?.startTime || '08:00',
          arrivalDate: new Date(trip?.serviceDate || new Date()),
          arrivalTime: trip?.endTime || '12:00',
          duration: 240,
          boardingPoint: boarding?.title || 'Central Bus Stand',
          droppingPoint: dropping?.title || 'Central Bus Stand'
        },
        seats: passengers.map((p, idx) => ({
          seatNumber: p.seat,
          seatType: 'seater',
          seatPosition: 'window',
          price: trip?.fare || 0,
          passengerName: p.name,
          passengerAge: parseInt(p.age),
          passengerGender: p.gender
        })),
        pricing: {
          baseFare: trip?.fare || 0,
          seatFare: (trip?.fare || 0) * (passengers.length - 1),
          taxes: { gst: 0, serviceTax: 0, other: 0 },
          discounts: { earlyBird: 0, loyalty: 0, promo: 0, other: 0 },
          totalAmount: calculateTotal(),
          paidAmount: 0,
          refundAmount: 0
        },
        payment: {
          method: 'upi',
          paymentStatus: 'pending'
        },
        status: 'pending',
        source: 'web'
      };

      const res = await apiFetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (res.ok) {
        const bookingId = res.data?.data?.bookingId || res.data?.bookingId;
        navigate('/redbus/payment', {
          state: {
            trip,
            passengers,
            contactDetails,
            selectedSeats,
            boarding,
            dropping,
            bookingId,
            totalAmount: calculateTotal()
          }
        });
      } else {
        setError('Failed to create booking. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Trip details not found</div>
          <button 
            onClick={() => navigate('/redbus')}
            className="bg-red-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Passenger Details</h1>
            </div>
            <div className="text-sm text-gray-600">
              Step 3 of 4
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Contact Details</h2>
                <p className="text-sm text-gray-600 mt-1">We'll use this to send you booking confirmation</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <select 
                    value={contactDetails.countryCode}
                    onChange={(e) => updateContact('countryCode', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="+91">+91 (IND)</option>
                    <option value="+1">+1 (USA)</option>
                    <option value="+44">+44 (UK)</option>
                  </select>
                  <input 
                    type="tel"
                    value={contactDetails.phone}
                    onChange={(e) => updateContact('phone', e.target.value)}
                    placeholder="Phone Number"
                    className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <input 
                  type="email"
                  value={contactDetails.email}
                  onChange={(e) => updateContact('email', e.target.value)}
                  placeholder="Email ID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <select 
                  value={contactDetails.state}
                  onChange={(e) => updateContact('state', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Select State of Residence</option>
                  <option value="kerala">Kerala</option>
                  <option value="tamil-nadu">Tamil Nadu</option>
                  <option value="karnataka">Karnataka</option>
                  <option value="maharashtra">Maharashtra</option>
                </select>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      id="whatsapp"
                      checked={contactDetails.whatsappUpdates}
                      onChange={(e) => updateContact('whatsappUpdates', e.target.checked)}
                      className="sr-only"
                    />
                    <label 
                      htmlFor="whatsapp"
                      className={`block w-12 h-6 rounded-full cursor-pointer transition-colors ${
                        contactDetails.whatsappUpdates ? 'bg-pink-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        contactDetails.whatsappUpdates ? 'translate-x-7' : 'translate-x-1'
                      }`}></div>
                    </label>
                  </div>
                  <span className="text-sm text-gray-600">
                    Send booking details and trip updates on WhatsApp
                  </span>
                </div>
              </div>
            </div>

            {/* Passenger Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Passenger Details</h2>
                <p className="text-sm text-gray-600 mt-1">Enter details for all passengers</p>
              </div>
              <div className="p-6 space-y-6">
                {passengers.map((passenger, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">Passenger {index + 1}</h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Seat {passenger.seat}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input 
                        type="text"
                        value={passenger.name}
                        onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                        placeholder="Full Name"
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      />
                      <input 
                        type="number"
                        value={passenger.age}
                        onChange={(e) => updatePassenger(index, 'age', e.target.value)}
                        placeholder="Age"
                        min="1"
                        max="120"
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      />
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input 
                            type="radio"
                            name={`gender-${index}`}
                            value="male"
                            checked={passenger.gender === 'male'}
                            onChange={(e) => updatePassenger(index, 'gender', e.target.value)}
                            className="text-pink-600 focus:ring-pink-500"
                          />
                          <span className="text-sm">Male</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="radio"
                            name={`gender-${index}`}
                            value="female"
                            checked={passenger.gender === 'female'}
                            onChange={(e) => updatePassenger(index, 'gender', e.target.value)}
                            className="text-pink-600 focus:ring-pink-500"
                          />
                          <span className="text-sm">Female</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Travel Assurance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Travel Assurance</h2>
                <p className="text-sm text-gray-600 mt-1">Protect your journey with redBus Assurance</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Trip Protection</div>
                      <div className="text-sm text-gray-600">Get ₹{calculateTotal()} if your bus gets cancelled</div>
                    </div>
                    <div className="text-lg font-bold text-green-600">₹50</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="radio"
                        name="assurance"
                        value="protect"
                        checked={assurance === 'protect'}
                        onChange={(e) => setAssurance(e.target.value)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="font-medium">Yes, protect my trip</span>
                    </div>
                    <span className="text-sm text-gray-500">₹50</span>
                  </label>
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="radio"
                        name="assurance"
                        value="none"
                        checked={assurance === 'none'}
                        onChange={(e) => setAssurance(e.target.value)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="font-medium">Don't add Assurance</span>
                    </div>
                    <span className="text-sm text-gray-500">Free</span>
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-600 text-sm">{error}</div>
              </div>
            )}
          </div>

          {/* Right: Trip Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <div className="text-sm text-gray-500 mb-2">Trip Summary</div>
              <div className="text-lg font-semibold text-gray-900 mb-3">{trip.routeName}</div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">From</span>
                  <span className="font-medium">{trip.fromCity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To</span>
                  <span className="font-medium">{trip.toCity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">
                    {new Date(trip.serviceDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Departure</span>
                  <span className="font-medium">{trip.startTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Arrival</span>
                  <span className="font-medium">{trip.endTime}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-900 mb-2">Selected Seats</div>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((seat, index) => (
                    <span key={index} className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-xs font-medium">
                      {seat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-900 mb-2">Boarding & Drop Points</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Boarding</span>
                    <span className="font-medium">{boarding?.title || 'Central Bus Stand'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dropping</span>
                    <span className="font-medium">{dropping?.title || 'Central Bus Stand'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Fare ({passengers.length} seat{passengers.length > 1 ? 's' : ''})</span>
                  <span>₹{(trip.fare || 0) * passengers.length}</span>
                </div>
                {assurance === 'protect' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Travel Assurance</span>
                    <span>₹50</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes & Fees</span>
                  <span>₹0</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="text-xl font-bold text-pink-600">₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleContinue}
                disabled={loading}
                className="mt-6 w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Payment</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedBusPassengerDetails;
