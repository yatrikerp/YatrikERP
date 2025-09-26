const mongoose = require('mongoose');

const routeGraphSchema = new mongoose.Schema({
  // Graph metadata
  graphVersion: {
    type: String,
    required: true,
    default: () => `v${Date.now()}`
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  totalStops: {
    type: Number,
    required: true
  },
  totalRoutes: {
    type: Number,
    required: true
  },
  
  // Graph structure
  nodes: [{
    stopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stop',
      required: true
    },
    stopCode: {
      type: String,
      required: true
    },
    stopName: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    routes: [{
      routeId: mongoose.Schema.Types.ObjectId,
      routeNumber: String,
      stopSequence: Number
    }]
  }],
  
  edges: [{
    fromStopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stop',
      required: true
    },
    toStopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stop',
      required: true
    },
    routes: [{
      routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
      },
      routeNumber: {
        type: String,
        required: true
      },
      distance: {
        type: Number,
        required: true,
        min: 0
      },
      duration: {
        type: Number,
        required: true,
        min: 0
      },
      averageSpeed: {
        type: Number,
        required: true,
        min: 0
      },
      fare: {
        type: Number,
        required: true,
        min: 0
      },
      transferPenalty: {
        type: Number,
        default: 10 // minutes penalty for transfers
      }
    }],
    
    // Combined metrics for pathfinding
    minDuration: {
      type: Number,
      required: true
    },
    minFare: {
      type: Number,
      required: true
    },
    averageDuration: {
      type: Number,
      required: true
    },
    averageFare: {
      type: Number,
      required: true
    },
    
    // Transfer information
    isDirectConnection: {
      type: Boolean,
      default: true
    },
    transferStops: [{
      stopId: mongoose.Schema.Types.ObjectId,
      stopName: String,
      transferTime: Number // minutes
    }]
  }],
  
  // Performance metrics
  buildTime: {
    type: Number, // milliseconds
    required: true
  },
  nodeCount: {
    type: Number,
    required: true
  },
  edgeCount: {
    type: Number,
    required: true
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isLatest: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
routeGraphSchema.index({ isActive: 1, isLatest: 1 });
routeGraphSchema.index({ lastUpdated: -1 });
routeGraphSchema.index({ 'nodes.stopId': 1 });
routeGraphSchema.index({ 'edges.fromStopId': 1, 'edges.toStopId': 1 });

// Method to find shortest path between two stops
routeGraphSchema.methods.findShortestPath = function(fromStopId, toStopId, criteria = 'duration') {
  const startNode = this.nodes.find(node => node.stopId.toString() === fromStopId.toString());
  const endNode = this.nodes.find(node => node.stopId.toString() === toStopId.toString());
  
  if (!startNode || !endNode) {
    throw new Error('Start or end stop not found in graph');
  }
  
  // Dijkstra's algorithm implementation
  const distances = new Map();
  const previous = new Map();
  const visited = new Set();
  const priorityQueue = [];
  
  // Initialize distances
  this.nodes.forEach(node => {
    distances.set(node.stopId.toString(), Infinity);
    previous.set(node.stopId.toString(), null);
  });
  distances.set(fromStopId.toString(), 0);
  priorityQueue.push({ stopId: fromStopId.toString(), distance: 0 });
  
  while (priorityQueue.length > 0) {
    // Get node with minimum distance
    priorityQueue.sort((a, b) => a.distance - b.distance);
    const current = priorityQueue.shift();
    
    if (visited.has(current.stopId)) continue;
    visited.add(current.stopId);
    
    // If we reached the destination
    if (current.stopId === toStopId.toString()) break;
    
    // Check all neighbors
    const edges = this.edges.filter(edge => 
      edge.fromStopId.toString() === current.stopId
    );
    
    edges.forEach(edge => {
      const neighborId = edge.toStopId.toString();
      if (visited.has(neighborId)) return;
      
      // Calculate edge weight based on criteria
      let edgeWeight;
      switch (criteria) {
        case 'duration':
          edgeWeight = edge.minDuration;
          break;
        case 'fare':
          edgeWeight = edge.minFare;
          break;
        case 'distance':
          edgeWeight = edge.routes[0]?.distance || 0;
          break;
        default:
          edgeWeight = edge.minDuration;
      }
      
      const newDistance = distances.get(current.stopId) + edgeWeight;
      
      if (newDistance < distances.get(neighborId)) {
        distances.set(neighborId, newDistance);
        previous.set(neighborId, {
          stopId: current.stopId,
          edge: edge
        });
        priorityQueue.push({ stopId: neighborId, distance: newDistance });
      }
    });
  }
  
  // Reconstruct path
  const path = [];
  let current = toStopId.toString();
  
  while (current !== null) {
    const prev = previous.get(current);
    if (prev) {
      path.unshift({
        stopId: current,
        edge: prev.edge
      });
    }
    current = prev ? prev.stopId : null;
  }
  
  // Add the starting node
  path.unshift({ stopId: fromStopId.toString(), edge: null });
  
  return {
    path,
    totalDistance: distances.get(toStopId.toString()),
    stops: path.map(p => p.stopId),
    routes: this.extractRoutesFromPath(path),
    totalDuration: this.calculatePathDuration(path),
    totalFare: this.calculatePathFare(path)
  };
};

// Helper method to extract routes from path
routeGraphSchema.methods.extractRoutesFromPath = function(path) {
  const routes = [];
  let currentRoute = null;
  
  for (let i = 1; i < path.length; i++) {
    const edge = path[i].edge;
    if (edge && edge.routes.length > 0) {
      // Use the first (best) route for this edge
      const route = edge.routes[0];
      if (!currentRoute || currentRoute.routeId.toString() !== route.routeId.toString()) {
        if (currentRoute) routes.push(currentRoute);
        currentRoute = {
          routeId: route.routeId,
          routeNumber: route.routeNumber,
          fromStopId: path[i-1].stopId,
          toStopId: path[i].stopId,
          duration: route.duration,
          fare: route.fare
        };
      } else {
        // Extend current route
        currentRoute.toStopId = path[i].stopId;
        currentRoute.duration += route.duration;
        currentRoute.fare += route.fare;
      }
    }
  }
  
  if (currentRoute) routes.push(currentRoute);
  return routes;
};

// Helper method to calculate total path duration
routeGraphSchema.methods.calculatePathDuration = function(path) {
  let totalDuration = 0;
  for (let i = 1; i < path.length; i++) {
    const edge = path[i].edge;
    if (edge) {
      totalDuration += edge.minDuration;
      // Add transfer penalty if this is a transfer
      if (!edge.isDirectConnection) {
        totalDuration += edge.transferStops.reduce((sum, transfer) => sum + transfer.transferTime, 0);
      }
    }
  }
  return totalDuration;
};

// Helper method to calculate total path fare
routeGraphSchema.methods.calculatePathFare = function(path) {
  let totalFare = 0;
  for (let i = 1; i < path.length; i++) {
    const edge = path[i].edge;
    if (edge) {
      totalFare += edge.minFare;
    }
  }
  return totalFare;
};

// Method to find multiple route options
routeGraphSchema.methods.findRouteOptions = function(fromStopId, toStopId, maxOptions = 5) {
  const options = [];
  
  // Try different criteria
  const criteriaList = ['duration', 'fare', 'distance'];
  
  criteriaList.forEach(criteria => {
    try {
      const result = this.findShortestPath(fromStopId, toStopId, criteria);
      options.push({
        ...result,
        criteria,
        score: this.calculateRouteScore(result, criteria)
      });
    } catch (error) {
      console.warn(`Failed to find route with criteria ${criteria}:`, error.message);
    }
  });
  
  // Sort by score and return top options
  return options
    .sort((a, b) => a.score - b.score)
    .slice(0, maxOptions);
};

// Helper method to calculate route score
routeGraphSchema.methods.calculateRouteScore = function(route, criteria) {
  switch (criteria) {
    case 'duration':
      return route.totalDuration;
    case 'fare':
      return route.totalFare;
    case 'distance':
      return route.totalDistance;
    default:
      return route.totalDuration;
  }
};

// Static method to get latest active graph
routeGraphSchema.statics.getLatest = function() {
  return this.findOne({ isActive: true, isLatest: true })
    .sort({ lastUpdated: -1 });
};

// Static method to create new graph version
routeGraphSchema.statics.createNewVersion = function(graphData) {
  // Mark all existing graphs as not latest
  return this.updateMany({}, { isLatest: false })
    .then(() => {
      // Create new graph
      const newGraph = new this({
        ...graphData,
        isLatest: true,
        isActive: true
      });
      return newGraph.save();
    });
};

module.exports = mongoose.model('RouteGraph', routeGraphSchema);


