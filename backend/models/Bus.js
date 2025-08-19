const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
	depotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', required: true },
	registrationNo: { type: String, unique: true, required: true, uppercase: true, trim: true },
	capacity: { type: Number, required: true, min: 1 },
	status: { type: String, enum: ['available','running','maintenance'], default: 'available' }
}, { timestamps: true });

module.exports = mongoose.model('Bus', busSchema);


