import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bus, MapPin, Clock, Calendar, 
  Users, CreditCard, CheckCircle, AlertCircle, 
  User, Phone, Mail, ChevronRight, Seat
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { toast } from 'react-hot-toast';

const MobileTripBooking = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Trip Details, 2: Seat Selection, 3: Passenger Details, 4: Payment
  const [passengerDetails, setPassengerDetails] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: '',
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    }
  });
  const [paymentMethod, setPaymentMethod] = useState('card');

  useEffect(() => {
    fetchTripDetails();
  }, [tripId]);

  const fetchTripDetails = async () => {
    try {
      const response = await apiFetch(`/api/booking/trip/${tripId}`);
      if (response.ok) {
        setTrip(response.data.trip);
      } else {
        toast.error('Failed to load trip details');
        navigate('/booking');
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
      toast.error('Failed to load trip details');
      navigate('/booking');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelection = (seatNumber) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const handlePassengerDetailsChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setPassengerDetails(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setPassengerDetails(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleBooking = async () => {
    if (!passengerDetails.name || !passengerDetails.phone || !passengerDetails.email) {
      toast.error('Please fill in all required passenger details');
      return;
    }

    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    setBookingLoading(true);
    
    try {
      const bookingData = {
        tripId: trip._id,
        seats: selectedSeats,
        passengerDetails,
        paymentMethod
      };

      const response = await apiFetch('/api/booking/create', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        toast.success('Booking successful!');
        navigate(`/booking/confirmation/${response.data.booking._id}`);
      } else {
        toast.error(response.data.message || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const renderTripDetails = () => (
    <div style={{ padding: '16px' }}>
      {/* RedBus Style Route Display */}
      <div style={{
        background: 'linear-gradient(135deg, #E91E63 0%, #EC407A 100%)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          transform: 'translate(30px, -30px)'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'white',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Bus size={20} />
            Route Details
          </h2>
          
          {/* Route Display - RedBus Style */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            {/* From Location */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid white'
              }} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>
                  {trip?.route?.from}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                  Departure
                </div>
              </div>
            </div>

            {/* Route Line */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
              marginLeft: '5px'
            }}>
              <div style={{
                width: '2px',
                height: '20px',
                background: 'linear-gradient(to bottom, #10b981, #f59e0b)',
                borderRadius: '1px'
              }} />
              <div style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: '500'
              }}>
                {trip?.route?.distance} km • {trip?.duration}
              </div>
            </div>

            {/* To Location */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#ef4444',
                border: '2px solid white'
              }} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>
                  {trip?.route?.to}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                  Arrival
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Information Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px'
        }}>
          Trip Information
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Departure
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {trip?.departureTime}
            </div>
          </div>
          
          <div style={{
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Arrival
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {trip?.arrivalTime}
            </div>
          </div>
          
          <div style={{
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Bus Type
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {trip?.bus?.type}
            </div>
          </div>
          
          <div style={{
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Fare
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#E91E63' }}>
              ₹{trip?.fare || 250}
            </div>
          </div>
        </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '8px'
          }}>
            <Clock size={20} color="#10b981" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                {trip?.departureTime} - {trip?.arrivalTime}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Duration: {trip?.duration}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '8px'
          }}>
            <Calendar size={20} color="#f59e0b" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                {new Date(trip?.date).toLocaleDateString()}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {trip?.bus?.operator}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '8px'
          }}>
            <Bus size={20} color="#8b5cf6" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                {trip?.bus?.type} - {trip?.bus?.number}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                ₹{trip?.fare || 250} per seat
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setCurrentStep(2)}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          border: 'none',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        Select Seats
        <ChevronRight size={20} />
      </button>
    </div>
  );

  const renderSeatSelection = () => (
    <div style={{ padding: '16px' }}>
      {/* RedBus Style Route Display in Seat Selection */}
      <div style={{
        background: 'linear-gradient(135deg, #E91E63 0%, #EC407A 100%)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        color: 'white',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981'
            }} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              {trip?.route?.from}
            </span>
          </div>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.8)'
          }}>
            {trip?.departureTime}
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '8px 0'
        }}>
          <div style={{
            width: '100%',
            height: '2px',
            background: 'rgba(255,255,255,0.3)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#E91E63',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600'
            }}>
              {trip?.route?.distance} km
            </div>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#ef4444'
            }} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              {trip?.route?.to}
            </span>
          </div>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.8)'
          }}>
            {trip?.arrivalTime}
          </div>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Seat size={20} color="#E91E63" />
          Select Seats
        </h2>

        {/* Seat Legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginBottom: '20px',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              background: 'white',
              border: '1px solid #e5e7eb'
            }} />
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              background: '#E91E63',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '600'
            }}>
              ✓
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Selected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              background: '#6b7280'
            }} />
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Booked</span>
          </div>
        </div>
        
        {/* Bus Layout */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          {/* Driver Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '20px',
              background: '#374151',
              borderRadius: '4px',
              margin: '0 auto 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px',
              fontWeight: '600'
            }}>
              🚌
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>Driver</div>
          </div>

          {/* Seat Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '16px'
          }}>
            {Array.from({ length: 40 }, (_, i) => i + 1).map(seatNumber => (
              <button
                key={seatNumber}
                onClick={() => handleSeatSelection(seatNumber)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  border: selectedSeats.includes(seatNumber) ? '2px solid #E91E63' : '1px solid #e5e7eb',
                  background: selectedSeats.includes(seatNumber) ? '#E91E63' : 'white',
                  color: selectedSeats.includes(seatNumber) ? 'white' : '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedSeats.includes(seatNumber) ? '0 2px 8px rgba(233, 30, 99, 0.3)' : 'none'
                }}
                onMouseOver={(e) => {
                  if (!selectedSeats.includes(seatNumber)) {
                    e.target.style.borderColor = '#E91E63';
                    e.target.style.background = '#fef2f2';
                  }
                }}
                onMouseOut={(e) => {
                  if (!selectedSeats.includes(seatNumber)) {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.background = 'white';
                  }
                }}
              >
                {seatNumber}
              </button>
            ))}
          </div>

          {/* Door Section */}
          <div style={{
            textAlign: 'center',
            marginTop: '16px'
          }}>
            <div style={{
              width: '60px',
              height: '40px',
              background: '#6b7280',
              borderRadius: '6px',
              margin: '0 auto 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              DOOR
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <Seat size={20} color="#6b7280" />
          <div style={{ fontSize: '14px', color: '#374151' }}>
            Selected Seats: {selectedSeats.length} × ₹{trip?.fare || 250} = ₹{selectedSeats.length * (trip?.fare || 250)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setCurrentStep(1)}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '12px',
            background: '#f3f4f6',
            color: '#374151',
            border: 'none',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          disabled={selectedSeats.length === 0}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '12px',
            background: selectedSeats.length === 0 ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: selectedSeats.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          Continue
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderPassengerDetails = () => (
    <div style={{ padding: '16px' }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px'
        }}>
          Passenger Details
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Full Name *
            </label>
            <input
              type="text"
              value={passengerDetails.name}
              onChange={(e) => handlePassengerDetailsChange('name', e.target.value)}
              placeholder="Enter full name"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Phone Number *
            </label>
            <input
              type="tel"
              value={passengerDetails.phone}
              onChange={(e) => handlePassengerDetailsChange('phone', e.target.value)}
              placeholder="Enter phone number"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Email *
            </label>
            <input
              type="email"
              value={passengerDetails.email}
              onChange={(e) => handlePassengerDetailsChange('email', e.target.value)}
              placeholder="Enter email address"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Age
              </label>
              <input
                type="number"
                value={passengerDetails.age}
                onChange={(e) => handlePassengerDetailsChange('age', e.target.value)}
                placeholder="Age"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Gender
              </label>
              <select
                value={passengerDetails.gender}
                onChange={(e) => handlePassengerDetailsChange('gender', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  background: 'white'
                }}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setCurrentStep(2)}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '12px',
            background: '#f3f4f6',
            color: '#374151',
            border: 'none',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep(4)}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          Continue
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div style={{ padding: '16px' }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '16px'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px'
        }}>
          Payment Summary
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Seats Selected</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
              {selectedSeats.length}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Fare per Seat</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
              ₹{trip?.fare || 250}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Subtotal</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
              ₹{selectedSeats.length * (trip?.fare || 250)}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0'
          }}>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Total</span>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              ₹{selectedSeats.length * (trip?.fare || 250)}
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '12px'
          }}>
            Payment Method
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
              { id: 'upi', label: 'UPI', icon: Phone },
              { id: 'netbanking', label: 'Net Banking', icon: CheckCircle }
            ].map(method => (
              <label key={method.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                border: paymentMethod === method.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                background: paymentMethod === method.id ? '#eff6ff' : 'white'
              }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ margin: 0 }}
                />
                <method.icon size={20} color={paymentMethod === method.id ? '#3b82f6' : '#6b7280'} />
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: paymentMethod === method.id ? '#3b82f6' : '#374151'
                }}>
                  {method.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setCurrentStep(3)}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '12px',
            background: '#f3f4f6',
            color: '#374151',
            border: 'none',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        <button
          onClick={handleBooking}
          disabled={bookingLoading}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '12px',
            background: bookingLoading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: bookingLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {bookingLoading ? (
            <>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Booking...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Confirm Booking
            </>
          )}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ fontSize: '16px', color: '#6b7280' }}>Loading trip details...</div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
            Trip Not Found
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
            The trip you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/booking')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderTripDetails();
      case 2:
        return renderSeatSelection();
      case 3:
        return renderPassengerDetails();
      case 4:
        return renderPayment();
      default:
        return renderTripDetails();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      width: '100vw',
      margin: 0,
      padding: 0
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        color: 'white',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
            Book Trip
          </h1>
          <p style={{ fontSize: '12px', margin: 0, opacity: 0.8 }}>
            Step {currentStep} of 4
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        background: 'white',
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {[1, 2, 3, 4].map((step) => (
            <div key={step} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: step <= currentStep ? '#3b82f6' : '#e5e7eb',
                color: step <= currentStep ? 'white' : '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {step < currentStep ? <CheckCircle size={14} /> : step}
              </div>
              <div style={{
                fontSize: '10px',
                color: step <= currentStep ? '#3b82f6' : '#9ca3af',
                textAlign: 'center'
              }}>
                {['Details', 'Seats', 'Passenger', 'Payment'][step - 1]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main style={{ paddingBottom: '20px' }}>
        {renderCurrentStep()}
      </main>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MobileTripBooking;
