const RouteGraph = require('../models/RouteGraph');
const RouteStop = require('../models/RouteStop');
const Stop = require('../models/Stop');

class PathfindingService {
  constructor() {
    // Disable in-memory cache to ensure live results
    this.cache = { has: () => false, get: () => null, set: () => {}, delete: () => {}, clear: () => {}, size: 0, keys: () => [] };
    this.cacheTimeout = 0;
  }

  /**
   * Find fastest route between two stops
   * @param {string} originStopId - Origin stop ID
   * @param {string} destinationStopId - Destination stop ID
   * @param {string} timeOfDay - Time of day in HH:MM format
   * @param {Object} options - Additional options
   */
  async findFastestRoute(originStopId, destinationStopId, timeOfDay = null, options = {}) {
    try {
      const cacheKey = `fastest_${originStopId}_${destinationStopId}_${timeOfDay || 'any'}`;
      
      // Skip cache for live-only mode

      // Get latest route graph
      const graph = await RouteGraph.getLatest();
      if (!graph) {
        throw new Error('No route graph available. Please build the graph first.');
      }

      // Validate stop IDs
      const [originStop, destinationStop] = await Promise.all([
        Stop.findById(originStopId),
        Stop.findById(destinationStopId)
      ]);

      if (!originStop || !destinationStop) {
        throw new Error('Invalid origin or destination stop ID');
      }

      // Find shortest path
      const result = graph.findShortestPath(originStopId, destinationStopId, 'duration');

      // Enhance result with additional information
      const enhancedResult = await this.enhanceRouteResult(result, timeOfDay, options);

      // Do not cache to keep results live

      return enhancedResult;
    } catch (error) {
      console.error('Error finding fastest route:', error);
      throw error;
    }
  }

  /**
   * Find multiple route options between two stops
   * @param {string} originStopId - Origin stop ID
   * @param {string} destinationStopId - Destination stop ID
   * @param {string} timeOfDay - Time of day in HH:MM format
   * @param {Object} options - Additional options
   */
  async findRouteOptions(originStopId, destinationStopId, timeOfDay = null, options = {}) {
    try {
      const cacheKey = `options_${originStopId}_${destinationStopId}_${timeOfDay || 'any'}_${JSON.stringify(options)}`;
      
      // Skip cache for live-only mode

      // Get latest route graph
      const graph = await RouteGraph.getLatest();
      if (!graph) {
        throw new Error('No route graph available. Please build the graph first.');
      }

      // Find multiple route options
      const options = graph.findRouteOptions(originStopId, destinationStopId, options.maxOptions || 5);

      // Enhance each option
      const enhancedOptions = await Promise.all(
        options.map(option => this.enhanceRouteResult(option, timeOfDay, options))
      );

      // Sort by preference
      const sortedOptions = this.sortRouteOptions(enhancedOptions, options.preference || 'duration');

      // Do not cache to keep results live

      return sortedOptions;
    } catch (error) {
      console.error('Error finding route options:', error);
      throw error;
    }
  }

  /**
   * Find cheapest route between two stops
   * @param {string} originStopId - Origin stop ID
   * @param {string} destinationStopId - Destination stop ID
   * @param {Object} options - Additional options
   */
  async findCheapestRoute(originStopId, destinationStopId, options = {}) {
    try {
      const cacheKey = `cheapest_${originStopId}_${destinationStopId}`;
      
      // Skip cache for live-only mode

      // Get latest route graph
      const graph = await RouteGraph.getLatest();
      if (!graph) {
        throw new Error('No route graph available. Please build the graph first.');
      }

      // Find cheapest path
      const result = graph.findShortestPath(originStopId, destinationStopId, 'fare');

      // Enhance result
      const enhancedResult = await this.enhanceRouteResult(result, null, options);

      // Do not cache to keep results live

      return enhancedResult;
    } catch (error) {
      console.error('Error finding cheapest route:', error);
      throw error;
    }
  }

