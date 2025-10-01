import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Calendar, Search, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './MinimalMobileLanding.css';

const MinimalMobileLanding = () => {
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
    <div className="minimal-mobile-container">
      {/* Debug Banner */}
      <div className="minimal-mobile-debug">
        🚀 MINIMAL MOBILE v4.0 - {new Date().toLocaleTimeString()}
      </div>

      {/* Minimal Header */}
      <div className="minimal-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bus size={20} color="white" />
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>YATRIK ERP</span>
        </div>
        <Menu size={20} color="white" />
      </div>

      {/* Main Content - Minimal */}
      <div className="minimal-mobile-content">
        
        {/* Hero - Minimal */}
        <div className="minimal-mobile-hero">
          <h1>Travel Smart, Travel Safe</h1>
          <p>Book your bus tickets with YATRIK ERP</p>
        </div>

        {/* Action Buttons - Minimal */}
        <div className="minimal-mobile-actions">
          <button
            onClick={handleBookNow}
            className="minimal-mobile-button minimal-mobile-button-primary"
          >
            <Bus size={18} />
            <span>Book Bus Ticket</span>
          </button>
          <button className="minimal-mobile-button minimal-mobile-button-secondary">
            <MapPin size={18} />
            <span>Track Bus</span>
          </button>
        </div>

        {/* Search Form - Minimal */}
        <div className="minimal-mobile-card">
          <h2>Search Buses</h2>
          <form onSubmit={handleSearch} className="minimal-mobile-form">
            
            {/* From */}
            <div className="minimal-mobile-field">
              <label className="minimal-mobile-label">From</label>
              <div className="minimal-mobile-input-container">
                <MapPin size={14} color="#9ca3af" className="minimal-mobile-icon" />
                <input
                  type="text"
                  value={formData.from}
                  onChange={(e) => setFormData({...formData, from: e.target.value})}
                  placeholder="Enter departure location"
                  className="minimal-mobile-input"
                  required
                />
              </div>
            </div>

            {/* To */}
            <div className="minimal-mobile-field">
              <label className="minimal-mobile-label">To</label>
              <div className="minimal-mobile-input-container">
                <MapPin size={14} color="#9ca3af" className="minimal-mobile-icon" />
                <input
                  type="text"
                  value={formData.to}
                  onChange={(e) => setFormData({...formData, to: e.target.value})}
                  placeholder="Enter destination location"
                  className="minimal-mobile-input"
                  required
                />
              </div>
            </div>

            {/* Date */}
            <div className="minimal-mobile-field">
              <label className="minimal-mobile-label">Journey Date</label>
              <div className="minimal-mobile-input-container">
                <Calendar size={14} color="#9ca3af" className="minimal-mobile-icon" />
                <input
                  type="date"
                  value={formData.journeyDate}
                  onChange={(e) => setFormData({...formData, journeyDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="minimal-mobile-input"
                  required
                />
              </div>
            </div>

            {/* Search Button */}
            <button type="submit" className="minimal-mobile-search-button">
              <Search size={18} />
              <span>Search Buses</span>
            </button>
          </form>
        </div>

        {/* Features - Minimal */}
        <div className="minimal-mobile-card">
          <h2>Why Choose YATRIK?</h2>
          <div className="minimal-mobile-features">
            <div className="minimal-mobile-feature">
              <div className="minimal-mobile-feature-icon" style={{ backgroundColor: '#dcfce7' }}>
                <Bus size={14} color="#16a34a" />
              </div>
              <div className="minimal-mobile-feature-text">
                <h3>Wide Network</h3>
                <p>Connect to 500+ cities across India</p>
              </div>
            </div>
            <div className="minimal-mobile-feature">
              <div className="minimal-mobile-feature-icon" style={{ backgroundColor: '#dbeafe' }}>
                <MapPin size={14} color="#2563eb" />
              </div>
              <div className="minimal-mobile-feature-text">
                <h3>Real-time Updates</h3>
                <p>Live tracking and status updates</p>
              </div>
            </div>
            <div className="minimal-mobile-feature">
              <div className="minimal-mobile-feature-icon" style={{ backgroundColor: '#f3e8ff' }}>
                <span style={{ fontSize: '14px' }}>⭐</span>
              </div>
              <div className="minimal-mobile-feature-text">
                <h3>Premium Service</h3>
                <p>Comfortable seating and WiFi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="minimal-mobile-footer">
        <div>
          <p className="copyright">© 2024 YATRIK ERP. All rights reserved.</p>
          <p className="tagline">Your trusted partner for safe travel</p>
        </div>
      </div>
    </div>
  );
};

export default MinimalMobileLanding;
