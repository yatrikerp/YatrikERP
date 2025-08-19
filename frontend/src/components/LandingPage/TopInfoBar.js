import React from 'react';
import { Phone, Clock, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const TopInfoBar = () => {
  return (
    <>
      <div className="bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-1.5">
          {/* Left side - Contact info */}
          <div className="flex items-center space-x-6 mb-1 sm:mb-0">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span className="font-medium text-sm">1800-123-4567</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium text-sm">24/7 Support</span>
            </div>
          </div>
          
          {/* Right side - Social icons */}
          <div className="flex items-center space-x-4">
            <a href="#" className="hover:text-primary-200 transition-colors opacity-90 hover:opacity-100">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-primary-200 transition-colors opacity-90 hover:opacity-100">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-primary-200 transition-colors opacity-90 hover:opacity-100">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-primary-200 transition-colors opacity-90 hover:opacity-100">
              <Youtube className="w-4 h-4" />
            </a>
          </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopInfoBar;
