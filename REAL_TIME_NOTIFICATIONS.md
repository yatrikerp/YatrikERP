# 🚀 Real-Time Notifications System

## Overview
The Yatrik ERP now includes a comprehensive real-time notification system that allows the admin dashboard to send updates directly to depot managers. When trips are updated from the admin dashboard, depot managers will see:

- **Driver and Conductor assignments** for scheduled trips
- **Real-time notifications** for trip updates
- **Latest messages** in the notification center
- **System alerts** and important announcements

## 🎯 Features Implemented

### 1. **Real-Time Trip Updates**
- When admin updates trip details (driver, conductor, timing, etc.)
- Depot dashboard automatically reflects the changes
- Notification appears with trip details

### 2. **New Trip Assignments**
- When admin assigns new trips to depot
- New trips appear in the Trip Management section
- High-priority notification sent to depot managers

### 3. **Notification Center**
- **Bell icon** in sidebar with unread count badge
- **Real-time updates** with different priority levels
- **Mark as read** functionality
- **Time stamps** showing when notifications arrived
- **Different notification types** (trip updates, assignments, messages, alerts)

### 4. **Socket.IO Integration**
- **WebSocket connection** for real-time communication
- **Authentication** with depot manager tokens
- **Room-based messaging** (admins → depot managers)
- **Automatic reconnection** handling

## 🛠️ Setup Instructions

### 1. **Install Socket.IO Server**
```bash
cd backend
npm install socket.io
```

### 2. **Start Socket Server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The socket server will run on `http://localhost:3001`

### 3. **Frontend Configuration**
The frontend automatically connects to the socket server using:
```javascript
const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000')
```

### 4. **Environment Variables**
Add to your `.env` file:
```env
REACT_APP_SOCKET_URL=http://localhost:3001
```

## 📡 Socket Events

### **From Admin Dashboard:**
- `updateTrip` - Send trip updates to depot managers
- `assignTrip` - Assign new trips to depot
- `sendMessage` - Send general messages
- `sendSystemAlert` - Send system alerts

### **To Depot Dashboard:**
- `tripUpdated` - Receive trip updates
- `tripAssigned` - Receive new trip assignments
- `message` - Receive general messages
- `systemAlert` - Receive system alerts

## 🎨 Notification Types

### **Trip Update Notification**
```javascript
{
  type: 'trip_update',
  title: 'Trip Updated',
  message: 'Trip TR-001 has been updated by admin. Driver: Rajesh Kumar, Conductor: Suresh Nair',
  priority: 'medium',
  timestamp: new Date()
}
```

### **Trip Assignment Notification**
```javascript
{
  type: 'trip_assigned',
  title: 'New Trip Assigned',
  message: 'New trip TR-004 has been assigned to you. Route: Kochi to Bangalore, Driver: Vikram Singh',
  priority: 'high',
  timestamp: new Date()
}
```

### **System Alert Notification**
```javascript
{
  type: 'system_alert',
  title: 'System Alert',
  message: 'All buses must undergo safety inspection before departure tomorrow.',
  priority: 'high',
  timestamp: new Date()
}
```

## 🔧 Usage Examples

### **Admin Sending Trip Update**
```javascript
// In admin dashboard
socket.emit('updateTrip', {
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
});
```

### **Admin Assigning New Trip**
```javascript
// In admin dashboard
socket.emit('assignTrip', {
  trip: {
    _id: 'trip_new',
    tripNumber: 'TR-004',
    routeId: { routeName: 'Kochi to Bangalore', routeNumber: 'KL-004' },
    busId: { busNumber: 'KL-76-AB-5117' },
    driverId: { name: 'Vikram Singh' },
    conductorId: { name: 'Priya Sharma' },
    serviceDate: '2024-01-16',
    startTime: '12:00',
    endTime: '18:00',
    status: 'scheduled',
    fare: 750
  }
});
```

### **Admin Sending Message**
```javascript
// In admin dashboard
socket.emit('sendMessage', {
  title: 'Important Notice',
  message: 'All buses must undergo safety inspection before departure tomorrow.',
  priority: 'high',
  targetUserType: 'depot_manager'
});
```

## 🎯 Testing the System

### **Automatic Testing**
The socket server includes automatic simulation that sends test events every 30 seconds:
- Trip updates
- New trip assignments
- General messages

### **Manual Testing**
1. Open depot dashboard
2. Click the notification bell icon
3. You should see sample notifications
4. Start the socket server to see real-time updates

## 🎨 UI Components

### **Notification Bell Icon**
- Located in sidebar footer
- Shows unread count badge
- Animated pulse effect for new notifications
- Click to open notification center

### **Notification Center**
- **Slide-in panel** from right side
- **Priority-based styling** (high, medium, low)
- **Read/unread states** with visual indicators
- **Time formatting** (just now, 5m ago, 2h ago)
- **Mark as read** functionality
- **Mark all as read** button

### **Trip Management Updates**
- **Real-time trip list** updates
- **Driver and conductor** information
- **Status changes** reflected immediately
- **New trips** appear automatically

## 🔒 Security Features

- **Token-based authentication** for socket connections
- **User type validation** (admin vs depot_manager)
- **Room-based messaging** to prevent unauthorized access
- **Input validation** for all socket events

## 🚀 Future Enhancements

- **Push notifications** for mobile devices
- **Email notifications** for critical updates
- **Notification preferences** per user
- **Notification history** and archiving
- **Rich media** in notifications (images, links)
- **Notification scheduling** for future events

## 📱 Responsive Design

The notification system is fully responsive and works on:
- **Desktop** - Full notification center panel
- **Tablet** - Optimized panel size
- **Mobile** - Full-screen notification center

## 🎉 Benefits

1. **Real-time Communication** - Instant updates between admin and depot
2. **Improved Efficiency** - No need to refresh pages to see updates
3. **Better Coordination** - Clear visibility of trip assignments and changes
4. **Professional UX** - Modern notification system with smooth animations
5. **Scalable Architecture** - Easy to extend with more notification types

The real-time notification system transforms the Yatrik ERP into a truly modern, responsive platform that keeps all users informed and synchronized in real-time! 🎯
