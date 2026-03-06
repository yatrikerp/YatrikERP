import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  Wallet,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';

const PaymentGateway = ({ 
  bookingData, 
  onPaymentSuccess, 
  onPaymentFailure,
  isGuest = false 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, RuPay',
      popular: true
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: Smartphone,
      description: 'GPay, PhonePe, Paytm',
      popular: true
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building,
      description: 'All major banks'
    },
    {
      id: 'wallet',
      name: 'Wallet',
      icon: Wallet,
      description: 'Paytm, Mobikwik, Amazon Pay'
    }
  ];

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpay();
  }, []);

  const createPaymentOrder = async () => {
    try {
      const endpoint = isGuest ? '/api/payment/create-order-guest' : '/api/payment/create-order';
      
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isGuest ? {} : { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        },
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
          amount: bookingData.totalAmount,
          currency: 'INR'
        })
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create payment order');
      }

      return response.data;
    } catch (error) {
      console.error('Payment order creation error:', error);
      throw error;
    }
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      const endpoint = isGuest ? '/api/payment/verify-guest' : '/api/payment/verify';
      
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isGuest ? {} : { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          transactionId: paymentOrder.transactionId
        })
      });

      if (!response.success) {
        throw new Error(response.message || 'Payment verification failed');
      }

      return response.data;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error('Payment gateway is loading. Please try again.');
      return;
    }

    setProcessing(true);

    try {
      // Step 1: Create payment order
      toast.loading('Creating payment order...', { id: 'payment' });
      const orderData = await createPaymentOrder();
      setPaymentOrder(orderData);

      // Step 2: Initialize Razorpay
      const options = {
        key: orderData.razorpayKeyId || process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_here',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'YATRIK ERP',
        description: 'Bus Ticket Booking',
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            toast.loading('Verifying payment...', { id: 'payment' });
            
            // Step 3: Verify payment
            const verificationResult = await verifyPayment(response);
            
            toast.success('Payment successful!', { id: 'payment' });
            
            // Call success callback with payment and booking details
            onPaymentSuccess({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              bookingId: verificationResult.bookingId,
              amount: verificationResult.amount,
              tickets: verificationResult.tickets || []
            });
            
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.', { id: 'payment' });
            onPaymentFailure(error);
          }
        },
        prefill: {
          name: bookingData.customer?.name || '',
          email: bookingData.customer?.email || '',
          contact: bookingData.customer?.phone || ''
        },
        theme: {
          color: '#E91E63'
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled', { id: 'payment' });
            setProcessing(false);
          }
        },
        method: {
          upi: selectedMethod === 'upi',
          card: selectedMethod === 'card',
          netbanking: selectedMethod === 'netbanking',
          wallet: selectedMethod === 'wallet'
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', (response) => {
        console.error('Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description}`, { id: 'payment' });
        onPaymentFailure(new Error(response.error.description));
        setProcessing(false);
      });

      toast.dismiss('payment');
      rzp.open();

    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(error.message || 'Failed to initiate payment', { id: 'payment' });
      onPaymentFailure(error);
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Booking Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-green-600" />
          Booking Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Route:</span>
            <span className="font-medium">
              {bookingData.journey?.from} → {bookingData.journey?.to}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Seats:</span>
            <span className="font-medium">
              {bookingData.seats?.map(s => s.seatNumber).join(', ')}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Passenger:</span>
            <span className="font-medium">{bookingData.customer?.name}</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-lg font-bold">
            <span>Total Amount:</span>
            <span className="text-pink-600">₹{bookingData.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mb-6">
        <h4 className="font-semibold mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-pink-600" />
          Select Payment Method
        </h4>
        <div className="grid gap-3">
          {paymentMethods.map(method => {
            const IconComponent = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all relative ${
                  selectedMethod === method.id
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-300'
                }`}
              >
                <div className="flex items-center">
                  <IconComponent className="w-6 h-6 mr-3 text-pink-600" />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium">{method.name}</span>
                      {method.popular && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{method.description}</div>
                  </div>
                  {selectedMethod === method.id && (
                    <CheckCircle className="w-5 h-5 text-pink-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Security Notice */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <div className="font-medium">Secure Payment</div>
            <div>Your payment is secured with 256-bit SSL encryption. We don't store your card details.</div>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={processing || !razorpayLoaded}
        className="w-full px-6 py-4 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-lg font-semibold transition-all"
      >
        {processing ? (
          <>
            <Loader className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : !razorpayLoaded ? (
          <>
            <Loader className="w-5 h-5 mr-2 animate-spin" />
            Loading Payment Gateway...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5 mr-2" />
            Pay ₹{bookingData.totalAmount} Securely
          </>
        )}
      </button>

      {/* Payment Methods Logos */}
      <div className="mt-4 text-center">
        <div className="text-xs text-gray-500 mb-2">Powered by Razorpay</div>
        <div className="flex justify-center items-center space-x-4 opacity-60">
          <img src="/api/placeholder/40/25" alt="Visa" className="h-6" />
          <img src="/api/placeholder/40/25" alt="Mastercard" className="h-6" />
          <img src="/api/placeholder/40/25" alt="RuPay" className="h-6" />
          <img src="/api/placeholder/40/25" alt="UPI" className="h-6" />
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;