import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, CheckCircle, CreditCard, Users, Bus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './BoardingSelection.css';

const BoardingSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seatSelectionData, setSeatSelectionData] = useState(null);
  const [selectedBoarding, setSelectedBoarding] = useState(null);
  const [selectedDropping, setSelectedDropping] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate('/login?redirect=/boarding-selection');
      return;
    }

    // Get seat selection data from sessionStorage
    const storedData = sessionStorage.getItem('seatSelectionData');
    if (!storedData) {
      navigate('/search-results');
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setSeatSelectionData(data);
    } catch (error) {
      console.error('Error parsing seat selection data:', error);
      navigate('/search-results');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  const boardingPoints = [
    {
      id: 'bp1',
      name: 'Majestic - Boarding Zone',
      address: 'Platform 1, Majestic Bus Stand, Bangalore',
      time: '22:10',
      type: 'main'
    },
    {
      id: 'bp2',
      name: 'Shanti Nagar - Boarding Zone',
      address: 'Near Metro Station, Shanti Nagar, Bangalore',
      time: '22:40',
      type: 'secondary'
    },
    {
      id: 'bp3',
      name: 'Dairy Circle',
      address: 'Dairy Circle Bus Stop, Bangalore',
      time: '22:55',
      type: 'secondary'
    },
    {
      id: 'bp4',
      name: 'Madiwala - IntrCity Lounge',
      address: 'Madiwala Bus Stand, Bangalore',
      time: '23:00',
      type: 'lounge'
    }
  ];

  const droppingPoints = [
    {
      id: 'dp1',
      name: 'Kanchipuram Bypass',
      address: 'NH 48, Kanchipuram, Tamil Nadu',
      time: '05:15',
      type: 'main'
    },
    {
      id: 'dp2',
      name: 'Sri Perumbudur',
      address: 'Sri Perumbudur Bus Stand, Chennai',
      time: '05:55',
      type: 'secondary'
    },
    {
      id: 'dp3',
      name: 'Poonamallee',
      address: 'Poonamallee Bus Stand, Chennai',
      time: '06:15',
      type: 'secondary'
    },
    {
      id: 'dp4',
      name: 'Chennai Central',
      address: 'Chennai Central Bus Stand, Chennai',
      time: '06:30',
      type: 'main'
    }
  ];

  const handleBoardingSelect = (point) => {
    setSelectedBoarding(point);
  };

  const handleDroppingSelect = (point) => {
    setSelectedDropping(point);
  };

  const handleProceedToPayment = () => {
    if (!selectedBoarding || !selectedDropping) {
      alert('Please select both boarding and dropping points');
      return;
    }

    // Store boarding/dropping selection
    const bookingData = {
      ...seatSelectionData,
      boardingPoint: selectedBoarding,
      droppingPoint: selectedDropping,
      passengerId: user._id,
      passengerName: user.name,
      passengerEmail: user.email
    };

    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    navigate('/payment');
  };

  const getPointTypeColor = (type) => {
    switch (type) {
      case 'main': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lounge': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPointTypeIcon = (type) => {
    switch (type) {
      case 'main': return '🏢';
      case 'lounge': return '☕';
      default: return '📍';
    }
  };

  if (loading) {
    return (
      <div className="boarding-selection-container">
        <div className="loading-spinner">Loading booking details...</div>
      </div>
    );
  }

  if (!seatSelectionData) {
    return (
      <div className="boarding-selection-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-title">No seat selection found</div>
          <div className="error-message">Please select seats first</div>
          <button onClick={() => navigate('/search-results')} className="retry-button">
            Go to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="boarding-selection-container">
      {/* Header */}
      <div className="boarding-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="header-content">
          <h1>Complete Your Booking</h1>
          <p>Select your boarding and dropping points</p>
        </div>
      </div>

      {/* Trip Summary */}
      <div className="trip-summary">
        <div className="summary-header">
          <h2>Trip Summary</h2>
        </div>
        <div className="summary-content">
          <div className="trip-route">
            <Bus className="w-5 h-5" />
            <span>{seatSelectionData.trip?.from} → {seatSelectionData.trip?.to}</span>
          </div>
          <div className="trip-details">
            <div className="detail-item">
              <Clock className="w-4 h-4" />
              <span>Departure: {seatSelectionData.trip?.departureTime}</span>
            </div>
            <div className="detail-item">
              <Users className="w-4 h-4" />
              <span>Seats: {seatSelectionData.seatNumbers}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="selection-content">
        {/* Boarding Points */}
        <div className="points-section">
          <div className="section-header">
            <h3>Select Boarding Point</h3>
            <p>Choose where you want to board the bus</p>
          </div>
          <div className="points-grid">
            {boardingPoints.map((point) => (
              <div
                key={point.id}
                className={`point-card ${selectedBoarding?.id === point.id ? 'selected' : ''}`}
                onClick={() => handleBoardingSelect(point)}
              >
                <div className="point-header">
                  <div className="point-type">
                    <span className="type-icon">{getPointTypeIcon(point.type)}</span>
                    <span className={`type-badge ${getPointTypeColor(point.type)}`}>
                      {point.type}
                    </span>
                  </div>
                  <div className="point-time">{point.time}</div>
                </div>
                <div className="point-name">{point.name}</div>
                <div className="point-address">{point.address}</div>
                {selectedBoarding?.id === point.id && (
                  <div className="selected-indicator">
                    <CheckCircle className="w-5 h-5" />
                    <span>Selected</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dropping Points */}
        <div className="points-section">
          <div className="section-header">
            <h3>Select Dropping Point</h3>
            <p>Choose where you want to get off the bus</p>
          </div>
          <div className="points-grid">
            {droppingPoints.map((point) => (
              <div
                key={point.id}
                className={`point-card ${selectedDropping?.id === point.id ? 'selected' : ''}`}
                onClick={() => handleDroppingSelect(point)}
              >
                <div className="point-header">
                  <div className="point-type">
                    <span className="type-icon">{getPointTypeIcon(point.type)}</span>
                    <span className={`type-badge ${getPointTypeColor(point.type)}`}>
                      {point.type}
                    </span>
                  </div>
                  <div className="point-time">{point.time}</div>
                </div>
                <div className="point-name">{point.name}</div>
                <div className="point-address">{point.address}</div>
                {selectedDropping?.id === point.id && (
                  <div className="selected-indicator">
                    <CheckCircle className="w-5 h-5" />
                    <span>Selected</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Summary & Payment */}
      <div className="booking-summary">
        <div className="summary-card">
          <div className="summary-header">
            <h3>Booking Summary</h3>
          </div>
          <div className="summary-details">
            <div className="detail-row">
              <span>Seats Selected:</span>
              <span>{seatSelectionData.seatNumbers}</span>
            </div>
            <div className="detail-row">
              <span>Base Fare:</span>
              <span>₹{seatSelectionData.totalPrice}</span>
            </div>
            <div className="detail-row">
              <span>Service Charges:</span>
              <span>₹{Math.round(seatSelectionData.totalPrice * 0.05)}</span>
            </div>
            <div className="detail-row total">
              <span>Total Amount:</span>
              <span>₹{Math.round(seatSelectionData.totalPrice * 1.05)}</span>
            </div>
          </div>
          <div className="payment-section">
            <div className="payment-method">
              <CreditCard className="w-5 h-5" />
              <span>Payment Method: UPI / Card / Net Banking</span>
            </div>
            <button 
              className="proceed-payment-btn"
              onClick={handleProceedToPayment}
              disabled={!selectedBoarding || !selectedDropping}
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardingSelection;
