import React from 'react';
import { X, User, ClipboardList, Car, Settings } from 'lucide-react';

const RoleSwitcher = ({ isOpen, onClose, onRoleSelect }) => {
  const roles = [
    {
      id: 'passenger',
      name: 'Passenger',
      description: 'Book tickets, track buses',
      icon: User,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'conductor',
      name: 'Conductor',
      description: 'Manage trips, scan tickets',
      icon: ClipboardList,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'driver',
      name: 'Driver',
      description: 'GPS tracking, route updates',
      icon: Car,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-lg w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Select Role</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Role Options */}
        <div className="p-4 space-y-3">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => onRoleSelect(role.id)}
                className={`w-full p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left ${role.bgColor}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-white ${role.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{role.name}</h3>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSwitcher;

