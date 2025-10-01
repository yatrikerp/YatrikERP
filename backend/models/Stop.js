const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true, uppercase: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  operatingHours: {
    start: { type: String, default: '00:00' },
    end: { type: String, default: '23:59' }
  }
}, { timestamps: true });

// Indexes
// code index is already defined as unique in schema
stopSchema.index({ name: 'text' });
stopSchema.index({ location: '2dsphere' });

// Pre-save middleware to populate location coordinates from lat/lon
stopSchema.pre('save', function(next) {
  if (this.lat && this.lon && (!this.location || !this.location.coordinates)) {
    this.location = {
      type: 'Point',
      coordinates: [this.lon, this.lat] // [longitude, latitude] format for GeoJSON
    };
  }
  next();
});

// Virtual for full address
stopSchema.virtual('fullAddress').get(function() {
  // For now, just return the stop name since we don't have address details
  return this.name || '';
});

// Virtual for coordinates string
stopSchema.virtual('coordinatesString').get(function() {
  if (this.location.coordinates && this.location.coordinates.length === 2) {
    return `${this.location.coordinates[1]}, ${this.location.coordinates[0]}`; // lat, lng
  }
  return '';
});

// Method to calculate distance to another stop
stopSchema.methods.distanceTo = function(otherStop) {
  if (!this.location.coordinates || !otherStop.location.coordinates) {
    return null;
  }
  
  const [lng1, lat1] = this.location.coordinates;
  const [lng2, lat2] = otherStop.location.coordinates;
  
  // Haversine formula for distance calculation
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Method to check if stop is operational at given time
stopSchema.methods.isOperational = function(time) {
  if (!this.operatingHours.start || !this.operatingHours.end) {
    return true; // Default to operational if no hours specified
  }
  
  const currentTime = time || new Date();
  const currentTimeString = currentTime.toTimeString().slice(0, 5);
  
  return currentTimeString >= this.operatingHours.start && 
         currentTimeString <= this.operatingHours.end;
};

module.exports = mongoose.model('Stop', stopSchema);
