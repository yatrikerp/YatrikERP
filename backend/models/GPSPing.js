const mongoose = require('mongoose');

const gpsPingSchema = new mongoose.Schema({
	tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
	driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	lat: { type: Number, required: true },
	lon: { type: Number, required: true },
	speedKmph: { type: Number, default: 0 },
	at: { type: Date, default: Date.now }
}, { timestamps: true });

gpsPingSchema.index({ tripId: 1, at: -1 });

module.exports = mongoose.model('GPSPing', gpsPingSchema);


