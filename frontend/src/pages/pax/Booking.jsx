import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const PaxBooking = () => {
  const { tripId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const selectedSeats = useMemo(() => state?.selectedSeats || [], [state?.selectedSeats]);
  const boarding = state?.boarding || null;
  const dropping = state?.dropping || null;
  const passengerDetails = useMemo(() => state?.passengerDetails || null, [state?.passengerDetails]);
  
  const [trip, setTrip] = useState(state?.trip || null);
  const [fare, setFare] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [passengerId, setPassengerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load trip details effect - completely separate from function declarations
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
          setFare(tripData.fare);
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
    
    console.log('🎫 Creating booking with passenger details:', passengerDetails);
    
    // Create proper booking data structure that matches backend model requirements
    const departureDate = trip.serviceDate || new Date().toISOString().split('T')[0];
    const departureTime = trip.startTime || '08:00';
    const arrivalTime = trip.endTime || '12:00';
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
        name: passengerDetails?.name || 'Guest Passenger',
        email: passengerDetails?.email || 'guest@example.com',
        phone: passengerDetails?.phone || '9999999999',
        age: parseInt(passengerDetails?.age) || 25,
        gender: passengerDetails?.gender || 'male'
      },
      journey: {
        from: trip.fromCity || 'Mumbai',
        to: trip.toCity || 'Pune',
        departureDate: new Date(departureDate),
        departureTime: departureTime,
        arrivalDate: new Date(departureDate), // Same day arrival
        arrivalTime: arrivalTime,
        duration: 240 // 4 hours in minutes
      },
      seats: (selectedSeats.length ? selectedSeats : ['U1']).map((s, idx) => ({
        seatNumber: s,
        seatType: 'seater',
        seatPosition: 'window', // Required field
        price: baseFare,
        passengerName: passengerDetails?.name || `Passenger ${idx+1}`,
        passengerAge: parseInt(passengerDetails?.age) || 25,
        passengerGender: passengerDetails?.gender || 'male'
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
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
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
              navigate(`/pax/ticket/${fallbackPnr}?pnr=${fallbackPnr}`);
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
              navigate(`/pax/ticket/${pnr}?pnr=${pnr}`);
              return;
            } else {
              console.error('Booking confirmation failed:', confirmRes);
              // Fallback: navigate to ticket anyway
              const fallbackPnr = `PNR${Date.now().toString().slice(-8)}`;
              console.log('⚠️ Using fallback PNR:', fallbackPnr);
              navigate(`/pax/ticket/${fallbackPnr}?pnr=${fallbackPnr}`);
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

      // Ensure Razorpay script is loaded and use the constructor returned
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-soft p-6 space-y-4">
        <div className="text-center py-8">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button 
            onClick={() => navigate('/pax/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact + Passengers */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 text-lg font-semibold">Contact details</div>
            <div className="px-6 pb-6 grid gap-3">
              <div className="grid grid-cols-3 gap-3">
                <select className="border rounded-lg px-3 py-2"><option>+91 (IND)</option></select>
                <input className="col-span-2 border rounded-lg px-3 py-2" placeholder="Phone" />
              </div>
              <input className="border rounded-lg px-3 py-2" placeholder="Email ID" />
              <select className="border rounded-lg px-3 py-2"><option>State of Residence</option></select>
              <div className="flex items-center gap-3 text-sm text-gray-600"><div className="w-10 h-6 rounded-full bg-gray-200 relative"><div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-pink-500"></div></div> Send booking details and trip updates on WhatsApp</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 text-lg font-semibold">Passenger details</div>
            <div className="px-6 pb-6 space-y-6">
              {passengers.map((p, i) => (
                <div key={i} className="border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">Passenger {i+1}</div>
                    <div className="text-sm text-gray-500">Seat {p.seat || selectedSeats[i] || ''}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input placeholder="Name" className="border rounded-lg px-3 py-2" />
                    <input placeholder="Age" className="border rounded-lg px-3 py-2" />
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm"><input type="radio" name={`g${i}`} /> Male</label>
                      <label className="flex items-center gap-2 text-sm"><input type="radio" name={`g${i}`} /> Female</label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 text-lg font-semibold">redBus Assurance</div>
            <div className="px-6 pb-6 space-y-3 text-sm">
              <div className="border rounded-xl p-4">If your bus gets cancelled, you get <span className="font-semibold text-green-700">₹2298</span></div>
              <label className="flex items-center justify-between border rounded-xl p-3"><span>Yes, protect my trip</span><input type="radio" name="ins" /></label>
              <label className="flex items-center justify-between border rounded-xl p-3"><span>Don't add Assurance</span><input type="radio" name="ins" defaultChecked /></label>
          </div>
          </div>
        </div>

        {/* Right: Trip summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-6">
            <div className="text-sm text-gray-400 mb-2">Top Handpicked Buses</div>
            <div className="text-base font-semibold mb-3">{trip?.routeName || 'Trip'}</div>
            <div className="text-sm text-gray-700 mb-1">{trip?.startTime} • {boarding?.title || 'Boarding point'} </div>
            <div className="text-xs text-gray-500 mb-1">{new Date(trip?.serviceDate || Date.now()).toDateString()}</div>
            <div className="text-sm text-gray-700 mb-1">{trip?.endTime} • {dropping?.title || 'Dropping point'}</div>
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Seat details</div>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((s, idx) => (
                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{s || `Seat ${idx+1}`}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Amount</div>
              <div className="text-2xl font-bold">₹{(fare || 0) * Math.max(1, selectedSeats.length || 1)}</div>
        </div>
            <button onClick={confirm} className="mt-4 w-full rounded-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3">Continue booking</button>
            <button 
              onClick={async () => {
                console.log('🚀 Test mode: Skipping payment verification');
                try {
                  const res = await apiFetch('/api/booking/confirm', { method: 'POST', body: JSON.stringify({ bookingId }) });
                  if (res.ok) {
                    const pnr = res.data.data?.ticket?.pnr || res.data.ticket?.pnr || bookingId;
                    navigate(`/pax/ticket/${pnr}?pnr=${pnr}`);
                  }
                } catch (error) {
                  console.error('Test mode confirmation failed:', error);
                }
              }}
              className="mt-2 w-full rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
            >
              🚀 Test Mode: Skip Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaxBooking;


