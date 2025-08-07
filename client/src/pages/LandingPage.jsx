import { Link } from 'react-router-dom';
import { FaMapMarkedAlt, FaLocationArrow, FaClock, FaMoneyBillWave, FaGraduationCap, FaCalendarAlt, FaUser, FaCogs, FaShieldAlt } from 'react-icons/fa';
import Logo from '../components/Logo';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white relative overflow-hidden">
      {/* Glowing background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-cyan-100/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-200/10 rounded-full blur-3xl"></div>
      
      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-6 py-4 max-w-6xl mx-auto border-b border-gray-200/50">
        <Logo size="default" />
        <div className="flex gap-4">
          <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition">Login</Link>
          <Link to="/register" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold px-4 py-2 rounded-lg shadow-lg hover:from-blue-700 hover:to-cyan-700 transition text-sm">Book Ticket</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Live Bus Tracking
            <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Kerala Transport
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Find buses near you within 30km radius. Real-time tracking and booking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:from-blue-700 hover:to-cyan-700 transition">
              Find Nearby Buses
            </button>
            <Link to="/register" className="border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition">
              Book Ticket
            </Link>
          </div>
        </div>

        {/* Live GPS Tracking Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Live GPS Tracking</h2>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaLocationArrow className="text-blue-600" />
                  Buses Near You (30km)
                </h3>
                <div className="bg-gray-100 rounded-lg p-4 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <FaMapMarkedAlt className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm">Live GPS Map</p>
                    <p className="text-xs text-gray-500 mt-1">1,247 active buses</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-700 text-sm">Nearby Buses</span>
                    <span className="font-bold text-blue-600">23</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700 text-sm">Next Bus</span>
                    <span className="font-bold text-green-600">5 min</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-gray-700 text-sm">Active Routes</span>
                    <span className="font-bold text-orange-600">156</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Planner Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Trip Planner</h2>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Journey</h3>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="From"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input 
                    type="text" 
                    placeholder="To"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition text-sm">
                    Find Route
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-1 mb-1">
                      <FaClock className="text-blue-600 text-xs" />
                      <span className="text-gray-700 text-xs">Time</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">2h 15m</span>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-1 mb-1">
                      <FaMoneyBillWave className="text-green-600 text-xs" />
                      <span className="text-gray-700 text-xs">Price</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">₹85</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Map</h3>
                <div className="bg-gray-100 rounded-lg p-4 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <FaMapMarkedAlt className="h-10 w-10 text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Google Maps</p>
                    <p className="text-xs text-gray-500">Route optimization</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Access Types */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Access Types</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
              <FaUser className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Public</h3>
              <p className="text-xs text-gray-600">Live tracking & info</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
              <FaGraduationCap className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Passenger</h3>
              <p className="text-xs text-gray-600">Book tickets</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
              <FaCogs className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Crew</h3>
              <p className="text-xs text-gray-600">Update status</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
              <FaShieldAlt className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Admin</h3>
              <p className="text-xs text-gray-600">Full control</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/register" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-xl text-center hover:from-blue-700 hover:to-cyan-700 transition">
              <FaUser className="h-6 w-6 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Book Ticket</h3>
            </Link>
            <button className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-xl text-center hover:from-green-700 hover:to-blue-700 transition">
              <FaMapMarkedAlt className="h-6 w-6 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Live Tracking</h3>
            </button>
            <Link to="/login" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-xl text-center hover:from-purple-700 hover:to-pink-700 transition">
              <FaShieldAlt className="h-6 w-6 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Staff Login</h3>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 py-6 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <Logo size="small" />
          <div className="flex gap-4 text-gray-600 text-sm">
            <a href="#" className="hover:text-gray-900 transition">Help</a>
            <a href="#" className="hover:text-gray-900 transition">Contact</a>
            <a href="#" className="hover:text-gray-900 transition">About</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;