import React, { useState, useEffect, useMemo, useCallback } from 'react';
import optimizedBusAPI from '../utils/optimizedBusAPI';

const OptimizedBusManagement = () => {
  const [stats, setStats] = useState(null);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepot, setSelectedDepot] = useState('');

  // Memoized filter options
  const filterOptions = useMemo(() => ({
    status: ['active', 'maintenance', 'assigned', 'idle'],
    busTypes: []
  }), []);

  // Load stats (cached)
  const loadStats = useCallback(async () => {
    try {
      const statsData = await optimizedBusAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  // Load buses with pagination
  const loadBuses = useCallback(async (pageNum = page, newFilters = filters) => {
    setLoading(true);
    try {
      const result = await optimizedBusAPI.getBuses(pageNum, 20, newFilters);
      setBuses(result.data.buses);
      setPagination(result.data.pagination);
    } catch (error) {
      console.error('Failed to load buses:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  // Load bus types
  const loadBusTypes = useCallback(async () => {
    try {
      const types = await optimizedBusAPI.getBusTypes();
      filterOptions.busTypes = types;
    } catch (error) {
      console.error('Failed to load bus types:', error);
    }
  }, [filterOptions.busTypes]);

  // Search buses
  const searchBuses = useCallback(async (query) => {
    if (!query.trim()) {
      loadBuses();
      return;
    }

    setLoading(true);
    try {
      const result = await optimizedBusAPI.searchBuses(query, 20);
      setBuses(result.data);
      setPagination({ page: 1, total: result.count, pages: 1 });
    } catch (error) {
      console.error('Failed to search buses:', error);
    } finally {
      setLoading(false);
    }
  }, [loadBuses]);

  // Update bus status
  const updateBusStatus = useCallback(async (busId, newStatus) => {
    try {
      await optimizedBusAPI.updateBusStatus(busId, newStatus);
      // Reload current page
      loadBuses();
      // Clear search if active
      if (searchQuery) {
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Failed to update bus status:', error);
    }
  }, [loadBuses, searchQuery]);

  // Debounced search
  const debouncedSearch = useMemo(() => {
    let timeoutId;
    return (query) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => searchBuses(query), 300);
    };
  }, [searchBuses]);

  // Handle search input
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPage(1);
    loadBuses(1, newFilters);
  };

  // Handle depot filter
  const handleDepotChange = (depotId) => {
    setSelectedDepot(depotId);
    if (depotId) {
      handleFilterChange('depotId', depotId);
    } else {
      const newFilters = { ...filters };
      delete newFilters.depotId;
      setFilters(newFilters);
      loadBuses(1, newFilters);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    loadBuses(newPage);
  };

  // Initial load
  useEffect(() => {
    loadStats();
    loadBusTypes();
    loadBuses();
  }, []);

  // Performance optimizations
  const BusCard = React.memo(({ bus }) => (
    <div className="bus-card" key={bus._id}>
      <div className="bus-header">
        <h3>{bus.busNumber}</h3>
        <span className={`status status-${bus.status}`}>{bus.status}</span>
      </div>
      <div className="bus-details">
        <p><strong>Registration:</strong> {bus.registrationNumber}</p>
        <p><strong>Type:</strong> {bus.busType}</p>
        <p><strong>Capacity:</strong> {bus.capacity.total} seats</p>
        <p><strong>Depot:</strong> {bus.depotId?.depotName}</p>
      </div>
      <div className="bus-actions">
        <select 
          value={bus.status}
          onChange={(e) => updateBusStatus(bus._id, e.target.value)}
          className="status-select"
        >
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="assigned">Assigned</option>
          <option value="idle">Idle</option>
        </select>
      </div>
    </div>
  ));

  if (!stats) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading bus management...</p>
      </div>
    );
  }

  return (
    <div className="optimized-bus-management">
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Buses</h3>
          <p className="stat-number">{stats.total.totalBuses}</p>
        </div>
        <div className="stat-card">
          <h3>Active</h3>
          <p className="stat-number">{stats.total.activeBuses}</p>
        </div>
        <div className="stat-card">
          <h3>Maintenance</h3>
          <p className="stat-number">{stats.total.maintenanceBuses}</p>
        </div>
        <div className="stat-card">
          <h3>Assigned</h3>
          <p className="stat-number">{stats.total.assignedBuses}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search buses..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            {filterOptions.status.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={filters.busType || ''}
            onChange={(e) => handleFilterChange('busType', e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            {filterOptions.busTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Buses Grid */}
      <div className="buses-grid">
        {loading ? (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          buses.map(bus => <BusCard key={bus._id} bus={bus} />)
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={!pagination.hasPrev}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={!pagination.hasNext}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OptimizedBusManagement;
