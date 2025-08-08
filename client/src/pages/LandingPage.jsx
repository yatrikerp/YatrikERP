import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="logo-section">
            <div className="big-y-logo">Y</div>
            <div className="logo-text">
              <span className="logo-title">YATRIK ERP</span>
              <span className="logo-subtitle">Intelligent Transport Management</span>
            </div>
        </div>
          <div className="nav-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">A Fully Software-Based Intelligent Public Transportion</h1>
          <p className="hero-subtitle">Complete fleet management, route optimization, real-time tracking, and comprehensive analytics for modern public transportation</p>
          <Link to="/public-dashboard" className="hero-btn">
            Explore System <FaArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;