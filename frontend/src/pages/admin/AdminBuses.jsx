import React from 'react';

const AdminBuses = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bus Management</h1>
        <p className="text-gray-600">Manage all buses in the fleet</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500">Bus management functionality will be implemented here.</p>
        <p className="text-gray-500 mt-2">This will include:</p>
        <ul className="list-disc list-inside text-gray-500 mt-2 ml-4">
          <li>Add/Edit/Delete buses</li>
          <li>Assign buses to routes</li>
          <li>Track bus maintenance</li>
          <li>Monitor bus capacity and status</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminBuses;
