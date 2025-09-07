import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, Clock, Bus, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import './BookingSystem.css';

const BookingSystem = ({ user, onBookingComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [searchData, setSearchData] = useState({
    from: '',
    to: '',
    departureDate: '',
    passengers: 1
  });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerDetails, setPassengerDetails] = useState([]);
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('price');
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Step 1: Search trips
  const handleSearch = async () => {
    if (!searchData.from || !searchData.to || !searchData.departureDate) {
      setError('Please fill in all search fields');
      return;
    }

    setLoading(true);
    setShowSkeleton(true);
    setError('');

    try {
      const response = await fetch('/api/booking/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('depotToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify(searchData)
      });

      const result = await response.json();

      if (result.success) {
        let trips = Array.isArray(result.data.trips) ? result.data.trips : [];
        // Basic sort
        trips = trips.sort((a, b) => {
          if (sort === 'price') return (a.fare || 0) - (b.fare || 0);
          if (sort === 'departure') return String(a.startTime || '').localeCompare(String(b.startTime || ''));
          return 0;
        });
        setSearchResults(trips);
        setCurrentStep(2);
      } else {
        setError(result.message || 'Failed to search trips');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setShowSkeleton(false);
    }
  };

  // Step 2: Select trip
  const handleTripSelect = (trip) => {
    setSelectedTrip(trip);
    setCurrentStep(3);
  };

  // Step 3: Select seats
  const handleSeatSelect = async (tripId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/booking/seats/${tripId}?departureDate=${searchData.departureDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('depotToken') || localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setCurrentStep(4);
      } else {
        setError(result.message || 'Failed to load seats');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Passenger details
  const handlePassengerDetails = (details) => {
    setPassengerDetails(details);
    setCurrentStep(5);
  };

  // Step 5: Payment and confirmation
  const handleBooking = async () => {
    setLoading(true);
    setError('');

    try {
      const bookingPayload = {
        tripId: selectedTrip._id,
        customer: {
          name: user?.name || 'Guest User',
          email: user?.email || 'guest@example.com',
          phone: user?.phone || '0000000000'
        },
        journey: {
          from: searchData.from,
          to: searchData.to,
          departureDate: new Date(searchData.departureDate),
          departureTime: selectedTrip.startTime,
          arrivalDate: new Date(searchData.departureDate),
          arrivalTime: selectedTrip.endTime,
          duration: selectedTrip.routeId?.duration || 0
        },
        seats: selectedSeats.map((seat, index) => ({
          seatNumber: seat,
          seatType: 'seater',
          seatPosition: 'window',
          price: selectedTrip.fare || 100,
          passengerName: passengerDetails[index]?.name || `Passenger ${index + 1}`,
          passengerAge: passengerDetails[index]?.age || 25,
          passengerGender: passengerDetails[index]?.gender || 'male'
        }))
      };

      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('depotToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify(bookingPayload)
      });

      const result = await response.json();

      if (result.success) {
        setBookingData(result.data);
        setCurrentStep(6);
        if (onBookingComplete) {
          onBookingComplete(result.data);
        }
      } else {
        setError(result.message || 'Failed to create booking');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="booking-step">
      <h2>Search Buses</h2>
      <div className="search-form">
        <div className="form-group">
          <label>From</label>
          <div className="input-group">
            <MapPin className="input-icon" />
            <input
              type="text"
              placeholder="Enter departure city"
              value={searchData.from}
              onChange={(e) => setSearchData({...searchData, from: e.target.value})}
            />
          </div>
        </div>

        <div className="form-group">
          <label>To</label>
          <div className="input-group">
            <MapPin className="input-icon" />
            <input
              type="text"
              placeholder="Enter destination city"
              value={searchData.to}
              onChange={(e) => setSearchData({...searchData, to: e.target.value})}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Departure Date</label>
          <div className="input-group">
            <Calendar className="input-icon" />
            <input
              type="date"
              value={searchData.departureDate}
              onChange={(e) => setSearchData({...searchData, departureDate: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Passengers</label>
          <div className="input-group">
            <Users className="input-icon" />
            <select
              value={searchData.passengers}
              onChange={(e) => setSearchData({...searchData, passengers: parseInt(e.target.value)})}
            >
              {[1,2,3,4,5,6].map(num => (
                <option key={num} value={num}>{num} Passenger{num > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          className="search-btn"
          onClick={handleSearch}
          disabled={loading}
        >
          <Search className="btn-icon" />
          {loading ? 'Searching...' : 'Search Buses'}
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="booking-step">
      <h2>Select Bus</h2>
      <div className="toolbar">
        <div className="sort">
          <label>Sort by</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="price">Lowest Price</option>
            <option value="departure">Departure Time</option>
          </select>
        </div>
      </div>
      <div className="search-results">
        {showSkeleton && (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="trip-card skeleton" />
            ))}
          </>
        )}
        {!showSkeleton && searchResults.map((trip, index) => (
          <div key={index} className="trip-card">
            <div className="trip-header">
              <div className="trip-info">
                <h3>{trip.routeId?.routeName || 'Route'}</h3>
                <p>{trip.routeId?.startingPoint?.city} → {trip.routeId?.endingPoint?.city}</p>
              </div>
              <div className="trip-fare">
                <span className="fare-amount">₹{trip.fare}</span>
                <span className="fare-label">per seat</span>
              </div>
            </div>

            <div className="trip-details">
              <div className="detail-item">
                <Bus className="detail-icon" />
                <span>{trip.busId?.busNumber} - {trip.busId?.busType}</span>
              </div>
              <div className="detail-item">
                <Clock className="detail-icon" />
                <span>{trip.startTime} - {trip.endTime}</span>
              </div>
              <div className="detail-item">
                <Users className="detail-icon" />
                <span>{trip.availableSeats} seats available</span>
              </div>
            </div>

            <div className="chip-row">
              {(trip.busId?.amenities || []).slice(0,4).map((a, i) => (
                <span key={i} className="chip">{a}</span>
              ))}
            </div>

            <div className="trip-actions">
              <button 
                className="select-trip-btn"
                onClick={() => handleTripSelect(trip)}
              >
                Select Bus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="booking-step">
      <h2>Select Seats</h2>
      <div className="seat-selection">
        <div className="seat-map">
          {/* Seat map will be rendered here */}
          <p>Seat selection interface will be implemented here</p>
        </div>
        <div className="seat-summary">
          <h3>Selected Seats: {selectedSeats.length}</h3>
          <button 
            className="continue-btn"
            onClick={() => setCurrentStep(4)}
            disabled={selectedSeats.length === 0}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="booking-step">
      <h2>Passenger Details</h2>
      <div className="passenger-form">
        {Array.from({ length: searchData.passengers }, (_, index) => (
          <div key={index} className="passenger-details">
            <h3>Passenger {index + 1}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={passengerDetails[index]?.name || ''}
                  onChange={(e) => {
                    const newDetails = [...passengerDetails];
                    newDetails[index] = { ...newDetails[index], name: e.target.value };
                    setPassengerDetails(newDetails);
                  }}
                />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  placeholder="Age"
                  value={passengerDetails[index]?.age || ''}
                  onChange={(e) => {
                    const newDetails = [...passengerDetails];
                    newDetails[index] = { ...newDetails[index], age: parseInt(e.target.value) };
                    setPassengerDetails(newDetails);
                  }}
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select
                  value={passengerDetails[index]?.gender || 'male'}
                  onChange={(e) => {
                    const newDetails = [...passengerDetails];
                    newDetails[index] = { ...newDetails[index], gender: e.target.value };
                    setPassengerDetails(newDetails);
                  }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button 
          className="continue-btn"
          onClick={() => setCurrentStep(5)}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="booking-step">
      <h2>Payment & Confirmation</h2>
      <div className="payment-summary">
        <div className="booking-summary">
          <h3>Booking Summary</h3>
          <div className="summary-item">
            <span>Route:</span>
            <span>{searchData.from} → {searchData.to}</span>
          </div>
          <div className="summary-item">
            <span>Date:</span>
            <span>{new Date(searchData.departureDate).toLocaleDateString()}</span>
          </div>
          <div className="summary-item">
            <span>Time:</span>
            <span>{selectedTrip?.startTime} - {selectedTrip?.endTime}</span>
          </div>
          <div className="summary-item">
            <span>Seats:</span>
            <span>{selectedSeats.length} seat(s)</span>
          </div>
          <div className="summary-item total">
            <span>Total Amount:</span>
            <span>₹{(selectedTrip?.fare || 100) * selectedSeats.length}</span>
          </div>
        </div>

        <div className="payment-methods">
          <h3>Payment Method</h3>
          <div className="payment-options">
            <label className="payment-option">
              <input type="radio" name="payment" value="card" defaultChecked />
              <CreditCard className="payment-icon" />
              <span>Credit/Debit Card</span>
            </label>
            <label className="payment-option">
              <input type="radio" name="payment" value="upi" />
              <span>UPI</span>
            </label>
            <label className="payment-option">
              <input type="radio" name="payment" value="wallet" />
              <span>Wallet</span>
            </label>
          </div>
        </div>

        <button 
          className="book-now-btn"
          onClick={handleBooking}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Book Now'}
        </button>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="booking-step">
      <div className="booking-success">
        <CheckCircle className="success-icon" />
        <h2>Booking Confirmed!</h2>
        <p>Your booking has been successfully created.</p>
        
        {bookingData && (
          <div className="booking-details">
            <h3>Booking Details</h3>
            <div className="detail-item">
              <span>Booking ID:</span>
              <span>{bookingData.bookingId}</span>
            </div>
            <div className="detail-item">
              <span>Reference:</span>
              <span>{bookingData.bookingReference}</span>
            </div>
            <div className="detail-item">
              <span>Total Amount:</span>
              <span>₹{bookingData.pricing?.totalAmount}</span>
            </div>
          </div>
        )}

        <div className="success-actions">
          <button 
            className="primary-btn"
            onClick={() => window.print()}
          >
            Print Ticket
          </button>
          <button 
            className="secondary-btn"
            onClick={() => {
              setCurrentStep(1);
              setSearchData({ from: '', to: '', departureDate: '', passengers: 1 });
              setSearchResults([]);
              setSelectedTrip(null);
              setSelectedSeats([]);
              setPassengerDetails([]);
              setBookingData(null);
            }}
          >
            Book Another
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="booking-system">
      <div className="booking-header">
        <h1>Book Your Bus Ticket</h1>
        <div className="booking-steps">
          {[1,2,3,4,5,6].map(step => (
            <div 
              key={step}
              className={`step ${currentStep >= step ? 'active' : ''}`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <XCircle className="error-icon" />
          {error}
        </div>
      )}

      <div className="booking-content">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}
      </div>
    </div>
  );
};

export default BookingSystem;
