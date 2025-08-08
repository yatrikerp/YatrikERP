import { useState } from 'react';
import { FaEnvelope, FaLock, FaArrowRight, FaRoute, FaBus, FaMapMarkedAlt, FaClock, FaShieldAlt, FaInfinity } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
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

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
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
        setError(data.message || 'Login failed');
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
    <div className="login-container">
      <div className="login-book">
        {/* Left Page - Form */}
        <div className="login-page left-page">
          <div className="page-content">
            <div className="form-header">
              <h2 className="form-title">Welcome Back</h2>
              <p className="form-subtitle">Sign in to your YATRIK ERP account</p>
            </div>
            
            {error && <div className="error-alert">{error}</div>}
            
            <form onSubmit={handleSubmit} className="login-form">
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
              
              <button type="submit" className="login-btn">
                Sign In <FaArrowRight />
              </button>
            </form>
            
            <div className="form-footer">
              <span>Don't have an account? </span>
              <Link to="/register" className="link">Sign Up</Link>
            </div>
          </div>
        </div>

        {/* Right Page - Animated Y with Routes and Security Icons */}
        <div className="login-page right-page">
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

export default Login;