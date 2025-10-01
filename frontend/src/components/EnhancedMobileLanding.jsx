import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Calendar, Search, Star, Clock, Users, Shield, Wifi, Phone, Menu, X, Navigation, MapPin as LocationIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import heroBusImage from '../assets/hero-bus.png';
import MobileHeroWithImage from './MobileHeroWithImage';

const EnhancedMobileLanding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showTrackBus, setShowTrackBus] = useState(false);
  const [showRunningTrips, setShowRunningTrips] = useState(false);
  const [showPopularRouteTrips, setShowPopularRouteTrips] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [popularRouteTrips, setPopularRouteTrips] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyBuses, setNearbyBuses] = useState([]);
  const [runningTrips, setRunningTrips] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [loadingPopularTrips, setLoadingPopularTrips] = useState(false);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    journeyDate: ''
  });

  const handleBookNow = () => {
    setShowRunningTrips(true);
    fetchRunningTrips();
  };

  const handleTripBook = (trip) => {
    if (!user) {
      // Save trip info to localStorage for after login
      localStorage.setItem('selectedTrip', JSON.stringify(trip));
      navigate('/login?next=/passenger/mobile&trip=' + encodeURIComponent(trip.id));
      return;
    }
    // If user is logged in, proceed to booking
    navigate('/passenger/mobile', { state: { selectedTrip: trip } });
  };

  const handlePopularRouteClick = (route) => {
    setSelectedRoute(route);
    setShowPopularRouteTrips(true);
    fetchPopularRouteTrips(route);
  };

  const fetchPopularRouteTrips = async (route) => {
    setLoadingPopularTrips(true);
    
    // Mock data for trips on popular routes - RedBus style
    const mockRouteTrips = {
      'Kochi → Bangalore': [
        {
          id: 'POP001',
          route: 'Kochi → Bangalore',
          busNumber: 'KL-01-AB-1234',
          busType: 'AC Sleeper',
          operator: 'KSRTC',
          departureTime: '08:30 AM',
          arrivalTime: '02:00 PM',
          duration: '5h 30m',
          price: '₹850',
          availableSeats: 12,
          totalSeats: 35,
          currentLocation: 'Edappally',
          nextStop: 'Aluva',
          estimatedDelay: 'On Time',
          driverName: 'Rajesh Kumar',
          amenities: ['AC', 'WiFi', 'Water'],
          boardingPoints: ['Kochi Central', 'Edappally', 'Aluva'],
          droppingPoints: ['Electronic City', 'Majestic', 'Bangalore Central'],
          rating: 4.2,
          reviews: 156
        },
        {
          id: 'POP002',
          route: 'Kochi → Bangalore',
          busNumber: 'KL-01-CD-5678',
          busType: 'AC Semi-Sleeper',
          operator: 'KPN Travels',
          departureTime: '10:15 AM',
          arrivalTime: '04:45 PM',
          duration: '6h 30m',
          price: '₹950',
          availableSeats: 8,
          totalSeats: 40,
          currentLocation: 'Vytilla',
          nextStop: 'Thripunithura',
          estimatedDelay: '15 min delay',
          driverName: 'Suresh Nair',
          amenities: ['AC', 'WiFi', 'Charging'],
          boardingPoints: ['Kochi Central', 'Vytilla', 'Thripunithura'],
          droppingPoints: ['Electronic City', 'Majestic', 'Bangalore Central'],
          rating: 4.0,
          reviews: 89
        },
        {
          id: 'POP003',
          route: 'Kochi → Bangalore',
          busNumber: 'KL-01-EF-9012',
          busType: 'Non-AC Sleeper',
          operator: 'Orange Tours',
          departureTime: '11:00 AM',
          arrivalTime: '06:15 PM',
          duration: '7h 15m',
          price: '₹650',
          availableSeats: 15,
          totalSeats: 32,
          currentLocation: 'Kakkanad',
          nextStop: 'Edappally',
          estimatedDelay: 'On Time',
          driverName: 'Kumar Menon',
          amenities: ['Water', 'Charging'],
          boardingPoints: ['Kochi Central', 'Kakkanad', 'Edappally'],
          droppingPoints: ['Electronic City', 'Majestic', 'Bangalore Central'],
          rating: 3.8,
          reviews: 67
        }
      ],
      'Trivandrum → Chennai': [
        {
          id: 'POP004',
          route: 'Trivandrum → Chennai',
          busNumber: 'KL-02-GH-3456',
          busType: 'AC Sleeper',
          operator: 'KSRTC',
          departureTime: '06:00 PM',
          arrivalTime: '08:00 AM',
          duration: '14h 00m',
          price: '₹1200',
          availableSeats: 5,
          totalSeats: 35,
          currentLocation: 'Trivandrum Central',
          nextStop: 'Kollam',
          estimatedDelay: 'On Time',
          driverName: 'Anil Kumar',
          amenities: ['AC', 'WiFi', 'Water', 'Blanket'],
          boardingPoints: ['Trivandrum Central', 'Kollam', 'Alappuzha'],
          droppingPoints: ['Chennai Central', 'Tambaram', 'Chengalpattu'],
          rating: 4.3,
          reviews: 234
        },
        {
          id: 'POP005',
          route: 'Trivandrum → Chennai',
          busNumber: 'KL-02-IJ-7890',
          busType: 'AC Semi-Sleeper',
          operator: 'Parveen Travels',
          departureTime: '08:30 PM',
          arrivalTime: '10:30 AM',
          duration: '14h 00m',
          price: '₹1100',
          availableSeats: 18,
          totalSeats: 40,
          currentLocation: 'Kollam',
          nextStop: 'Alappuzha',
          estimatedDelay: '10 min delay',
          driverName: 'Vijay Kumar',
          amenities: ['AC', 'WiFi', 'Water', 'Charging'],
          boardingPoints: ['Trivandrum Central', 'Kollam', 'Alappuzha'],
          droppingPoints: ['Chennai Central', 'Tambaram', 'Chengalpattu'],
          rating: 4.1,
          reviews: 178
        }
      ],
      'Kozhikode → Mysore': [
        {
          id: 'POP006',
          route: 'Kozhikode → Mysore',
          busNumber: 'KL-03-KL-2468',
          busType: 'AC Seater',
          operator: 'KSRTC',
          departureTime: '07:00 AM',
          arrivalTime: '02:00 PM',
          duration: '7h 00m',
          price: '₹900',
          availableSeats: 22,
          totalSeats: 45,
          currentLocation: 'Kozhikode Bus Stand',
          nextStop: 'Thrissur',
          estimatedDelay: 'On Time',
          driverName: 'Ramesh Kumar',
          amenities: ['AC', 'WiFi', 'Water', 'Charging'],
          boardingPoints: ['Kozhikode Bus Stand', 'Thrissur', 'Palakkad'],
          droppingPoints: ['Mysore Bus Stand', 'Mandya', 'Srirangapatna'],
          rating: 4.4,
          reviews: 145
        }
      ]
    };
    
    // Simulate API delay
    setTimeout(() => {
      const trips = mockRouteTrips[route.route] || [];
      setPopularRouteTrips(trips);
      setLoadingPopularTrips(false);
    }, 1000);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!formData.from || !formData.to || !formData.journeyDate) {
      alert('Please fill all fields');
      return;
    }
    navigate(`/passenger/search-results?from=${formData.from}&to=${formData.to}&date=${formData.journeyDate}`);
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getCurrentLocation = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          fetchNearbyBuses(location);
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Kochi coordinates for demo
          const fallbackLocation = { latitude: 9.9312, longitude: 76.2673 };
          setUserLocation(fallbackLocation);
          fetchNearbyBuses(fallbackLocation);
          setLoadingLocation(false);
        }
      );
    } else {
      // Fallback to Kochi coordinates for demo
      const fallbackLocation = { latitude: 9.9312, longitude: 76.2673 };
      setUserLocation(fallbackLocation);
      fetchNearbyBuses(fallbackLocation);
      setLoadingLocation(false);
    }
  };

  const fetchNearbyBuses = async (location) => {
    // Mock data for nearby buses - in real implementation, this would be an API call
    const mockBuses = [
      {
        id: 'BUS001',
        route: 'Kochi → Bangalore',
        busNumber: 'KL-01-AB-1234',
        currentLocation: 'Edappally',
        nextStop: 'Aluva',
        estimatedTime: '15 min',
        distance: '2.3 km',
        status: 'on-time',
        driverName: 'Rajesh Kumar',
        driverPhone: '+91 98765 43210'
      },
      {
        id: 'BUS002',
        route: 'Kochi → Chennai',
        busNumber: 'KL-02-CD-5678',
        currentLocation: 'Vytilla',
        nextStop: 'Thripunithura',
        estimatedTime: '8 min',
        distance: '1.2 km',
        status: 'delayed',
        driverName: 'Suresh Nair',
        driverPhone: '+91 98765 43211'
      },
      {
        id: 'BUS003',
        route: 'Kochi → Mysore',
        busNumber: 'KL-03-EF-9012',
        currentLocation: 'Kakkanad',
        nextStop: 'Edappally',
        estimatedTime: '25 min',
        distance: '4.1 km',
        status: 'on-time',
        driverName: 'Kumar Menon',
        driverPhone: '+91 98765 43212'
      },
      {
        id: 'BUS004',
        route: 'Kochi → Coimbatore',
        busNumber: 'KL-04-GH-3456',
        currentLocation: 'Palarivattom',
        nextStop: 'Vytilla',
        estimatedTime: '12 min',
        distance: '3.2 km',
        status: 'early',
        driverName: 'Vijay Kumar',
        driverPhone: '+91 98765 43213'
      }
    ];
    
    setNearbyBuses(mockBuses);
  };

  const handleTrackBus = () => {
    setShowTrackBus(true);
    if (!userLocation) {
      getCurrentLocation();
    }
  };

  const fetchRunningTrips = async () => {
    setLoadingTrips(true);
    // Mock data for currently running trips
    const mockRunningTrips = [
      {
        id: 'TRIP001',
        route: 'Kochi → Bangalore',
        busNumber: 'KL-01-AB-1234',
        busType: 'AC Sleeper',
        departureTime: '08:30 AM',
        arrivalTime: '02:00 PM',
        duration: '5h 30m',
        price: '₹850',
        availableSeats: 12,
        totalSeats: 35,
        currentLocation: 'Edappally',
        nextStop: 'Aluva',
        estimatedDelay: 'On Time',
        driverName: 'Rajesh Kumar',
        amenities: ['AC', 'WiFi', 'Water'],
        boardingPoints: ['Kochi Central', 'Edappally', 'Aluva'],
        droppingPoints: ['Electronic City', 'Majestic', 'Bangalore Central']
      },
      {
        id: 'TRIP002',
        route: 'Kochi → Chennai',
        busNumber: 'KL-02-CD-5678',
        busType: 'AC Semi-Sleeper',
        departureTime: '10:15 AM',
        arrivalTime: '06:30 PM',
        duration: '8h 15m',
        price: '₹1200',
        availableSeats: 8,
        totalSeats: 40,
        currentLocation: 'Vytilla',
        nextStop: 'Thripunithura',
        estimatedDelay: '15 min delay',
        driverName: 'Suresh Nair',
        amenities: ['AC', 'WiFi', 'Charging'],
        boardingPoints: ['Kochi Central', 'Vytilla', 'Thripunithura'],
        droppingPoints: ['Chennai Central', 'Tambaram', 'Chengalpattu']
      },
      {
        id: 'TRIP003',
        route: 'Kochi → Mysore',
        busNumber: 'KL-03-EF-9012',
        busType: 'Non-AC Sleeper',
        departureTime: '11:00 AM',
        arrivalTime: '05:45 PM',
        duration: '6h 45m',
        price: '₹650',
        availableSeats: 15,
        totalSeats: 32,
        currentLocation: 'Kakkanad',
        nextStop: 'Edappally',
        estimatedDelay: 'On Time',
        driverName: 'Kumar Menon',
        amenities: ['Water', 'Charging'],
        boardingPoints: ['Kochi Central', 'Kakkanad', 'Edappally'],
        droppingPoints: ['Mysore Bus Stand', 'Mandya', 'Srirangapatna']
      },
      {
        id: 'TRIP004',
        route: 'Kochi → Coimbatore',
        busNumber: 'KL-04-GH-3456',
        busType: 'AC Seater',
        departureTime: '02:30 PM',
        arrivalTime: '08:15 PM',
        duration: '5h 45m',
        price: '₹750',
        availableSeats: 22,
        totalSeats: 45,
        currentLocation: 'Palarivattom',
        nextStop: 'Vytilla',
        estimatedDelay: '10 min early',
        driverName: 'Vijay Kumar',
        amenities: ['AC', 'WiFi', 'Water', 'Charging'],
        boardingPoints: ['Kochi Central', 'Palarivattom', 'Vytilla'],
        droppingPoints: ['Coimbatore Central', 'Gandhipuram', 'Ukkadam']
      },
      {
        id: 'TRIP005',
        route: 'Kochi → Hyderabad',
        busNumber: 'KL-05-IJ-7890',
        busType: 'AC Sleeper',
        departureTime: '06:00 PM',
        arrivalTime: '08:00 AM',
        duration: '14h 00m',
        price: '₹1800',
        availableSeats: 5,
        totalSeats: 35,
        currentLocation: 'Kochi Central',
        nextStop: 'Edappally',
        estimatedDelay: 'On Time',
        driverName: 'Anil Kumar',
        amenities: ['AC', 'WiFi', 'Water', 'Blanket'],
        boardingPoints: ['Kochi Central', 'Edappally', 'Aluva'],
        droppingPoints: ['Secunderabad', 'Begumpet', 'Hyderabad Central']
      }
    ];
    
    // Simulate API delay
    setTimeout(() => {
      setRunningTrips(mockRunningTrips);
      setLoadingTrips(false);
    }, 1000);
  };

  const features = [
    { icon: Shield, title: 'Safe Travel', description: 'Your safety is our priority' },
    { icon: Clock, title: 'On Time', description: 'Punctual departures guaranteed' },
    { icon: Users, title: 'Comfort', description: 'Spacious and comfortable seats' },
    { icon: Wifi, title: 'WiFi', description: 'Free WiFi on all buses' }
  ];

  const popularRoutes = [
    { from: 'Kochi', to: 'Bangalore', price: '₹800' },
    { from: 'Trivandrum', to: 'Chennai', price: '₹1200' },
    { from: 'Kozhikode', to: 'Mysore', price: '₹900' },
    { from: 'Thrissur', to: 'Coimbatore', price: '₹700' }
  ];

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #E91E63 0%, #EC407A 100%)',
        color: 'white',
        padding: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bus size={20} color="white" />
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>YATRIK ERP</span>
          </div>
          <button
            onClick={() => setShowMobileMenu(true)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            padding: '16px'
          }}
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              width: '280px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Menu
              </h3>
              <button
                onClick={() => setShowMobileMenu(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => {
            navigate('/mobile');
            setShowMobileMenu(false);
          }}
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #E91E63 0%, #EC407A 100%)',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '16px',
            color: 'white',
            fontWeight: '500'
          }}
        >
          Home
        </button>
        <button
          onClick={() => {
            navigate('/passenger/mobile');
            setShowMobileMenu(false);
          }}
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #00ACC1 0%, #00838F 100%)',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '16px',
            color: 'white',
            fontWeight: '500'
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => {
            navigate('/login');
            setShowMobileMenu(false);
          }}
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #E91E63 0%, #EC407A 100%)',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '16px',
            color: 'white',
            fontWeight: '500'
          }}
        >
          Login
        </button>
            </nav>
          </div>
        </div>
      )}

      {/* Hero Section with Bus Image */}
      <MobileHeroWithImage />

      {/* Main Content */}
      <div style={{ 
        padding: '20px 16px', 
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        
        {/* Quick Actions */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '12px', 
          marginBottom: '24px' 
        }}>
          <button
            onClick={handleBookNow}
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #E91E63 0%, #EC407A 100%)',
              color: 'white',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(233, 30, 99, 0.3)'
            }}
          >
            <Bus size={24} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Book Bus</span>
          </button>
          <button
            onClick={handleTrackBus}
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #00ACC1 0%, #00838F 100%)',
              color: 'white',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 172, 193, 0.3)'
            }}
          >
            <Navigation size={24} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Track Bus</span>
          </button>
        </div>

        {/* Search Form */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          marginBottom: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Search Buses
          </h2>
          
          <form onSubmit={handleSearch} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                From
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280'
                  }}
                />
                <input
                  type="text"
                  placeholder="Enter departure city"
                  value={formData.from}
                  onChange={(e) => setFormData({...formData, from: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '16px 12px 16px 44px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                    background: 'white',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                To
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280'
                  }}
                />
                <input
                  type="text"
                  placeholder="Enter destination city"
                  value={formData.to}
                  onChange={(e) => setFormData({...formData, to: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '16px 12px 16px 44px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                    background: 'white',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Journey Date
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280'
                  }}
                />
                <input
                  type="date"
                  min={getCurrentDate()}
                  value={formData.journeyDate}
                  onChange={(e) => setFormData({...formData, journeyDate: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '16px 12px 16px 44px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                    background: 'white',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #E91E63 0%, #EC407A 100%)',
                color: 'white',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                boxShadow: '0 4px 15px rgba(233, 30, 99, 0.3)'
              }}
            >
              <Search size={20} />
              Search Buses
            </button>
          </form>
        </div>

        {/* Features */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          marginBottom: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Why Choose YATRIK?
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            {features.map((feature, index) => (
              <div key={index} style={{
                textAlign: 'center',
                padding: '16px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #E91E63 0%, #EC407A 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <feature.icon size={24} color="white" />
                </div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '4px'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  lineHeight: '1.4'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Routes */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          marginBottom: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Popular Routes
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {popularRoutes.map((route, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handlePopularRouteClick(route)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#111827'
                    }}>
                      {route.from} → {route.to}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      Multiple buses available
                    </div>
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#00ACC1'
                  }}>
                    {route.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div style={{
          background: 'linear-gradient(135deg, #E91E63 0%, #EC407A 100%)',
          borderRadius: '20px',
          padding: '24px',
          color: 'white',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            Need Help?
          </h2>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <Phone size={20} />
            <span style={{ fontSize: '16px', fontWeight: '500' }}>
              +91 98765 43210
            </span>
          </div>
          <p style={{
            fontSize: '14px',
            opacity: 0.9,
            margin: 0
          }}>
            Available 24/7 for your assistance
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: '#1f2937',
        color: 'white',
        padding: '24px 16px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <Bus size={24} color="white" />
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>YATRIK ERP</span>
        </div>
        <p style={{
          fontSize: '14px',
          opacity: 0.8,
          marginBottom: '8px'
        }}>
          © 2024 YATRIK ERP. All rights reserved.
        </p>
        <p style={{
          fontSize: '12px',
          opacity: 0.7,
          margin: 0
        }}>
          Your trusted partner for safe travel
        </p>
      </div>

      {/* Track Bus Modal */}
      {showTrackBus && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Track Nearby Buses
              </h2>
              <button
                onClick={() => setShowTrackBus(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>

            {/* Location Info */}
            <div style={{
              background: '#f0f9ff',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              border: '1px solid #e0f2fe'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <LocationIcon size={16} color="#0284c7" />
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#0284c7'
                }}>
                  Your Location
                </span>
              </div>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: 0
              }}>
                {userLocation ? `Lat: ${userLocation.latitude.toFixed(4)}, Lng: ${userLocation.longitude.toFixed(4)}` : 'Getting location...'}
              </p>
            </div>

            {/* Loading State */}
            {loadingLocation && (
              <div style={{
                textAlign: 'center',
                padding: '40px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #00ACC1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }} />
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Finding nearby buses...
                </p>
              </div>
            )}

            {/* Nearby Buses List */}
            {!loadingLocation && nearbyBuses.length > 0 && (
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '16px'
                }}>
                  Nearby Buses ({nearbyBuses.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {nearbyBuses.map((bus) => (
                    <div
                      key={bus.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '16px',
                        background: '#f9fafb'
                      }}
                    >
                      {/* Route and Bus Number */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: '0 0 4px 0'
                          }}>
                            {bus.route}
                          </p>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            {bus.busNumber}
                          </p>
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: '600',
                          background: bus.status === 'on-time' ? '#dcfce7' : 
                                     bus.status === 'delayed' ? '#fef3c7' : '#dbeafe',
                          color: bus.status === 'on-time' ? '#166534' : 
                                 bus.status === 'delayed' ? '#92400e' : '#1e40af'
                        }}>
                          {bus.status.toUpperCase()}
                        </div>
                      </div>

                      {/* Current Location and Next Stop */}
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#10b981'
                          }} />
                          <span style={{
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            Currently at: <strong>{bus.currentLocation}</strong>
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#3b82f6'
                          }} />
                          <span style={{
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            Next stop: <strong>{bus.nextStop}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Estimated Time and Distance */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#00ACC1',
                            margin: '0 0 2px 0'
                          }}>
                            {bus.estimatedTime}
                          </p>
                          <p style={{
                            fontSize: '10px',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            ETA
                          </p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#E91E63',
                            margin: '0 0 2px 0'
                          }}>
                            {bus.distance}
                          </p>
                          <p style={{
                            fontSize: '10px',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            Distance
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            // In a real app, this would initiate a call or show contact info
                            alert(`Contact Driver: ${bus.driverName}\nPhone: ${bus.driverPhone}`);
                          }}
                          style={{
                            padding: '8px 12px',
                            background: 'linear-gradient(135deg, #00ACC1 0%, #00838F 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Contact
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Buses Found */}
            {!loadingLocation && nearbyBuses.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px'
              }}>
                <Bus size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  No buses found nearby
                </p>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={getCurrentLocation}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #E91E63 0%, #EC407A 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Refresh Location
            </button>
          </div>
        </div>
      )}

      {/* Running Trips Modal */}
      {showRunningTrips && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '420px',
            maxHeight: '85vh',
            overflow: 'auto'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                Currently Running Trips
              </h2>
              <button
                onClick={() => setShowRunningTrips(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>

            {/* Loading State */}
            {loadingTrips && (
              <div style={{
                textAlign: 'center',
                padding: '40px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #E91E63',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }} />
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Loading running trips...
                </p>
              </div>
            )}

            {/* Running Trips List */}
            {!loadingTrips && runningTrips.length > 0 && (
              <div>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  {runningTrips.length} trips currently running
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {runningTrips.map((trip) => (
                    <div
                      key={trip.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '16px',
                        padding: '16px',
                        background: '#f9fafb',
                        position: 'relative'
                      }}
                    >
                      {/* Route and Bus Info */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '12px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: '0 0 4px 0'
                          }}>
                            {trip.route}
                          </h3>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: '0 0 4px 0'
                          }}>
                            {trip.busNumber} • {trip.busType}
                          </p>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            Driver: {trip.driverName}
                          </p>
                        </div>
                        <div style={{
                          textAlign: 'right'
                        }}>
                          <p style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#E91E63',
                            margin: '0 0 4px 0'
                          }}>
                            {trip.price}
                          </p>
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: '600',
                            background: trip.estimatedDelay === 'On Time' ? '#dcfce7' : 
                                       trip.estimatedDelay.includes('early') ? '#dbeafe' : '#fef3c7',
                            color: trip.estimatedDelay === 'On Time' ? '#166534' : 
                                   trip.estimatedDelay.includes('early') ? '#1e40af' : '#92400e'
                          }}>
                            {trip.estimatedDelay}
                          </div>
                        </div>
                      </div>

                      {/* Timing Information */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        padding: '8px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: '0 0 2px 0'
                          }}>
                            Departure
                          </p>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: 0
                          }}>
                            {trip.departureTime}
                          </p>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: '0 0 2px 0'
                          }}>
                            Duration
                          </p>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: 0
                          }}>
                            {trip.duration}
                          </p>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: '0 0 2px 0'
                          }}>
                            Arrival
                          </p>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: 0
                          }}>
                            {trip.arrivalTime}
                          </p>
                        </div>
                      </div>

                      {/* Current Location and Seats */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
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
                          <span style={{
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            Currently at: <strong>{trip.currentLocation}</strong>
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Users size={12} color="#6b7280" />
                          <span style={{
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            {trip.availableSeats}/{trip.totalSeats} seats
                          </span>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        marginBottom: '12px'
                      }}>
                        {trip.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            style={{
                              padding: '2px 6px',
                              background: '#f0f9ff',
                              color: '#0284c7',
                              fontSize: '10px',
                              borderRadius: '4px',
                              border: '1px solid #e0f2fe'
                            }}
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>

                      {/* Book Now Button */}
                      <button
                        onClick={() => handleTripBook(trip)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'linear-gradient(135deg, #E91E63 0%, #EC407A 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <Bus size={16} />
                        BOOK NOW
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Trips Found */}
            {!loadingTrips && runningTrips.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px'
              }}>
                <Bus size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  No trips currently running
                </p>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={fetchRunningTrips}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #00ACC1 0%, #00838F 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Refresh Trips
            </button>
          </div>
        </div>
      )}

      {/* Popular Route Trips Modal */}
      {showPopularRouteTrips && selectedRoute && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '420px',
            maxHeight: '85vh',
            overflow: 'auto'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 4px 0'
                }}>
                  {selectedRoute.from} → {selectedRoute.to}
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Available trips for this route
                </p>
              </div>
              <button
                onClick={() => setShowPopularRouteTrips(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={24} color="#6b7280" />
              </button>
            </div>

            {/* Loading State */}
            {loadingPopularTrips && (
              <div style={{
                textAlign: 'center',
                padding: '40px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #e5e7eb',
                  borderTop: '3px solid #E91E63',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }} />
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Loading trips for {selectedRoute.from} → {selectedRoute.to}...
                </p>
              </div>
            )}

            {/* Popular Route Trips List */}
            {!loadingPopularTrips && popularRouteTrips.length > 0 && (
              <div>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  {popularRouteTrips.length} trips available
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {popularRouteTrips.map((trip) => (
                    <div
                      key={trip.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '16px',
                        padding: '16px',
                        background: '#f9fafb',
                        position: 'relative'
                      }}
                    >
                      {/* Route and Bus Info */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '12px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: '0 0 4px 0'
                          }}>
                            {trip.operator}
                          </h3>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: '0 0 4px 0'
                          }}>
                            {trip.busNumber} • {trip.busType}
                          </p>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            Driver: {trip.driverName}
                          </p>
                        </div>
                        <div style={{
                          textAlign: 'right'
                        }}>
                          <p style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#E91E63',
                            margin: '0 0 4px 0'
                          }}>
                            {trip.price}
                          </p>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            justifyContent: 'flex-end'
                          }}>
                            <Star size={12} color="#fbbf24" fill="#fbbf24" />
                            <span style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              fontWeight: '500'
                            }}>
                              {trip.rating} ({trip.reviews})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timing Information */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        padding: '8px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: '0 0 2px 0'
                          }}>
                            Departure
                          </p>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: 0
                          }}>
                            {trip.departureTime}
                          </p>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: '0 0 2px 0'
                          }}>
                            Duration
                          </p>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: 0
                          }}>
                            {trip.duration}
                          </p>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            margin: '0 0 2px 0'
                          }}>
                            Arrival
                          </p>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: 0
                          }}>
                            {trip.arrivalTime}
                          </p>
                        </div>
                      </div>

                      {/* Current Location and Seats */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px'
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
                          <span style={{
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            Currently at: <strong>{trip.currentLocation}</strong>
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Users size={12} color="#6b7280" />
                          <span style={{
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            {trip.availableSeats}/{trip.totalSeats} seats
                          </span>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px',
                        marginBottom: '12px'
                      }}>
                        {trip.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            style={{
                              padding: '2px 6px',
                              background: '#f0f9ff',
                              color: '#0284c7',
                              fontSize: '10px',
                              borderRadius: '4px',
                              border: '1px solid #e0f2fe'
                            }}
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>

                      {/* Book Now Button */}
                      <button
                        onClick={() => handleTripBook(trip)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'linear-gradient(135deg, #E91E63 0%, #EC407A 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <Bus size={16} />
                        BOOK NOW
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Trips Found */}
            {!loadingPopularTrips && popularRouteTrips.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px'
              }}>
                <Bus size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  No trips available for this route
                </p>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={() => fetchPopularRouteTrips(selectedRoute)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #00ACC1 0%, #00838F 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Refresh Trips
            </button>
          </div>
        </div>
      )}

      {/* Add CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EnhancedMobileLanding;
