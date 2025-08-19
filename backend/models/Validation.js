const mongoose = require('mongoose');

const validationSchema = new mongoose.Schema({
	ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
	conductorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
	method: { type: String, enum: ['qr','manualPNR'], required: true },
	validatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

validationSchema.index({ ticketId: 1, tripId: 1 }, { unique: true });

module.exports = mongoose.model('Validation', validationSchema);


