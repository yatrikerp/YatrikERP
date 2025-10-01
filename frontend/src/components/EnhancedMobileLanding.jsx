import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Calendar, Search, Star, Clock, Users, Shield, Wifi, Phone, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import heroBusImage from '../assets/hero-bus.png';
import MobileHeroWithImage from './MobileHeroWithImage';

const EnhancedMobileLanding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    journeyDate: ''
  });

  const handleBookNow = () => {
    if (!user) {
      navigate('/login?next=/passenger/mobile');
      return;
    }
    navigate('/passenger/mobile');
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
            onClick={() => navigate('/passenger/mobile')}
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
            <MapPin size={24} />
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
                onClick={() => navigate(`/passenger/search-results?from=${route.from}&to=${route.to}&date=${getCurrentDate()}`)}
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
    </div>
  );
};

export default EnhancedMobileLanding;
