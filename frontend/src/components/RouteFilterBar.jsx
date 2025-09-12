import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  RefreshCw, 
  Download, 
  Upload, 
  Grid3X3, 
  List,
  Settings,
  ChevronDown,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useRouteStore } from '../stores/routeStore';
import AdvancedRouteFilters from './AdvancedRouteFilters';
import RouteCategorization from './RouteCategorization';

const RouteFilterBar = ({ 
  onExport, 
  onImport, 
  viewMode, 
  onViewModeChange,
  onRefresh,
  showCategorization = false,
  onToggleCategorization
}) => {
  const { filters, setFilters, getFilteredRoutes, getPaginatedRoutes } = useRouteStore();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [quickFilters, setQuickFilters] = useState({
    status: filters.status || 'all',
    type: filters.type || 'all',
    category: filters.category || 'all'
  });

  const filteredRoutes = getFilteredRoutes();
  const paginatedData = getPaginatedRoutes();

  const handleSearchChange = useCallback((e) => {
    setSearchValue(e.target.value);
    // Debounced search will be handled by the store
  }, []);

  const handleQuickFilterChange = useCallback((key, value) => {
    const newQuickFilters = { ...quickFilters, [key]: value };
    setQuickFilters(newQuickFilters);
    setFilters({ ...filters, ...newQuickFilters });
  }, [quickFilters, filters, setFilters]);

  const handleSort = useCallback((field) => {
    const newDirection = filters.sortField === field && filters.sortDirection === 'asc' ? 'desc' : 'asc';
    setFilters({ sortField: field, sortDirection: newDirection });
  }, [filters.sortField, filters.sortDirection, setFilters]);

  const clearAllFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      category: 'all',
      region: 'all',
      distanceMin: 0,
      distanceMax: 1000,
      durationMin: 0,
      durationMax: 1440,
      fareMin: 0,
      fareMax: 10000,
      features: [],
      performance: 'all',
      sortField: 'routeNumber',
      sortDirection: 'asc',
    });
    setSearchValue('');
    setQuickFilters({
      status: 'all',
      type: 'all',
      category: 'all'
    });
  }, [setFilters]);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'sortField' || key === 'sortDirection') return false;
      if (key === 'search') return value && value.trim() !== '';
      if (Array.isArray(value)) return value.length > 0;
      return value && value !== 'all' && value !== 0;
    }).length;
  }, [filters]);

  const QuickFilterChip = ({ label, value, options, onChange, icon: Icon }) => (
    <div className="quick-filter-chip">
      <label>
        {Icon && <Icon size={14} />}
        {label}:
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="chip-select"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const SortButton = ({ field, label, isActive, direction }) => (
    <button
      className={`sort-btn ${isActive ? 'active' : ''}`}
      onClick={() => handleSort(field)}
    >
      {label}
      {isActive && (
        direction === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
      )}
    </button>
  );

  return (
    <div className="route-filter-bar">
      {/* Main Search and Controls */}
      <div className="filter-bar-main">
        <div className="search-section">
          <div className="search-input-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search routes, numbers, cities, features..."
              value={searchValue}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchValue && (
              <button
                onClick={() => {
                  setSearchValue('');
                  setFilters({ search: '' });
                }}
                className="clear-search-btn"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="controls-section">
          {/* Quick Filters */}
          <div className="quick-filters">
            <QuickFilterChip
              label="Status"
              value={quickFilters.status}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'maintenance', label: 'Maintenance' }
              ]}
              onChange={(value) => handleQuickFilterChange('status', value)}
            />

            <QuickFilterChip
              label="Type"
              value={quickFilters.type}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'deluxe', label: 'Deluxe' },
                { value: 'semi-deluxe', label: 'Semi-Deluxe' },
                { value: 'ordinary', label: 'Ordinary' }
              ]}
              onChange={(value) => handleQuickFilterChange('type', value)}
            />

            <QuickFilterChip
              label="Category"
              value={quickFilters.category}
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'intercity', label: 'Intercity' },
                { value: 'local', label: 'Local' },
                { value: 'express', label: 'Express' },
                { value: 'premium', label: 'Premium' },
                { value: 'tourist', label: 'Tourist' }
              ]}
              onChange={(value) => handleQuickFilterChange('category', value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            {false && (
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`filter-btn ${showAdvancedFilters ? 'active' : ''}`}
              >
                <Filter size={18} />
                Advanced
                {activeFiltersCount > 0 && (
                  <span className="filter-count">{activeFiltersCount}</span>
                )}
              </button>
            )}

            <button onClick={onRefresh} className="refresh-btn">
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

            {false && (
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
            )}

            {false && showCategorization !== undefined && (
              <button
                onClick={onToggleCategorization}
                className={`categorization-btn ${showCategorization ? 'active' : ''}`}
              >
                <Settings size={18} />
                Categorize
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="sort-section">
        <div className="sort-label">Sort by:</div>
        <div className="sort-buttons">
          <SortButton
            field="routeNumber"
            label="Route Number"
            isActive={filters.sortField === 'routeNumber'}
            direction={filters.sortDirection}
          />
          <SortButton
            field="routeName"
            label="Route Name"
            isActive={filters.sortField === 'routeName'}
            direction={filters.sortDirection}
          />
          <SortButton
            field="distance"
            label="Distance"
            isActive={filters.sortField === 'distance'}
            direction={filters.sortDirection}
          />
          <SortButton
            field="baseFare"
            label="Fare"
            isActive={filters.sortField === 'baseFare'}
            direction={filters.sortDirection}
          />
          <SortButton
            field="status"
            label="Status"
            isActive={filters.sortField === 'status'}
            direction={filters.sortDirection}
          />
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <div className="results-info">
          <span className="results-count">
            Showing {paginatedData.routes.length} of {filteredRoutes.length} routes
          </span>
          {filteredRoutes.length !== paginatedData.totalItems && (
            <span className="filtered-info">
              (filtered from {paginatedData.totalItems} total)
            </span>
          )}
        </div>
        
        {activeFiltersCount > 0 && (
          <button onClick={clearAllFilters} className="clear-filters-btn">
            <X size={14} />
            Clear all filters
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <AdvancedRouteFilters
            onFiltersChange={(newFilters) => setFilters(newFilters)}
            isOpen={showAdvancedFilters}
            onToggle={() => setShowAdvancedFilters(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RouteFilterBar;
