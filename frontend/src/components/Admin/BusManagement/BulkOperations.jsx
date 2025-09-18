import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Users, Wrench, Fuel, MapPin, Settings, Download, Upload,
  AlertTriangle, CheckCircle, Clock, Star, Zap, Shield, BarChart
} from 'lucide-react';
import toast from 'react-hot-toast';

const BulkOperations = ({ 
  selectedBuses = [], 
  onClose, 
  onAction 
}) => {
  const [selectedAction, setSelectedAction] = useState('');
  const [actionData, setActionData] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const bulkActions = [
    {
      id: 'status_update',
      title: 'Update Status',
      description: 'Change status of selected buses',
      icon: Settings,
      color: 'blue',
      fields: [
        {
          name: 'status',
          type: 'select',
          label: 'New Status',
          options: [
            { value: 'active', label: 'Active' },
            { value: 'maintenance', label: 'Maintenance' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'retired', label: 'Retired' }
          ]
        }
      ]
    },
    {
      id: 'assign_driver',
      title: 'Assign Driver',
      description: 'Assign driver to selected buses',
      icon: Users,
      color: 'green',
      fields: [
        {
          name: 'driverId',
          type: 'select',
          label: 'Select Driver',
          options: [
            { value: 'driver1', label: 'John Doe' },
            { value: 'driver2', label: 'Jane Smith' },
            { value: 'driver3', label: 'Mike Johnson' }
          ]
        }
      ]
    },
    {
      id: 'assign_conductor',
      title: 'Assign Conductor',
      description: 'Assign conductor to selected buses',
      icon: Users,
      color: 'purple',
      fields: [
        {
          name: 'conductorId',
          type: 'select',
          label: 'Select Conductor',
          options: [
            { value: 'conductor1', label: 'Alice Brown' },
            { value: 'conductor2', label: 'Bob Wilson' },
            { value: 'conductor3', label: 'Carol Davis' }
          ]
        }
      ]
    },
    {
      id: 'schedule_maintenance',
      title: 'Schedule Maintenance',
      description: 'Schedule maintenance for selected buses',
      icon: Wrench,
      color: 'yellow',
      fields: [
        {
          name: 'maintenanceType',
          type: 'select',
          label: 'Maintenance Type',
          options: [
            { value: 'routine', label: 'Routine Service' },
            { value: 'repair', label: 'Repair' },
            { value: 'inspection', label: 'Inspection' }
          ]
        },
        {
          name: 'scheduledDate',
          type: 'date',
          label: 'Scheduled Date'
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'Notes (Optional)',
          placeholder: 'Additional notes for maintenance...'
        }
      ]
    },
    {
      id: 'update_fuel',
      title: 'Update Fuel Level',
      description: 'Update fuel level for selected buses',
      icon: Fuel,
      color: 'orange',
      fields: [
        {
          name: 'fuelLevel',
          type: 'number',
          label: 'Fuel Level (%)',
          min: 0,
          max: 100
        },
        {
          name: 'refuelDate',
          type: 'datetime-local',
          label: 'Refuel Date & Time'
        }
      ]
    },
    {
      id: 'update_location',
      title: 'Update Location',
      description: 'Update current location of selected buses',
      icon: MapPin,
      color: 'indigo',
      fields: [
        {
          name: 'latitude',
          type: 'number',
          label: 'Latitude',
          step: 'any'
        },
        {
          name: 'longitude',
          type: 'number',
          label: 'Longitude',
          step: 'any'
        },
        {
          name: 'stopName',
          type: 'text',
          label: 'Stop Name',
          placeholder: 'Current stop or location name'
        }
      ]
    },
    {
      id: 'export_data',
      title: 'Export Data',
      description: 'Export selected buses data',
      icon: Download,
      color: 'gray',
      fields: [
        {
          name: 'format',
          type: 'select',
          label: 'Export Format',
          options: [
            { value: 'csv', label: 'CSV' },
            { value: 'excel', label: 'Excel' },
            { value: 'pdf', label: 'PDF' }
          ]
        },
        {
          name: 'includeDetails',
          type: 'checkbox',
          label: 'Include detailed information'
        }
      ]
    },
    {
      id: 'performance_analysis',
      title: 'Performance Analysis',
      description: 'Generate performance report for selected buses',
      icon: BarChart,
      color: 'teal',
      fields: [
        {
          name: 'reportType',
          type: 'select',
          label: 'Report Type',
          options: [
            { value: 'summary', label: 'Summary Report' },
            { value: 'detailed', label: 'Detailed Report' },
            { value: 'comparison', label: 'Comparison Report' }
          ]
        },
        {
          name: 'dateRange',
          type: 'select',
          label: 'Date Range',
          options: [
            { value: 'week', label: 'Last Week' },
            { value: 'month', label: 'Last Month' },
            { value: 'quarter', label: 'Last Quarter' },
            { value: 'year', label: 'Last Year' }
          ]
        }
      ]
    }
  ];

  const handleActionSelect = (actionId) => {
    setSelectedAction(actionId);
    setActionData({});
  };

  const handleFieldChange = (fieldName, value) => {
    setActionData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async () => {
    if (!selectedAction) return;

    setIsProcessing(true);
    try {
      await onAction(selectedAction, actionData);
      onClose();
    } catch (error) {
      toast.error(`Bulk operation failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedActionConfig = bulkActions.find(action => action.id === selectedAction);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Bulk Operations</h3>
                <p className="text-sm text-gray-600">
                  {selectedBuses.length} bus{selectedBuses.length !== 1 ? 'es' : ''} selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Action Selection */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Select Action</h4>
            <div className="space-y-2">
              {bulkActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleActionSelect(action.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedAction === action.id
                        ? `bg-${action.color}-100 border-2 border-${action.color}-300 text-${action.color}-700`
                        : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        selectedAction === action.id
                          ? `bg-${action.color}-200`
                          : 'bg-gray-100'
                      }`}>
                        <IconComponent className={`w-4 h-4 ${
                          selectedAction === action.id
                            ? `text-${action.color}-600`
                            : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Configuration */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedAction ? (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`p-3 bg-${selectedActionConfig.color}-100 rounded-lg`}>
                    <selectedActionConfig.icon className={`w-6 h-6 text-${selectedActionConfig.color}-600`} />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedActionConfig.title}</h4>
                    <p className="text-sm text-gray-600">{selectedActionConfig.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedActionConfig.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {field.type === 'select' && (
                        <select
                          value={actionData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select {field.label}</option>
                          {field.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={actionData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}

                      {field.type === 'number' && (
                        <input
                          type="number"
                          value={actionData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}

                      {field.type === 'date' && (
                        <input
                          type="date"
                          value={actionData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}

                      {field.type === 'datetime-local' && (
                        <input
                          type="datetime-local"
                          value={actionData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}

                      {field.type === 'textarea' && (
                        <textarea
                          value={actionData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}

                      {field.type === 'checkbox' && (
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={actionData[field.name] || false}
                            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{field.label}</span>
                        </label>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Action Summary</h5>
                  <div className="text-sm text-gray-600">
                    <p>• {selectedActionConfig.title} will be applied to {selectedBuses.length} bus{selectedBuses.length !== 1 ? 'es' : ''}</p>
                    {Object.entries(actionData).map(([key, value]) => (
                      <p key={key}>
                        • {key}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Select an action to continue</p>
                  <p className="text-gray-400 text-sm">Choose from the available bulk operations</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedBuses.length} bus{selectedBuses.length !== 1 ? 'es' : ''} will be affected
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedAction || isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Execute Action</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BulkOperations;