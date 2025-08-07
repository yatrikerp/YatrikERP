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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="flex justify-between items-center w-full max-w-6xl mx-auto pt-6 px-4">
        <Logo size="default" />
        <div className="flex gap-4 items-center">
          <Link to="/login" className="text-gray-700 font-medium hover:text-blue-700 transition text-sm">Login</Link>
          <Link to="/register" className="text-gray-700 font-medium hover:text-blue-700 transition text-sm">Register</Link>
        </div>
      </div>
      {/* Hero */}
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-2xl mx-auto py-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 text-center">Kerala’s Smart Public Transport Platform</h1>
        <p className="text-lg text-gray-600 mb-8 text-center">Live bus tracking, route planning, and digital ticketing for everyone.</p>
        <Link
          to="/public-dashboard"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-xl shadow-lg transition text-lg flex items-center gap-2"
        >
          Get Started <FaArrowRight />
        </Link>
      </div>
      {/* Features */}
      <div className="w-full max-w-4xl mx-auto py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-4 bg-white rounded-lg shadow p-4 border border-gray-100">
              {f.icon}
              <div>
                <div className="font-semibold text-gray-800 text-base">{f.title}</div>
                <div className="text-xs text-gray-500">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* How it works */}
      <div className="w-full max-w-3xl mx-auto py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">How it works</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="bg-gray-100 rounded-full p-4 mb-2">{s.icon}</div>
              <div className="text-gray-700 font-medium text-sm mb-1">{s.label}</div>
              {i < steps.length - 1 && <div className="hidden sm:block h-8 border-l-2 border-gray-200 mx-4" />}
            </div>
          ))}
        </div>
      </div>
      {/* Footer */}
      <footer className="w-full border-t border-gray-100 py-6 bg-white mt-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <Logo size="small" />
          <div className="text-gray-400 text-xs">&copy; {new Date().getFullYear()} YATRIK ERP. All rights reserved.</div>
          <div className="flex gap-4 text-gray-500 text-xs">
            <a href="#" className="hover:text-blue-700 transition">Help</a>
            <a href="#" className="hover:text-blue-700 transition">Contact</a>
            <a href="#" className="hover:text-blue-700 transition">About</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;