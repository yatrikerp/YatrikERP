import React from 'react';
import { Smartphone, Download, Star } from 'lucide-react';
import BrandLogo from '../Common/BrandLogo';

const AppBanner = () => {
  return (
    <section className="app-banner">
      <div className="container">
        <div className="app-banner__grid">
          {/* Left content */}
          <div className="app-banner__content">
            <h2 className="app-banner__title">
              Get the YATRIK ERP App
            </h2>
            <p className="app-banner__subtitle">
              Book tickets, track buses, and manage your travel on the go with our mobile app.
            </p>
            
            <div className="app-banner__rating">
              <div className="app-banner__stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="star" />
                ))}
              </div>
              <span className="app-banner__rating-text">4.8/5 from 10,000+ users</span>
            </div>
            
            <div className="app-banner__buttons">
              <button className="app-btn">
                <Download className="w-5 h-5" />
                <span>App Store</span>
              </button>
              <button className="app-btn">
                <Download className="w-5 h-5" />
                <span>Google Play</span>
              </button>
            </div>
          </div>
          
          {/* Right content - App mockup */}
          <div className="app-banner__mockup">
            <div className="phone-mockup">
              <div className="phone-mockup__screen">
                <Smartphone className="phone-mockup__icon" />
                <div className="phone-mockup__content">
                  <div className="phone-mockup__logo" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <BrandLogo size={20} />
                  </div>
                  <p className="phone-mockup__label">Smart Travel App</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppBanner;
