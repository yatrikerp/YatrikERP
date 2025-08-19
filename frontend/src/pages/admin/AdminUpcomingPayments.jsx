import React from 'react';

const AdminUpcomingPayments = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upcoming Payments</h1>
        <p className="text-gray-600">Track and manage upcoming payment obligations</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500">Upcoming payments management functionality will be implemented here.</p>
        <p className="text-gray-500 mt-2">This will include:</p>
        <ul className="list-disc list-inside text-gray-500 mt-2 ml-4">
          <li>View pending payments</li>
          <li>Track payment due dates</li>
          <li>Manage payment reminders</li>
          <li>Generate payment reports</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminUpcomingPayments;
