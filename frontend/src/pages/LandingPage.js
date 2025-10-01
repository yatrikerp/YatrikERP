import React, { useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bus, Clock, MapPin, Phone, Star } from 'lucide-react';
import Navigation from '../components/LandingPage/Navigation';
import TopInfoBar from '../components/LandingPage/TopInfoBar';
import SearchCard from '../components/SearchCard/SearchCard';
import useMobileDetection from '../hooks/useMobileDetection';
import './landing.css';
import heroBus from '../assets/hero-bus.png';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const AppBanner = lazy(() => import('../components/LandingPage/AppBanner'));
const PopularRoutes = lazy(() => import('../components/LandingPage/PopularRoutes'));
const ServiceAlerts = lazy(() => import('../components/LandingPage/ServiceAlerts'));
const BusTrackingModal = lazy(() => import('../components/Common/BusTrackingModal'));
const GoogleMapsRouteTracker = lazy(() => import('../components/Common/GoogleMapsRouteTracker'));

const LandingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBusTracking, setShowBusTracking] = useState(false);
  const [featuredTrip, setFeaturedTrip] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useMobileDetection();
  const mapSectionRef = useRef(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

  // Redirect mobile users to mobile landing page
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      if (isMobileDevice && window.location.pathname === '/') {
        navigate('/mobile', { replace: true });
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [navigate]);

  const handleBookNow = () => {
    if (!user) {
      navigate('/login?next=/passenger/dashboard');
      return;
    }
    
    const role = (user.role || 'passenger').toUpperCase();
    
    // Send each role to its own dashboard; passengers to mobile or desktop dashboard
    if (role === 'PASSENGER') {
      if (isMobile) {
        navigate('/passenger/mobile');
      } else {
        navigate('/passenger/dashboard');
      }
    } else if (role === 'ADMIN') {
      navigate('/admin');
    } else if (role === 'CONDUCTOR') {
      navigate('/conductor');
    } else if (role === 'DRIVER') {
      navigate('/driver');
    } else if (role === 'DEPOT_MANAGER') {
      navigate('/depot');
    } else {
      navigate('/dashboard');
    }
  };

  // Popular routes - live only (no static defaults)
  const [popularRoutes, setPopularRoutes] = useState([]);

  // Fetch a featured active route from admin (prefer Thrissur → Guruvayur) and build a trip-like object
  useEffect(() => {
    const loadFeaturedRoute = async () => {
      try {
        // Preferred names kept for future use if needed
        let route = null;

        // Try public routes endpoint first (no auth required)
        const publicPreferred = [
          { fromCity: 'Thrissur', toCity: 'Guruvayur' },
          { fromCity: 'Thrissur' },
          { toCity: 'Guruvayur' }
        ];
        for (const q of publicPreferred) {
          const params = new URLSearchParams({ ...q, limit: '1', status: 'active' });
          const res = await apiFetch('/api/routes?' + params.toString(), { suppressError: true });
          const found = res?.data?.data?.[0] || null;
          if (found) { route = found; break; }
        }

        // No static fallback when not found; show nothing

        if (!route) return;

        const startingPoint = route.startingPoint || route.from || { city: 'Thrissur' };
        const endingPoint = route.endingPoint || route.to || { city: 'Guruvayur' };

        const demoTrip = {
          busId: { busNumber: 'LIVE-TRACK' },
          routeId: {
            routeName: route.routeName || `${startingPoint.city} to ${endingPoint.city}`,
            startingPoint,
            endingPoint
          },
        	coordinates: startingPoint?.coordinates?.latitude && startingPoint?.coordinates?.longitude
            ? { lat: startingPoint.coordinates.latitude, lng: startingPoint.coordinates.longitude }
            : { lat: 10.5276, lng: 76.2144 },
          currentLocation: startingPoint?.location || startingPoint?.city || 'Starting Point',
          currentSpeed: '64 km/h',
          lastUpdate: new Date().toLocaleTimeString(),
          status: 'running',
          estimatedArrival: ''
        };

        setFeaturedTrip(demoTrip);
      } catch (e) {
        // ignore errors on landing
      }
    };

    loadFeaturedRoute();
  }, []);

  // Fetch live popular routes and refresh periodically (deferred)
  useEffect(() => {
    let isMounted = true;
    const fetchPopular = async () => {
      try {
        const res = await apiFetch('/api/routes/popular?limit=6', { 
          method: 'GET', 
          suppressError: true,
          timeout: 5000 // 5 second timeout
        });
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
      } catch (error) {
        // Live-only mode: on error, keep empty state
      }
    };

    // Defer initial fetch so it never blocks paint
    const scheduleFetch = () => setTimeout(fetchPopular, 300);
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(scheduleFetch, { timeout: 800 });
    } else {
      scheduleFetch();
    }
    const intervalId = setInterval(fetchPopular, 60000); // refresh every 60s
    return () => { 
      isMounted = false; 
      clearInterval(intervalId); 
    };
  }, []);

  const serviceAlerts = useMemo(() => ([
    { type: 'info', message: 'New Kerala routes added: Kochi to Thiruvananthapuram, Kozhikode to Kochi' },
    { type: 'warning', message: 'Monsoon season - expect delays on coastal routes' },
    { type: 'success', message: 'All buses now equipped with free WiFi and charging ports' },
  ]), []);

  // Add mobile class to body for CSS targeting
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      if (isMobileDevice) {
        document.body.classList.add('mobile-device');
      } else {
        document.body.classList.remove('mobile-device');
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobile]);

  // Observe map section to lazy-mount Google Maps when in view
  useEffect(() => {
    if (!mapSectionRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsMapVisible(true);
          observer.disconnect();
        }
      });
    }, { rootMargin: '200px 0px' });
    observer.observe(mapSectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-root">
      {/* Mobile Detection Banner - Remove this after testing */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4)',
          color: 'white',
          padding: '8px',
          textAlign: 'center',
          fontSize: '12px',
          zIndex: 9999,
          fontWeight: 'bold'
        }}>
          📱 MOBILE MODE DETECTED - Screen Width: {window.innerWidth}px
        </div>
      )}
      
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
              <Suspense fallback={<div style={{height:'200px'}} />}> 
                <PopularRoutes routes={popularRoutes} />
              </Suspense>
            </div>
            
            {/* Service Alerts */}
            <div>
              <Suspense fallback={null}>
                <ServiceAlerts alerts={serviceAlerts} />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Live Route Preview - Uber-style tracking on landing */}
      <section className="section" ref={mapSectionRef}>
          <div className="container">
            <div className="section__intro">
              <h2 className="section__title">Live Route Preview</h2>
              <p className="section__subtitle">Real-time tracking preview from Streamlined Route Management</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style={{ height: '360px' }}>
              <Suspense fallback={<div className="w-full h-full" />}>
                {isMapVisible && featuredTrip ? (
                  <GoogleMapsRouteTracker trip={featuredTrip} isTracking={true} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full" />
                )}
              </Suspense>
            </div>
          </div>
        </section>

      {/* App Banner */}
      <Suspense fallback={null}>
        <AppBanner />
      </Suspense>

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
                  { icon: 'Facebook', href: "/" },
                  { icon: 'Twitter', href: "/" },
                  { icon: 'Instagram', href: "/" },
                  { icon: 'YouTube', href: "/" }
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
      <Suspense fallback={null}>
        <BusTrackingModal 
          isOpen={showBusTracking}
          onClose={() => setShowBusTracking(false)}
        />
      </Suspense>
    </div>
  );
};

export default LandingPage;
