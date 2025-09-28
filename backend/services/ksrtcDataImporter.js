const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const Route = require('../models/Route');
const Stop = require('../models/Stop');
const RouteStop = require('../models/RouteStop');
const RouteGraph = require('../models/RouteGraph');

class KSRTCDataImporter {
  constructor() {
    this.importStats = {
      routes: 0,
      stops: 0,
      routeStops: 0,
      errors: []
    };
  }

  /**
   * Import KSRTC routes from CSV/JSON data
   * @param {string} dataPath - Path to the data file
   * @param {string} format - 'csv' or 'json'
   */
  async importRoutes(dataPath, format = 'csv') {
    try {
      console.log(`Starting KSRTC route import from ${dataPath}...`);
      
      let routeData;
      if (format === 'csv') {
        routeData = await this.parseCSV(dataPath);
      } else {
        routeData = await this.parseJSON(dataPath);
      }

      for (const route of routeData) {
        try {
          await this.importSingleRoute(route);
          this.importStats.routes++;
        } catch (error) {
          console.error(`Error importing route ${route.routeNumber}:`, error.message);
          this.importStats.errors.push({
            type: 'route',
            identifier: route.routeNumber,
            error: error.message
          });
        }
      }

      console.log(`Route import completed. Imported ${this.importStats.routes} routes.`);
      return this.importStats;
    } catch (error) {
      console.error('Error in route import:', error);
      throw error;
    }
  }

  /**
   * Import KSRTC stops from CSV/JSON data
   * @param {string} dataPath - Path to the data file
   * @param {string} format - 'csv' or 'json'
   */
  async importStops(dataPath, format = 'csv') {
    try {
      console.log(`Starting KSRTC stop import from ${dataPath}...`);
      
      let stopData;
      if (format === 'csv') {
        stopData = await this.parseCSV(dataPath);
      } else {
        stopData = await this.parseJSON(dataPath);
      }

      for (const stop of stopData) {
        try {
          await this.importSingleStop(stop);
          this.importStats.stops++;
        } catch (error) {
          console.error(`Error importing stop ${stop.stopCode}:`, error.message);
          this.importStats.errors.push({
            type: 'stop',
            identifier: stop.stopCode,
            error: error.message
          });
        }
      }

      console.log(`Stop import completed. Imported ${this.importStats.stops} stops.`);
      return this.importStats;
    } catch (error) {
      console.error('Error in stop import:', error);
      throw error;
    }
  }

  /**
   * Import route-stop relationships from CSV/JSON data
   * @param {string} dataPath - Path to the data file
   * @param {string} format - 'csv' or 'json'
   */
  async importRouteStops(dataPath, format = 'csv') {
    try {
      console.log(`Starting KSRTC route-stop import from ${dataPath}...`);
      
      let routeStopData;
      if (format === 'csv') {
        routeStopData = await this.parseCSV(dataPath);
      } else {
        routeStopData = await this.parseJSON(dataPath);
      }

      for (const routeStop of routeStopData) {
        try {
          await this.importSingleRouteStop(routeStop);
          this.importStats.routeStops++;
        } catch (error) {
          console.error(`Error importing route-stop ${routeStop.routeNumber}-${routeStop.stopCode}:`, error.message);
          this.importStats.errors.push({
            type: 'routeStop',
            identifier: `${routeStop.routeNumber}-${routeStop.stopCode}`,
            error: error.message
          });
        }
      }

      console.log(`Route-stop import completed. Imported ${this.importStats.routeStops} route-stops.`);
      return this.importStats;
    } catch (error) {
      console.error('Error in route-stop import:', error);
      throw error;
    }
  }

