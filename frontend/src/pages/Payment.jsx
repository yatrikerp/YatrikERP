import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, Wifi, CheckCircle, Lock, Shield, Download, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookingData, setBookingData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate('/login?redirect=/payment');
      return;
    }

    // Get booking data from sessionStorage
    const storedData = sessionStorage.getItem('bookingData');
    if (!storedData) {
      navigate('/search-results');
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setBookingData(data);
    } catch (error) {
      console.error('Error parsing booking data:', error);
      navigate('/search-results');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  const handlePayment = async () => {
    if (!bookingData) return;

    setProcessing(true);

    try {
      // Create booking first
      const bookingPayload = {
        tripId: bookingData.tripId,
        passengerId: user._id,
        passengerName: user.name,
        passengerEmail: user.email,
        seatNumbers: bookingData.seatNumbers.split(','),
        totalAmount: Math.round(bookingData.totalPrice * 1.05),
        passengers: bookingData.passengers,
        paymentMethod: paymentMethod
      };

      const response = await apiFetch('/api/bookings/create', {
        method: 'POST',
        body: JSON.stringify(bookingPayload)
      });

      if (response.ok) {
        const booking = response.data;
        setBookingId(booking._id);
        
        // Initialize Razorpay
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY || 'rzp_test_1234567890', // Replace with your Razorpay key
          amount: Math.round(bookingData.totalPrice * 1.05) * 100, // Amount in paise
          currency: 'INR',
          name: 'Yatrik ERP',
          description: `Bus Booking - ${bookingData.trip?.from} to ${bookingData.trip?.to}`,
          image: '/logo.png',
          order_id: booking._id, // Use booking ID as order ID
          handler: async function (response) {
            // Payment successful
            await handlePaymentSuccess(booking._id, response);
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone || '9876543210'
          },
          notes: {
            bookingId: booking._id,
            tripId: bookingData.tripId
          },
          theme: {
            color: '#e91e63'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

        rzp.on('payment.failed', function (response) {
          console.error('Payment failed:', response.error);
          alert('Payment failed. Please try again.');
          setProcessing(false);
        });

      } else {
        throw new Error('Failed to create booking');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (bookingId, paymentResponse) => {
    try {
      // Confirm booking with payment details
      const confirmResponse = await apiFetch(`/api/booking/${bookingId}/confirm`, {
        method: 'PUT',
        body: JSON.stringify({
          paymentId: paymentResponse.razorpay_payment_id,
          paymentOrderId: paymentResponse.razorpay_order_id,
          paymentSignature: paymentResponse.razorpay_signature,
          paymentStatus: 'completed'
        })
      });

      if (confirmResponse.ok) {
        // Generate QR code
        await generateQRCode(bookingId);
        
        // Clear session data
        sessionStorage.removeItem('seatSelectionData');
        sessionStorage.removeItem('bookingData');
        
        setPaymentSuccess(true);
      } else {
        throw new Error('Failed to confirm booking');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      alert('Payment confirmation failed. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  const generateQRCode = async (bookingId) => {
    try {
      const QRCode = (await import('qrcode')).default;
      const qrData = {
        bookingId: bookingId,
        tripId: bookingData.tripId,
        passengerName: user.name,
        seatNumbers: bookingData.seatNumbers,
        timestamp: new Date().toISOString()
      };
      
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 2,
        color: {
          dark: '#e91e63',
          light: '#ffffff'
        }
      });
      
      setQrCode(qrCodeDataURL);
    } catch (error) {
      console.error('QR code generation failed:', error);
    }
  };

  const downloadPDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;
      
      const ticketElement = document.getElementById('ticket-content');
      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`ticket-${bookingId}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const downloadQRCode = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.download = `qr-code-${bookingId}.png`;
      link.href = qrCode;
      link.click();
    }
  };

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: <Smartphone className="w-6 h-6" />,
      description: 'Pay using UPI ID'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="w-6 h-6" />,
      description: 'Pay using card'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: <Wifi className="w-6 h-6" />,
      description: 'Pay using net banking'
    }
  ];

  if (loading) {
    return (
      <div className="payment-container">
        <div className="loading-spinner">Loading payment details...</div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="payment-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-title">No booking data found</div>
          <div className="error-message">Please complete the booking process first</div>
          <button onClick={() => navigate('/search-results')} className="retry-button">
            Go to Search
          </button>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="payment-container">
        <div className="success-page">
          <div className="success-header">
            <div className="success-icon">✅</div>
            <h1>Payment Successful!</h1>
            <p>Your booking has been confirmed</p>
          </div>

          <div className="ticket-section">
            <div className="ticket-card" id="ticket-content">
              <div className="ticket-header">
                <h2>YATRIK ERP</h2>
                <div className="ticket-id">Booking ID: {bookingId}</div>
              </div>

              <div className="ticket-content">
                <div className="ticket-route">
                  <div className="route-info">
                    <div className="from-to">
                      <span className="from">{bookingData.trip?.from || 'Unknown'}</span>
                      <span className="arrow">→</span>
                      <span className="to">{bookingData.trip?.to || 'Unknown'}</span>
                    </div>
                    <div className="departure-time">
                      Departure: {bookingData.trip?.departureTime || 'Not specified'}
                    </div>
                  </div>
                </div>

                <div className="passenger-details">
                  <h3>Passenger Details</h3>
                  {bookingData.passengers?.map((passenger, index) => (
                    <div key={index} className="passenger-info">
                      <div className="passenger-name">{passenger.name}</div>
                      <div className="passenger-seat">Seat: {passenger.seatNumber}</div>
                    </div>
                  ))}
                </div>

                <div className="ticket-footer">
                  <div className="qr-code">
                    {qrCode && <img src={qrCode} alt="QR Code" />}
                  </div>
                  <div className="booking-info">
                    <div>Total Amount: ₹{Math.round(bookingData.totalPrice * 1.05)}</div>
                    <div>Payment Status: Completed</div>
                    <div>Booking Date: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="download-actions">
              <button onClick={downloadPDF} className="download-btn pdf-btn">
                <Download className="w-5 h-5" />
                Download PDF Ticket
              </button>
              <button onClick={downloadQRCode} className="download-btn qr-btn">
                <QrCode className="w-5 h-5" />
                Download QR Code
              </button>
            </div>
          </div>

          <div className="success-actions">
            <button onClick={() => navigate('/dashboard')} className="action-btn primary">
              Go to Dashboard
            </button>
            <button onClick={() => navigate('/search-results')} className="action-btn secondary">
              Book Another Trip
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalAmount = Math.round(bookingData.totalPrice * 1.05);
  const serviceCharges = totalAmount - bookingData.totalPrice;

  return (
    <div className="payment-container">
      {/* Header */}
      <div className="payment-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="header-content">
          <h1>Complete Payment</h1>
          <p>Secure payment for your booking</p>
        </div>
      </div>

      <div className="payment-content">
        {/* Booking Summary */}
        <div className="booking-summary">
          <h2>Booking Summary</h2>
          <div className="summary-details">
            <div className="trip-info">
              <div className="route">{bookingData.trip?.from} → {bookingData.trip?.to}</div>
              <div className="details">
                <span>Seats: {bookingData.seatNumbers}</span>
                <span>•</span>
                <span>Departure: {bookingData.trip?.departureTime}</span>
              </div>
            </div>
            <div className="points">
              <div className="point">
                <strong>Boarding:</strong> {bookingData.boardingPoint?.name}
              </div>
              <div className="point">
                <strong>Dropping:</strong> {bookingData.droppingPoint?.name}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="payment-methods">
          <h2>Select Payment Method</h2>
          <div className="methods-grid">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`method-card ${paymentMethod === method.id ? 'selected' : ''}`}
                onClick={() => setPaymentMethod(method.id)}
              >
                <div className="method-icon">{method.icon}</div>
                <div className="method-info">
                  <div className="method-name">{method.name}</div>
                  <div className="method-description">{method.description}</div>
                </div>
                {paymentMethod === method.id && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Form */}
        <div className="payment-form">
          <h2>Payment Details</h2>
          
          {paymentMethod === 'upi' && (
            <div className="form-group">
              <label>UPI ID</label>
              <input
                type="text"
                placeholder="Enter your UPI ID (e.g., 1234567890@paytm)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="form-input"
              />
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="card-form">
              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'netbanking' && (
            <div className="netbanking-info">
              <p>You will be redirected to your bank's secure payment page.</p>
            </div>
          )}
        </div>

        {/* Amount Summary */}
        <div className="amount-summary">
          <div className="amount-details">
            <div className="amount-row">
              <span>Base Fare:</span>
              <span>₹{bookingData.totalPrice}</span>
            </div>
            <div className="amount-row">
              <span>Service Charges:</span>
              <span>₹{serviceCharges}</span>
            </div>
            <div className="amount-row total">
              <span>Total Amount:</span>
              <span>₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="security-info">
          <div className="security-badges">
            <div className="security-badge">
              <Lock className="w-4 h-4" />
              <span>SSL Secured</span>
            </div>
            <div className="security-badge">
              <Shield className="w-4 h-4" />
              <span>PCI Compliant</span>
            </div>
          </div>
          <p className="security-text">
            Your payment information is encrypted and secure. We do not store your card details.
          </p>
        </div>

        {/* Payment Button */}
        <div className="payment-actions">
          <button
            className="pay-button"
            onClick={handlePayment}
            disabled={processing || (paymentMethod === 'upi' && !upiId) || (paymentMethod === 'card' && (!cardNumber || !expiryDate || !cvv || !cardName))}
          >
            {processing ? (
              <>
                <div className="spinner"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay ₹{totalAmount}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
