// backend/utils/jwtFactory.js
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

/**
 * Sign a Super Admin JWT
 * @param {number} id - SuperAdmin ID
 * @returns {{ token: string, jti: string }}
 */
function signSuperAdminToken(id) {
  const jti = uuidv4();
  const token = jwt.sign(
    { sub: id, role: 'super_admin', jti },
    process.env.JWT_SECRET_SUPER_ADMIN,
    { expiresIn: '2h' }
  );
  return { token, jti };
}

/**
 * Sign an Admin JWT
 * @param {object} admin - Admin model instance
 * @returns {string} JWT token
 */
function signAdminToken(admin) {
  return jwt.sign(
    {
      sub: admin.id,
      role: 'admin',
      org: admin.organization_id,
      org_role: admin.role,
    },
    process.env.JWT_SECRET_ADMIN,
    { expiresIn: '8h' }
  );
}

/**
 * Sign a User JWT
 * @param {object} user - User model instance
 * @returns {string} JWT token
 */
function signUserToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: 'user',
      org: user.organization_id,
    },
    process.env.JWT_SECRET_USER,
    { expiresIn: '24h' }
  );
}

/**
 * Sign a Magic Link JWT (short-lived, one-time)
 * @param {number} userId
 * @param {number} orgId
 * @returns {string} JWT token
 */
function signMagicLinkToken(userId, orgId) {
  return jwt.sign(
    {
      sub: userId,
      role: 'user',
      org: orgId,
      type: 'magic_link',
    },
    process.env.JWT_SECRET_MAGIC_LINK,
    { expiresIn: '15m' }
  );
}

/**
 * Verify a token with the appropriate secret
 * @param {string} token
 * @param {'super_admin'|'admin'|'user'|'magic_link'} type
 * @returns {object} decoded payload
 */
function verifyToken(token, type) {
  const secrets = {
    super_admin: process.env.JWT_SECRET_SUPER_ADMIN,
    admin: process.env.JWT_SECRET_ADMIN,
    user: process.env.JWT_SECRET_USER,
    magic_link: process.env.JWT_SECRET_MAGIC_LINK,
  };
  return jwt.verify(token, secrets[type]);
}

module.exports = {
  signSuperAdminToken,
  signAdminToken,
  signUserToken,
  signMagicLinkToken,
  verifyToken,
};
