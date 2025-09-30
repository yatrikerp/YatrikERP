import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bus, Clock, MapPin, Phone, Star } from 'lucide-react';
import Navigation from '../components/LandingPage/Navigation';
import TopInfoBar from '../components/LandingPage/TopInfoBar';
import AppBanner from '../components/LandingPage/AppBanner';
import PopularRoutes from '../components/LandingPage/PopularRoutes';
import ServiceAlerts from '../components/LandingPage/ServiceAlerts';
import SearchCard from '../components/SearchCard/SearchCard';
import AnimatedMapPanel from '../components/Common/AnimatedMapPanel';
import AnimatedStats from '../components/pax/AnimatedStats';
import KeralaDestinationsShowcase from '../components/pax/KeralaDestinationsShowcase';
import ManageBookingPanel from '../components/pax/ManageBookingPanel';
import StatusCheckPanel from '../components/pax/StatusCheckPanel';
import CancellationPolicyPanel from '../components/pax/CancellationPolicyPanel';
import FeedbackPanel from '../components/pax/FeedbackPanel';
import ContactUsPanel from '../components/pax/ContactUsPanel';
import BusTrackingModal from '../components/Common/BusTrackingModal';
import './landing.css';
import heroBus from '../assets/hero-bus.png';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const LandingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBusTracking, setShowBusTracking] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBookNow = () => {
    console.log('handleBookNow called:', { user, hasUser: !!user });
    
    if (!user) {
      console.log('No user, redirecting to login');
      navigate('/login?next=/passenger/dashboard');
      return;
    }
    
    const role = (user.role || 'passenger').toUpperCase();
    console.log('User role:', role);
    
    // Send each role to its own dashboard; passengers to new passenger dashboard
    if (role === 'PASSENGER') {
      console.log('Redirecting to /passenger/dashboard');
      navigate('/passenger/dashboard');
    } else if (role === 'ADMIN') {
      console.log('Redirecting to /admin');
      navigate('/admin');
    } else if (role === 'CONDUCTOR') {
      console.log('Redirecting to /conductor');
      navigate('/conductor');
    } else if (role === 'DRIVER') {
      console.log('Redirecting to /driver');
      navigate('/driver');
    } else if (role === 'DEPOT_MANAGER') {
      console.log('Redirecting to /depot');
      navigate('/depot');
    } else {
      console.log('Redirecting to /dashboard');
      navigate('/dashboard');
    }
  };

  const [popularRoutes, setPopularRoutes] = useState([]);

  // Fetch live popular routes and refresh periodically
  useEffect(() => {
    let isMounted = true;
    const fetchPopular = async () => {
      const res = await apiFetch('/api/routes/popular', { method: 'GET', suppressError: true });
      if (!isMounted) return;
      if (res && res.ok) {
        // API returns { success: true, data: [...] }
        if (res.data && Array.isArray(res.data.data)) {
          setPopularRoutes(res.data.data);
          return;
        }
        // Fallback if endpoint returns an array directly
        if (Array.isArray(res.data)) {
          setPopularRoutes(res.data);
        }
      }
    };

    fetchPopular();
    const intervalId = setInterval(fetchPopular, 60000); // refresh every 60s
    return () => { isMounted = false; clearInterval(intervalId); };
  }, []);

  const serviceAlerts = [
    { type: 'info', message: 'New Kerala routes added: Kochi to Thiruvananthapuram, Kozhikode to Kochi' },
    { type: 'warning', message: 'Monsoon season - expect delays on coastal routes' },
    { type: 'success', message: 'All buses now equipped with free WiFi and charging ports' },
  ];

  return (
    <div className="landing-root">
      <TopInfoBar />
      <Navigation 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Hero Section */}
      <section className="hero">
        <img src={heroBus} alt="" className="hero__bus" aria-hidden="true" />
        <div className="hero__overlay" />
        <div className="container hero__container">
          <div className="hero__grid">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="hero__left"
            >
              <h1 className="hero__title">
                Travel Smart,
                <span>Travel Safe</span>
              </h1>
              <p className="hero__subtitle">
                Book your bus tickets with YATRIK ERP. Experience comfortable,
                reliable, and affordable bus travel across India.
              </p>
              <div className="hero__ctas">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBookNow}
                  className="btn btn--accent"
                >
                  Book Now <ArrowRight size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowBusTracking(true)}
                  className="btn btn--secondary"
                >
                  <Bus size={16} /> Track Bus
                </motion.button>
              </div>
            </motion.div>

            {/* Right - Search Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="hero__right"
            >
              <SearchCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Below the fold content */}
      <section className="section">
        <div className="container">
          <div className="grid-3">
            {/* Popular Routes */}
            <div className="lg:col-span-2">
              <PopularRoutes routes={popularRoutes} />
            </div>
            
            {/* Service Alerts */}
            <div>
              <ServiceAlerts alerts={serviceAlerts} />
            </div>
          </div>
        </div>
      </section>

      {/* App Banner */}
      <AppBanner />

      {/* Features Section */}
      <section className="section section--muted">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="section__intro"
          >
            <h2 className="section__title">
              Why Choose YATRIK ERP?
            </h2>
            <p className="section__subtitle">
              We're committed to providing the best bus travel experience with modern technology and excellent service.
            </p>
          </motion.div>

          <div className="features">
            {[
              {
                icon: <Bus className="feature__icon" />,
                title: "Wide Network",
                description: "Connect to 500+ cities across India with our extensive bus network."
              },
              {
                icon: <Clock className="feature__icon" />,
                title: "Real-time Updates",
                description: "Get live tracking, delays, and status updates for your journey."
              },
              {
                icon: <Star className="feature__icon" />,
                title: "Premium Service",
                description: "Enjoy comfortable seating, WiFi, and entertainment on premium routes."
              },
              {
                icon: <MapPin className="feature__icon" />,
                title: "Smart Routes",
                description: "AI-powered route optimization for faster and efficient travel."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="feature"
              >
                <div className="feature__iconWrap">
                  {feature.icon}
                </div>
                <h3 className="feature__title">
                  {feature.title}
                </h3>
                <p className="feature__desc">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer__grid">
            <div className="footer__brand">
              <h3>YATRIK ERP</h3>
              <p>
                Your trusted partner for safe, comfortable, and affordable bus travel across India. 
                Experience the future of transportation with our smart booking system.
              </p>
              <div className="footer__socials">
                {[
                  { icon: 'Facebook', href: "#" },
                  { icon: 'Twitter', href: "#" },
                  { icon: 'Instagram', href: "#" },
                  { icon: 'YouTube', href: "#" }
                ].map((social, index) => (
                  <a key={index} href={social.href} className="social" aria-label={social.icon}>
                    <span>{social.icon[0]}</span>
                  </a>
                ))}
              </div>
            </div>
            
            <div className="footer__col">
              <h4>Quick Links</h4>
              <ul>
                {['About Us', 'Contact', 'Terms & Conditions', 'Privacy Policy', 'FAQ'].map((link, index) => (
                  <li key={index}><a href="#">{link}</a></li>
                ))}
              </ul>
            </div>
            
            <div className="footer__col">
              <h4>Support</h4>
              <ul>
                <li className="footer__support"><Phone size={12} /><span>1800-123-4567</span></li>
                <li>support@yatrikerp.com</li>
                <li>24/7 Customer Support</li>
              </ul>
            </div>
          </div>
          
          <div className="footer__bottom">© 2024 YATRIK ERP. All rights reserved.</div>
        </div>
      </footer>

      {/* Bus Tracking Modal */}
      <BusTrackingModal 
        isOpen={showBusTracking}
        onClose={() => setShowBusTracking(false)}
      />
    </div>
  );
};

export default LandingPage;
