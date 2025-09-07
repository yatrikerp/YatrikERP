import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Square, ChevronDown, Users, MapPin, Wrench,
  Trash2, Download, Upload, Settings, AlertTriangle, X,
  Check, Loader2, FileText, Calendar, Fuel
} from 'lucide-react';

const BulkOperations = ({
  selectedBuses = [],
  totalBuses = 0,
  onSelectAll,
  onDeselectAll,
  onBulkUpdate,
  onBulkDelete,
  onBulkAssign,
  onBulkExport,
  isLoading = false,
  depots = [],
  drivers = [],
  conductors = []
}) => {
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [bulkAssignData, setBulkAssignData] = useState({
    depotId: '',
    driverId: '',
    conductorId: '',
    status: ''
  });

  const [bulkUpdateData, setBulkUpdateData] = useState({
    status: '',
    depotId: '',
    maintenanceDate: '',
    notes: ''
  });

  const isAllSelected = selectedBuses.length === totalBuses && totalBuses > 0;
  const isPartialSelected = selectedBuses.length > 0 && selectedBuses.length < totalBuses;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  const handleBulkAssign = () => {
    if (!bulkAssignData.depotId && !bulkAssignData.driverId && !bulkAssignData.conductorId) {
      return;
    }
    
    const assignments = {};
    if (bulkAssignData.depotId) assignments.depotId = bulkAssignData.depotId;
    if (bulkAssignData.driverId) assignments.assignedDriver = bulkAssignData.driverId;
    if (bulkAssignData.conductorId) assignments.assignedConductor = bulkAssignData.conductorId;
    if (bulkAssignData.status) assignments.status = bulkAssignData.status;

    onBulkAssign(selectedBuses, assignments);
    setShowBulkAssignModal(false);
    setBulkAssignData({ depotId: '', driverId: '', conductorId: '', status: '' });
  };

  const handleBulkUpdate = () => {
    const updates = {};
    if (bulkUpdateData.status) updates.status = bulkUpdateData.status;
    if (bulkUpdateData.depotId) updates.depotId = bulkUpdateData.depotId;
    if (bulkUpdateData.maintenanceDate) updates.nextMaintenanceDate = bulkUpdateData.maintenanceDate;
    if (bulkUpdateData.notes) updates.notes = bulkUpdateData.notes;

    onBulkUpdate(selectedBuses, updates);
    setShowBulkUpdateModal(false);
    setBulkUpdateData({ status: '', depotId: '', maintenanceDate: '', notes: '' });
  };

  const handleBulkDelete = () => {
    onBulkDelete(selectedBuses);
    setShowDeleteConfirm(false);
  };

  if (selectedBuses.length === 0) return null;

  return (
    <>
      {/* Bulk Operations Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-40"
      >
        <div className="flex items-center space-x-4">
          {/* Selection Info */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSelectAll}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : isPartialSelected ? (
                <div className="w-5 h-5 bg-blue-600 rounded border-2 border-blue-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded"></div>
                </div>
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <span className="text-sm font-medium text-gray-900">
              {selectedBuses.length} selected
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBulkAssignModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
            >
              <Users className="w-4 h-4" />
              <span>Assign</span>
            </button>

            <button
              onClick={() => setShowBulkUpdateModal(true)}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm"
            >
              <Settings className="w-4 h-4" />
              <span>Update</span>
            </button>

            <button
              onClick={() => onBulkExport(selectedBuses)}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showBulkMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px]"
                  >
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowBulkMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Selected</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Close Button */}
            <button
              onClick={onDeselectAll}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Bulk Assign Modal */}
      <AnimatePresence>
        {showBulkAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bulk Assign ({selectedBuses.length} buses)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depot</label>
                  <select
                    value={bulkAssignData.depotId}
                    onChange={(e) => setBulkAssignData(prev => ({ ...prev, depotId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Keep current depot</option>
                    {depots.map(depot => (
                      <option key={depot._id} value={depot._id}>{depot.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Driver</label>
                  <select
                    value={bulkAssignData.driverId}
                    onChange={(e) => setBulkAssignData(prev => ({ ...prev, driverId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Keep current driver</option>
                    {drivers.map(driver => (
                      <option key={driver._id} value={driver._id}>{driver.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conductor</label>
                  <select
                    value={bulkAssignData.conductorId}
                    onChange={(e) => setBulkAssignData(prev => ({ ...prev, conductorId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Keep current conductor</option>
                    {conductors.map(conductor => (
                      <option key={conductor._id} value={conductor._id}>{conductor.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={bulkAssignData.status}
                    onChange={(e) => setBulkAssignData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Keep current status</option>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBulkAssignModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAssign}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Assign</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Update Modal */}
      <AnimatePresence>
        {showBulkUpdateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bulk Update ({selectedBuses.length} buses)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={bulkUpdateData.status}
                    onChange={(e) => setBulkUpdateData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No change</option>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transfer to Depot</label>
                  <select
                    value={bulkUpdateData.depotId}
                    onChange={(e) => setBulkUpdateData(prev => ({ ...prev, depotId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No change</option>
                    {depots.map(depot => (
                      <option key={depot._id} value={depot._id}>{depot.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Maintenance</label>
                  <input
                    type="date"
                    value={bulkUpdateData.maintenanceDate}
                    onChange={(e) => setBulkUpdateData(prev => ({ ...prev, maintenanceDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={bulkUpdateData.notes}
                    onChange={(e) => setBulkUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add bulk update notes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBulkUpdateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpdate}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Update</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Buses</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete {selectedBuses.length} selected bus{selectedBuses.length > 1 ? 'es' : ''}?
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BulkOperations;
