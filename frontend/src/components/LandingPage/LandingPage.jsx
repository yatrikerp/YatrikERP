import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RedBusSearchCard from '../SearchCard/RedBusSearchCard';
import BusTrackingModal from '../Common/BusTrackingModal';
import { Bus } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  const handleBookNow = useCallback(() => {
    // Navigate directly to search results page
    navigate('/search-results');
  }, [navigate]);

  const handleTrackBus = useCallback(() => {
    setIsTrackingModalOpen(true);
  }, []);

  return (
    <div className="landing-page">
      {/* Top Support Bar */}
      <div className="support-bar">
        <div className="support-item">
          <span className="support-icon">📞</span>
          <span className="support-text">+1 (555) 123-4567</span>
        </div>
        <div className="support-item">
          <span className="support-icon">✉️</span>
          <span className="support-text">support@yatrik.com</span>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="nav-bar">
        <div className="nav-logo">
          <span className="logo-text">YATRIK</span>
          <span className="logo-subtitle">ERP</span>
        </div>
        <div className="nav-links">
          <a href="#home" className="nav-link active">Home</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#contact" className="nav-link">Contact</a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Smart Bus Travel Management
          </h1>
          <p className="hero-subtitle">
            Streamline your transportation operations with intelligent route optimization, 
            real-time tracking, and comprehensive fleet management.
          </p>
          
          {/* CTA Buttons */}
          <div className="hero-buttons">
            <button className="btn btn-primary">Sign Up</button>
            <button className="btn btn-primary" onClick={handleBookNow}>Book Now</button>
            <button className="btn btn-secondary" onClick={handleTrackBus}>
              <Bus className="w-4 h-4 mr-2" />
              Track Bus
            </button>
          </div>

          {/* Search Section */}
          <div className="search-section">
            <RedBusSearchCard />
          </div>
        </div>

        {/* Hero Visual */}
        <div className="hero-visual">
          <div className="scenic-background">
            <div className="hills-container">
              <div className="hill hill-1"></div>
              <div className="hill hill-2"></div>
              <div className="hill hill-3"></div>
            </div>
            
            {/* Modern Buses */}
            <div className="bus-container">
              <div className="bus bus-1">
                <div className="bus-body"></div>
                <div className="bus-windows"></div>
                <div className="bus-lights"></div>
              </div>
              <div className="bus bus-2">
                <div className="bus-body"></div>
                <div className="bus-windows"></div>
                <div className="bus-lights"></div>
              </div>
            </div>

            {/* Route Lines and Pins */}
            <div className="route-network">
              <div className="route-line route-1"></div>
              <div className="route-line route-2"></div>
              <div className="route-line route-3"></div>
              
              <div className="location-pin pin-1">
                <div className="pin-icon">📍</div>
                <div className="pin-label">Station A</div>
              </div>
              <div className="location-pin pin-2">
                <div className="pin-icon">📍</div>
                <div className="pin-label">Station B</div>
              </div>
              <div className="location-pin pin-3">
                <div className="pin-icon">📍</div>
                <div className="pin-label">Station C</div>
              </div>
            </div>

            {/* Glowing Dots */}
            <div className="glow-dots">
              <div className="glow-dot dot-1"></div>
              <div className="glow-dot dot-2"></div>
              <div className="glow-dot dot-3"></div>
              <div className="glow-dot dot-4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="features-section">
        <div className="feature-card">
          <div className="feature-icon">🚌</div>
          <h3 className="feature-title">Route Optimization</h3>
          <p className="feature-description">
            AI-powered route planning for maximum efficiency and cost savings.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">📱</div>
          <h3 className="feature-title">Real-time Tracking</h3>
          <p className="feature-description">
            Monitor your fleet in real-time with GPS tracking and live updates.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3 className="feature-title">Analytics Dashboard</h3>
          <p className="feature-description">
            Comprehensive insights and reports for data-driven decisions.
          </p>
        </div>
      </div>

      {/* Popular Routes Section */}
      <div className="popular-routes-section">
        <div className="section-header">
          <h2 className="section-title">Popular Routes</h2>
          <p className="section-subtitle">Book your journey on our most popular bus routes</p>
        </div>
        
        <div className="routes-grid">
          <div className="route-card">
            <div className="route-info">
              <div className="route-cities">
                <span className="from-city">Thiruvananthapuram</span>
                <span className="route-arrow">→</span>
                <span className="to-city">Kochi</span>
              </div>
              <div className="route-details">
                <span className="route-number">Route: TVM-KOC-001</span>
                <span className="route-duration">Duration: 4h 30m</span>
              </div>
              <div className="route-price">
                <span className="price">Starting from ₹150</span>
              </div>
            </div>
            <button 
              className="book-route-btn"
              onClick={() => navigate('/search-results?from=Thiruvananthapuram&to=Kochi&date=' + new Date().toISOString().slice(0,10))}
            >
              Book Now
            </button>
          </div>

          <div className="route-card">
            <div className="route-info">
              <div className="route-cities">
                <span className="from-city">Kochi</span>
                <span className="route-arrow">→</span>
                <span className="to-city">Bangalore</span>
              </div>
              <div className="route-details">
                <span className="route-number">Route: KOC-BLR-002</span>
                <span className="route-duration">Duration: 8h 15m</span>
              </div>
              <div className="route-price">
                <span className="price">Starting from ₹450</span>
              </div>
            </div>
            <button 
              className="book-route-btn"
              onClick={() => navigate('/search-results?from=Kochi&to=Bangalore&date=' + new Date().toISOString().slice(0,10))}
            >
              Book Now
            </button>
          </div>

          <div className="route-card">
            <div className="route-info">
              <div className="route-cities">
                <span className="from-city">Thrissur</span>
                <span className="route-arrow">→</span>
                <span className="to-city">Calicut</span>
              </div>
              <div className="route-details">
                <span className="route-number">Route: TSR-CAL-003</span>
                <span className="route-duration">Duration: 3h 45m</span>
              </div>
              <div className="route-price">
                <span className="price">Starting from ₹120</span>
              </div>
            </div>
            <button 
              className="book-route-btn"
              onClick={() => navigate('/search-results?from=Thrissur&to=Calicut&date=' + new Date().toISOString().slice(0,10))}
            >
              Book Now
            </button>
          </div>

          <div className="route-card">
            <div className="route-info">
              <div className="route-cities">
                <span className="from-city">Kollam</span>
                <span className="route-arrow">→</span>
                <span className="to-city">Thiruvananthapuram</span>
              </div>
              <div className="route-details">
                <span className="route-number">Route: KOL-TVM-004</span>
                <span className="route-duration">Duration: 2h 30m</span>
              </div>
              <div className="route-price">
                <span className="price">Starting from ₹80</span>
              </div>
            </div>
            <button 
              className="book-route-btn"
              onClick={() => navigate('/search-results?from=Kollam&to=Thiruvananthapuram&date=' + new Date().toISOString().slice(0,10))}
            >
              Book Now
            </button>
          </div>

          <div className="route-card">
            <div className="route-info">
              <div className="route-cities">
                <span className="from-city">Kannur</span>
                <span className="route-arrow">→</span>
                <span className="to-city">Mangalore</span>
              </div>
              <div className="route-details">
                <span className="route-number">Route: KAN-MAN-005</span>
                <span className="route-duration">Duration: 2h 15m</span>
              </div>
              <div className="route-price">
                <span className="price">Starting from ₹90</span>
              </div>
            </div>
            <button 
              className="book-route-btn"
              onClick={() => navigate('/search-results?from=Kannur&to=Mangalore&date=' + new Date().toISOString().slice(0,10))}
            >
              Book Now
            </button>
          </div>

          <div className="route-card">
            <div className="route-info">
              <div className="route-cities">
                <span className="from-city">Alappuzha</span>
                <span className="route-arrow">→</span>
                <span className="to-city">Kottayam</span>
              </div>
              <div className="route-details">
                <span className="route-number">Route: ALP-KOT-006</span>
                <span className="route-duration">Duration: 1h 45m</span>
              </div>
              <div className="route-price">
                <span className="price">Starting from ₹60</span>
              </div>
            </div>
            <button 
              className="book-route-btn"
              onClick={() => navigate('/search-results?from=Alappuzha&to=Kottayam&date=' + new Date().toISOString().slice(0,10))}
            >
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Additional Sections */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-number">500+</div>
          <div className="stat-label">Buses Managed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">50+</div>
          <div className="stat-label">Routes Optimized</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">10K+</div>
          <div className="stat-label">Happy Customers</div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <h2 className="cta-title">Ready to Transform Your Transportation?</h2>
        <p className="cta-subtitle">Join thousands of companies already using Yatrik ERP</p>
        <div className="cta-buttons">
          <button className="btn btn-primary" onClick={handleBookNow}>Get Started Free</button>
          <button className="btn btn-secondary" onClick={handleBookNow}>Schedule Demo</button>
        </div>
      </div>

      {/* Bus Tracking Modal */}
      <BusTrackingModal 
        isOpen={isTrackingModalOpen} 
        onClose={() => setIsTrackingModalOpen(false)} 
      />
    </div>
  );
};

export default LandingPage;
