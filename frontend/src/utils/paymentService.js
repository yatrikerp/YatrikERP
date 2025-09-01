import { apiFetch } from './api';
import toast from 'react-hot-toast';

// Razorpay configuration
const RAZORPAY_KEY_ID = 'rzp_test_cAb1OjW2zX8866';

class PaymentService {
  // Initialize Razorpay
  static initializeRazorpay() {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return window.Razorpay;
    }
    throw new Error('Razorpay not loaded');
  }

  // Create payment order
  static async createOrder(amount, bookingId, passengerId, currency = 'INR') {
    try {
      const response = await apiFetch('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          currency,
          bookingId,
          passengerId
        })
      });

      if (!response.ok) {
        throw new Error(response.message || 'Failed to create payment order');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }

  // Process payment
  static async processPayment(orderData, userDetails = {}) {
    try {
      const Razorpay = this.initializeRazorpay();

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'YATRIK ERP',
        description: 'Bus Ticket Booking',
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            await this.verifyPayment(response, orderData.bookingId);
            toast.success('Payment successful!');
            return { success: true, paymentId: response.razorpay_payment_id };
          } catch (error) {
            toast.error('Payment verification failed');
            throw error;
          }
        },
        prefill: {
          name: userDetails.name || '',
          email: userDetails.email || '',
          contact: userDetails.phone || ''
        },
        theme: {
          color: '#E91E63'
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();

      return new Promise((resolve, reject) => {
        rzp.on('payment.failed', (response) => {
          toast.error('Payment failed');
          reject(new Error('Payment failed'));
        });
      });

    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  // Verify payment
  static async verifyPayment(paymentResponse, bookingId) {
    try {
      const response = await apiFetch('/api/payments/verify-payment', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          bookingId
        })
      });

      if (!response.ok) {
        throw new Error(response.message || 'Payment verification failed');
      }

      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  // Get payment status
  static async getPaymentStatus(paymentId) {
    try {
      const response = await apiFetch(`/api/payments/status/${paymentId}`);
      
      if (!response.ok) {
        throw new Error(response.message || 'Failed to get payment status');
      }

      return response.data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  // Get payment history
  static async getPaymentHistory() {
    try {
      const response = await apiFetch('/api/payments/history');
      
      if (!response.ok) {
        throw new Error(response.message || 'Failed to get payment history');
      }

      return response.data;
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  }

  // Add money to wallet
  static async addMoneyToWallet(amount) {
    try {
      const orderData = await this.createOrder(amount, `wallet_${Date.now()}`, 'wallet');
      
      return this.processPayment(orderData);
    } catch (error) {
      console.error('Error adding money to wallet:', error);
      throw error;
    }
  }

  // Format currency
  static formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }
}

export default PaymentService;
