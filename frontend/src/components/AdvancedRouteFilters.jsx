import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Clock, 
  DollarSign, 
  Bus,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useRouteStore } from '../stores/routeStore';

const AdvancedRouteFilters = ({ onFiltersChange, isOpen, onToggle }) => {
  const { filters, setFilters } = useRouteStore();
  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    location: false,
    pricing: false,
    schedule: false,
    features: false,
    performance: false
  });

  // Update local filters when store filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [localFilters, setFilters, onFiltersChange]);

  const handleRangeChange = useCallback((key, min, max) => {
    const newFilters = { 
      ...localFilters, 
      [`${key}Min`]: min, 
      [`${key}Max`]: max 
    };
    setLocalFilters(newFilters);
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [localFilters, setFilters, onFiltersChange]);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    const clearedFilters = {
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
    };
    setLocalFilters(clearedFilters);
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  }, [setFilters, onFiltersChange]);

  const FilterSection = ({ title, icon: Icon, section, children }) => (
    <div className="filter-section">
      <button
        className="filter-section-header"
        onClick={() => toggleSection(section)}
      >
        <div className="section-title">
          <Icon size={18} />
          <span>{title}</span>
        </div>
        {expandedSections[section] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <AnimatePresence>
        {expandedSections[section] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="filter-section-content"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const RangeInput = ({ label, min, max, minValue, maxValue, unit, onChange }) => (
    <div className="range-input-group">
      <label>{label}</label>
      <div className="range-inputs">
        <input
          type="number"
          placeholder={`Min ${unit}`}
          value={minValue || ''}
          onChange={(e) => onChange(min, e.target.value ? Number(e.target.value) : null)}
          min={min}
          max={max}
        />
        <span className="range-separator">to</span>
        <input
          type="number"
          placeholder={`Max ${unit}`}
          value={maxValue || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null, max)}
          min={min}
          max={max}
        />
      </div>
    </div>
  );

  const MultiSelect = ({ label, options, selected, onChange, icon: Icon }) => (
    <div className="multi-select-group">
      <label>
        {Icon && <Icon size={16} />}
        {label}
      </label>
      <div className="multi-select-options">
        {options.map((option) => (
          <button
            key={option.value}
            className={`multi-select-option ${selected.includes(option.value) ? 'selected' : ''}`}
            onClick={() => {
              const newSelected = selected.includes(option.value)
                ? selected.filter(item => item !== option.value)
                : [...selected, option.value];
              onChange(newSelected);
            }}
          >
            {option.icon && <option.icon size={14} />}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="advanced-filters-panel"
    >
      <div className="filters-header">
        <h3>Advanced Filters</h3>
        <button onClick={onToggle} className="close-filters-btn">
          <X size={20} />
        </button>
      </div>

      <div className="filters-content">
        {/* Basic Filters */}
        <FilterSection title="Basic Filters" icon={Filter} section="basic">
          <div className="filter-group">
            <label>Search Routes</label>
            <div className="search-input-container">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by route number, name, cities..."
                value={localFilters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              {localFilters.search && (
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="clear-search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Status</label>
              <select
                value={localFilters.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Route Type</label>
              <select
                value={localFilters.type || 'all'}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="deluxe">Deluxe</option>
                <option value="semi-deluxe">Semi-Deluxe</option>
                <option value="ordinary">Ordinary</option>
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Category</label>
              <select
                value={localFilters.category || 'all'}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="intercity">Intercity</option>
                <option value="local">Local</option>
                <option value="express">Express</option>
                <option value="premium">Premium</option>
                <option value="tourist">Tourist</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Region</label>
              <select
                value={localFilters.region || 'all'}
                onChange={(e) => handleFilterChange('region', e.target.value)}
              >
                <option value="all">All Regions</option>
                <option value="north">North Kerala</option>
                <option value="central">Central Kerala</option>
                <option value="south">South Kerala</option>
                <option value="interstate">Interstate</option>
              </select>
            </div>
          </div>
        </FilterSection>

        {/* Location Filters */}
        <FilterSection title="Location & Distance" icon={MapPin} section="location">
          <RangeInput
            label="Distance Range"
            min={0}
            max={1000}
            minValue={localFilters.distanceMin}
            maxValue={localFilters.distanceMax}
            unit="km"
            onChange={(min, max) => handleRangeChange('distance', min, max)}
          />

          <div className="filter-group">
            <label>Starting Point</label>
            <input
              type="text"
              placeholder="Filter by starting city..."
              value={localFilters.startingPoint || ''}
              onChange={(e) => handleFilterChange('startingPoint', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Ending Point</label>
            <input
              type="text"
              placeholder="Filter by ending city..."
              value={localFilters.endingPoint || ''}
              onChange={(e) => handleFilterChange('endingPoint', e.target.value)}
            />
          </div>
        </FilterSection>

        {/* Pricing Filters */}
        <FilterSection title="Pricing & Duration" icon={DollarSign} section="pricing">
          <RangeInput
            label="Fare Range"
            min={0}
            max={10000}
            minValue={localFilters.fareMin}
            maxValue={localFilters.fareMax}
            unit="₹"
            onChange={(min, max) => handleRangeChange('fare', min, max)}
          />

          <RangeInput
            label="Duration Range"
            min={0}
            max={1440}
            minValue={localFilters.durationMin}
            maxValue={localFilters.durationMax}
            unit="minutes"
            onChange={(min, max) => handleRangeChange('duration', min, max)}
          />

          <div className="filter-group">
            <label>Fare Category</label>
            <select
              value={localFilters.fareCategory || 'all'}
              onChange={(e) => handleFilterChange('fareCategory', e.target.value)}
            >
              <option value="all">All Fare Categories</option>
              <option value="budget">Budget (₹0-100)</option>
              <option value="standard">Standard (₹100-300)</option>
              <option value="premium">Premium (₹300-500)</option>
              <option value="luxury">Luxury (₹500+)</option>
            </select>
          </div>
        </FilterSection>

        {/* Features Filters */}
        <FilterSection title="Features & Amenities" icon={Star} section="features">
          <MultiSelect
            label="Route Features"
            icon={Star}
            options={[
              { value: 'ac', label: 'Air Conditioning', icon: CheckCircle },
              { value: 'entertainment', label: 'Entertainment', icon: CheckCircle },
              { value: 'wifi', label: 'WiFi', icon: CheckCircle },
              { value: 'charging', label: 'Charging Points', icon: CheckCircle },
              { value: 'refreshments', label: 'Refreshments', icon: CheckCircle },
              { value: 'luggage', label: 'Luggage Space', icon: CheckCircle },
            ]}
            selected={localFilters.features || []}
            onChange={(features) => handleFilterChange('features', features)}
          />
        </FilterSection>

        {/* Performance Filters */}
        <FilterSection title="Performance & Analytics" icon={TrendingUp} section="performance">
          <div className="filter-group">
            <label>Performance Rating</label>
            <select
              value={localFilters.performance || 'all'}
              onChange={(e) => handleFilterChange('performance', e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="excellent">Excellent (4.5+)</option>
              <option value="good">Good (4.0-4.5)</option>
              <option value="average">Average (3.0-4.0)</option>
              <option value="poor">Poor (Below 3.0)</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Booking Status</label>
            <select
              value={localFilters.bookingStatus || 'all'}
              onChange={(e) => handleFilterChange('bookingStatus', e.target.value)}
            >
              <option value="all">All Booking Status</option>
              <option value="available">Available</option>
              <option value="limited">Limited Seats</option>
              <option value="full">Fully Booked</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Last Updated</label>
            <select
              value={localFilters.lastUpdated || 'all'}
              onChange={(e) => handleFilterChange('lastUpdated', e.target.value)}
            >
              <option value="all">Any Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </FilterSection>

        {/* Sort Options */}
        <FilterSection title="Sorting Options" icon={TrendingUp} section="schedule">
          <div className="filter-row">
            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={localFilters.sortField || 'routeNumber'}
                onChange={(e) => handleFilterChange('sortField', e.target.value)}
              >
                <option value="routeNumber">Route Number</option>
                <option value="routeName">Route Name</option>
                <option value="startingPoint">Starting Point</option>
                <option value="endingPoint">Ending Point</option>
                <option value="distance">Distance</option>
                <option value="duration">Duration</option>
                <option value="baseFare">Base Fare</option>
                <option value="status">Status</option>
                <option value="createdAt">Created Date</option>
                <option value="updatedAt">Updated Date</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Order</label>
              <select
                value={localFilters.sortDirection || 'asc'}
                onChange={(e) => handleFilterChange('sortDirection', e.target.value)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </FilterSection>
      </div>

      <div className="filters-footer">
        <button onClick={clearAllFilters} className="clear-all-btn">
          <X size={16} />
          Clear All Filters
        </button>
        <div className="active-filters-count">
          {Object.values(localFilters).filter(value => 
            value && value !== 'all' && value !== 'asc' && value !== 'routeNumber'
          ).length} filters active
        </div>
      </div>
    </motion.div>
  );
};

export default AdvancedRouteFilters;
