import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Route, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminRoutes = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to the new routes management system after 3 seconds
    const timer = setTimeout(() => {
      navigate('/admin/routes-management');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <Route className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Route Management</h1>
          </div>
          <p className="text-gray-600 mb-6">
            Manage bus routes, stops, and route configurations
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-8 h-8 text-green-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  🎉 Route Management System is Now Live!
                </h3>
                <p className="text-green-700 mb-4">
                  Your comprehensive route management system is ready with depot scheduling, 
                  starting/ending points, intermediate stops, and full CRUD operations.
                </p>
                
                <div className="bg-white rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-green-800 mb-2">✨ New Features:</h4>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• Complete route creation with starting/ending points</li>
                    <li>• Depot integration and scheduling</li>
                    <li>• Intermediate stops management</li>
                    <li>• Advanced filtering and search</li>
                    <li>• Beautiful admin interface</li>
                    <li>• Real-time statistics and analytics</li>
                  </ul>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigate('/admin/routes-management')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    Go to Routes Management
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                  <span className="text-green-600 text-sm">
                    Auto-redirecting in 3 seconds...
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-800 mb-2">🚌 Routes Management</h4>
              <p className="text-blue-700 text-sm mb-3">
                Access the full routes management system with depot scheduling capabilities.
              </p>
              <button
                onClick={() => navigate('/admin/routes-management')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                Open Routes Management <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h4 className="font-semibold text-purple-800 mb-2">🏢 Depot Management</h4>
              <p className="text-purple-700 text-sm mb-3">
                Manage bus depots, capacity, facilities, and operating hours.
              </p>
              <button
                onClick={() => navigate('/admin/depot-management')}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center"
              >
                Open Depot Management <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminRoutes;
