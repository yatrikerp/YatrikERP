// Location Service for automatic GPS tracking
class LocationService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.currentLocation = null;
    this.locationHistory = [];
    this.onLocationUpdate = null;
    this.trackingOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // 30 seconds
    };
  }

  // Get current location once
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
            speed: position.coords.speed,
            heading: position.coords.heading
          };
          
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          console.error('Error getting current location:', error);
          reject(error);
        },
        this.trackingOptions
      );
    });
  }

  // Start continuous location tracking
  startTracking(callback) {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return false;
    }

    if (this.isTracking) {
      console.warn('Location tracking is already active');
      return true;
    }

    this.onLocationUpdate = callback;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
          speed: position.coords.speed,
          heading: position.coords.heading
        };

        this.currentLocation = location;
        this.locationHistory.push(location);

        // Keep only last 100 locations
        if (this.locationHistory.length > 100) {
          this.locationHistory = this.locationHistory.slice(-100);
        }

        // Call the callback with new location
        if (this.onLocationUpdate) {
          this.onLocationUpdate(location);
        }
      },
      (error) => {
        console.error('Location tracking error:', error);
        if (this.onLocationUpdate) {
          this.onLocationUpdate(null, error);
        }
      },
      this.trackingOptions
    );

    this.isTracking = true;
    console.log('Location tracking started');
    return true;
  }

  // Stop location tracking
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    this.isTracking = false;
    this.onLocationUpdate = null;
    console.log('Location tracking stopped');
  }

  // Get tracking status
  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      currentLocation: this.currentLocation,
      historyCount: this.locationHistory.length
    };
  }

  // Send location to backend
  async sendLocationToBackend(dutyId, apiEndpoint = '/api/driver/duties') {
    if (!this.currentLocation || !dutyId) return;

    try {
      const response = await fetch(`${apiEndpoint}/${dutyId}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          lat: this.currentLocation.latitude,
          lng: this.currentLocation.longitude,
          timestamp: this.currentLocation.timestamp,
          speed: this.currentLocation.speed,
          accuracy: this.currentLocation.accuracy
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending location to backend:', error);
      throw error;
    }
  }
}

// Create singleton instance
const locationService = new LocationService();

export default locationService;
