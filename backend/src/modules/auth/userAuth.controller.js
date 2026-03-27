// backend/src/modules/auth/userAuth.controller.js
const { User, Card, CardScanEvent, Organization, AlumniRequest } = require('../models');
const redis = require('../../../config/redis');
const { sendMail } = require('../../../config/mailer');
const { signUserToken, signMagicLinkToken } = require('../../../utils/jwtFactory');
const { magicLinkEmail, passwordResetEmail } = require('../../../utils/emailTemplates');
const auditLog = require('../../../utils/auditLog');
const { logger } = require('../../../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Helper to build full actor response
async function buildActorResponse(user, org) {
    let qr_hash = null;
    try {
        const card = await Card.findOne({ user_id: user._id }).select('qr_hash').lean();
        if (card) qr_hash = card.qr_hash;
    } catch (e) {}

    let pending_alumni_request = false;
    try {
        const ar = await AlumniRequest.findOne({ user_id: user._id, status: 'pending' });
        if (ar) pending_alumni_request = true;
    } catch (e) {}

    return {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roll_number: user.roll_number,
        branch: user.branch,
        batch_year: user.batch_year,
        avatar_url: user.avatar_url,
        linkedin_url: user.linkedin_url,
        github_url: user.github_url,
        twitter_url: user.twitter_url,
        website_url: user.website_url,
        instagram_url: user.instagram_url,
        bio: user.bio,
        has_password: !!user.password_hash,
        qr_hash,
        pending_alumni_request,
        organization: {
            id: org._id,
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

async function requestMagicLink(req, res) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'No account found with this email. Please contact your institution admin.' });
        if (!user.is_active) return res.status(403).json({ error: 'Your account has been deactivated. Please contact your institution admin.' });

        const org = await Organization.findById(user.organization_id);
        if (!org || (org.status !== 'active' && org.status !== 'trial')) {
            return res.status(403).json({ error: 'Your institution is not currently active.' });
        }

        const magicToken = signMagicLinkToken(user._id, user.organization_id);
        await redis.set(`magic_link:${magicToken}`, user._id.toString(), 900);

        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
        const link = `${appBaseUrl}/portal?magic=${magicToken}`;
        sendMail(user.email, 'Your Login Link', magicLinkEmail(user.name, link))
            .catch(e => logger.error('Failed to send magic link:', e.message));

        res.json({ message: 'Magic link sent! Check your email inbox.' });
    } catch (err) {
        logger.error('requestMagicLink error:', err.message);
        res.status(500).json({ error: 'Failed to process request.' });
    }
}

async function verifyMagicLink(req, res) {
    try {
        const { token } = req.params;
        const userId = await redis.get(`magic_link:${token}`);
        if (!userId) return res.status(400).json({ error: 'Login link expired or already used.' });

        const user = await User.findById(userId);
        if (!user || !user.is_active) return res.status(400).json({ error: 'User not found or inactive.' });

        await redis.del(`magic_link:${token}`);
        user.last_login_at = new Date();
        await user.save();

        const jwtToken = signUserToken(user);
        const org = await Organization.findById(user.organization_id).select('_id name slug plan brand_color brand_color_rgb logo_url selected_card_template card_back_image_url');

        res.json({ message: 'Login successful.', token: jwtToken, actor: await buildActorResponse(user, org) });
    } catch (err) {
        logger.error('verifyMagicLink error:', err.message);
        res.status(500).json({ error: 'Login failed.' });
    }
}

