import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../Common/BrandLogo';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity duration-200">
              <BrandLogo size={28} />
            </Link>
            <nav className="flex space-x-8">
              <a href="/passenger/trip-planner" className="text-gray-700 hover:text-primary-600">Trip Planner</a>
              <a href="/passenger/booking" className="text-gray-700 hover:text-primary-600">Bookings</a>
              <a href="/passenger/wallet" className="text-gray-700 hover:text-primary-600">Wallet</a>
              <a href="/passenger/profile" className="text-gray-700 hover:text-primary-600">Profile</a>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
