import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, X, ChevronDown, Calendar, MapPin, 
  Fuel, Users, Settings, Save, RotateCcw, Star
} from 'lucide-react';

const AdvancedFilters = ({ 
  filters, 
  onFiltersChange, 
  depots = [], 
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter 
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [filterName, setFilterName] = useState('');

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      depotId: 'all',
      busType: 'all',
      fuelLevel: 'all',
      maintenanceStatus: 'all',
      performanceScore: 'all',
      dateRange: 'all'
    });
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) return;
    onSaveFilter?.(filterName, filters);
    setFilterName('');
    setShowSaveModal(false);
  };

  const activeFiltersCount = Object.values(filters).filter(
    value => value && value !== 'all' && value !== ''
  ).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Basic Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by bus number, registration, or driver..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Saved Filters Dropdown */}
          {savedFilters.length > 0 && (
            <div className="relative">
              <select
                onChange={(e) => e.target.value && onLoadFilter?.(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                defaultValue=""
              >
                <option value="">Saved Filters</option>
                {savedFilters.map((filter, index) => (
                  <option key={index} value={index}>
                    {filter.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Advanced Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2 rounded-lg border transition-all flex items-center space-x-2 ${
              showAdvanced 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Advanced</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px]">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* Reset Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status || 'all'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* Depot Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Depot</label>
                  <select
                    value={filters.depotId || 'all'}
                    onChange={(e) => handleFilterChange('depotId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Depots</option>
                    {depots.map(depot => (
                      <option key={depot._id} value={depot._id}>{depot.name}</option>
                    ))}
                  </select>
                </div>

                {/* Bus Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type</label>
                  <select
                    value={filters.busType || 'all'}
                    onChange={(e) => handleFilterChange('busType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="ac_sleeper">AC Sleeper</option>
                    <option value="ac_seater">AC Seater</option>
                    <option value="non_ac_sleeper">Non-AC Sleeper</option>
                    <option value="non_ac_seater">Non-AC Seater</option>
                    <option value="volvo">Volvo</option>
                    <option value="mini">Mini Bus</option>
                  </select>
                </div>

                {/* Fuel Level Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Level</label>
                  <select
                    value={filters.fuelLevel || 'all'}
                    onChange={(e) => handleFilterChange('fuelLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Levels</option>
                    <option value="high">High (80%+)</option>
                    <option value="medium">Medium (40-79%)</option>
                    <option value="low">Low (20-39%)</option>
                    <option value="critical">Critical (&lt;20%)</option>
                  </select>
                </div>

                {/* Performance Score Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Performance</label>
                  <select
                    value={filters.performanceScore || 'all'}
                    onChange={(e) => handleFilterChange('performanceScore', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Scores</option>
                    <option value="excellent">Excellent (90%+)</option>
                    <option value="good">Good (70-89%)</option>
                    <option value="average">Average (50-69%)</option>
                    <option value="poor">Poor (&lt;50%)</option>
                  </select>
                </div>

                {/* Maintenance Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance</label>
                  <select
                    value={filters.maintenanceStatus || 'all'}
                    onChange={(e) => handleFilterChange('maintenanceStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="overdue">Overdue</option>
                    <option value="due_soon">Due Soon (7 days)</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="up_to_date">Up to Date</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Added</label>
                  <select
                    value={filters.dateRange || 'all'}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                  </select>
                </div>

                {/* Capacity Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                  <select
                    value={filters.capacityRange || 'all'}
                    onChange={(e) => handleFilterChange('capacityRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Sizes</option>
                    <option value="small">Small (1-20)</option>
                    <option value="medium">Medium (21-40)</option>
                    <option value="large">Large (41-60)</option>
                    <option value="extra_large">Extra Large (60+)</option>
                  </select>
                </div>
              </div>

              {/* Save Filter Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {activeFiltersCount > 0 && `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied`}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    disabled={activeFiltersCount === 0}
                    className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Filter</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Filter Modal */}
      <AnimatePresence>
        {showSaveModal && (
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Filter Preset</h3>
              <input
                type="text"
                placeholder="Enter filter name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCurrentFilter}
                  disabled={!filterName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Filter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedFilters;
