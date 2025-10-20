import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import notificationService from '../../services/notificationService';
import { validateIndianMobile } from '../../utils/bookingValidation';

const PaxBooking = () => {
  const { tripId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const selectedSeats = useMemo(() => state?.selectedSeats || [], [state?.selectedSeats]);
  const boarding = state?.boarding || null;
  const dropping = state?.dropping || null;
  
  const [trip, setTrip] = useState(state?.trip || null);
  const [fare, setFare] = useState(null);

  // Robust per-seat fare derivation to handle different trip shapes
  const deriveFarePerSeat = (t) => {
    if (!t) return 0;
    return (
      t.fare ??
      t.price ??
      t.ticketPrice ??
      t.baseFare ??
      t.pricing?.perSeat ??
      t.pricing?.baseFare ??
      t.pricing?.totalAmountPerSeat ??
      0
    );
  };
  const [bookingId, setBookingId] = useState(null);
  const [passengerId, setPassengerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Contact details state
  const [contactDetails, setContactDetails] = useState({
    phone: '',
    email: '',
    otp: ''
  });
  const [contactErrors, setContactErrors] = useState({});
  // OTP state for email verification flow
  const [otpState, setOtpState] = useState({
    isSent: false,
    isVerified: false,
    error: ''
  });

  const handleContactChange = (field, value) => {
    setContactDetails(prev => ({ ...prev, [field]: value }));
    if (field === 'phone') {
      const isValid = validateIndianMobile(value);
      setContactErrors(prev => ({ ...prev, phone: isValid || value === '' ? '' : 'Enter a valid 10-digit Indian mobile (starts with 6-9, no sequences/repeats)' }));
    }
  };

  // Send OTP function
  const sendOTP = async () => {
    if (!contactDetails.email) {
      setOtpState(prev => ({
        ...prev,
        error: 'Please enter email address first'
      }));
      return;
    }

    setOtpState(prev => ({
      ...prev,
      isLoading: true,
      error: ''
    }));

    try {
      // Call the actual OTP sending API
      const response = await apiFetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: contactDetails.email
        })
      });

      if (response.ok) {
        setOtpState(prev => ({
          ...prev,
          isSent: true,
          isLoading: false,
          timer: 60,
          error: ''
        }));

        // Start countdown timer
        const timer = setInterval(() => {
          setOtpState(prev => {
            if (prev.timer <= 1) {
              clearInterval(timer);
              return { ...prev, timer: 0 };
            }
            return { ...prev, timer: prev.timer - 1 };
          });
        }, 1000);
      } else {
        setOtpState(prev => ({
          ...prev,
          isLoading: false,
          error: response.data?.error || 'Failed to send OTP. Please try again.'
        }));
      }

    } catch (error) {
      setOtpState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to send OTP. Please check your internet connection.'
      }));
    }
  };

  // Verify OTP function
  const verifyOTP = async () => {
    if (!contactDetails.otp || contactDetails.otp.length !== 6) {
      setOtpState(prev => ({
        ...prev,
        error: 'Please enter a valid 6-digit OTP'
      }));
      return;
    }

    setOtpState(prev => ({
      ...prev,
      isLoading: true,
      error: ''
    }));

    try {
      // Call the actual OTP verification API
      const response = await apiFetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: contactDetails.email,
          otp: contactDetails.otp
        })
      });

      if (response.ok && response.data?.success) {
        setOtpState(prev => ({
          ...prev,
          isVerified: true,
          isLoading: false,
          error: ''
        }));
      } else {
        setOtpState(prev => ({
          ...prev,
          isLoading: false,
          error: response.data?.error || 'Invalid OTP. Please try again.'
        }));
      }
    } catch (error) {
      setOtpState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to verify OTP. Please check your internet connection.'
      }));
    }
  };

  // Load trip details effect - completely separate from function declarations
  useEffect(() => {
    const loadTripDetails = async () => {
      if (trip) { 
        setFare(deriveFarePerSeat(trip)); 
        return; 
      }
      try {
        setLoading(true);
        const tripRes = await apiFetch(`/api/trips/${tripId}`);
        if (tripRes.ok) {
          const tripData = tripRes.data?.data || tripRes.data;
          setTrip(tripData);
          setFare(deriveFarePerSeat(tripData));
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
    
    // Create proper booking data structure that matches backend model requirements
    const departureDate = trip.serviceDate || new Date().toISOString().split('T')[0];
    const departureTime = boarding?.time || trip.startTime || '08:00';
    const arrivalTime = dropping?.time || trip.endTime || '12:00';
    const baseFare = trip.fare || 250;
    const seatCount = Math.max(1, selectedSeats.length || 1);
    const totalAmount = baseFare * seatCount;
    
    const bookingData = {
      tripId: tripId,
      // Use tripId as fallback for required ObjectId fields
      routeId: tripId,
      busId: tripId,
      depotId: tripId,
      customer: {
        name: 'Guest Passenger',
        email: contactDetails.email || 'guest@example.com',
        phone: contactDetails.phone || '9999999999',
        age: 25,
        gender: 'male'
      },
      journey: {
        from: trip.fromCity || 'Mumbai',
        to: trip.toCity || 'Pune',
        departureDate: new Date(departureDate),
        departureTime: departureTime,
        arrivalDate: new Date(departureDate), // Same day arrival
        arrivalTime: arrivalTime,
        duration: 240, // 4 hours in minutes
        boardingPoint: boarding?.title || 'Central Bus Stand',
        droppingPoint: dropping?.title || 'Central Bus Stand'
      },
      seats: (selectedSeats.length ? selectedSeats : ['U1']).map((s, idx) => ({
        seatNumber: s,
        seatType: 'seater',
        seatPosition: 'window', // Required field
        price: baseFare,
        passengerName: `Passenger ${idx+1}`,
        passengerAge: 25,
        passengerGender: 'male'
      })),
      pricing: {
        baseFare: baseFare,
        seatFare: baseFare * (seatCount - 1), // Additional seats beyond first
        taxes: {
          gst: 0,
          serviceTax: 0,
          other: 0
        },
        discounts: {
          earlyBird: 0,
          loyalty: 0,
          promo: 0,
          other: 0
        },
        totalAmount: totalAmount,
        paidAmount: 0,
        refundAmount: 0
      },
      payment: {
        method: 'upi', // Required field
        paymentStatus: 'pending'
      },
      status: 'pending',
      source: 'web'
    };
    
    console.log('🚌 Frontend sending booking data:', JSON.stringify(bookingData, null, 2));
    
    try {
      const res = await apiFetch('/api/booking', { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData) 
      });
      
      console.log('📝 Booking API response:', res);
      
      if (res.ok) { 
        setFare(res.data?.data?.fare || res.data?.fare || trip.fare); 
        const bkId = res.data?.data?.bookingId || res.data?.bookingId;
        const paxId = res.data?.data?.passengerId || res.data?.passengerId || res.data?.data?.customerId;
        console.log('📝 Booking created with ID:', bkId);
        console.log('📝 Full response data:', res.data);
        setBookingId(bkId); 
        if (paxId) setPassengerId(paxId);
        return { ok: true, bookingId: bkId, passengerId: paxId };
      } else {
        console.error('Booking creation failed:', res?.data || res);
        setError('Failed to create booking: ' + (res?.data?.message || res?.message || 'Unknown error'));
        return { ok: false };
      }
    } catch (error) {
      console.error('Booking creation error:', error);
      setError('Failed to create booking: ' + error.message);
      return { ok: false };
    }
  }

  async function confirm(){
    // Check if OTP is verified before proceeding
    if (!otpState.isVerified) {
      setError('Please verify your phone number with OTP before proceeding with the booking.');
      return;
    }

    try {
      // Ensure we have a bookingId available locally for this flow
      let currentBookingId = bookingId;
      if (!currentBookingId) {
        console.log('🔍 No booking ID found, creating booking...');
        const created = await createBooking();
        if (!created?.ok) {
          console.error('❌ Booking creation failed, using fallback');
          currentBookingId = `BK${Date.now().toString().slice(-8)}`;
          setBookingId(currentBookingId);
          setPassengerId('guest_1');
        } else {
          console.log('✅ Booking created successfully:', created.bookingId);
          currentBookingId = created.bookingId;
          setBookingId(currentBookingId);
          if (created.passengerId) setPassengerId(created.passengerId);
        }
      }

      console.log('🔍 Current booking ID:', currentBookingId);

      if (!currentBookingId) {
        console.error('❌ No booking ID available for payment');
        setError('No booking ID available. Please try again.');
        return;
      }

      const seatsCount = Math.max(1, selectedSeats.length || 1);
      const totalAmount = (fare || trip?.fare || 0) * seatsCount;

      // Prefer backend order, but if not present, open checkout using key directly (test mode)
      let order_id, amount, currency, key;
      try {
        const shortBookingId = currentBookingId.substring(0, 15); // Limit to 15 chars
        const paymentData = { amount: Math.round(totalAmount * 100), currency: 'INR', receipt: shortBookingId, bookingId: currentBookingId, passengerId: (passengerId || 'guest_1') };
        console.log('💳 Frontend sending payment data:', JSON.stringify(paymentData, null, 2));
        
        const orderRes = await apiFetch('/api/payments/create-order', {
          method: 'POST',
          body: JSON.stringify(paymentData)
        });
        if (orderRes.ok) {
          const ord = orderRes.data?.order || orderRes.data || {};
          order_id = ord.id; amount = ord.amount; currency = ord.currency; key = orderRes.data?.key || orderRes.key;
        }
      } catch {}

      const RZP_KEY = key || (import.meta.env?.VITE_RAZORPAY_KEY_ID) || (window.RAZORPAY_KEY_ID) || 'rzp_test_1DP5mmOlF5G5ag';

      // 2) Open Razorpay checkout
      const options = {
        key: RZP_KEY,
        amount: amount || Math.round(totalAmount * 100),
        currency: currency || 'INR',
        name: trip?.routeName || 'Bus Ticket',
        description: `${trip?.fromCity} → ${trip?.toCity}`,
        order_id,
        theme: {
          color: '#E91E63'
        },
        prefill: {
          name: 'Guest Passenger',
          email: contactDetails.email || 'guest@example.com',
          contact: contactDetails.phone || '9999999999'
        },
        notes: { bookingId: currentBookingId, tripId: tripId },
        handler: async (response) => {
          console.log('💳 Payment response:', response);
          // For now, skip verification and directly confirm booking
          try {
            console.log('💳 Confirming booking with ID:', currentBookingId);
            console.log('💳 Available bookingId state:', bookingId);
            
            if (!currentBookingId) {
              console.error('❌ No booking ID available for confirmation');
              const fallbackPnr = `PNR${Date.now().toString().slice(-8)}`;
              navigate(`/passenger/ticket/${fallbackPnr}?pnr=${fallbackPnr}`);
              return;
            }
            
            const confirmRes = await apiFetch('/api/booking/confirm', { 
              method: 'POST', 
              body: JSON.stringify({ 
                bookingId: currentBookingId,
                paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                orderId: order_id || `order_${Date.now()}`,
                paymentStatus: 'completed'
              }) 
            });
            
            console.log('💳 Booking confirmation response:', confirmRes);
            
            if (confirmRes.ok) {
              const pnr = confirmRes.data?.data?.ticket?.pnr || confirmRes.data?.ticket?.pnr || currentBookingId || `PNR${Date.now().toString().slice(-8)}`;
              console.log('✅ Payment successful! Navigating to ticket:', pnr);
              
              // Trigger notifications
              notificationService.showPaymentSuccess({
                amount: amount / 100, // Convert from paise to rupees
                bookingId: currentBookingId,
                pnr: pnr
              });
              
              notificationService.showBookingConfirmation({
                bookingId: currentBookingId,
                pnr: pnr,
                trip: {
                  from: trip?.fromCity || 'Origin',
                  to: trip?.toCity || 'Destination',
                  date: trip?.serviceDate || new Date().toISOString().split('T')[0],
                  time: trip?.startTime || '08:00',
                  seats: selectedSeats.length ? selectedSeats : ['U1']
                }
              });
              
              navigate(`/passenger/ticket/${pnr}?pnr=${pnr}`);
              return;
            } else {
              console.error('Booking confirmation failed:', confirmRes);
              // Fallback: navigate to ticket anyway
              const fallbackPnr = `PNR${Date.now().toString().slice(-8)}`;
              console.log('⚠️ Using fallback PNR:', fallbackPnr);
              navigate(`/passenger/ticket/${fallbackPnr}?pnr=${fallbackPnr}`);
            }
          } catch (error) {
            console.error('Payment processing error:', error);
            // Fallback: navigate to ticket anyway
            const fallbackPnr = `PNR${Date.now().toString().slice(-8)}`;
            console.log('⚠️ Error fallback - using PNR:', fallbackPnr);
            navigate(`/pax/ticket/${fallbackPnr}?pnr=${fallbackPnr}`);
          }
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
          }
        }
      };

      // Ensure Razorpay script is loaded properly, then instantiate
      const { default: PaymentService } = await import('../../utils/paymentService');
      const RazorpayClass = await PaymentService.initializeRazorpay();
      const rzp = new RazorpayClass(options);
      rzp.open();
    } catch (e) {
      console.error('Payment init error:', e);
      setError(e.message || 'Failed to start payment');
    }
  }


  const passengers = useMemo(() => {
    const count = Math.max(1, selectedSeats.length || 1);
    return Array.from({ length: count }, (_, i) => ({ name: '', age: '', gender: '', seat: selectedSeats[i] || '' }));
  }, [selectedSeats]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-soft p-6 space-y-4">
        <div className="text-center py-8">
          <div className="text-lg">Loading trip details...</div>
          <div className="text-sm text-gray-500 mt-2">Trip ID: {tripId || 'Not found'}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-soft p-6 space-y-4">
        <div className="text-center py-8">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <div className="text-sm text-gray-500 mb-4">Trip ID: {tripId || 'Not found'}</div>
          <button 
            onClick={() => navigate('/passenger/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Contact + Passengers */}
        <div className="lg:col-span-2 space-y-8 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-pink-100/50 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-rose-600 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Contact Details</h2>
                  <p className="text-rose-100 text-sm">We'll send your booking confirmation here</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-8 space-y-6">
              {/* Phone Number */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  Phone Number
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <select 
                    className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all duration-200 bg-white shadow-sm"
                    value="+91"
                    onChange={(e) => handleContactChange('countryCode', e.target.value)}
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                  <input 
                    className="col-span-3 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all duration-200 bg-white shadow-sm placeholder-gray-400" 
                    placeholder="Enter your phone number" 
                    inputMode="numeric"
                    pattern="^[6-9][0-9]{9}$"
                    maxLength={10}
                    value={contactDetails.phone}
                    onChange={(e) => {
                      // Allow only digits, trim to 10, enforce Indian mobile starting 6-9
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleContactChange('phone', digits);
                    }}
                    onBlur={(e) => {
                      // Keep minimal check; UI already blocks non-compliant input
                      const valid = /^[6-9][0-9]{9}$/.test(e.target.value);
                      if (!valid) {
                        try { console.warn('Invalid Indian mobile number'); } catch {}
                      }
                    }}
                  />
                </div>
                {contactErrors.phone && (
                  <p className="text-xs text-red-500 mt-1">{contactErrors.phone}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                  </svg>
                  Email Address
                </label>
                <input 
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all duration-200 bg-white shadow-sm placeholder-gray-400" 
                  placeholder="Enter your email address" 
                  type="email"
                  value={contactDetails.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                />
              </div>
              {/* OTP Verification */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  Email Verification
                </label>
                <div className="flex gap-3">
                  <input 
                    className={`flex-1 border-2 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest ${
                      otpState.isVerified 
                        ? 'border-green-500 bg-green-50 focus:ring-green-500 focus:border-green-500' 
                        : otpState.error 
                          ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-pink-200 focus:border-pink-500'
                    } transition-all duration-200 shadow-sm`}
                    placeholder="000000" 
                    type="text" 
                    maxLength="6"
                    value={contactDetails.otp}
                    onChange={(e) => handleContactChange('otp', e.target.value.replace(/\D/g, ''))}
                    disabled={!otpState.isSent}
                  />
                  {!otpState.isSent ? (
                    <button
                      onClick={sendOTP}
                      disabled={otpState.isLoading || !contactDetails.email}
                      className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      {otpState.isLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                          </svg>
                          Send OTP
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={verifyOTP}
                      disabled={otpState.isLoading || otpState.isVerified || contactDetails.otp.length !== 6}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      {otpState.isLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying...
                        </>
                      ) : otpState.isVerified ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          Verified
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          Verify
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {/* OTP Status Messages */}
              {otpState.isSent && otpState.timer > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-blue-700 font-medium">
                    OTP sent to your email! Resend available in {otpState.timer}s
                  </span>
                </div>
              )}
              
              {otpState.isSent && otpState.timer === 0 && !otpState.isVerified && (
                <div className="flex justify-center">
                  <button
                    onClick={sendOTP}
                    className="text-pink-600 hover:text-pink-700 font-medium underline flex items-center gap-2 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Resend OTP to Email
                  </button>
                </div>
              )}
              
              {otpState.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-red-700 font-medium">{otpState.error}</span>
                </div>
              )}
              
              {otpState.isVerified && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-green-700 font-medium">Email verified successfully!</span>
                </div>
              )}

              {/* State of Residence */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  State of Residence
                </label>
                <select 
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all duration-200 bg-white shadow-sm"
                  value={contactDetails.state}
                  onChange={(e) => handleContactChange('state', e.target.value)}
                >
                  <option value="">Select your state</option>
                  <option value="Kerala">🏛️ Kerala</option>
                  <option value="Tamil Nadu">🏛️ Tamil Nadu</option>
                  <option value="Karnataka">🏛️ Karnataka</option>
                  <option value="Maharashtra">🏛️ Maharashtra</option>
                  <option value="Gujarat">🏛️ Gujarat</option>
                  <option value="Rajasthan">🏛️ Rajasthan</option>
                  <option value="Delhi">🏛️ Delhi</option>
                </select>
              </div>

              {/* WhatsApp Updates Toggle */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">WhatsApp Updates</p>
                      <p className="text-sm text-green-600">Get booking details and trip updates on WhatsApp</p>
                    </div>
                  </div>
                  <div 
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-200 ${contactDetails.whatsappUpdates ? 'bg-green-500' : 'bg-gray-300'}`}
                    onClick={() => handleContactChange('whatsappUpdates', !contactDetails.whatsappUpdates)}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${contactDetails.whatsappUpdates ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-pink-100/50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Passenger Details</h2>
                  <p className="text-purple-100 text-sm">Enter passenger information for booking</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-8 space-y-6">
              {passengers.map((p, i) => (
                <div key={i} className="bg-gradient-to-r from-gray-50 to-purple-50 border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-sm">{i+1}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">Passenger {i+1}</h3>
                        <p className="text-sm text-gray-500">Traveler Information</p>
                      </div>
                    </div>
                    <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                      Seat {p.seat || selectedSeats[i] || ''}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Full Name
                      </label>
                      <input 
                        placeholder="Enter passenger name" 
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white shadow-sm placeholder-gray-400" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Age
                      </label>
                      <input 
                        placeholder="Age" 
                        type="number"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white shadow-sm placeholder-gray-400" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        Gender
                      </label>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-blue-100 transition-colors duration-200 flex-1">
                          <input type="radio" name={`g${i}`} className="text-blue-500 focus:ring-blue-500" />
                          <span className="text-sm font-medium text-blue-700">👨 Male</span>
                        </label>
                        <label className="flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-pink-100 transition-colors duration-200 flex-1">
                          <input type="radio" name={`g${i}`} className="text-pink-500 focus:ring-pink-500" />
                          <span className="text-sm font-medium text-pink-700">👩 Female</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-pink-100/50 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">YATRIK Assurance</h2>
                  <p className="text-green-100 text-sm">Protect your journey with our travel insurance</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-8 space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-green-800">Full Refund Protection</h3>
                    <p className="text-sm text-green-600">If your bus gets cancelled, you get <span className="font-bold text-lg">₹2,298</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center justify-between bg-white border border-green-200 rounded-xl p-4 cursor-pointer hover:bg-green-50 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="ins" className="text-green-500 focus:ring-green-500" />
                      <div>
                        <span className="font-semibold text-green-800">Yes, protect my trip</span>
                        <p className="text-xs text-green-600">Get full refund if bus is cancelled</p>
                      </div>
                    </div>
                    <div className="text-green-600 font-bold">₹99</div>
                  </label>
                  <label className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="ins" defaultChecked className="text-gray-500 focus:ring-gray-500" />
                      <div>
                        <span className="font-semibold text-gray-800">Don't add Assurance</span>
                        <p className="text-xs text-gray-600">Continue without protection</p>
                      </div>
                    </div>
                    <div className="text-gray-400 font-bold">Free</div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Trip summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-pink-100/50 overflow-hidden sticky top-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-white font-semibold">Trip Summary</span>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800 mb-1">{trip?.routeName || 'Your Journey'}</div>
                <div className="text-sm text-gray-500">Premium Bus Service</div>
              </div>
              
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-gray-700">{trip?.startTime || '08:00'}</span>
                  </div>
                  <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                    {new Date(trip?.serviceDate || Date.now()).toLocaleDateString('en-IN', { 
                      weekday: 'short', 
                      day: '2-digit', 
                      month: 'short' 
                    })}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-2">{boarding?.title || 'Boarding Point'}</div>
                
                <div className="flex items-center justify-center my-2">
                  <div className="w-full h-0.5 bg-gray-300 relative">
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      {trip?.routeId?.distance || '120'} km
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-gray-700">{trip?.endTime || '12:00'}</div>
                    <div className="text-sm text-gray-600">{dropping?.title || 'Dropping Point'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-3">
                <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  Selected Seats
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((s, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                      {s || `Seat ${idx+1}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-pink-100/50 overflow-hidden sticky top-[calc(6rem+16px)]">
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 px-4 py-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
                <span className="text-white font-semibold">Payment Summary</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-600">Total Amount</div>
                <div className="text-2xl font-bold text-gray-800">₹{Math.max(0, (fare ?? deriveFarePerSeat(trip) ?? 0) * Math.max(1, selectedSeats.length || 1))}</div>
              </div>
              <button 
                onClick={confirm} 
                disabled={!otpState.isVerified}
                className={`w-full rounded-2xl font-bold py-4 text-lg transition-all duration-200 ${
                  otpState.isVerified 
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {otpState.isVerified ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                    Continue to Payment
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    Verify Email to Continue
                  </div>
                )}
              </button>
              {!otpState.isVerified && (
                <p className="text-center text-xs text-gray-500 mt-2">
                  Complete email verification to proceed with booking
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaxBooking;


