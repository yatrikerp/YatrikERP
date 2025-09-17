# 🗺️ Google Maps API Setup Guide for YATRIK ERP

This guide will help you set up Google Maps API integration for the bus tracking feature.

## 📋 Prerequisites

- Google account
- Access to Google Cloud Console
- Your YATRIK ERP project running

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **Create New Project**
   - Click "Select a project" → "New Project"
   - Project name: `YATRIK-ERP-MAPS`
   - Click "Create"

### Step 2: Enable Required APIs

Navigate to "APIs & Services" → "Library" and enable these APIs:

1. **Maps JavaScript API** ✅
   - Search: "Maps JavaScript API"
   - Click "Enable"

2. **Maps Embed API** ✅
   - Search: "Maps Embed API" 
   - Click "Enable"

3. **Geocoding API** ✅ (Optional)
   - Search: "Geocoding API"
   - Click "Enable"

### Step 3: Create API Key

1. **Go to Credentials**
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"

2. **Copy Your API Key**
   - Copy the generated key (starts with `AIza...`)
   - Example: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 4: Secure Your API Key ⚠️ IMPORTANT

1. **Click on your API key to edit it**

2. **Set Application Restrictions**
   ```
   Application restrictions: HTTP referrers (web sites)
   
   
   Website restrictions:
   ✅ http://localhost:3000/*
   ✅ https://yourdomain.com/*
   ✅ http://127.0.0.1:3000/*
   ```

3. **Set API Restrictions**
   ```
   API restrictions: Restrict key
   
   Select APIs:
   ✅ Maps JavaScript API
   ✅ Maps Embed API
   ✅ Geocoding API
   ```

4. **Save the changes**

### Step 5: Add API Key to Your Project

1. **Create/Update .env file**
   ```bash
   # In your frontend directory
   touch .env
   ```

2. **Add your API key**
   ```env
   REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Restart your development server**
   ```bash
   npm start
   # or
   yarn start
   ```

## 🧪 Testing the Integration

1. **Start your YATRIK ERP application**
2. **Go to the landing page**
3. **Click "Track Bus" button**
4. **Verify the map loads correctly**

## 🎯 Expected Results

### ✅ Success Indicators:
- Google Maps loads in the bus tracking modal
- Bus locations are displayed as markers
- Interactive map with zoom/pan functionality
- No console errors related to maps

### ❌ Common Issues:

1. **"This page can't load Google Maps correctly"**
   - Check if API key is correctly set in .env
   - Verify API key restrictions allow your domain
   - Ensure required APIs are enabled

2. **"For development purposes only" watermark**
   - Add billing account to your Google Cloud project
   - Enable billing for the APIs

3. **API key not working**
   - Check if the key starts with `AIza`
   - Verify the key is not restricted to wrong domains
   - Ensure Maps Embed API is enabled

## 💰 Billing Information

### Free Tier Limits:
- **Maps Embed API**: 25,000 requests/month
- **Maps JavaScript API**: 28,000 requests/month
- **Geocoding API**: 40,000 requests/month

### After Free Tier:
- Maps Embed API: $7.00 per 1,000 requests
- Maps JavaScript API: $7.00 per 1,000 requests
- Geocoding API: $5.00 per 1,000 requests

## 🔧 Configuration Options

### Environment Variables:
```env
# Required
REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here

# Optional
REACT_APP_GOOGLE_MAPS_DEFAULT_ZOOM=13
REACT_APP_GOOGLE_MAPS_DEFAULT_CENTER_LAT=9.9312
REACT_APP_GOOGLE_MAPS_DEFAULT_CENTER_LNG=76.2673
```

### Map Configuration:
The map configuration is stored in `frontend/src/config/maps.js` and can be customized:

```javascript
export const GOOGLE_MAPS_CONFIG = {
  API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  DEFAULT_ZOOM: 13,
  DEFAULT_CENTER: {
    lat: 9.9312, // Kochi, Kerala
    lng: 76.2673
  }
};
```

## 🚨 Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables for API keys**
3. **Restrict API keys to specific domains**
4. **Monitor API usage in Google Cloud Console**
5. **Set up billing alerts**

## 📞 Support

If you encounter issues:

1. **Check Google Cloud Console** for API status
2. **Review the browser console** for error messages
3. **Verify your .env file** is in the correct location
4. **Ensure your development server** is restarted after adding the API key

## 🎉 Success!

Once configured correctly, you should see:
- Interactive Google Maps in the bus tracking modal
- Real-time bus locations with coordinates
- Smooth map interactions (zoom, pan, etc.)
- Professional map styling

Your YATRIK ERP bus tracking feature is now fully integrated with Google Maps! 🚌🗺️
