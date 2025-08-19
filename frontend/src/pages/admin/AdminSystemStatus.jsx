import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

const AdminSystemStatus = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
          </div>
          <p className="text-gray-600 mb-6">
            Monitor system health, performance, and operational status
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm">
              <strong>Coming Soon:</strong> System status interface will be implemented here.
              This will include real-time monitoring of API, database, and WebSocket connections.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminSystemStatus;
