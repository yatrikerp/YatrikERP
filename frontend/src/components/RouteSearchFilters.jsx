import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'react-use';
import { Search, Filter, X, RefreshCw, Download, Upload, Grid3X3, List } from 'lucide-react';
import { useRouteStore } from '../stores/routeStore';
import { motion, AnimatePresence } from 'framer-motion';

const RouteSearchFilters = ({ onExport, onImport, viewMode, onViewModeChange }) => {
  const { filters, setFilters, setLoading } = useRouteStore();
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Debounced search
  useDebounce(
    () => {
      setFilters({ search: localSearch });
    },
    300,
    [localSearch]
  );

  const handleSearchChange = useCallback((e) => {
    setLocalSearch(e.target.value);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters({ [key]: value });
  }, [setFilters]);

  const handleSort = useCallback((field) => {
    const newDirection = 
      filters.sortField === field && filters.sortDirection === 'asc' ? 'desc' : 'asc';
    setFilters({ sortField: field, sortDirection: newDirection });
  }, [filters.sortField, filters.sortDirection, setFilters]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      sortField: 'routeNumber',
      sortDirection: 'asc',
    });
    setLocalSearch('');
  }, [setFilters]);

  const refreshData = useCallback(() => {
    setLoading(true);
    // This will trigger a refetch in the parent component
    window.dispatchEvent(new CustomEvent('refreshRoutes'));
  }, [setLoading]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="search-filters-container"
    >
      {/* Main Search Bar */}
      <div className="search-bar">
        <div className="search-input-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search routes, numbers, cities..."
            value={localSearch}
            onChange={handleSearchChange}
            className="search-input"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="clear-search-btn"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="search-actions">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`filter-toggle-btn ${showAdvancedFilters ? 'active' : ''}`}
          >
            <Filter size={18} />
            Filters
          </button>

          <button onClick={refreshData} className="refresh-btn">
            <RefreshCw size={18} />
          </button>

          <div className="view-mode-toggle">
            <button
              onClick={() => onViewModeChange('table')}
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            >
              <Grid3X3 size={18} />
            </button>
          </div>

          <div className="export-import-buttons">
            <button onClick={onExport} className="export-btn">
              <Download size={18} />
              Export
            </button>
            <label className="import-btn">
              <Upload size={18} />
              Import
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={onImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="advanced-filters"
          >
            <div className="filter-row">
              <div className="filter-group">
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Types</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="semi-deluxe">Semi-Deluxe</option>
                  <option value="ordinary">Ordinary</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Sort By</label>
                <select
                  value={filters.sortField}
                  onChange={(e) => handleFilterChange('sortField', e.target.value)}
                  className="filter-select"
                >
                  <option value="routeNumber">Route Number</option>
                  <option value="routeName">Route Name</option>
                  <option value="startingPoint">Starting Point</option>
                  <option value="endingPoint">Ending Point</option>
                  <option value="distance">Distance</option>
                  <option value="baseFare">Base Fare</option>
                  <option value="status">Status</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Order</label>
                <select
                  value={filters.sortDirection}
                  onChange={(e) => handleFilterChange('sortDirection', e.target.value)}
                  className="filter-select"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>

              <button onClick={clearFilters} className="clear-filters-btn">
                <X size={16} />
                Clear All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RouteSearchFilters;
