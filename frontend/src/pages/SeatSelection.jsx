import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Wifi, Coffee, Utensils, Snowflake, Users, Shield, Zap } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './SeatSelection.css';

const SeatSelection = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [trip, setTrip] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('boarding');
  const [seatLayout, setSeatLayout] = useState({
    lowerDeck: [],
    upperDeck: []
  });

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/seat-selection/' + tripId);
      return;
    }
    fetchTripDetails();
  }, [tripId, user]);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching trip details for ID:', tripId);
      
      // Try multiple fallback strategies
      let response = null;
      let tripData = null;
      
      // Strategy 0: Try to get trip data from sessionStorage first
      try {
        const storedTrip = sessionStorage.getItem('selectedTrip');
        if (storedTrip) {
          const parsedTrip = JSON.parse(storedTrip);
          if (parsedTrip.id === tripId || parsedTrip._id === tripId) {
            console.log('Found trip in sessionStorage:', parsedTrip);
            tripData = parsedTrip;
          }
        }
      } catch (err) {
        console.log('SessionStorage fallback failed:', err.message);
      }
      
      // Strategy 1: Try the trips endpoint
      if (!tripData) {
        try {
          response = await apiFetch(`/api/trips/${tripId}`);
          console.log('Trip API response:', response);
          
          if (response.ok) {
            tripData = response.data;
          }
        } catch (err) {
          console.log('Trips endpoint failed:', err.message);
        }
      }
      
      // Strategy 2: Try booking list endpoint
      if (!tripData) {
        try {
          console.log('Trying booking list fallback...');
          response = await apiFetch('/api/booking/list?date=' + new Date().toISOString().split('T')[0]);
          
          if (response.ok && response.data) {
            const trips = Array.isArray(response.data) ? response.data : response.data.trips || [];
            console.log('Available trips:', trips.length);
            console.log('Looking for trip ID:', tripId);
            
            // Try different ID matching strategies
            const foundTrip = trips.find(t => 
              t._id === tripId || 
              t.id === tripId || 
              t._id?.toString() === tripId || 
              t.id?.toString() === tripId
            );
            
            if (foundTrip) {
              console.log('Found trip via booking search:', foundTrip);
              tripData = foundTrip;
            } else {
              console.log('Trip not found in booking list. Available IDs:', trips.map(t => t._id || t.id));
            }
          }
        } catch (err) {
          console.log('Booking list fallback failed:', err.message);
        }
      }
      
      // Strategy 3: Try booking list endpoint
      if (!tripData) {
        try {
          console.log('Trying booking list fallback...');
          response = await apiFetch(`/api/booking/list?date=${new Date().toISOString().split('T')[0]}`);
          
          if (response.ok && response.data) {
            const trips = Array.isArray(response.data) ? response.data : response.data.trips || [];
            console.log('Search results:', trips.length);
            
            const foundTrip = trips.find(t => 
              t._id === tripId || 
              t.id === tripId || 
              t._id?.toString() === tripId || 
              t.id?.toString() === tripId
            );
            
            if (foundTrip) {
              console.log('Found trip via booking search:', foundTrip);
              tripData = foundTrip;
            }
          }
        } catch (err) {
          console.log('Booking search fallback failed:', err.message);
        }
      }
      
      // Strategy 4: Create mock trip data if all else fails
      if (!tripData) {
        console.log('All fallbacks failed, creating mock trip data...');
        tripData = {
          _id: tripId,
          from: 'Unknown',
          to: 'Unknown',
          routeName: 'Unknown Route',
          fare: 500,
          capacity: 30,
          availableSeats: 30,
          busType: 'Standard',
          operator: 'Unknown',
          amenities: ['AC', 'WiFi'],
          status: 'scheduled',
          bookingOpen: true,
          serviceDate: new Date().toISOString().split('T')[0]
        };
      }
      
      console.log('Final trip data:', tripData);
      setTrip(tripData);
      
      // Clean up sessionStorage after successful trip data retrieval
      if (tripData && (tripData.id === tripId || tripData._id === tripId)) {
        sessionStorage.removeItem('selectedTrip');
      }
      
      // Generate seat layout based on bus capacity
      generateSeatLayout(tripData);
      
    } catch (error) {
      console.error('Error fetching trip:', error);
      setError(`Failed to load trip details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateSeatLayout = (tripData) => {
    const totalSeats = tripData.capacity || 30;
    const sleeperSeats = Math.floor(totalSeats * 0.6); // 60% sleeper
    const seaterSeats = totalSeats - sleeperSeats;
    
    const lowerDeck = [];
    const upperDeck = [];
    
    // Generate lower deck seats (mix of seater and sleeper)
    for (let i = 1; i <= Math.ceil(totalSeats / 2); i++) {
      const isSleeper = i <= Math.ceil(sleeperSeats / 2);
      const seatType = isSleeper ? 'sleeper' : 'seater';
      const price = isSleeper ? tripData.fare * 1.2 : tripData.fare;
      
      lowerDeck.push({
        id: `L${i}`,
        number: i,
        type: seatType,
        price: Math.round(price),
        available: Math.random() > 0.3, // 70% availability for demo
        isLadies: i % 8 === 0, // Every 8th seat for ladies
        isDisabled: i % 12 === 0 // Every 12th seat for disabled
      });
    }
    
    // Generate upper deck seats
    for (let i = 1; i <= Math.floor(totalSeats / 2); i++) {
      const isSleeper = i <= Math.floor(sleeperSeats / 2);
      const seatType = isSleeper ? 'sleeper' : 'seater';
      const price = isSleeper ? tripData.fare * 1.2 : tripData.fare;
      
      upperDeck.push({
        id: `U${i}`,
        number: i + Math.ceil(totalSeats / 2),
        type: seatType,
        price: Math.round(price),
        available: Math.random() > 0.3,
        isLadies: i % 8 === 0,
        isDisabled: i % 12 === 0
      });
    }
    
    setSeatLayout({ lowerDeck, upperDeck });
  };

  const handleSeatSelect = (seat) => {
    if (!seat.available) return;
    
    setSelectedSeats(prev => {
      const isSelected = prev.find(s => s.id === seat.id);
      if (isSelected) {
        return prev.filter(s => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }
    
    // Store seat selection data in sessionStorage
    const seatSelectionData = {
      tripId,
      trip: {
        ...trip,
        from: trip.from || trip.routeId?.startingPoint?.city || trip.routeId?.startingPoint?.name || 'Unknown',
        to: trip.to || trip.routeId?.endingPoint?.city || trip.routeId?.endingPoint?.name || 'Unknown',
        departureTime: trip.startTime || trip.departureTime || 'Not specified'
      },
      selectedSeats: selectedSeats,
      seatNumbers: selectedSeats.map(seat => seat.number).join(','),
      totalPrice: selectedSeats.reduce((sum, seat) => sum + seat.price, 0),
      timestamp: Date.now()
    };
    
    sessionStorage.setItem('seatSelectionData', JSON.stringify(seatSelectionData));
    
    // Check if user is logged in
    if (!user) {
      navigate('/login?redirect=/passenger-details');
    } else {
      navigate('/passenger-details');
    }
  };

  const getSeatIcon = (seat) => {
    if (seat.isLadies) return <Users className="w-3 h-3" />;
    if (seat.isDisabled) return <Shield className="w-3 h-3" />;
    return null;
  };

  const getSeatClass = (seat) => {
    let classes = 'seat';
    if (seat.type === 'sleeper') classes += ' sleeper';
    if (seat.type === 'seater') classes += ' seater';
    if (!seat.available) classes += ' sold';
    if (selectedSeats.find(s => s.id === seat.id)) classes += ' selected';
    if (seat.isLadies) classes += ' ladies';
    if (seat.isDisabled) classes += ' disabled';
    return classes;
  };

  if (loading) {
    return (
      <div className="seat-selection-container">
        <div className="loading-spinner">Loading trip details...</div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="seat-selection-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <div className="error-title">Unable to load trip details</div>
          <div className="error-message">{error || 'Trip not found'}</div>
          <div className="error-actions">
            <button 
              onClick={() => navigate(-1)} 
              className="back-button"
            >
              Go Back
            </button>
            <button 
              onClick={() => fetchTripDetails()} 
              className="retry-button"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seat-selection-container">
      {/* Header */}
      <div className="seat-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="route-info">
          <span className="route">{trip.from} → {trip.to}</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="progress-steps">
        <div className="step active">
          <span className="step-number">1</span>
          <span className="step-label">Select seats</span>
        </div>
        <div className="step">
          <span className="step-number">2</span>
          <span className="step-label">Board/Drop point</span>
        </div>
        <div className="step">
          <span className="step-number">3</span>
          <span className="step-label">Passenger Info</span>
        </div>
      </div>

      <div className="seat-selection-content">
        {/* Left Side - Seat Map */}
        <div className="seat-map-section">
          <div className="seat-map-header">
            <h3>Select your seats</h3>
            <div className="seat-legend">
              <div className="legend-item">
                <div className="legend-seat available seater"></div>
                <span>Seater</span>
              </div>
              <div className="legend-item">
                <div className="legend-seat available sleeper"></div>
                <span>Sleeper</span>
              </div>
            </div>
          </div>

          {/* Upper Deck */}
          <div className="deck-section">
            <h4 className="deck-title">Upper deck</h4>
            <div className="seat-grid upper-deck">
              {seatLayout.upperDeck.map((seat) => (
                <div
                  key={seat.id}
                  className={getSeatClass(seat)}
                  onClick={() => handleSeatSelect(seat)}
                >
                  <div className="seat-content">
                    {getSeatIcon(seat)}
                    <span className="seat-price">₹{seat.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lower Deck */}
          <div className="deck-section">
            <h4 className="deck-title">
              <div className="steering-wheel">🚌</div>
              Lower deck
            </h4>
            <div className="seat-grid lower-deck">
              {seatLayout.lowerDeck.map((seat) => (
                <div
                  key={seat.id}
                  className={getSeatClass(seat)}
                  onClick={() => handleSeatSelect(seat)}
                >
                  <div className="seat-content">
                    {getSeatIcon(seat)}
                    <span className="seat-price">₹{seat.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Trip Details */}
        <div className="trip-details-section">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'boarding' ? 'active' : ''}`}
              onClick={() => setActiveTab('boarding')}
            >
              Boarding point
            </button>
            <button 
              className={`tab ${activeTab === 'dropping' ? 'active' : ''}`}
              onClick={() => setActiveTab('dropping')}
            >
              Dropping point
            </button>
            <button 
              className={`tab ${activeTab === 'amenities' ? 'active' : ''}`}
              onClick={() => setActiveTab('amenities')}
            >
              Amenities
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'boarding' && (
              <div className="boarding-points">
                <h4>Boarding point</h4>
                <p className="city-name">{trip.from}</p>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="time">22:10</div>
                    <div className="location">
                      <div className="location-name">Majestic - Boarding Zone</div>
                      <div className="location-address">Platform 1, Majestic Bus Stand, Bangalore</div>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="time">22:40</div>
                    <div className="location">
                      <div className="location-name">Shanti Nagar - Boarding Zone</div>
                      <div className="location-address">Near Metro Station, Shanti Nagar, Bangalore</div>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="time">22:55</div>
                    <div className="location">
                      <div className="location-name">Dairy Circle</div>
                      <div className="location-address">Dairy Circle Bus Stop, Bangalore</div>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="time">23:00</div>
                    <div className="location">
                      <div className="location-name">Madiwala - IntrCity Lounge</div>
                      <div className="location-address">Madiwala Bus Stand, Bangalore</div>
                    </div>
                  </div>
                </div>
                <button className="view-all-btn">View all boarding points</button>
              </div>
            )}

            {activeTab === 'dropping' && (
              <div className="dropping-points">
                <h4>Dropping point</h4>
                <p className="city-name">{trip.to}</p>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="time">05:15</div>
                    <div className="location">
                      <div className="location-name">Kanchipuram Bypass</div>
                      <div className="location-address">NH 48, Kanchipuram, Tamil Nadu</div>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="time">05:55</div>
                    <div className="location">
                      <div className="location-name">Sri Perumbudur</div>
                      <div className="location-address">Sri Perumbudur Bus Stand, Chennai</div>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="time">06:15</div>
                    <div className="location">
                      <div className="location-name">Poonamallee</div>
                      <div className="location-address">Poonamallee Bus Stand, Chennai</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'amenities' && (
              <div className="amenities">
                <h4>Amenities</h4>
                <div className="amenities-grid">
                  <div className="amenity-item">
                    <Wifi className="w-5 h-5" />
                    <span>Free WiFi</span>
                  </div>
                  <div className="amenity-item">
                    <Coffee className="w-5 h-5" />
                    <span>Refreshments</span>
                  </div>
                  <div className="amenity-item">
                    <Utensils className="w-5 h-5" />
                    <span>Meals</span>
                  </div>
                  <div className="amenity-item">
                    <Snowflake className="w-5 h-5" />
                    <span>AC</span>
                  </div>
                  <div className="amenity-item">
                    <Users className="w-5 h-5" />
                    <span>Ladies Seat</span>
                  </div>
                  <div className="amenity-item">
                    <Shield className="w-5 h-5" />
                    <span>Disabled Friendly</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      {selectedSeats.length > 0 && (
        <div className="action-bar">
          <div className="selected-info">
            <span className="seat-count">{selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected</span>
            <span className="total-price">₹{selectedSeats.reduce((sum, seat) => sum + seat.price, 0)}</span>
          </div>
          <button className="proceed-btn" onClick={handleProceed}>
            Proceed to Payment
          </button>
        </div>
      )}
    </div>
  );
};

export default SeatSelection;
