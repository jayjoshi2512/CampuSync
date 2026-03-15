// backend/middleware/checkStorageLimit.js
const Organization = require('../models/Organization');

/**
 * Middleware that checks if the organization has exceeded its storage limit.
 * Must be used AFTER auth middleware (requires req.actor.org).
 * Attaches req.org for use in downstream controllers.
 */
async function checkStorageLimit(req, res, next) {
  try {
    const orgId = req.actor?.org;
    if (!orgId) {
      return res.status(403).json({ error: 'Organization context required' });
    }

    const org = await Organization.findByPk(orgId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const usedGb = parseFloat(org.storage_used_gb) || 0;
    const limitGb = parseFloat(org.storage_limit_gb) || 0;

    if (usedGb >= limitGb) {
      return res.status(429).json({
        error: 'Storage limit reached',
        message: `Your organization has used ${usedGb.toFixed(2)} GB of ${limitGb.toFixed(2)} GB. Please upgrade your plan or contact support.`,
        storage_used_gb: usedGb,
        storage_limit_gb: limitGb,
      });
    }

    // Attach org to request for downstream use
    req.org = org;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to check storage limit' });
  }
}

module.exports = { checkStorageLimit };
