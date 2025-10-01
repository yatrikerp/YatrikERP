import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Calendar, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UltraMobileLanding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      {/* Debug Banner */}
      <div style={{
        backgroundColor: '#059669',
        color: 'white',
        padding: '8px',
        textAlign: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        width: '100%'
      }}>
        🚀 ULTRA MOBILE v5.0 - {new Date().toLocaleTimeString()}
      </div>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
        color: 'white',
        padding: '16px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bus size={20} color="white" />
          <span style={{ fontWeight: 'bold', fontSize: '18px' }}>YATRIK ERP</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        padding: '16px', 
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}>
        
        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '20px 0', marginBottom: '20px' }}>
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

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
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
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          width: '100%'
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
                marginBottom: '6px' 
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
                    transform: 'translateY(-50%)',
                    zIndex: 1
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
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    minHeight: '48px',
                    boxSizing: 'border-box'
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
                marginBottom: '6px' 
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
                    transform: 'translateY(-50%)',
                    zIndex: 1
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
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    minHeight: '48px',
                    boxSizing: 'border-box'
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
                marginBottom: '6px' 
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
                    transform: 'translateY(-50%)',
                    zIndex: 1
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
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    minHeight: '48px',
                    boxSizing: 'border-box'
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
                padding: '14px',
                borderRadius: '8px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '16px',
                minHeight: '52px',
                marginTop: '8px'
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
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          width: '100%'
        }}>
          <h2 style={{ 
            fontWeight: '600', 
            color: '#111827', 
            marginBottom: '16px',
            fontSize: '18px'
          }}>
            Why Choose YATRIK?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#dcfce7',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bus size={20} color="#16a34a" />
              </div>
              <div>
                <h3 style={{ fontWeight: '600', color: '#111827', fontSize: '16px', margin: 0 }}>Wide Network</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Connect to 500+ cities across India</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#dbeafe',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MapPin size={20} color="#2563eb" />
              </div>
              <div>
                <h3 style={{ fontWeight: '600', color: '#111827', fontSize: '16px', margin: 0 }}>Real-time Updates</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Live tracking and status updates</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#f3e8ff',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '20px' }}>⭐</span>
              </div>
              <div>
                <h3 style={{ fontWeight: '600', color: '#111827', fontSize: '16px', margin: 0 }}>Premium Service</h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Comfortable seating and WiFi</p>
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
        marginTop: '24px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', margin: 0 }}>© 2024 YATRIK ERP. All rights reserved.</p>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0 0' }}>Your trusted partner for safe travel</p>
        </div>
      </div>
    </div>
  );
};

export default UltraMobileLanding;
