const io = require('socket.io')(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle authentication
  socket.on('authenticate', (data) => {
    const { token, userType } = data;
    
    // Store user info
    connectedUsers.set(socket.id, {
      token,
      userType,
      socketId: socket.id
    });

    // Join appropriate room based on user type
    if (userType === 'depot_manager') {
      socket.join('depot_managers');
      console.log('Depot manager joined:', socket.id);
    } else if (userType === 'admin') {
      socket.join('admins');
      console.log('Admin joined:', socket.id);
    }
  });

  // Handle trip updates from admin
  socket.on('updateTrip', (data) => {
    console.log('Trip update received from admin:', data);
    
    // Broadcast to all depot managers
    socket.to('depot_managers').emit('tripUpdated', {
      tripId: data.tripId,
      tripNumber: data.tripNumber,
      updates: data.updates,
      updatedBy: 'admin',
      timestamp: new Date()
    });
  });

  // Handle new trip assignments from admin
  socket.on('assignTrip', (data) => {
    console.log('Trip assignment received from admin:', data);
    
    // Broadcast to all depot managers
    socket.to('depot_managers').emit('tripAssigned', {
      trip: data.trip,
      assignedBy: 'admin',
      timestamp: new Date()
    });
  });

  // Handle general messages
  socket.on('sendMessage', (data) => {
    console.log('Message received:', data);
    
    // Broadcast to appropriate users
    if (data.targetUserType === 'depot_manager') {
      socket.to('depot_managers').emit('message', {
        title: data.title,
        message: data.message,
        priority: data.priority || 'low',
        timestamp: new Date()
      });
    }
  });

  // Handle system alerts
  socket.on('sendSystemAlert', (data) => {
    console.log('System alert received:', data);
    
    // Broadcast to all depot managers
    socket.to('depot_managers').emit('systemAlert', {
      message: data.message,
      severity: data.severity || 'medium',
      timestamp: new Date()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
  });
});

// Example function to simulate admin sending trip updates
function simulateTripUpdate() {
  const tripUpdate = {
    tripId: 'trip1',
    tripNumber: 'TR-001',
    updates: {
      driverId: { name: 'Rajesh Kumar', id: 'driver1' },
      conductorId: { name: 'Suresh Nair', id: 'conductor1' },
      status: 'scheduled',
      serviceDate: '2024-01-16',
      startTime: '06:00',
      endTime: '10:30'
    }
  };

  // Send to all depot managers
  io.to('depot_managers').emit('tripUpdated', {
    ...tripUpdate,
    updatedBy: 'admin',
    timestamp: new Date()
  });

  console.log('Simulated trip update sent:', tripUpdate);
}

// Example function to simulate admin assigning new trip
function simulateTripAssignment() {
  const newTrip = {
    _id: 'trip_new',
    tripNumber: 'TR-004',
    routeId: { routeName: 'Kochi to Bangalore', routeNumber: 'KL-004' },
    busId: { busNumber: 'KL-76-AB-5117', registrationNumber: 'KL76AB9958' },
    driverId: { name: 'Vikram Singh' },
    conductorId: { name: 'Priya Sharma' },
    serviceDate: '2024-01-16',
    startTime: '12:00',
    endTime: '18:00',
    status: 'scheduled',
    fare: 750
  };

  // Send to all depot managers
  io.to('depot_managers').emit('tripAssigned', {
    trip: newTrip,
    assignedBy: 'admin',
    timestamp: new Date()
  });

  console.log('Simulated trip assignment sent:', newTrip);
}

// Example function to simulate admin sending message
function simulateMessage() {
  const message = {
    title: 'Important Notice',
    message: 'All buses must undergo safety inspection before departure tomorrow.',
    priority: 'high'
  };

  // Send to all depot managers
  io.to('depot_managers').emit('message', {
    ...message,
    timestamp: new Date()
  });

  console.log('Simulated message sent:', message);
}

// Simulate events every 30 seconds for testing
setInterval(() => {
  const random = Math.random();
  
  if (random < 0.33) {
    simulateTripUpdate();
  } else if (random < 0.66) {
    simulateTripAssignment();
  } else {
    simulateMessage();
  }
}, 30000); // Every 30 seconds

console.log('Socket server running on port 3001');
console.log('Simulating events every 30 seconds for testing...');

module.exports = io;
