import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Calendar, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileLandingNew = () => {
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
    navigate(`/redbus-results?from=${formData.from}&to=${formData.to}&date=${formData.journeyDate}`);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Debug Banner */}
      <div style={{
        backgroundColor: '#10b981',
        color: 'white',
        padding: '8px',
        textAlign: 'center',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        🚀 NEW MOBILE LANDING - v3.0 - {new Date().toLocaleTimeString()}
      </div>

      {/* Mobile Header */}
      <div style={{
        background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
        color: 'white',
        padding: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bus size={20} color="white" />
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>YATRIK ERP</span>
          </div>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#111827', 
            marginBottom: '8px',
            lineHeight: '1.2'
          }}>
            Travel Smart, Travel Safe
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Book your bus tickets with YATRIK ERP
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleBookNow}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '16px',
              minHeight: '56px'
            }}
          >
            <Bus size={20} />
            <span>Book Bus Ticket</span>
          </button>
          <button style={{
            width: '100%',
            backgroundColor: '#14b8a6',
            color: 'white',
            padding: '16px',
            borderRadius: '12px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '16px',
            minHeight: '56px'
          }}>
            <MapPin size={20} />
            <span>Track Bus</span>
          </button>
        </div>

        {/* Search Form */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontWeight: '600', 
            color: '#111827', 
            marginBottom: '16px',
            fontSize: '18px'
          }}>
            Search Buses
          </h2>
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* From */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '4px' 
              }}>
                From
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin 
                  size={16} 
                  color="#9ca3af" 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
                <input
                  type="text"
                  value={formData.from}
                  onChange={(e) => setFormData({...formData, from: e.target.value})}
                  placeholder="Enter departure location"
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    minHeight: '48px'
                  }}
                  required
                />
              </div>
            </div>

            {/* To */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '4px' 
              }}>
                To
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin 
                  size={16} 
                  color="#9ca3af" 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
                <input
                  type="text"
                  value={formData.to}
                  onChange={(e) => setFormData({...formData, to: e.target.value})}
                  placeholder="Enter destination location"
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    minHeight: '48px'
                  }}
                  required
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '4px' 
              }}>
                Journey Date
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar 
                  size={16} 
                  color="#9ca3af" 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
                <input
                  type="date"
                  value={formData.journeyDate}
                  onChange={(e) => setFormData({...formData, journeyDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    minHeight: '48px'
                  }}
                  required
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              style={{
                width: '100%',
                backgroundColor: '#ec4899',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '16px',
                minHeight: '48px'
              }}
            >
              <Search size={20} />
              <span>Search Buses</span>
            </button>
          </form>
        </div>

        {/* Features */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            fontWeight: '600', 
            color: '#111827', 
            marginBottom: '16px',
            fontSize: '18px'
          }}>
            Why Choose YATRIK?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#dcfce7',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bus size={16} color="#16a34a" />
              </div>
              <div>
                <h3 style={{ fontWeight: '500', color: '#111827', fontSize: '16px' }}>Wide Network</h3>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>Connect to 500+ cities across India</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#dbeafe',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MapPin size={16} color="#2563eb" />
              </div>
              <div>
                <h3 style={{ fontWeight: '500', color: '#111827', fontSize: '16px' }}>Real-time Updates</h3>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>Live tracking and status updates</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#f3e8ff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '16px' }}>⭐</span>
              </div>
              <div>
                <h3 style={{ fontWeight: '500', color: '#111827', fontSize: '16px' }}>Premium Service</h3>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>Comfortable seating and WiFi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '16px',
        marginTop: '32px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px' }}>© 2024 YATRIK ERP. All rights reserved.</p>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Your trusted partner for safe travel</p>
        </div>
      </div>
    </div>
  );
};

export default MobileLandingNew;
