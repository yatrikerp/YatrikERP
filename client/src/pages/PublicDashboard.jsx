import { FaMapMarkedAlt, FaRoute, FaClock, FaMoneyBillWave } from 'react-icons/fa';
import Logo from '../components/Logo';
import { Link } from 'react-router-dom';

const PublicDashboard = () => {
  return (
    <div className="min-h-screen bg-white px-4">
      <nav className="flex justify-between items-center px-4 py-4 max-w-5xl mx-auto border-b border-gray-100">
        <Logo size="small" />
        <div className="flex gap-4">
          <Link to="/login" className="text-gray-700 font-medium hover:text-blue-700 transition text-sm">Login</Link>
          <Link to="/register" className="text-gray-700 font-medium hover:text-blue-700 transition text-sm">Register</Link>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto py-8 flex flex-col gap-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Live Bus Map */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col items-center">
            <FaMapMarkedAlt className="h-14 w-14 text-blue-600 mb-2" />
            <div className="text-xl font-bold text-gray-900 mb-1">Live Buses in Kerala</div>
            <div className="text-xs text-gray-500 mb-4">(Map placeholder: show all active buses in Kerala)</div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 text-sm">Nearby Buses</span>
                <span className="font-bold text-blue-600">23</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 text-sm">Next Bus</span>
                <span className="font-bold text-green-600">5 min</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 text-sm">Active Routes</span>
                <span className="font-bold text-orange-600">156</span>
              </div>
            </div>
          </div>
          {/* Route Planner */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col items-center">
            <FaRoute className="h-14 w-14 text-cyan-600 mb-2" />
            <div className="text-xl font-bold text-gray-900 mb-1">Route Planner</div>
            <div className="text-xs text-gray-500 mb-4">Plan your trip and get the best route instantly.</div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <input type="text" placeholder="From" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <input type="text" placeholder="To" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition text-sm">Find Route</button>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <FaClock className="text-blue-600 text-xs" />
                    <span className="text-gray-700 text-xs">Time</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">2h 15m</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-1 mb-1">
                    <FaMoneyBillWave className="text-green-600 text-xs" />
                    <span className="text-gray-700 text-xs">Price</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">₹85</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-4">
          <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-md transition text-lg">Book Ticket</Link>
        </div>
      </div>
    </div>
  );
};

export default PublicDashboard;