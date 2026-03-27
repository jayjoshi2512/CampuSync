// backend/utils/auditLog.js
const { AuditLog } = require('../src/modules/models');
const { logger } = require('../config/database');

/**
 * Write an audit log entry (non-blocking — fire-and-forget)
 * @param {string} actorType - 'super_admin' | 'admin' | 'user' | 'system'
 * @param {number|null} actorId - Actor ID
 * @param {string} action - Action identifier (e.g. 'ORG_APPROVED')
 * @param {string|null} targetType - Target entity type (e.g. 'organization')
 * @param {number|null} targetId - Target entity ID
 * @param {object|null} metadata - Additional JSON data
 * @param {object|null} req - Express request object (for IP and user agent)
 */
function log(actorType, actorId, action, targetType = null, targetId = null, metadata = null, req = null) {
  // Fire and forget — do not await, catch errors silently
  AuditLog.create({
    actor_type: actorType,
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    ip_address: req ? (req.ip || req.connection?.remoteAddress || null) : null,
    user_agent: req ? (req.get('user-agent') || null) : null,
    metadata: metadata ? JSON.stringify(metadata) : null,
  }).catch((err) => {
    logger.error(`Audit log write failed: ${action}`, err.message);
  });
}

module.exports = { log };
