const AuditLog = require('../models/AuditLog');

/**
 * Write audit log for admin actions
 * @param {Object} req - Express request object
 * @param {Object} payload - Audit payload
 * @param {string} payload.action - Action performed
 * @param {Object} payload.target - Target object {collection, id}
 * @param {*} payload.before - State before change
 * @param {*} payload.after - State after change
 * @param {Object} payload.metadata - Additional metadata
 */
async function writeAudit(req, payload) {
  try {
    if (!req.user) {
      console.error('Audit: No user in request');
      return;
    }

    const auditData = {
      actorId: req.user._id,
      actorRole: req.user.role.toUpperCase(),
      action: payload.action,
      target: payload.target,
      before: payload.before,
      after: payload.after,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      ua: req.get('User-Agent') || 'unknown',
      metadata: payload.metadata || {}
    };

    const auditLog = new AuditLog(auditData);
    await auditLog.save();

    console.log(`Audit logged: ${payload.action} on ${payload.target.collection}:${payload.target.id} by ${req.user.role}`);
  } catch (error) {
    console.error('Error writing audit log:', error);
    // Don't throw - audit failure shouldn't break main functionality
  }
}

/**
 * Create audit payload for common operations
 */
const auditPayloads = {
  create: (collection, id, after, metadata = {}) => ({
    action: 'CREATE',
    target: { collection, id },
    before: null,
    after,
    metadata
  }),

  update: (collection, id, before, after, metadata = {}) => ({
    action: 'UPDATE',
    target: { collection, id },
    before,
    after,
    metadata
  }),

  delete: (collection, id, before, metadata = {}) => ({
    action: 'DELETE',
    target: { collection, id },
    before,
    after: null,
    metadata
  }),

  statusChange: (collection, id, before, after, reason, metadata = {}) => ({
    action: after.status === 'active' ? 'ACTIVATE' : 
            after.status === 'inactive' ? 'DEACTIVATE' : 'SUSPEND',
    target: { collection, id },
    before,
    after,
    metadata: { ...metadata, reason }
  }),

  roleChange: (collection, id, before, after, reason, metadata = {}) => ({
    action: 'ROLE_CHANGE',
    target: { collection, id },
    before,
    after,
    metadata: { ...metadata, reason }
  })
};

module.exports = {
  writeAudit,
  auditPayloads
};
