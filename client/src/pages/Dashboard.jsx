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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Logo size="default" />
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 mr-4">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Welcome to YatrikERP</h2>
            <p className="text-gray-600 text-center max-w-md">
              This is a simple dashboard placeholder. In a real application, this would display
              relevant data, statistics, and actions for the transport management system.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
              <div className="bg-white p-4 rounded shadow-md">
                <h3 className="font-bold text-lg mb-2">Bus Management</h3>
                <p className="text-gray-600">Manage your bus fleet, schedules, and routes</p>
              </div>
              <div className="bg-white p-4 rounded shadow-md">
                <h3 className="font-bold text-lg mb-2">Ticket Booking</h3>
                <p className="text-gray-600">View and manage passenger bookings</p>
              </div>
              <div className="bg-white p-4 rounded shadow-md">
                <h3 className="font-bold text-lg mb-2">Reports</h3>
                <p className="text-gray-600">Access analytics and generate reports</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;