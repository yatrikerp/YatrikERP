const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
	passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
	boardingStopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop', required: true },
	seatNo: { type: String },
	fareAmount: { type: Number, required: true },
	status: { type: String, enum: ['initiated','paid','issued','cancelled','refunded'], default: 'initiated' },
	createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