  /**
   * Parse CSV file and return array of objects
   */
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * Parse JSON file and return array of objects
   */
  async parseJSON(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to parse JSON file: ${error.message}`);
    }
  }

  /**
   * Import a single route
   */
  async importSingleRoute(routeData) {
    // Validate required fields
    const requiredFields = ['routeNumber', 'routeName', 'startingPoint', 'endingPoint', 'totalDistance'];
    for (const field of requiredFields) {
      if (!routeData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check if route already exists
    const existingRoute = await Route.findOne({ routeNumber: routeData.routeNumber });
    if (existingRoute) {
      console.log(`Route ${routeData.routeNumber} already exists, updating...`);
      
      // Update existing route
      Object.assign(existingRoute, {
        routeName: routeData.routeName,
        startingPoint: routeData.startingPoint,
        endingPoint: routeData.endingPoint,
        totalDistance: parseFloat(routeData.totalDistance),
        estimatedDuration: parseInt(routeData.estimatedDuration) || 0,
        baseFare: parseFloat(routeData.baseFare) || 0,
        farePerKm: parseFloat(routeData.farePerKm) || 0,
        features: routeData.features || [],
        status: routeData.status || 'active',
        updatedBy: routeData.createdBy || null
      });

      await existingRoute.save();
      return existingRoute;
    }

    // Create new route
    const route = new Route({
      routeNumber: routeData.routeNumber,
      routeName: routeData.routeName,
      startingPoint: routeData.startingPoint,
      endingPoint: routeData.endingPoint,
      totalDistance: parseFloat(routeData.totalDistance),
      estimatedDuration: parseInt(routeData.estimatedDuration) || 0,
      baseFare: parseFloat(routeData.baseFare) || 0,
      farePerKm: parseFloat(routeData.farePerKm) || 0,
      features: routeData.features || [],
      status: routeData.status || 'active',
      depot: routeData.depot || null,
      createdBy: routeData.createdBy || null
    });

    await route.save();
    return route;
  }

  /**
   * Import a single stop
   */
  async importSingleStop(stopData) {
    // Validate required fields
    const requiredFields = ['stopCode', 'stopName', 'latitude', 'longitude'];
    for (const field of requiredFields) {
      if (!stopData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check if stop already exists
    const existingStop = await Stop.findOne({ code: stopData.stopCode });
    if (existingStop) {
      console.log(`Stop ${stopData.stopCode} already exists, updating...`);
      
      // Update existing stop
      Object.assign(existingStop, {
        name: stopData.stopName,
        lat: parseFloat(stopData.latitude),
        lon: parseFloat(stopData.longitude)
      });

      await existingStop.save();
      return existingStop;
    }

    // Create new stop
    const stop = new Stop({
      name: stopData.stopName,
      code: stopData.stopCode,
      lat: parseFloat(stopData.latitude),
      lon: parseFloat(stopData.longitude)
    });

    await stop.save();
    return stop;
  }

  /**
   * Import a single route-stop relationship
   */
  async importSingleRouteStop(routeStopData) {
    // Validate required fields
    const requiredFields = ['routeNumber', 'stopCode', 'stopSequence', 'distanceFromStart'];
    for (const field of requiredFields) {
      if (!routeStopData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Find route and stop
    const route = await Route.findOne({ routeNumber: routeStopData.routeNumber });
    const stop = await Stop.findOne({ code: routeStopData.stopCode });

    if (!route) {
      throw new Error(`Route ${routeStopData.routeNumber} not found`);
    }
    if (!stop) {
      throw new Error(`Stop ${routeStopData.stopCode} not found`);
    }

    // Check if route-stop already exists
    const existingRouteStop = await RouteStop.findOne({
      routeId: route._id,
      stopId: stop._id
    });

    if (existingRouteStop) {
      console.log(`Route-stop ${routeStopData.routeNumber}-${routeStopData.stopCode} already exists, updating...`);
      
      // Update existing route-stop
      Object.assign(existingRouteStop, {
        stopSequence: parseInt(routeStopData.stopSequence),
        distanceFromStart: parseFloat(routeStopData.distanceFromStart),
        distanceFromPrev: parseFloat(routeStopData.distanceFromPrev) || 0,
        estimatedArrival: parseInt(routeStopData.estimatedArrival) || 0,
        estimatedDeparture: parseInt(routeStopData.estimatedDeparture) || 0,
        segmentDuration: parseInt(routeStopData.segmentDuration) || 0,
        fareFromStart: parseFloat(routeStopData.fareFromStart) || 0,
        coordinates: {
          latitude: parseFloat(routeStopData.latitude),
          longitude: parseFloat(routeStopData.longitude)
        },
        stopType: routeStopData.stopType || 'minor',
        ksrtcStopCode: routeStopData.ksrtcStopCode || routeStopData.stopCode,
        updatedBy: routeStopData.createdBy || null
      });

      await existingRouteStop.save();
      return existingRouteStop;
    }

    // Create new route-stop
    const routeStop = new RouteStop({
      routeId: route._id,
      routeNumber: routeStopData.routeNumber,
      stopId: stop._id,
      stopCode: routeStopData.stopCode,
      stopName: stop.name,
      stopSequence: parseInt(routeStopData.stopSequence),
      distanceFromStart: parseFloat(routeStopData.distanceFromStart),
      distanceFromPrev: parseFloat(routeStopData.distanceFromPrev) || 0,
      estimatedArrival: parseInt(routeStopData.estimatedArrival) || 0,
      estimatedDeparture: parseInt(routeStopData.estimatedDeparture) || 0,
      segmentDuration: parseInt(routeStopData.segmentDuration) || 0,
      fareFromStart: parseFloat(routeStopData.fareFromStart) || 0,
      coordinates: {
        latitude: parseFloat(routeStopData.latitude),
        longitude: parseFloat(routeStopData.longitude)
      },
      stopType: routeStopData.stopType || 'minor',
      ksrtcStopCode: routeStopData.ksrtcStopCode || routeStopData.stopCode,
      createdBy: routeStopData.createdBy || null
    });

    await routeStop.save();
    return routeStop;
  }

  /**
   * Build route graph from imported data
   */
  async buildRouteGraph() {
    try {
      console.log('Building route graph...');
      const startTime = Date.now();

      // Get all route stops
      const routeStops = await RouteStop.find({ isActive: true })
        .populate('routeId', 'routeNumber routeName')
        .populate('stopId', 'name code lat lon')
        .sort({ routeId: 1, stopSequence: 1 })
        .lean();

      if (routeStops.length === 0) {
        throw new Error('No route stops found. Please import route-stop data first.');
      }

      // Build nodes (unique stops)
      const stopMap = new Map();
      const routeMap = new Map();

      routeStops.forEach(routeStop => {
        const stopId = routeStop.stopId._id.toString();
        const routeId = routeStop.routeId._id.toString();

        // Add to stop map
        if (!stopMap.has(stopId)) {
          stopMap.set(stopId, {
            stopId: routeStop.stopId._id,
            stopCode: routeStop.stopId.code,
            stopName: routeStop.stopId.name,
            coordinates: {
              latitude: routeStop.stopId.lat,
              longitude: routeStop.stopId.lon
            },
            routes: []
          });
        }

        // Add route to stop
        stopMap.get(stopId).routes.push({
          routeId: routeStop.routeId._id,
          routeNumber: routeStop.routeId.routeNumber,
          stopSequence: routeStop.stopSequence
        });

        // Add to route map
        if (!routeMap.has(routeId)) {
          routeMap.set(routeId, []);
        }
        routeMap.get(routeId).push(routeStop);
      });

      // Build edges (connections between stops)
      const edgeMap = new Map();
      const edges = [];

      routeMap.forEach((routeStops, routeId) => {
        // Sort stops by sequence
        routeStops.sort((a, b) => a.stopSequence - b.stopSequence);

        // Create edges between consecutive stops
        for (let i = 0; i < routeStops.length - 1; i++) {
          const fromStop = routeStops[i];
          const toStop = routeStops[i + 1];

          const edgeKey = `${fromStop.stopId._id}-${toStop.stopId._id}`;

          if (!edgeMap.has(edgeKey)) {
            edgeMap.set(edgeKey, {
              fromStopId: fromStop.stopId._id,
              toStopId: toStop.stopId._id,
              routes: [],
              isDirectConnection: true,
              transferStops: []
            });
          }

          const edge = edgeMap.get(edgeKey);
          const distance = toStop.distanceFromStart - fromStop.distanceFromStart;
          const duration = toStop.estimatedArrival - fromStop.estimatedDeparture;
          const fare = toStop.fareFromStart - fromStop.fareFromStart;
          const averageSpeed = distance > 0 ? (distance / duration) * 60 : 0; // km/h

          edge.routes.push({
            routeId: fromStop.routeId._id,
            routeNumber: fromStop.routeId.routeNumber,
            distance: distance,
            duration: duration,
            averageSpeed: averageSpeed,
            fare: fare,
            transferPenalty: 10
          });
        }
      });

      // Convert edge map to array and calculate combined metrics
      edgeMap.forEach(edge => {
        if (edge.routes.length > 0) {
          edge.minDuration = Math.min(...edge.routes.map(r => r.duration));
          edge.minFare = Math.min(...edge.routes.map(r => r.fare));
          edge.averageDuration = edge.routes.reduce((sum, r) => sum + r.duration, 0) / edge.routes.length;
          edge.averageFare = edge.routes.reduce((sum, r) => sum + r.fare, 0) / edge.routes.length;
          edges.push(edge);
        }
      });

      // Create graph document
      const graphData = {
        totalStops: stopMap.size,
        totalRoutes: routeMap.size,
        nodes: Array.from(stopMap.values()),
        edges: edges,
        buildTime: Date.now() - startTime,
        nodeCount: stopMap.size,
        edgeCount: edges.length
      };

      // Save graph using static method
      const graph = await RouteGraph.createNewVersion(graphData);

      console.log(`Route graph built successfully in ${graphData.buildTime}ms`);
      console.log(`Nodes: ${graphData.nodeCount}, Edges: ${graphData.edgeCount}`);

      return graph;
    } catch (error) {
      console.error('Error building route graph:', error);
      throw error;
    }
  }

  /**
   * Get import statistics
   */
  getStats() {
    return this.importStats;
  }

  /**
   * Reset import statistics
   */
  resetStats() {
    this.importStats = {
      routes: 0,
      stops: 0,
      routeStops: 0,
      errors: []
    };
  }
}

module.exports = KSRTCDataImporter;





