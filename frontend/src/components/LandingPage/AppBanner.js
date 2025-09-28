import React, { useEffect, useRef, useState } from 'react';
import { Smartphone, Download, Star, Play, Shield, Zap, Heart, ThumbsUp, Sparkles } from 'lucide-react';
import BrandLogo from '../Common/BrandLogo';

const AppBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [clickedStars, setClickedStars] = useState([]);
  const [showSparkles, setShowSparkles] = useState(false);
  const bannerRef = useRef(null);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (bannerRef.current) {
      observer.observe(bannerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: <Download />, text: "Instant Booking", color: "#10B981" },
    { icon: <Play />, text: "Live Tracking", color: "#3B82F6" },
    { icon: <Shield />, text: "Secure Payments", color: "#F59E0B" }
  ];

  const handleStarClick = (index) => {
    const newClickedStars = [...clickedStars];
    if (newClickedStars.includes(index)) {
      setClickedStars(newClickedStars.filter(i => i !== index));
    } else {
      setClickedStars([...newClickedStars, index]);
    }
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 1000);
  };

  const handleFeatureClick = (index) => {
    setActiveFeature(index);
  };

  const handleDownloadClick = (store) => {
    // Add download animation
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 1500);
    
    // Simulate download action
    alert(`Redirecting to ${store}...`);
  };

  const handlePhoneClick = () => {
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 1000);
  };

  return (
    <section className="app-banner" ref={bannerRef}>
      {/* Animated Background Elements */}
      <div className="app-banner__bg-elements">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
      </div>

      <div className="container">
        <div className={`app-banner__grid ${isVisible ? 'animate-in' : ''}`}>
          {/* Left content */}
          <div className="app-banner__content">
            <div className={`app-banner__badge ${isVisible ? 'animate-slide-up' : ''}`}>
              <Zap className="badge-icon" />
              <span>Now Available</span>
            </div>
            
            <h2 className={`app-banner__title ${isVisible ? 'animate-slide-up' : ''}`}>
              Get the YATRIK ERP App
            </h2>
            
            <p className={`app-banner__subtitle ${isVisible ? 'animate-slide-up' : ''}`}>
              Book tickets, track buses, and manage your travel on the go with our mobile app.
            </p>
            
            {/* Interactive Star Rating */}
            <div className={`app-banner__rating ${isVisible ? 'animate-slide-up' : ''}`}>
              <div className="app-banner__stars">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`star star-${i} ${clickedStars.includes(i) ? 'clicked' : ''}`}
                    onClick={() => handleStarClick(i)}
                    style={{ 
                      color: clickedStars.includes(i) ? '#FFD700' : '#fbbf24',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
              <span className="app-banner__rating-text">
                4.8/5 from 10,000+ users
                {clickedStars.length > 0 && (
                  <span className="rating-feedback"> Thanks for rating!</span>
                )}
              </span>
            </div>

            {/* Interactive Feature Showcase */}
            <div className={`app-banner__features ${isVisible ? 'animate-slide-up' : ''}`}>
              <div className="feature-rotator">
                <div 
                  className="feature-active"
                  style={{ 
                    background: `linear-gradient(135deg, ${features[activeFeature].color}20, ${features[activeFeature].color}10)`,
                    borderColor: features[activeFeature].color
                  }}
                >
                  <div className="feature-icon-wrapper" style={{ color: features[activeFeature].color }}>
                    {features[activeFeature].icon}
                  </div>
                  <span>{features[activeFeature].text}</span>
                </div>
                <div className="feature-dots">
                  {features.map((feature, i) => (
                    <div 
                      key={i} 
                      className={`feature-dot ${i === activeFeature ? 'active' : ''}`}
                      onClick={() => handleFeatureClick(i)}
                      style={{ 
                        backgroundColor: i === activeFeature ? feature.color : 'rgba(255, 255, 255, 0.3)',
                        cursor: 'pointer'
                      }}
                      title={`Click to see ${feature.text}`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Feature Preview Cards */}
              <div className="feature-cards">
                {features.map((feature, i) => (
                  <div 
                    key={i}
                    className={`feature-card ${i === activeFeature ? 'active' : ''}`}
                    onClick={() => handleFeatureClick(i)}
                    style={{
                      borderColor: feature.color,
                      cursor: 'pointer'
                    }}
                  >
                    <div className="feature-card-icon" style={{ color: feature.color }}>
                      {feature.icon}
                    </div>
                    <span className="feature-card-text">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Enhanced Download Buttons */}
            <div className={`app-banner__buttons ${isVisible ? 'animate-slide-up' : ''}`}>
              <button 
                className="app-btn app-btn--primary"
                onClick={() => handleDownloadClick('App Store')}
              >
                <Download className="btn-icon" />
                <span>App Store</span>
                <div className="btn-shine"></div>
                <div className="btn-particles"></div>
              </button>
              <button 
                className="app-btn app-btn--secondary"
                onClick={() => handleDownloadClick('Google Play')}
              >
                <Download className="btn-icon" />
                <span>Google Play</span>
                <div className="btn-shine"></div>
                <div className="btn-particles"></div>
              </button>
            </div>

            {/* Social Proof */}
            <div className={`app-banner__social-proof ${isVisible ? 'animate-slide-up' : ''}`}>
              <div className="social-proof-item">
                <Heart className="social-icon" />
                <span>Loved by travelers</span>
              </div>
              <div className="social-proof-item">
                <ThumbsUp className="social-icon" />
                <span>Highly rated</span>
              </div>
              <div className="social-proof-item">
                <Sparkles className="social-icon" />
                <span>Premium features</span>
              </div>
            </div>
          </div>
          
          {/* Right content - Enhanced Interactive App mockup */}
          <div className={`app-banner__mockup ${isVisible ? 'animate-slide-up' : ''}`}>
            <div className="phone-mockup" onClick={handlePhoneClick}>
              {/* Phone glow effect */}
              <div className="phone-glow"></div>
              
              {/* Sparkle effects */}
              {showSparkles && (
                <div className="sparkle-effects">
                  <div className="sparkle sparkle-1">✨</div>
                  <div className="sparkle sparkle-2">✨</div>
                  <div className="sparkle sparkle-3">✨</div>
                  <div className="sparkle sparkle-4">✨</div>
                </div>
              )}
              
              <div className="phone-mockup__screen">
                {/* Interactive status bar */}
                <div className="status-bar">
                  <div className="status-time">9:41</div>
                  <div className="status-icons">
                    <div className="signal-bars">
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                    </div>
                    <div className="wifi-icon">📶</div>
                    <div className="battery">🔋</div>
                  </div>
                </div>

                {/* App content */}
                <div className="app-content">
                  <div className="app-header">
                    <Smartphone className="phone-mockup__icon" />
                  </div>
                  
                  <div className="app-body">
                    <div className="phone-mockup__logo">
                      <BrandLogo size={24} />
                    </div>
                    <p className="phone-mockup__label">Smart Travel App</p>
                    
                    {/* Interactive app features */}
                    <div className="app-features">
                      <div 
                        className="feature-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('Book Bus feature clicked!');
                        }}
                      >
                        <div className="feature-icon">🚌</div>
                        <span>Book Bus</span>
                      </div>
                      <div 
                        className="feature-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('Live Tracking feature clicked!');
                        }}
                      >
                        <div className="feature-icon">📍</div>
                        <span>Track Live</span>
                      </div>
                      <div 
                        className="feature-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('My Tickets feature clicked!');
                        }}
                      >
                        <div className="feature-icon">🎫</div>
                        <span>My Tickets</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive notification */}
                <div 
                  className="notification-bubble"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Notification clicked! Bus is arriving soon.');
                  }}
                >
                  <div className="notification-icon">🔔</div>
                  <div className="notification-text">Bus arriving in 5 mins!</div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="decorative-elements">
              <div className="orbit orbit-1">
                <div className="orbit-dot"></div>
              </div>
              <div className="orbit orbit-2">
                <div className="orbit-dot"></div>
              </div>
              <div className="orbit orbit-3">
                <div className="orbit-dot"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppBanner;
