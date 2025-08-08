import { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaArrowRight, FaRoute, FaBus, FaMapMarkedAlt, FaClock, FaShieldAlt, FaInfinity } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acceptTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role: 'passenger'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('email', formData.email);
        localStorage.setItem('role', 'passenger');
        navigate('/dashboard');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const routes = [
    { icon: <FaBus />, route: 'Kochi → Trivandrum', time: '2h 15m' },
    { icon: <FaRoute />, route: 'Kozhikode → Kochi', time: '3h 30m' },
    { icon: <FaMapMarkedAlt />, route: 'Thrissur → Kozhikode', time: '1h 45m' },
    { icon: <FaClock />, route: 'Kannur → Trivandrum', time: '4h 20m' }
  ];

  return (
    <div className="register-container">
      <div className="register-book">
        {/* Left Page - Form */}
        <div className="register-page left-page">
          <div className="page-content">
            <div className="form-header">
              <h2 className="form-title">Create Account</h2>
              <p className="form-subtitle">Join YATRIK ERP for intelligent transport management</p>
            </div>
            
            {error && <div className="error-alert">{error}</div>}
            
            <form onSubmit={handleSubmit} className="register-form">
              <div className="input-group">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="input-group">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="input-group">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="input-group">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <label htmlFor="acceptTerms">
                  I agree to the Terms and Conditions
                </label>
              </div>
              
              <button type="submit" className="register-btn">
                Create Account <FaArrowRight />
              </button>
            </form>
            
            <div className="form-footer">
              <span>Already have an account? </span>
              <Link to="/login" className="link">Sign In</Link>
            </div>
          </div>
        </div>

        {/* Right Page - Animated Y with Routes and Security Icons */}
        <div className="register-page right-page">
          <div className="page-content">
            {/* Animated Security Icons */}
            <div className="security-icons">
              <div className="security-icon shield">
                <FaShieldAlt />
              </div>
              <div className="security-icon infinity">
                <FaInfinity />
              </div>
            </div>

            <div className="animated-y-container">
              <div className="big-y-logo animated">
                <span className="y-letter">Y</span>
                <div className="routes-overlay">
                  {routes.map((route, index) => (
                    <div 
                      key={index} 
                      className="route-item"
                      style={{ animationDelay: `${index * 0.5}s` }}
                    >
                      <div className="route-icon">{route.icon}</div>
                      <div className="route-info">
                        <span className="route-name">{route.route}</span>
                        <span className="route-time">{route.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="logo-text">
                <h1 className="logo-title">YATRIK ERP</h1>
                <p className="logo-subtitle">Intelligent Transport Management</p>
                <p className="security-text">Secure • Reliable • Infinite Possibilities</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
