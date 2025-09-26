import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import notificationService from '../services/notificationService';

const RedBusPayment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    trip,
    passengers,
    contactDetails,
    selectedSeats,
    boarding,
    dropping,
    bookingId,
    totalAmount
  } = state || {};

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!trip || !passengers || !contactDetails) {
      navigate('/redbus');
    }
  }, [trip, passengers, contactDetails, navigate]);

  const handlePayment = async () => {
    if (!bookingId) {
      setError('Booking ID not found. Please try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create Razorpay order
      const paymentData = {
        amount: Math.round(totalAmount * 100), // Convert to paise
        currency: 'INR',
        receipt: bookingId.substring(0, 15),
        bookingId: bookingId
      };

      const orderRes = await apiFetch('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });

      let order_id, amount, currency, key;
      if (orderRes.ok) {
        const ord = orderRes.data?.order || orderRes.data || {};
        order_id = ord.id;
        amount = ord.amount;
        currency = ord.currency;
        key = orderRes.data?.key || orderRes.key;
      }

      const RZP_KEY = key || import.meta.env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';

      // Open Razorpay checkout
      const options = {
        key: RZP_KEY,
        amount: amount || Math.round(totalAmount * 100),
        currency: currency || 'INR',
        name: 'YATRIK ERP',
        description: `${trip.fromCity} → ${trip.toCity}`,
        order_id,
        theme: {
          color: '#E91E63'
        },
        prefill: {
          name: passengers[0].name,
          email: contactDetails.email,
          contact: contactDetails.phone
        },
        notes: { 
          bookingId: bookingId,
          tripId: trip._id || trip.id
        },
        handler: async (response) => {
          console.log('Payment response:', response);
          await handlePaymentSuccess(response);
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setLoading(false);
          }
        }
      };

      const { default: PaymentService } = await import('../utils/paymentService');
      const RazorpayClass = await PaymentService.initializeRazorpay();
      const rzp = new RazorpayClass(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      const confirmRes = await apiFetch('/api/booking/confirm', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: bookingId,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          paymentStatus: 'completed'
        })
      });

      if (confirmRes.ok) {
        const pnr = confirmRes.data?.data?.ticket?.pnr || 
                   confirmRes.data?.ticket?.pnr || 
                   bookingId || 
                   `PNR${Date.now().toString().slice(-8)}`;

        setPaymentSuccess(true);

        // Show notifications
        notificationService.showPaymentSuccess({
          amount: totalAmount,
          bookingId: bookingId,
          pnr: pnr
        });

        notificationService.showBookingConfirmation({
          bookingId: bookingId,
          pnr: pnr,
          trip: {
            from: trip.fromCity,
            to: trip.toCity,
            date: trip.serviceDate,
            time: trip.startTime,
            seats: selectedSeats
          }
        });

        // Navigate to ticket after a short delay
        setTimeout(() => {
          navigate(`/redbus/ticket/${pnr}?pnr=${pnr}`);
        }, 2000);
      } else {
        setError('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      setError('Payment verification failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestMode = async () => {
    setLoading(true);
    try {
      const confirmRes = await apiFetch('/api/booking/confirm', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: bookingId,
          paymentId: `test_pay_${Date.now()}`,
          orderId: `test_order_${Date.now()}`,
          paymentStatus: 'completed'
        })
      });

      if (confirmRes.ok) {
        const pnr = confirmRes.data?.data?.ticket?.pnr || 
                   confirmRes.data?.ticket?.pnr || 
                   bookingId || 
                   `PNR${Date.now().toString().slice(-8)}`;

        setPaymentSuccess(true);
        setTimeout(() => {
          navigate(`/redbus/ticket/${pnr}?pnr=${pnr}`);
        }, 2000);
      } else {
        setError('Test mode failed. Please try again.');
      }
    } catch (error) {
      console.error('Test mode error:', error);
      setError('Test mode failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Your booking has been confirmed.</p>
          <div className="text-sm text-gray-500">
            Redirecting to your ticket...
          </div>
        </div>
      </div>
    );
  }

  if (!trip || !passengers || !contactDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Booking details not found</div>
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
              <h1 className="text-xl font-semibold text-gray-900">Payment</h1>
            </div>
            <div className="text-sm text-gray-600">
              Step 4 of 4
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Methods */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Choose Payment Method</h2>
                <p className="text-sm text-gray-600 mt-1">Select your preferred payment option</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="radio"
                        name="payment"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z"/>
                        </svg>
                      </div>
                      <span className="font-medium">UPI</span>
                    </div>
                    <span className="text-sm text-gray-500">Pay using UPI apps</span>
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z"/>
                        </svg>
                      </div>
                      <span className="font-medium">Credit/Debit Card</span>
                    </div>
                    <span className="text-sm text-gray-500">Visa, Mastercard, RuPay</span>
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="radio"
                        name="payment"
                        value="netbanking"
                        checked={paymentMethod === 'netbanking'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z"/>
                        </svg>
                      </div>
                      <span className="font-medium">Net Banking</span>
                    </div>
                    <span className="text-sm text-gray-500">All major banks</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-medium text-blue-900">Secure Payment</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Your payment is secured with 256-bit SSL encryption. We never store your payment details.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-600 text-sm">{error}</div>
              </div>
            )}
          </div>

          {/* Right: Booking Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <div className="text-sm text-gray-500 mb-2">Booking Summary</div>
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
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-900 mb-2">Passengers</div>
                <div className="space-y-1">
                  {passengers.map((passenger, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{passenger.name}</span>
                      <span className="font-medium">Seat {passenger.seat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Fare ({passengers.length} seat{passengers.length > 1 ? 's' : ''})</span>
                  <span>₹{(trip.fare || 0) * passengers.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes & Fees</span>
                  <span>₹0</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="text-xl font-bold text-red-600">₹{totalAmount}</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handlePayment}
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
                    <span>Pay ₹{totalAmount}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>

              <button 
                onClick={handleTestMode}
                disabled={loading}
                className="mt-3 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>🚀 Test Mode: Skip Payment</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedBusPayment;
