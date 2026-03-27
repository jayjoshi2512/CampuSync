// backend/middleware/requireOrgActive.js
const { Organization } = require('../src/modules/models');

/**
 * Middleware that checks if the actor's organization has status 'active'.
 * Must be used AFTER auth middleware (requires req.actor.org).
 */
async function requireOrgActive(req, res, next) {
  try {
    const orgId = req.actor?.org;
    if (!orgId) {
      return res.status(403).json({ error: 'Organization context required' });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (org.status !== 'active' && org.status !== 'trial') {
      return res.status(403).json({
        error: 'Account suspended or not yet approved',
        message: `Your organization status is "${org.status}". Please contact the platform administrator.`,
        status: org.status,
      });
    }

    // Attach org if not already present
    if (!req.org) {
      req.org = org;
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify organization status' });
  }
}

module.exports = { requireOrgActive };
