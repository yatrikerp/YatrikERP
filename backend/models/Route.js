const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  distanceKm: { type: Number, default: 0 }
}, { timestamps: true });

// Indexes
// code index is already defined as unique in schema

// Virtual for route summary
// keep simple per Phase-0

module.exports = mongoose.model('Route', routeSchema);
