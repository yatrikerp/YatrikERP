import React, { useState } from 'react';
import PaymentService from '../../utils/paymentService';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentTest = () => {
  const [amount, setAmount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const handleTestPayment = async () => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus(null);

    try {
      // Create a test order
      const orderData = await PaymentService.createOrder(
        amount,
        `test_${Date.now()}`,
        'test_user'
      );

      // Process payment
      await PaymentService.processPayment(orderData, {
        name: 'Test User',
        email: 'test@example.com',
        phone: '9876543210'
      });

      setPaymentStatus('success');
      toast.success('Test payment successful!');
    } catch (error) {
      console.error('Test payment error:', error);
      setPaymentStatus('failed');
      toast.error('Test payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Razorpay Payment Test
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Enter amount"
            min="1"
            step="1"
          />
        </div>

        <button
          onClick={handleTestPayment}
          disabled={isProcessing}
          className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Test Payment...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Test Payment ₹{amount}
            </>
          )}
        </button>

        {paymentStatus && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            paymentStatus === 'success' 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            {paymentStatus === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">
              {paymentStatus === 'success' 
                ? 'Payment test successful!' 
                : 'Payment test failed'
              }
            </span>
          </div>
        )}

        <div className="text-xs text-gray-500 text-center">
          <p>This is a test payment using Razorpay test mode.</p>
          <p>No real money will be charged.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentTest;
