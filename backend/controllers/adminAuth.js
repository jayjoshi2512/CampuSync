// backend/controllers/adminAuth.js
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Organization = require('../models/Organization');
const { signAdminToken } = require('../utils/jwtFactory');
const auditLog = require('../utils/auditLog');
const { logger } = require('../config/database');

/**
 * POST /api/admin/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!admin.password_hash) {
      return res.status(401).json({ error: 'Please set up your password first using the onboarding link.' });
    }

    const isValid = await admin.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check org is active
    const org = await Organization.findByPk(admin.organization_id);
    if (!org || (org.status !== 'active' && org.status !== 'trial')) {
      return res.status(403).json({ error: 'Your organization account is not active. Contact platform support.' });
    }

    // Update login info
    await admin.update({
      last_login_at: new Date(),
      last_login_ip: req.ip || req.connection?.remoteAddress,
    });

    const token = signAdminToken(admin);

    auditLog.log('admin', admin.id, 'ADMIN_LOGIN', 'organization', org.id, null, req);

    res.json({
      message: 'Login successful.',
      token,
      actor: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
        org_role: admin.role,
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          plan: org.plan,
          brand_color: org.brand_color,
          brand_color_rgb: org.brand_color_rgb,
          logo_url: org.logo_url,
          selected_card_template: org.selected_card_template,
          card_back_image_url: org.card_back_image_url,
        },
      },
    });
  } catch (err) {
    logger.error('admin login error:', err.message);
    res.status(500).json({ error: 'Login failed.' });
  }
}

/**
 * POST /api/admin/setup-password
 */
async function setupPassword(req, res) {
  try {
    const { token, password } = req.body;

    const admin = await Admin.findOne({ where: { onboarding_token: token } });
    if (!admin) {
      return res.status(400).json({ error: 'Invalid or expired setup link.' });
    }

    if (admin.onboarding_token_expires_at && new Date() > new Date(admin.onboarding_token_expires_at)) {
      return res.status(400).json({ error: 'Setup link has expired. Contact your platform administrator for a new one.' });
    }

    // Hash password and clear token
    const passwordHash = await bcrypt.hash(password, 12);
    await admin.update({
      password_hash: passwordHash,
      onboarding_token: null,
      onboarding_token_expires_at: null,
    });

    // Update org password_set flag
    await Organization.update(
      { password_set: 1 },
      { where: { id: admin.organization_id } }
    );

    auditLog.log('admin', admin.id, 'ADMIN_PASSWORD_SET', 'admin', admin.id, null, req);

    res.json({ message: 'Password set successfully. You can now log in.' });
  } catch (err) {
    logger.error('setupPassword error:', err.message);
    res.status(500).json({ error: 'Failed to set password.' });
  }
}

module.exports = { login, setupPassword };