async function qrLogin(req, res) {
    try {
        const { qr_hash } = req.params;
        const card = await Card.findOne({ qr_hash });
        if (!card) return res.status(404).json({ error: 'Card not found.' });

        const user = await User.findById(card.user_id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const org = await Organization.findById(user.organization_id);
        if (!org || (org.status !== 'active' && org.status !== 'trial')) {
            return res.status(403).json({ error: 'Organization is not active.' });
        }

        card.scan_count = (card.scan_count || 0) + 1;
        card.last_scanned_at = new Date();
        await card.save();

        CardScanEvent.create({
            card_id: card._id,
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('user-agent'),
        }).catch(() => {});

        user.last_login_at = new Date();
        await user.save();
        const token = signUserToken(user);

        res.json({ message: 'Login successful.', token, actor: await buildActorResponse(user, org) });
    } catch (err) {
        logger.error('qrLogin error:', err.message);
        res.status(500).json({ error: 'Login failed.' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

        const user = await User.findOne({ email, is_active: true });
        if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
        if (!user.password_hash) return res.status(401).json({ error: 'Please use a magic link to log in for the first time.' });

        const isValid = await user.validatePassword(password);
        if (!isValid) return res.status(401).json({ error: 'Invalid email or password.' });

        const org = await Organization.findById(user.organization_id);
        if (!org || (org.status !== 'active' && org.status !== 'trial')) {
            return res.status(403).json({ error: 'Organization is not active.' });
        }

        user.last_login_at = new Date();
        await user.save();
        const token = signUserToken(user);

        res.json({ message: 'Login successful.', token, actor: await buildActorResponse(user, org) });
    } catch (err) {
        logger.error('user login error:', err.message);
        res.status(500).json({ error: 'Login failed.' });
    }
}

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required.' });

        const user = await User.findOne({ email });
        if (!user) return res.json({ message: 'If this email is registered, a reset link has been sent.' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        await redis.set(`password_reset:${resetToken}`, user._id.toString(), 1800);

        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
        const link = `${appBaseUrl}/reset-password?token=${resetToken}`;
        const html = typeof passwordResetEmail === 'function'
            ? passwordResetEmail(user.name, link)
            : `<p>Hi ${user.name},</p><p>Click <a href="${link}">here</a> to reset your password. Expires in 30 minutes.</p>`;

        sendMail(user.email, 'Password Reset', html).catch(e => logger.error('Password reset mail error:', e.message));
        res.json({ message: 'If this email is registered, a reset link has been sent.' });
    } catch (err) {
        logger.error('forgotPassword error:', err.message);
        res.status(500).json({ error: 'Failed to process request.' });
    }
}

async function resetPassword(req, res) {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ error: 'Token and password required.' });
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        if (!/[A-Z]/.test(password)) return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' });
        if (!/[a-z]/.test(password)) return res.status(400).json({ error: 'Password must contain at least one lowercase letter.' });
        if (!/[0-9]/.test(password)) return res.status(400).json({ error: 'Password must contain at least one number.' });

        const userId = await redis.get(`password_reset:${token}`);
        if (!userId) return res.status(400).json({ error: 'Reset link expired or already used.' });

        const user = await User.findById(userId);
        if (!user) return res.status(400).json({ error: 'User not found.' });

        await redis.del(`password_reset:${token}`);
        user.password_hash = await bcrypt.hash(password, 12);
        await user.save();

        auditLog.log('user', user._id, 'PASSWORD_RESET', 'user', user._id, null, req);
        res.json({ message: 'Password updated successfully. You can now log in.' });
    } catch (err) {
        logger.error('resetPassword error:', err.message);
        res.status(500).json({ error: 'Failed to reset password.' });
    }
}

async function changePassword(req, res) {
    try {
        const { current_password, new_password } = req.body;
        if (!new_password) return res.status(400).json({ error: 'New password is required.' });
        if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        if (!/[A-Z]/.test(new_password)) return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' });
        if (!/[a-z]/.test(new_password)) return res.status(400).json({ error: 'Password must contain at least one lowercase letter.' });
        if (!/[0-9]/.test(new_password)) return res.status(400).json({ error: 'Password must contain at least one number.' });

        const user = await User.findById(req.actor.id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        if (user.password_hash) {
            if (!current_password) return res.status(400).json({ error: 'Current password is required.' });
            const valid = await bcrypt.compare(current_password, user.password_hash);
            if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        user.password_hash = await bcrypt.hash(new_password, 12);
        await user.save();

        auditLog.log('user', user._id, 'PASSWORD_CHANGED', 'user', user._id, null, req);
        res.json({ message: 'Password changed successfully.' });
    } catch (err) {
        logger.error('change password error:', err.message);
        res.status(500).json({ error: 'Failed to change password.' });
    }
}

async function getMe(req, res) {
    try {
        const user = await User.findById(req.actor.id);
        if (!user || !user.is_active) return res.status(404).json({ error: 'User not found' });
        const org = await Organization.findById(user.organization_id);
        res.json({ actor: await buildActorResponse(user, org) });
    } catch (err) {
        logger.error('getMe error:', err.message);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}

module.exports = { requestMagicLink, verifyMagicLink, qrLogin, login, forgotPassword, resetPassword, changePassword, getMe };
