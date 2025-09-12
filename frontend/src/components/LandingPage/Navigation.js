import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../Common/BrandLogo';

const Navigation = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNavClick = (slug) => {
    if (user) {
      navigate(`/passenger/dashboard#${slug}`);
    } else {
      navigate(`/login?next=/passenger/dashboard#${slug}`);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { name: 'Contact Us', slug: 'contact' },
    { name: 'Cancellation', slug: 'cancellation' },
    { name: 'Feedback', slug: 'feedback' },
    { name: 'Manage Booking', slug: 'manage' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Status Check', slug: 'status' },
  ];

  return (
    <nav className="bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity duration-200 shrink-0">
            <BrandLogo size={28} />
          </Link>

          {/* Desktop Navigation (centered) */}
          <div className="hidden md:flex items-center justify-center gap-6 flex-1">
            {navItems.map((item) => (
              item.slug ? (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.slug)}
                  className="text-gray-800 hover:text-pink-600 transition-colors font-semibold text-base px-2 py-1 rounded-md hover:bg-gray-100"
                >
                  {item.name}
                </button>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-800 hover:text-pink-600 transition-colors font-semibold text-base px-2 py-1 rounded-md hover:bg-gray-100"
                >
                  {item.name}
                </Link>
              )
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link
              to="/login"
              className="flex items-center space-x-2 border border-pink-500 text-pink-600 hover:bg-pink-50 transition-colors font-semibold text-base px-3 py-2 rounded-md"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Login</span>
            </Link>
            <Link
              to="/signup"
              className="signup-cta"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-pink-600 hover:bg-gray-100 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t bg-gradient-to-b from-white/80 to-white">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                item.slug ? (
                  <button
                    key={item.name}
                    onClick={() => {
                      handleNavClick(item.slug);
                      setIsOpen(false);
                    }}
                    className="text-gray-800 hover:text-pink-600 transition-colors font-medium text-base px-4 py-2 rounded-md hover:bg-gray-100 w-full text-left"
                  >
                    {item.name}
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="text-gray-800 hover:text-pink-600 transition-colors font-medium text-base px-4 py-2 rounded-md hover:bg-gray-100"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                )
              ))}
              <div className="pt-4 border-t">
                <Link
                  to="/login"
                  className="flex items-center space-x-2 border border-pink-500 text-pink-600 hover:bg-pink-50 transition-colors font-semibold text-base px-4 py-2 rounded-md mb-2"
                  onClick={() => setIsOpen(false)}
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors font-semibold inline-block"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
