# Modern Bus Management System Setup Guide

## Overview
The Modern Bus Management System is a comprehensive solution featuring:
- Real-time bus tracking with WebSocket
- AI-powered analytics and insights
- Advanced dashboard with multiple views
- QR code scanning for check-ins
- Predictive maintenance
- Route optimization
- Mobile-responsive design

## Installation

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
npm install socket.io
```

2. **Environment Configuration**
Create or update your `.env` file:
```env
# Existing configuration...

# WebSocket Configuration
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# AI Analytics (optional)
ENABLE_AI_ANALYTICS=true
AI_SIMULATION_MODE=development
```

3. **Database Models**
Ensure you have the following models:
- Bus
- FuelLog
- MaintenanceLog
- Trip

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install mapbox-gl qr-scanner
```

2. **Environment Configuration**
Create a `.env` file in the frontend directory:
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WEBSOCKET_URL=ws://localhost:5000

# Mapbox Configuration (Required for map features)
REACT_APP_MAPBOX_TOKEN=your_mapbox_access_token_here

# Feature Flags
REACT_APP_ENABLE_AI_INSIGHTS=true
REACT_APP_ENABLE_REAL_TIME_TRACKING=true
REACT_APP_ENABLE_QR_SCANNER=true
```

3. **Get Mapbox Token**
- Go to https://www.mapbox.com/
- Create a free account
- Get your access token
- Add it to your `.env` file

## Features

### 1. Real-Time Bus Tracking
- Live location updates via WebSocket
- Interactive map with bus markers
- Speed and direction indicators
- Route visualization

### 2. AI-Powered Analytics
- Predictive maintenance scheduling
- Fuel efficiency optimization
- Route optimization suggestions
- Anomaly detection

### 3. Advanced Dashboard
- **Dashboard View**: Overview with key metrics and live map
- **Grid View**: Card-based bus listing
- **Map View**: Full-screen interactive map
- **Analytics View**: Detailed charts and insights

### 4. QR Code Integration
- Scan QR codes for quick bus check-ins
- Camera and file upload support
- JSON data parsing

### 5. Real-Time Notifications
- Browser push notifications
- Alert system for critical events
- WebSocket-based updates

## Usage

### Accessing the Modern Bus Management

1. Navigate to Admin Panel
2. Click on "Bus Management" in the sidebar
3. The modern interface will load automatically

### Switching Views
Use the view selector buttons in the header:
- **Dashboard**: Complete overview
- **Grid**: Traditional card layout
- **Map**: Focus on tracking
- **Analytics**: Data insights

### Real-Time Features
- Bus locations update automatically
- Alerts appear in real-time
- Analytics refresh every 30 seconds

### AI Insights Panel
Located in the dashboard view:
- **Recommendations**: Actionable suggestions
- **Predictions**: Future trends
- **Anomalies**: Unusual patterns detected

## API Endpoints

### Analytics Endpoints
```
GET /api/admin/buses/analytics
GET /api/admin/buses/ai-insights
```

### WebSocket Events
```javascript
// Client -> Server
'track-bus': Start tracking a specific bus
'stop-tracking': Stop tracking a bus
'update-location': Update bus location

// Server -> Client
'bus-update': Bus data update
'tracking-update': Location update
'alert': System alert
'analytics-update': Analytics refresh
```

## Troubleshooting

### Map Not Loading
- Check if Mapbox token is configured
- Verify internet connection
- Check browser console for errors

### WebSocket Connection Issues
- Ensure backend server is running
- Check CORS configuration
- Verify WebSocket URL in frontend

### QR Scanner Not Working
- Ensure HTTPS or localhost
- Check camera permissions
- Try file upload alternative

## Performance Optimization

### Caching
- API responses are cached
- Use `clearApiCache()` to refresh

### Debouncing
- Search input has 300ms debounce
- Reduces API calls

### Pagination
- Server-side pagination
- Configurable page size

## Security Considerations

1. **Authentication**
   - JWT tokens required
   - WebSocket authentication
   - Role-based access

2. **Data Protection**
   - Sensitive data encryption
   - HTTPS in production
   - Input validation

3. **Rate Limiting**
   - API rate limits
   - WebSocket connection limits

## Future Enhancements

1. **PWA Support**
   - Offline functionality
   - Mobile app experience
   - Push notifications

2. **Redis Caching**
   - Improved performance
   - Reduced database load

3. **Machine Learning**
   - Enhanced predictions
   - Pattern recognition
   - Automated optimization

## Support

For issues or questions:
1. Check the console for errors
2. Verify all dependencies are installed
3. Ensure environment variables are set
4. Check network connectivity

## Demo Mode

In development, the system includes:
- Simulated bus movement
- Sample AI insights
- Mock data generation

To disable demo mode, set:
```env
NODE_ENV=production
```

