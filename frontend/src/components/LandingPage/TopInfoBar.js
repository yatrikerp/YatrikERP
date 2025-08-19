import React from 'react';
import { Phone, Clock, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const TopInfoBar = () => {
  return (
    <div className="support-bar">
      <div className="support-inner">
        <div className="support-left">
          <div className="support-item">
            <Phone className="support-icon" />
            <span className="support-text">1800-123-4567</span>
          </div>
          <div className="support-item">
            <Clock className="support-icon" />
            <span className="support-text">24/7 Support</span>
          </div>
        </div>
        <div className="support-right">
          <a href="#" aria-label="Facebook" className="support-link">
            <Facebook className="support-icon" />
          </a>
          <a href="#" aria-label="Twitter" className="support-link">
            <Twitter className="support-icon" />
          </a>
          <a href="#" aria-label="Instagram" className="support-link">
            <Instagram className="support-icon" />
          </a>
          <a href="#" aria-label="YouTube" className="support-link">
            <Youtube className="support-icon" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default TopInfoBar;