  /**
   * Find routes with least transfers
   * @param {string} originStopId - Origin stop ID
   * @param {string} destinationStopId - Destination stop ID
   * @param {Object} options - Additional options
   */
  async findLeastTransfersRoute(originStopId, destinationStopId, options = {}) {
    try {
      const cacheKey = `least_transfers_${originStopId}_${destinationStopId}`;
      
      // Skip cache for live-only mode

      // Get latest route graph
      const graph = await RouteGraph.getLatest();
      if (!graph) {
        throw new Error('No route graph available. Please build the graph first.');
      }

      // Find path with least transfers
      const result = graph.findShortestPath(originStopId, destinationStopId, 'duration');
      
      // Calculate transfer count
      let transferCount = 0;
      for (let i = 1; i < result.routes.length; i++) {
        if (result.routes[i].routeId.toString() !== result.routes[i-1].routeId.toString()) {
          transferCount++;
        }
      }

      // Enhance result
      const enhancedResult = await this.enhanceRouteResult(result, null, options);
      enhancedResult.transferCount = transferCount;

      // Cache result
      this.cache.set(cacheKey, {
        data: enhancedResult,
        timestamp: Date.now()
      });

      return enhancedResult;
    } catch (error) {
      console.error('Error finding least transfers route:', error);
      throw error;
    }
  }

