/**
 * YATRIK Quick Help - Cache Manager
 * In-memory cache for instant responses
 * All data is preloaded at login
 */

class QuickHelpCache {
  constructor() {
    this.cache = {
      todayBuses: [],
      routes: [],
      userRole: null,
      activeTrips: [],
      userLocation: null,
      busLocations: new Map(), // Map of busId -> location
      lastUpdated: null,
    };
    
    // Initialize from localStorage on creation
    this.loadFromStorage();
  }

  /**
   * Preload data at login
   * This should be called once when user logs in
   */
  async preloadData(userRole, apiFetch) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Preload in parallel for speed
      // Use role-based endpoints
      const tripsEndpoint = userRole === 'depot_manager' || userRole === 'depot_supervisor' 
        ? `/api/depot/trips?date=${today}` 
        : `/api/admin/trips?date=${today}`;
      const routesEndpoint = userRole === 'depot_manager' || userRole === 'depot_supervisor'
        ? '/api/depot/routes'
        : '/api/admin/routes';
      
      const [busesResponse, routesResponse] = await Promise.all([
        apiFetch(tripsEndpoint).catch(() => ({ data: { trips: [] } })),
        apiFetch(routesEndpoint).catch(() => ({ data: { routes: [] } })),
      ]);

      // Extract data from response structure
      this.cache.todayBuses = busesResponse.data?.trips || busesResponse.data?.data?.trips || busesResponse.data || [];
      this.cache.routes = routesResponse.data?.routes || routesResponse.data?.data?.routes || routesResponse.data || [];
      this.cache.userRole = userRole;
      this.cache.lastUpdated = Date.now();

      // Save to localStorage for persistence
      this.saveToStorage();
      
      console.log('[QuickHelp] Data preloaded:', {
        buses: this.cache.todayBuses.length,
        routes: this.cache.routes.length,
        role: userRole
      });
    } catch (error) {
      console.warn('[QuickHelp] Preload error (non-critical):', error);
      // Continue with cached data if preload fails
    }
  }

  /**
   * Get today's buses
   */
  getTodayBuses() {
    return this.cache.todayBuses || [];
  }

  /**
   * Get routes
   */
  getRoutes() {
    return this.cache.routes || [];
  }

  /**
   * Get user role
   */
  getUserRole() {
    return this.cache.userRole;
  }

  /**
   * Set user location (cached from browser geolocation)
   */
  setUserLocation(lat, lng) {
    this.cache.userLocation = { lat, lng, timestamp: Date.now() };
    this.saveToStorage();
  }

  /**
   * Get cached user location
   */
  getUserLocation() {
    // Location expires after 5 minutes
    if (this.cache.userLocation && Date.now() - this.cache.userLocation.timestamp < 5 * 60 * 1000) {
      return this.cache.userLocation;
    }
    return null;
  }

  /**
   * Update bus location (for live tracking)
   */
  updateBusLocation(busId, location) {
    this.cache.busLocations.set(busId, {
      ...location,
      timestamp: Date.now()
    });
  }

  /**
   * Get bus location
   */
  getBusLocation(busId) {
    const location = this.cache.busLocations.get(busId);
    if (location && Date.now() - location.timestamp < 30 * 1000) {
      return location;
    }
    return null;
  }

  /**
   * Save to localStorage
   */
  saveToStorage() {
    try {
      const dataToSave = {
        todayBuses: this.cache.todayBuses,
        routes: this.cache.routes,
        userRole: this.cache.userRole,
        userLocation: this.cache.userLocation,
        lastUpdated: this.cache.lastUpdated,
      };
      localStorage.setItem('yatrikQuickHelpCache', JSON.stringify(dataToSave));
    } catch (error) {
      // localStorage might be full, ignore silently
    }
  }

  /**
   * Load from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('yatrikQuickHelpCache');
      if (stored) {
        const data = JSON.parse(stored);
        // Only use if less than 1 hour old
        if (data.lastUpdated && Date.now() - data.lastUpdated < 60 * 60 * 1000) {
          this.cache.todayBuses = data.todayBuses || [];
          this.cache.routes = data.routes || [];
          this.cache.userRole = data.userRole;
          this.cache.userLocation = data.userLocation;
          this.cache.lastUpdated = data.lastUpdated;
        }
      }
    } catch (error) {
      // Ignore parse errors
    }
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache = {
      todayBuses: [],
      routes: [],
      userRole: null,
      activeTrips: [],
      userLocation: null,
      busLocations: new Map(),
      lastUpdated: null,
    };
    localStorage.removeItem('yatrikQuickHelpCache');
  }
}

// Export singleton instance
export default new QuickHelpCache();
