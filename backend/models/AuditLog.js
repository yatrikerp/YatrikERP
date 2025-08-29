const mongoose = require('mongoose');

// Feature flag to disable all audit writes (prevents collection recreation)
const AUDIT_DISABLED = (process.env.AUDIT_DISABLED || process.env.DISABLE_AUDIT_LOGS || '').toString().toLowerCase() === 'true';

if (AUDIT_DISABLED) {
	module.exports = {
		create: async () => undefined,
		insertMany: async () => undefined,
		updateOne: async () => undefined,
		deleteOne: async () => undefined,
		// expose a minimal shape so require() calls don't fail
		modelName: 'AuditLog',
	};
	return;
}

const auditLogSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	action: {
		type: String,
		required: true,
		enum: [
			'login', 'logout', 'create', 'read', 'update', 'delete',
			'booking_created', 'booking_cancelled', 'payment_processed',
			'ticket_issued', 'ticket_validated', 'crew_assigned',
			'fuel_logged', 'route_modified', 'fare_updated',
			'user_role_changed', 'system_config_modified'
		]
	},
	resource: {
		type: String,
		required: true,
		enum: [
			'user', 'booking', 'ticket', 'trip', 'route', 'bus',
			'crew', 'fuel', 'payment', 'system', 'depot'
		]
	},
	resourceId: {
		type: mongoose.Schema.Types.ObjectId,
		required: false
	},
	details: {
		before: mongoose.Schema.Types.Mixed,
		after: mongoose.Schema.Types.Mixed,
		changes: [String]
	},
	ipAddress: String,
	userAgent: String,
	sessionId: String,
	status: {
		type: String,
		enum: ['success', 'failure', 'partial'],
		default: 'success'
	},
	errorMessage: String,
	metadata: {
		browser: String,
		os: String,
		device: String,
		location: String
	},
	severity: {
		type: String,
		enum: ['low', 'medium', 'high', 'critical'],
		default: 'low'
	},
	tags: [String]
}, {
	timestamps: true,
	autoCreate: false,
	autoIndex: false
});

// Indexes for performance and querying (only applied if indexing is enabled elsewhere)
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ status: 1 });
auditLogSchema.index({ tags: 1 });

// TTL index to automatically delete old logs (keep for 2 years)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

