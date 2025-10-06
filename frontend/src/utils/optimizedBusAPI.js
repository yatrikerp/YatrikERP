// Optimized Bus API Utility for Lightning Fast Performance
class OptimizedBusAPI {
  constructor() {
    this.baseURL = '/api/admin/buses-optimized';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached data or fetch fresh data
  async getCachedData(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return { ...cached.data, cached: true };
    }

    const freshData = await fetchFunction();
    this.cache.set(key, {
      data: freshData,
      timestamp: Date.now()
    });

    return { ...freshData, cached: false };
  }

  // Get bus statistics (super fast with caching)
  async getStats() {
    return this.getCachedData('stats', async () => {
      const response = await fetch(`${this.baseURL}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bus statistics');
      }
      
      const result = await response.json();
      return result.data;
    });
  }

  // Get buses with pagination (optimized)
  async getBuses(page = 1, limit = 20, filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });

    const response = await fetch(`${this.baseURL}/list?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch buses');
    }

    return await response.json();
  }

  // Get single bus details (optimized)
  async getBus(id) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bus details');
    }

    return await response.json();
  }

  // Get buses by depot (optimized)
  async getBusesByDepot(depotId, filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseURL}/depot/${depotId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch depot buses');
    }

    return await response.json();
  }

  // Search buses (optimized)
  async searchBuses(query, limit = 10) {
    const response = await fetch(`${this.baseURL}/search/${encodeURIComponent(query)}?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to search buses');
    }

    return await response.json();
  }

  // Get bus types (cached)
  async getBusTypes() {
    return this.getCachedData('busTypes', async () => {
      const response = await fetch(`${this.baseURL}/types/list`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bus types');
      }

      const result = await response.json();
      return result.data;
    });
  }

  // Update bus status (optimized)
  async updateBusStatus(busId, status) {
    const response = await fetch(`${this.baseURL}/${busId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update bus status');
    }

    // Clear cache after update
    this.cache.delete('stats');

    return await response.json();
  }

  // Clear all cache
  clearCache() {
    this.cache.clear();
  }

  // Preload critical data for instant loading
  async preloadData() {
    try {
      // Preload stats and bus types in parallel
      await Promise.all([
        this.getStats(),
        this.getBusTypes()
      ]);
      console.log('🚀 Bus data preloaded for instant access');
    } catch (error) {
      console.error('Failed to preload data:', error);
    }
  }
}

// Create singleton instance
const optimizedBusAPI = new OptimizedBusAPI();

// Auto-preload data when module loads
if (typeof window !== 'undefined' && localStorage.getItem('token')) {
  optimizedBusAPI.preloadData();
}

export default optimizedBusAPI;
