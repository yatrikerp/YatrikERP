import React, { useState } from 'react';
import { Users, Bus, Route, Calendar, Settings, BarChart3 } from 'lucide-react';

const AdminOperations = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'operations', label: 'Operations', icon: Settings },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  const quickActions = [
    {
      title: 'Add New User',
      description: 'Create user accounts with role-based permissions',
      icon: Users,
      color: 'bg-blue-500',
      action: () => window.location.href = '/admin/users'
    },
    {
      title: 'Schedule Trip',
      description: 'Create and manage bus trips and schedules',
      icon: Calendar,
      color: 'bg-green-500',
      action: () => window.location.href = '/admin/trips'
    },
    {
      title: 'Manage Routes',
      description: 'Configure bus routes and stops',
      icon: Route,
      color: 'bg-purple-500',
      action: () => window.location.href = '/admin/routes-management'
    },
    {
      title: 'Vehicle Assignment',
      description: 'Assign buses and drivers to routes',
      icon: Bus,
      color: 'bg-orange-500',
      action: () => window.location.href = '/admin/vehicles'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <div
            key={index}
            onClick={action.action}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
          >
            <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">{action.title}</h4>
            <p className="text-sm text-gray-600">{action.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      default:
        return <div className="text-center py-12 text-gray-500">Content coming soon...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Operations Center</h1>
          <p className="text-gray-600">System management and operations dashboard</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex space-x-1 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminOperations;
