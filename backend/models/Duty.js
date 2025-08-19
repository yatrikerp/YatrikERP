const mongoose = require('mongoose');

const dutySchema = new mongoose.Schema({
	tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
	driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	conductorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	startedAt: { type: Date },
	endedAt: { type: Date },
	status: { type: String, enum: ['open','closed'], default: 'open' }
}, { timestamps: true });

module.exports = mongoose.model('Duty', dutySchema);


