const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
	bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
	pnr: { type: String, unique: true, required: true },
	qrPayload: { type: String, required: true },
	expiresAt: { type: Date, required: true },
	state: { type: String, enum: ['issued','active','validated','expired'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);


