const mongoose = require('mongoose');

const routeStopSchema = new mongoose.Schema({
	routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
	stopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop', required: true },
	sequence: { type: Number, required: true },
	stdArrival: { type: String, default: null },
	stdDeparture: { type: String, default: null }
}, { timestamps: true });

routeStopSchema.index({ routeId: 1, stopId: 1 }, { unique: true });
routeStopSchema.index({ routeId: 1, sequence: 1 });

module.exports = mongoose.model('RouteStop', routeStopSchema);


