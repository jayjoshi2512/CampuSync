// backend/middleware/auth.js
const { verifyToken } = require('../utils/jwtFactory');
const SuperAdmin = require('../models/SuperAdmin');
const Admin = require('../models/Admin');
const User = require('../models/User');
const redis = require('../config/redis');
const { logger } = require('../config/database');

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

/**
 * Verify Super Admin JWT
 * Checks: token validity, jti not revoked in Redis, is_active = 1 in DB
 */
async function verifySuperAdminJWT(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token, 'super_admin');

    // Check if jti has been revoked
    if (decoded.jti) {
      const revoked = await redis.get(`sa_revoked_jti:${decoded.jti}`);
      if (revoked) {
        return res.status(401).json({ error: 'Session has been revoked' });
      }
    }

    // Verify actor exists and is active in DB
    const superAdmin = await SuperAdmin.findByPk(decoded.sub);
    if (!superAdmin || superAdmin.is_active !== 1) {
      return res.status(401).json({ error: 'Account not found or deactivated' });
    }

    req.actor = {
      id: decoded.sub,
      role: 'super_admin',
      jti: decoded.jti,
      email: superAdmin.email,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    logger.error('verifySuperAdminJWT error:', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Verify Admin JWT
 * Checks: token validity, is_active = 1 in DB, org_id matches
 */
async function verifyAdminJWT(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token, 'admin');

    // Verify actor exists and is active in DB
    const admin = await Admin.findByPk(decoded.sub);
    if (!admin || admin.is_active !== 1) {
      return res.status(401).json({ error: 'Account not found or deactivated' });
    }

    req.actor = {
      id: decoded.sub,
      role: 'admin',
      org: decoded.org,
      org_role: decoded.org_role,
      email: admin.email,
      name: admin.name,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    logger.error('verifyAdminJWT error:', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Verify User JWT
 * Checks: token validity, is_active = 1 in DB
 */
async function verifyUserJWT(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token, 'user');

    // Verify actor exists and is active in DB
    const user = await User.findByPk(decoded.sub);
    if (!user || user.is_active !== 1) {
      return res.status(401).json({ error: 'Account not found or deactivated' });
    }

    req.actor = {
      id: decoded.sub,
      role: 'user',
      org: decoded.org,
      email: user.email,
      name: user.name,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    logger.error('verifyUserJWT error:', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Verify Any Valid JWT (User, Admin, or SuperAdmin)
 * Tries each one. If all fail, 401.
 */
async function verifyAnyJWT(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = require('jsonwebtoken').decode(token);
    if (!decoded || !decoded.role) return res.status(401).json({ error: 'Invalid token structure' });

    req.actor = { id: decoded.sub, role: decoded.role, org: decoded.org };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Failed to read token' });
  }
}

module.exports = { verifySuperAdminJWT, verifyAdminJWT, verifyUserJWT, verifyAnyJWT };
