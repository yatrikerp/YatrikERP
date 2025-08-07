import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { FaMapMarkedAlt, FaRoute, FaCreditCard, FaQrcode, FaArrowRight } from 'react-icons/fa';

const features = [
  {
    icon: <FaMapMarkedAlt className="h-6 w-6 text-blue-600" />,
    title: 'Live Bus Tracking',
    desc: 'See all active buses in Kerala in real time.'
  },
  {
    icon: <FaRoute className="h-6 w-6 text-cyan-600" />,
    title: 'Smart Route Planner',
    desc: 'Plan your trip and get the best route instantly.'
  },
  {
    icon: <FaCreditCard className="h-6 w-6 text-green-600" />,
    title: 'Cashless Ticketing',
    desc: 'Book tickets and pay digitally with ease.'
  },
  {
    icon: <FaQrcode className="h-6 w-6 text-purple-600" />,
    title: 'Digital Passes',
    desc: 'Student and concession passes, all digital.'
  }
];

const steps = [
  {
    icon: <FaMapMarkedAlt className="h-5 w-5 text-blue-600" />,
    label: 'Find your bus'
  },
  {
    icon: <FaRoute className="h-5 w-5 text-cyan-600" />,
    label: 'Plan your route'
  },
  {
    icon: <FaCreditCard className="h-5 w-5 text-green-600" />,
    label: 'Book your ticket'
  }
];

const LandingPage = () => {
  return (
    <div className="flex-col" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Top bar */}
      <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 0 1.5rem' }}>
        <Logo size="default" />
        <div className="flex-row" style={{ gap: '1.5rem', alignItems: 'center', display: 'flex' }}>
          <Link to="/login" style={{ color: 'var(--color-text)', fontWeight: 500, fontSize: '1rem', textDecoration: 'none' }}>Login</Link>
          <Link to="/register" style={{ color: 'var(--color-text)', fontWeight: 500, fontSize: '1rem', textDecoration: 'none' }}>Register</Link>
        </div>
      </div>
      {/* Hero */}
      <div className="flex-col flex-center" style={{ flex: 1, width: '100%', maxWidth: '700px', margin: '0 auto', padding: '4rem 0' }}>
        <h1 className="title text-center mb-2" style={{ fontSize: '2.5rem' }}>Kerala’s Smart Public Transport Platform</h1>
        <p className="subtitle text-center mb-6" style={{ fontSize: '1.2rem' }}>Live bus tracking, route planning, and digital ticketing for everyone.</p>
        <Link
          to="/public-dashboard"
          className="btn"
          style={{ fontSize: '1.2rem', padding: '1.2em 3em', borderRadius: '1em', marginBottom: '2em', display: 'flex', alignItems: 'center', gap: '0.7em' }}
        >
          Get Started <FaArrowRight />
        </Link>
      </div>
      {/* Features */}
      <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '2rem 0' }}>
        <h2 className="title text-center mb-6" style={{ fontSize: '2rem' }}>Key Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {features.map((f, i) => (
            <div key={i} className="card flex-row" style={{ alignItems: 'center', gap: '1.2em' }}>
              {f.icon}
              <div>
                <div className="title" style={{ fontSize: '1.1rem', marginBottom: '0.2em' }}>{f.title}</div>
                <div className="text-secondary" style={{ fontSize: '0.95em' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* How it works */}
      <div style={{ width: '100%', maxWidth: '700px', margin: '0 auto', padding: '2rem 0' }}>
        <h2 className="title text-center mb-4" style={{ fontSize: '1.3rem' }}>How it works</h2>
        <div className="flex-row" style={{ gap: '2.5em', justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
          {steps.map((s, i) => (
            <div key={i} className="flex-col flex-center">
              <div style={{ background: 'var(--color-shadow)', borderRadius: '50%', padding: '1.2em', marginBottom: '0.5em' }}>{s.icon}</div>
              <div className="text-secondary" style={{ fontWeight: 500, fontSize: '1em', marginBottom: '0.2em' }}>{s.label}</div>
              {i < steps.length - 1 && <div style={{ height: '2em', borderLeft: '2px solid var(--color-border)', margin: '0 1.5em' }} />}
            </div>
          ))}
        </div>
      </div>
      {/* Footer */}
      <footer style={{ width: '100%', borderTop: '1px solid var(--color-border)', padding: '2rem 0', background: 'var(--color-bg)', marginTop: '2rem' }}>
        <div className="flex-row" style={{ maxWidth: '1100px', margin: '0 auto', alignItems: 'center', justifyContent: 'space-between', display: 'flex', gap: '1.5em' }}>
          <Logo size="small" />
          <div className="text-secondary" style={{ fontSize: '0.95em' }}>&copy; {new Date().getFullYear()} YATRIK ERP. All rights reserved.</div>
          <div className="flex-row" style={{ gap: '1.5em', fontSize: '0.95em', color: 'var(--color-text-secondary)' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Help</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>About</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;