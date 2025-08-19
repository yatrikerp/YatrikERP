import React from 'react';
import { motion } from 'framer-motion';
import { Route } from 'lucide-react';

const AdminFarePolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <Route className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold text-gray-900">Fare Policy Management</h1>
          </div>
          <p className="text-gray-600 mb-6">
            Manage fare policies and pricing rules for all routes
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm">
              <strong>Coming Soon:</strong> Fare policy management interface will be implemented here.
              This will include route-based pricing, seasonal rates, and discount rules.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminFarePolicy;