  /**
   * Find routes by proximity to coordinates
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} radius - Search radius in kilometers
   */
  async findNearbyStops(latitude, longitude, radius = 1) {
    try {
      const cacheKey = `nearby_${latitude}_${longitude}_${radius}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
        this.cache.delete(cacheKey);
      }

      // Find stops within radius
      const nearbyStops = await RouteStop.findWithinRadius(latitude, longitude, radius);
      
      // Enhance with distance calculation
      const enhancedStops = nearbyStops.map(stop => {
        const distance = this.calculateDistance(
          latitude, longitude,
          stop.coordinates.latitude, stop.coordinates.longitude
        );
        
        return {
          ...stop,
          distance: distance
        };
      });

      // Sort by distance
      enhancedStops.sort((a, b) => a.distance - b.distance);

      // Do not cache to keep results live

      return enhancedStops;
    } catch (error) {
      console.error('Error finding nearby stops:', error);
      throw error;
    }
  }

  /**
   * Enhance route result with additional information
   * @param {Object} result - Basic route result
   * @param {string} timeOfDay - Time of day
   * @param {Object} options - Additional options
   */
  async enhanceRouteResult(result, timeOfDay, options = {}) {
    try {
      // Get stop details
      const stopIds = result.stops.map(stopId => stopId.toString());
      const stops = await Stop.find({ _id: { $in: stopIds } })
        .select('name code lat lon')
        .lean();

      // Create stop lookup
      const stopMap = new Map();
      stops.forEach(stop => {
        stopMap.set(stop._id.toString(), stop);
      });

      // Enhance stops with details
      const enhancedStops = result.stops.map(stopId => {
        const stop = stopMap.get(stopId.toString());
        return {
          stopId: stopId,
          name: stop?.name || 'Unknown Stop',
          code: stop?.code || 'UNKNOWN',
          coordinates: {
            latitude: stop?.lat || 0,
            longitude: stop?.lon || 0
          }
        };
      });

      // Calculate additional metrics
      const transferCount = this.calculateTransferCount(result.routes);
      const walkingDistance = this.calculateWalkingDistance(enhancedStops);
      const confidence = this.calculateRouteConfidence(result);

      // Apply time-based adjustments
      let adjustedDuration = result.totalDuration;
      let adjustedFare = result.totalFare;
      
      if (timeOfDay) {
        const timeAdjustments = this.getTimeBasedAdjustments(timeOfDay);
        adjustedDuration = Math.round(result.totalDuration * timeAdjustments.durationMultiplier);
        adjustedFare = Math.round(result.totalFare * timeAdjustments.fareMultiplier);
      }

      return {
        ...result,
        stops: enhancedStops,
        transferCount,
        walkingDistance,
        confidence,
        adjustedDuration,
        adjustedFare,
        timeOfDay,
        timestamp: new Date().toISOString(),
        routeSummary: this.generateRouteSummary(result.routes, enhancedStops),
        directions: this.generateDirections(result.routes, enhancedStops)
      };
    } catch (error) {
      console.error('Error enhancing route result:', error);
      return result; // Return basic result if enhancement fails
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Calculate number of transfers in route
   */
  calculateTransferCount(routes) {
    if (routes.length <= 1) return 0;
    
    let transfers = 0;
    for (let i = 1; i < routes.length; i++) {
      if (routes[i].routeId.toString() !== routes[i-1].routeId.toString()) {
        transfers++;
      }
    }
    return transfers;
  }

  /**
   * Calculate walking distance between stops
   */
  calculateWalkingDistance(stops) {
    let totalWalking = 0;
    for (let i = 1; i < stops.length; i++) {
      const distance = this.calculateDistance(
        stops[i-1].coordinates.latitude, stops[i-1].coordinates.longitude,
        stops[i].coordinates.latitude, stops[i].coordinates.longitude
      );
      totalWalking += distance;
    }
    return Math.round(totalWalking * 1000); // Convert to meters
  }

  /**
   * Calculate route confidence score
   */
  calculateRouteConfidence(result) {
    let confidence = 100;
    
    // Reduce confidence based on transfers
    confidence -= result.routes.length * 5;
    
    // Reduce confidence based on distance
    if (result.totalDistance > 100) {
      confidence -= 10;
    }
    
    // Reduce confidence if no direct route
    if (result.routes.length > 1) {
      confidence -= 15;
    }
    
    return Math.max(confidence, 0);
  }

  /**
   * Get time-based adjustments for duration and fare
   */
  getTimeBasedAdjustments(timeOfDay) {
    const hour = parseInt(timeOfDay.split(':')[0]);
    
    // Peak hours: 7-9 AM and 5-7 PM
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return {
        durationMultiplier: 1.3,
        fareMultiplier: 1.1
      };
    }
    
    // Off-peak hours: 10 PM - 5 AM
    if (hour >= 22 || hour <= 5) {
      return {
        durationMultiplier: 1.1,
        fareMultiplier: 0.9
      };
    }
    
    // Normal hours
    return {
      durationMultiplier: 1.0,
      fareMultiplier: 1.0
    };
  }

  /**
   * Sort route options by preference
   */
  sortRouteOptions(options, preference) {
    switch (preference) {
      case 'fare':
        return options.sort((a, b) => a.totalFare - b.totalFare);
      case 'transfers':
        return options.sort((a, b) => a.transferCount - b.transferCount);
      case 'distance':
        return options.sort((a, b) => a.totalDistance - b.totalDistance);
      default:
        return options.sort((a, b) => a.totalDuration - b.totalDuration);
    }
  }

  /**
   * Generate route summary
   */
  generateRouteSummary(routes, stops) {
    if (routes.length === 1) {
      return `Take ${routes[0].routeNumber} from ${stops[0].name} to ${stops[stops.length - 1].name}`;
    }
    
    const routeNumbers = [...new Set(routes.map(r => r.routeNumber))];
    return `Take ${routeNumbers.join(' → ')} with ${routes.length - 1} transfer(s)`;
  }

  /**
   * Generate step-by-step directions
   */
  generateDirections(routes, stops) {
    const directions = [];
    let currentRoute = null;
    let routeStart = 0;
    
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      
      if (!currentRoute || currentRoute.routeId.toString() !== route.routeId.toString()) {
        // New route or first route
        if (currentRoute) {
          // End previous route
          directions.push({
            type: 'alight',
            stop: stops[routeStart + 1],
            route: currentRoute.routeNumber,
            message: `Alight at ${stops[routeStart + 1].name}`
          });
        }
        
        // Start new route
        currentRoute = route;
        routeStart = i;
        directions.push({
          type: 'board',
          stop: stops[routeStart],
          route: route.routeNumber,
          message: `Board ${route.routeNumber} at ${stops[routeStart].name}`,
          duration: route.duration,
          fare: route.fare
        });
      } else {
        // Continue same route
        directions[directions.length - 1].duration += route.duration;
        directions[directions.length - 1].fare += route.fare;
      }
    }
    
    // Final alight instruction
    if (currentRoute) {
      directions.push({
        type: 'alight',
        stop: stops[stops.length - 1],
        route: currentRoute.routeNumber,
        message: `Alight at ${stops[stops.length - 1].name} (final destination)`
      });
    }
    
    return directions;
  }

  /**
   * Clear cache
   */
  clearCache() {
    // no-op
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return { size: 0, keys: [] };
  }
}

module.exports = PathfindingService;






















