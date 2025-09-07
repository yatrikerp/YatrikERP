const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Bus = require('../models/Bus');
const User = require('../models/User');

let io;
const connectedClients = new Map();

// Initialize WebSocket server
const initializeWebSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected`);
    connectedClients.set(socket.userId, socket);

    // Join depot room if user has depot
    if (socket.user.depotId) {
      socket.join(`depot-${socket.user.depotId}`);
    }

    // Join admin room if admin
    if (socket.user.role === 'admin') {
      socket.join('admin-room');
    }

    // Real-time bus tracking updates
    socket.on('track-bus', async (busId) => {
      try {
        const bus = await Bus.findById(busId);
        if (bus) {
          socket.join(`bus-${busId}`);
          socket.emit('tracking-started', { busId, status: 'tracking' });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to track bus' });
      }
    });

    // Stop tracking
    socket.on('stop-tracking', (busId) => {
      socket.leave(`bus-${busId}`);
      socket.emit('tracking-stopped', { busId });
    });

    // Bus location update (from bus device/app)
    socket.on('update-location', async (data) => {
      try {
        const { busId, location, speed, heading, timestamp } = data;
        
        // Verify user has permission to update this bus
        const bus = await Bus.findById(busId);
        if (!bus || (socket.user.role !== 'admin' && bus.depotId.toString() !== socket.user.depotId?.toString())) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        // Update bus location in database
        bus.lastKnownLocation = location;
        bus.lastLocationUpdate = timestamp || new Date();
        await bus.save();

        // Broadcast to all tracking this bus
        const trackingData = {
          busId,
          location,
          speed,
          heading,
          timestamp: timestamp || new Date()
        };

        io.to(`bus-${busId}`).emit('tracking-update', trackingData);
        io.to('admin-room').emit('bus-update', { ...trackingData, bus });
      } catch (error) {
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnected`);
      connectedClients.delete(socket.userId);
    });
  });

  return io;
};

// Emit real-time updates
const emitBusUpdate = (busId, data) => {
  if (io) {
    io.to(`bus-${busId}`).emit('bus-update', data);
    io.to('admin-room').emit('bus-update', data);
  }
};

// Emit alerts
const emitAlert = (alert) => {
  if (io) {
    // Emit to specific depot if applicable
    if (alert.depotId) {
      io.to(`depot-${alert.depotId}`).emit('alert', alert);
    }
    
    // Always emit to admin room
    io.to('admin-room').emit('alert', alert);
  }
};

// Emit analytics update
const emitAnalyticsUpdate = (data) => {
  if (io) {
    io.to('admin-room').emit('analytics-update', data);
  }
};

// Simulate real-time bus movement (for demo purposes)
const simulateBusMovement = async () => {
  try {
    const activeBuses = await Bus.find({ status: 'active' }).limit(10);
    
    activeBuses.forEach(bus => {
      // Simulate random movement
      const currentLocation = bus.lastKnownLocation || { lat: 20.5937, lng: 78.9629 };
      const newLocation = {
        lat: currentLocation.lat + (Math.random() - 0.5) * 0.01,
        lng: currentLocation.lng + (Math.random() - 0.5) * 0.01
      };
      
      const speed = Math.floor(Math.random() * 60) + 20; // 20-80 km/h
      const heading = Math.floor(Math.random() * 360);
      
      emitBusUpdate(bus._id, {
        busId: bus._id,
        location: newLocation,
        speed,
        heading,
        timestamp: new Date()
      });
    });
  } catch (error) {
    console.error('Simulation error:', error);
  }
};

// Start simulation if in development
if (process.env.NODE_ENV === 'development') {
  setInterval(simulateBusMovement, 5000); // Update every 5 seconds
}

module.exports = {
  initializeWebSocket,
  emitBusUpdate,
  emitAlert,
  emitAnalyticsUpdate
};

