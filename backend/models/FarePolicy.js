const mongoose = require('mongoose');

const farePolicySchema = new mongoose.Schema({
	baseFare: { type: Number, default: 0 },
	perKm: { type: Number, default: 0 },
	currency: { type: String, default: 'INR' },
	active: { type: Boolean, default: true },
	updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('FarePolicy', farePolicySchema);


