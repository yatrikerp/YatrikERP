# 🗺️ Google Maps Integration Setup Guide

## Overview
This guide will help you set up Google Maps integration for the Live Bus Tracking feature in your YATRIK ERP application.

## Prerequisites
- Google Cloud Platform account
- Access to Google Cloud Console
- Basic understanding of API keys

## Step 1: Google Cloud Console Setup

### 1.1 Create or Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 1.2 Enable Required APIs
Enable the following APIs in your project:
- **Maps JavaScript API** - For displaying maps
- **Directions API** - For route planning
- **Places API** - For location search
- **Geocoding API** - For address conversion

### 1.3 Create API Key
1. Go to "Credentials" in the left sidebar
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key
4. (Optional) Restrict the API key to your domain for security

## Step 2: Frontend Configuration

### 2.1 Create Environment File
Run the setup script:
```bash
node setup-google-maps-api.js
```

Or manually create `frontend/.env`:
```env
# Google Maps API Configuration
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# Other configurations
REACT_APP_API_URL=http://localhost:5000
PORT=5173
```

### 2.2 Restart Development Server
After adding the API key, restart your frontend development server:
```bash
cd frontend
npm start
```

## Step 3: Testing the Integration

### 3.1 Test Map Display
1. Open your application
2. Navigate to Live Bus Tracking
3. Select a running trip
4. Verify that the map loads correctly

### 3.2 Test Features
- ✅ Map displays with bus location
- ✅ Route path shows from start to destination
- ✅ Real-time location updates
- ✅ Interactive markers and info windows
- ✅ Route progress tracking

## Step 4: Troubleshooting

### Common Issues

#### Map Not Loading
- Check if API key is correctly set in `.env`
- Verify API key has required permissions
- Check browser console for errors
- Ensure APIs are enabled in Google Cloud Console

#### "For development purposes only" Watermark
- This appears when using an unrestricted API key
- Add billing information to your Google Cloud project
- Or restrict the API key to your domain

#### CORS Errors
- Ensure your domain is added to API key restrictions
- Check if API key is valid and active

### Debug Mode
The application includes a fallback interface that works without Google Maps API. This helps with development and testing.

## Step 5: Production Deployment

### 5.1 Environment Variables
For production deployment, set the environment variable:
```env
VITE_GOOGLE_MAPS_API_KEY=your_production_api_key
```

### 5.2 API Key Restrictions
For production, restrict your API key to:
- Specific domains (your production domain)
- Specific IP addresses
- Specific APIs only

### 5.3 Billing Setup
- Add billing information to your Google Cloud project
- Monitor usage to avoid unexpected charges
- Set up billing alerts

## Features Included

### 🚌 Live Bus Tracking
- Real-time bus location display
- Interactive map with custom bus markers
- Route visualization with start/end points
- Speed and location information

### 🗺️ Enhanced Map Features
- Custom styled map with Kerala focus
- Smooth route paths with intermediate points
- Interactive info windows
- Real-time location updates
- Responsive design for all devices

### 🔧 Developer Features
- Fallback interface without API key
- Comprehensive error handling
- Debug mode for development
- Easy API key configuration

## API Usage Limits

### Free Tier Limits
- Maps JavaScript API: 28,000 loads per month
- Directions API: 2,500 requests per month
- Places API: 1,000 requests per month
- Geocoding API: 40,000 requests per month

### Pricing
- Maps JavaScript API: $7 per 1,000 loads after free tier
- Directions API: $5 per 1,000 requests after free tier
- Places API: $17 per 1,000 requests after free tier
- Geocoding API: $5 per 1,000 requests after free tier

## Security Best Practices

1. **Restrict API Keys**: Limit to specific domains/IPs
2. **Monitor Usage**: Set up billing alerts
3. **Rotate Keys**: Regularly update API keys
4. **Environment Variables**: Never commit API keys to version control

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify API key configuration
3. Test with the fallback interface
4. Review Google Cloud Console logs

## Next Steps

After successful setup:
1. Test all tracking features
2. Customize map styling if needed
3. Add additional location services
4. Implement advanced routing features

---

**Note**: This integration provides a professional-grade mapping solution for your bus tracking system. The fallback interface ensures your application works even without Google Maps API, making development and testing easier.
