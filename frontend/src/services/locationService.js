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
      timeout: 20000,
      maximumAge: 30000 // 30 seconds
    };
    // High-performance mode
    this.highPerformance = false;
    // Smoothing (exponential moving average)
    this.smoothingFactor = 0.25; // 0..1, higher = more responsive
    this.smoothed = null; // { latitude, longitude, speed, heading, timestamp }
    this.lastRaw = null;
    this.lastCallbackTs = 0;
    this.minCallbackIntervalMs = 800; // throttle callbacks for UI smoothness
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
        const nowIso = new Date().toISOString();
        const raw = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: nowIso,
          speed: typeof position.coords.speed === 'number' ? position.coords.speed : null,
          heading: typeof position.coords.heading === 'number' ? position.coords.heading : null
        };
        // Derive speed/heading if missing using lastRaw
        if (this.lastRaw) {
          const dt = (new Date(nowIso) - new Date(this.lastRaw.timestamp)) / 1000;
          if (dt > 0.2 && dt < 10) {
            const distMeters = this.#haversineMeters(this.lastRaw.latitude, this.lastRaw.longitude, raw.latitude, raw.longitude);
            if (raw.speed == null) raw.speed = distMeters / dt; // m/s
            if (raw.heading == null) raw.heading = this.#bearing(this.lastRaw.latitude, this.lastRaw.longitude, raw.latitude, raw.longitude);
          }
        }
        this.lastRaw = raw;

        // Smoothing EMA
        if (!this.smoothed) {
          this.smoothed = { ...raw };
        } else {
          const a = this.smoothingFactor;
          this.smoothed = {
            latitude: this.smoothed.latitude + a * (raw.latitude - this.smoothed.latitude),
            longitude: this.smoothed.longitude + a * (raw.longitude - this.smoothed.longitude),
            accuracy: raw.accuracy,
            timestamp: raw.timestamp,
            speed: raw.speed != null && this.smoothed.speed != null ? this.smoothed.speed + a * (raw.speed - this.smoothed.speed) : (raw.speed ?? this.smoothed.speed),
            heading: raw.heading != null && this.smoothed.heading != null ? this.#lerpAngle(this.smoothed.heading, raw.heading, a) : (raw.heading ?? this.smoothed.heading)
          };
        }

        this.currentLocation = this.smoothed;
        this.locationHistory.push(this.smoothed);

        // Keep only last 100 locations
        if (this.locationHistory.length > 100) {
          this.locationHistory = this.locationHistory.slice(-100);
        }

        // Throttle callback for UI & battery
        const now = Date.now();
        if (!this.onLocationUpdate) return;
        if (now - this.lastCallbackTs >= this.minCallbackIntervalMs) {
          this.lastCallbackTs = now;
          this.onLocationUpdate(this.smoothed);
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

  setHighPerformanceMode(enabled) {
    this.highPerformance = !!enabled;
    // lower maximumAge to make updates fresher, adjust throttle
    this.trackingOptions = {
      ...this.trackingOptions,
      maximumAge: enabled ? 0 : 30000,
      timeout: enabled ? 8000 : 10000,
      enableHighAccuracy: true
    };
    this.minCallbackIntervalMs = enabled ? 500 : 800;
  }

  getSmoothedLocation() {
    return this.smoothed || this.currentLocation;
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
          heading: this.currentLocation.heading,
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

  // Utilities
  #toRad(d) { return (d * Math.PI) / 180; }
  #toDeg(r) { return (r * 180) / Math.PI; }
  #haversineMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = this.#toRad(lat2 - lat1);
    const dLon = this.#toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) ** 2 + Math.cos(this.#toRad(lat1)) * Math.cos(this.#toRad(lat2)) * Math.sin(dLon/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  #bearing(lat1, lon1, lat2, lon2) {
    const y = Math.sin(this.#toRad(lon2 - lon1)) * Math.cos(this.#toRad(lat2));
    const x = Math.cos(this.#toRad(lat1)) * Math.sin(this.#toRad(lat2)) - Math.sin(this.#toRad(lat1)) * Math.cos(this.#toRad(lat2)) * Math.cos(this.#toRad(lon2 - lon1));
    return (this.#toDeg(Math.atan2(y, x)) + 360) % 360;
  }
  #lerpAngle(a, b, t) {
    let diff = ((b - a + 540) % 360) - 180;
    return (a + diff * t + 360) % 360;
  }
}

// Create singleton instance
const locationService = new LocationService();

export default locationService;
