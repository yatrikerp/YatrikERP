import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login page
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <Logo size="default" />
          <div className="flex items-center">
            <span className="text-gray-600 mr-4 text-sm">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8 text-2xl font-bold text-gray-800">Welcome to YATRIK ERP</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex flex-col items-start">
            <h3 className="font-bold text-lg mb-2 text-blue-700">Bus Management</h3>
            <p className="text-gray-600 text-sm">Manage your bus fleet, schedules, and routes.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex flex-col items-start">
            <h3 className="font-bold text-lg mb-2 text-blue-700">Ticket Booking</h3>
            <p className="text-gray-600 text-sm">View and manage passenger bookings.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100 flex flex-col items-start">
            <h3 className="font-bold text-lg mb-2 text-blue-700">Reports</h3>
            <p className="text-gray-600 text-sm">Access analytics and generate reports.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;