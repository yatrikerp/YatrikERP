import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, CreditCard, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './PassengerDetails.css';

const PassengerDetails = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seatSelectionData, setSeatSelectionData] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/passenger-details');
      return;
    }

    const storedData = sessionStorage.getItem('seatSelectionData');
    if (!storedData) {
      navigate('/search-results');
      return;
    }

    try {
      const data = JSON.parse(storedData);
      
      // If trip data is incomplete, try to fetch it
      if (!data.trip?.from || data.trip?.from === 'Unknown') {
        fetchTripDetails(data.tripId).then(tripData => {
          if (tripData) {
            const updatedData = {
              ...data,
              trip: {
                ...data.trip,
                from: tripData.from || tripData.routeId?.startingPoint?.city || tripData.routeId?.startingPoint?.name || 'Unknown',
                to: tripData.to || tripData.routeId?.endingPoint?.city || tripData.routeId?.endingPoint?.name || 'Unknown',
                departureTime: tripData.startTime || tripData.departureTime || 'Not specified'
              }
            };
            setSeatSelectionData(updatedData);
            sessionStorage.setItem('seatSelectionData', JSON.stringify(updatedData));
          } else {
            setSeatSelectionData(data);
          }
        });
      } else {
        setSeatSelectionData(data);
      }
      
      // Initialize passengers based on selected seats
      const initialPassengers = data.selectedSeats.map((seat, index) => ({
        id: index + 1,
        name: '',
        age: '',
        gender: seat.isLadies ? 'female' : (seat.isDisabled ? 'male' : ''),
        seatNumber: seat.number,
        seatType: seat.type,
        isLadies: seat.isLadies,
        isDisabled: seat.isDisabled
      }));
      
      setPassengers(initialPassengers);
    } catch (error) {
      console.error('Error parsing seat selection data:', error);
      navigate('/search-results');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  const fetchTripDetails = async (tripId) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`);
      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      console.error('Error fetching trip details:', error);
    }
    return null;
  };

  const handlePassengerChange = (index, field, value) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value
    };
    setPassengers(updatedPassengers);
  };

  const handleGenderChange = (index, gender) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      gender: gender
    };
    setPassengers(updatedPassengers);
  };

  const handleProceedToPayment = () => {
    // Validate all passenger details
    const isValid = passengers.every(passenger => 
      passenger.name.trim() && 
      passenger.age.trim() && 
      passenger.gender
    );

    if (!isValid) {
      alert('Please fill in all passenger details');
      return;
    }

    // Store passenger details in sessionStorage
    const bookingData = {
      ...seatSelectionData,
      passengers: passengers,
      passengerId: user._id,
      passengerName: user.name,
      passengerEmail: user.email
    };

    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    navigate('/payment');
  };

  const getSeatTypeColor = (seatType) => {
    switch (seatType) {
      case 'seater': return 'bg-blue-100 text-blue-800';
      case 'sleeper': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGenderIcon = (gender) => {
    return gender === 'female' ? '👩' : '👨';
  };

  if (loading) {
    return (
      <div className="passenger-details-container">
        <div className="loading-spinner">Loading passenger details...</div>
      </div>
    );
  }

  if (!seatSelectionData) {
    return (
      <div className="passenger-details-container">
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
    <div className="passenger-details-container">
      {/* Header */}
      <div className="passenger-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="header-content">
          <h1>Passenger Details</h1>
          <p>Enter details for all passengers</p>
        </div>
      </div>

      <div className="main-content">
        {/* Left Column - Passenger Form */}
        <div className="left-column">
          {/* Trip Summary */}
          <div className="trip-summary">
            <div className="summary-header">
              <h2>Trip Summary</h2>
            </div>
            <div className="summary-content">
              <div className="trip-route">
                <span>{seatSelectionData.trip?.from || 'Unknown'} → {seatSelectionData.trip?.to || 'Unknown'}</span>
              </div>
              <div className="trip-details">
                <span>Departure: {seatSelectionData.trip?.departureTime || 'Not specified'}</span>
                <span>•</span>
                <span>Seats: {seatSelectionData.seatNumbers}</span>
              </div>
            </div>
          </div>

          {/* Passenger Details Form */}
          <div className="passenger-form">
            <div className="form-header">
              <h2>Passenger Information</h2>
              <p>Please provide details for all passengers</p>
            </div>

            <div className="passengers-list">
              {passengers.map((passenger, index) => (
                <div key={passenger.id} className="passenger-card">
                  <div className="passenger-header">
                    <div className="passenger-info">
                      <User className="w-5 h-5" />
                      <span className="passenger-title">Passenger {passenger.id}</span>
                    </div>
                    <div className="seat-info">
                      <span className={`seat-type ${getSeatTypeColor(passenger.seatType)}`}>
                        {passenger.seatType}
                      </span>
                      <span className="seat-number">Seat {passenger.seatNumber}</span>
                    </div>
                  </div>

                  <div className="passenger-form-fields">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Name *</label>
                        <input
                          type="text"
                          placeholder="Enter passenger name"
                          value={passenger.name}
                          onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Age *</label>
                        <input
                          type="number"
                          placeholder="Age"
                          value={passenger.age}
                          onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                          className="form-input"
                          min="1"
                          max="120"
                        />
                      </div>
                    </div>

                    <div className="gender-section">
                      <label>Gender *</label>
                      <div className="gender-options">
                        {passenger.isLadies ? (
                          <div className="gender-selected">
                            <span className="gender-icon">{getGenderIcon('female')}</span>
                            <span>Female (reserved seat)</span>
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        ) : passenger.isDisabled ? (
                          <div className="gender-selected">
                            <span className="gender-icon">{getGenderIcon('male')}</span>
                            <span>Male (reserved seat)</span>
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="gender-radio-group">
                            <label className="gender-option">
                              <input
                                type="radio"
                                name={`gender-${index}`}
                                value="male"
                                checked={passenger.gender === 'male'}
                                onChange={(e) => handleGenderChange(index, e.target.value)}
                              />
                              <span className="gender-icon">{getGenderIcon('male')}</span>
                              <span>Male</span>
                            </label>
                            <label className="gender-option">
                              <input
                                type="radio"
                                name={`gender-${index}`}
                                value="female"
                                checked={passenger.gender === 'female'}
                                onChange={(e) => handleGenderChange(index, e.target.value)}
                              />
                              <span className="gender-icon">{getGenderIcon('female')}</span>
                              <span>Female</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Payment Summary */}
        <div className="right-column">
          <div className="payment-summary">
            <div className="summary-card">
              <div className="summary-header">
                <h3>Booking Summary</h3>
              </div>
              <div className="summary-details">
                <div className="detail-row">
                  <span>Passengers:</span>
                  <span>{passengers.length}</span>
                </div>
                <div className="detail-row">
                  <span>Seats:</span>
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
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerDetails;
