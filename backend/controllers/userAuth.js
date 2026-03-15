// backend/controllers/userAuth.js
const User = require('../models/User');
const Card = require('../models/Card');
const CardScanEvent = require('../models/CardScanEvent');
const Organization = require('../models/Organization');
const redis = require('../config/redis');
const { sendMail } = require('../config/mailer');
const { signUserToken, signMagicLinkToken, verifyToken } = require('../utils/jwtFactory');
const { magicLinkEmail, passwordResetEmail } = require('../utils/emailTemplates');
const auditLog = require('../utils/auditLog');
const { logger } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Helper to build full actor response
function buildActorResponse(user, org) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: 'user',
    roll_number: user.roll_number,
    branch: user.branch,
    batch_year: user.batch_year,
    avatar_url: user.avatar_url,
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
  };
}

/**
 * POST /api/user/magic-link
 */
async function requestMagicLink(req, res) {
  try {
    const { email } = req.body;

    // Step 1: Check if user exists at all
    const user = await User.scope('withInactive').findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email. Please contact your institution admin.' });
    }

    // Step 2: Check if user is active
    if (user.is_active !== 1) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact your institution admin.' });
    }

    const org = await Organization.findByPk(user.organization_id);
    if (!org || (org.status !== 'active' && org.status !== 'trial')) {
      return res.status(403).json({ error: 'Your institution is not currently active.' });
    }

    const magicToken = signMagicLinkToken(user.id, user.organization_id);
    await redis.set(`magic_link:${magicToken}`, user.id.toString(), 900); // 15 min TTL

    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
    const link = `${appBaseUrl}/portal?magic=${magicToken}`;

    sendMail(user.email, 'Your Login Link', magicLinkEmail(user.name, link))
      .catch((e) => logger.error('Failed to send magic link:', e.message));

    res.json({ message: 'Magic link sent! Check your email inbox.' });
  } catch (err) {
    logger.error('requestMagicLink error:', err.message);
    res.status(500).json({ error: 'Failed to process request.' });
  }
}

/**
 * GET /api/user/verify-magic-link/:token
 */
async function verifyMagicLink(req, res) {
  try {
    const { token } = req.params;

    const userId = await redis.get(`magic_link:${token}`);
    if (!userId) {
      return res.status(400).json({ error: 'Login link expired or already used.' });
    }

    const user = await User.findByPk(parseInt(userId));
    if (!user || user.is_active !== 1) {
      return res.status(400).json({ error: 'User not found or inactive.' });
    }

    await redis.del(`magic_link:${token}`);
    await user.update({ last_login_at: new Date() });

    const jwtToken = signUserToken(user);

    const org = await Organization.findByPk(user.organization_id, {
      attributes: ['id', 'name', 'slug', 'plan', 'brand_color', 'brand_color_rgb', 'logo_url', 'selected_card_template', 'card_back_image_url'],
    });

    res.json({
      message: 'Login successful.',
      token: jwtToken,
      actor: buildActorResponse(user, org),
    });
  } catch (err) {
    logger.error('verifyMagicLink error:', err.message);
    res.status(500).json({ error: 'Login failed.' });
  }
}

/**
 * GET /api/user/qr-login/:qr_hash
 */
async function qrLogin(req, res) {
  try {
    const { qr_hash } = req.params;

    const card = await Card.findOne({ where: { qr_hash } });
    if (!card) {
      return res.status(404).json({ error: 'Card not found.' });
    }

    const user = await User.findByPk(card.user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const org = await Organization.findByPk(user.organization_id);
    if (!org || (org.status !== 'active' && org.status !== 'trial')) {
      return res.status(403).json({ error: 'Organization is not active.' });
    }

    await card.increment('scan_count');
    await card.update({ last_scanned_at: new Date() });

    CardScanEvent.create({
      card_id: card.id,
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.get('user-agent'),
    }).catch(() => {});

    await user.update({ last_login_at: new Date() });
    const token = signUserToken(user);

    res.json({
      message: 'Login successful.',
      token,
      actor: buildActorResponse(user, org),
    });
  } catch (err) {
    logger.error('qrLogin error:', err.message);
    res.status(500).json({ error: 'Login failed.' });
  }
}

/**
 * POST /api/user/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Please use a magic link to log in for the first time.' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const org = await Organization.findByPk(user.organization_id);
    if (!org || (org.status !== 'active' && org.status !== 'trial')) {
      return res.status(403).json({ error: 'Organization is not active.' });
    }

    await user.update({ last_login_at: new Date() });
    const token = signUserToken(user);

    res.json({
      message: 'Login successful.',
      token,
      actor: buildActorResponse(user, org),
    });
  } catch (err) {
    logger.error('user login error:', err.message);
    res.status(500).json({ error: 'Login failed.' });
  }
}

/**
 * POST /api/user/forgot-password
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ message: 'If this email is registered, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await redis.set(`password_reset:${resetToken}`, user.id.toString(), 1800); // 30 min

    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
    const link = `${appBaseUrl}/reset-password?token=${resetToken}`;

    const html = typeof passwordResetEmail === 'function'
      ? passwordResetEmail(user.name, link)
      : `<p>Hi ${user.name},</p><p>Click <a href="${link}">here</a> to reset your password. This link expires in 30 minutes.</p>`;

    sendMail(user.email, 'Password Reset', html)
      .catch((e) => logger.error('Password reset mail error:', e.message));

    res.json({ message: 'If this email is registered, a reset link has been sent.' });
  } catch (err) {
    logger.error('forgotPassword error:', err.message);
    res.status(500).json({ error: 'Failed to process request.' });
  }
}

/**
 * POST /api/user/reset-password
 */
async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password required.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const userId = await redis.get(`password_reset:${token}`);
    if (!userId) return res.status(400).json({ error: 'Reset link expired or already used.' });

    const user = await User.findByPk(parseInt(userId));
    if (!user) return res.status(400).json({ error: 'User not found.' });

    await redis.del(`password_reset:${token}`);

    const hash = await bcrypt.hash(password, 12);
    await user.update({ password_hash: hash });

    auditLog.log('user', user.id, 'PASSWORD_RESET', 'user', user.id, null, req);
    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    logger.error('resetPassword error:', err.message);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
}

/**
 * POST /api/user/change-password (authenticated)
 */
async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;
    if (!new_password) return res.status(400).json({ error: 'New password is required.' });
    if (new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const user = await User.findByPk(req.actor.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // If user has a password, validate current
    if (user.password_hash) {
      if (!current_password) return res.status(400).json({ error: 'Current password is required.' });
      const valid = await bcrypt.compare(current_password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    await user.update({ password_hash: hash });

    auditLog.log('user', user.id, 'PASSWORD_CHANGED', 'user', user.id, null, req);
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    logger.error('change password error:', err.message);
    res.status(500).json({ error: 'Failed to change password.' });
  }
}

/**
 * GET /api/user/me
 */
async function getMe(req, res) {
  try {
    const user = await User.findByPk(req.actor.id);
    if (!user || user.is_active !== 1) return res.status(404).json({ error: 'User not found' });
    const org = await Organization.findByPk(user.organization_id);
    res.json({ actor: buildActorResponse(user, org) });
  } catch (err) {
    logger.error('getMe error:', err.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

module.exports = {
  requestMagicLink,
  verifyMagicLink,
  qrLogin,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
};
