// backend/src/modules/auth/adminAuth.controller.js
const bcrypt = require('bcryptjs');
const { Admin, Organization } = require('../models');
const { signAdminToken } = require('../../../utils/jwtFactory');
const auditLog = require('../../../utils/auditLog');
const { logger } = require('../../../config/database');

async function login(req, res) {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email, is_active: true });
        if (!admin) return res.status(401).json({ error: 'Invalid email or password.' });
        if (!admin.password_hash) return res.status(401).json({ error: 'Please set up your password first using the onboarding link.' });

        const isValid = await admin.validatePassword(password);
        if (!isValid) return res.status(401).json({ error: 'Invalid email or password.' });

        const org = await Organization.findById(admin.organization_id);
        if (!org || (org.status !== 'active' && org.status !== 'trial')) {
            return res.status(403).json({ error: 'Your organization account is not active. Contact platform support.' });
        }

        admin.last_login_at = new Date();
        admin.last_login_ip = req.ip || req.connection?.remoteAddress;
        await admin.save();

        const token = signAdminToken(admin);
        auditLog.log('admin', admin._id, 'ADMIN_LOGIN', 'organization', org._id, null, req);

        res.json({
            message: 'Login successful.',
            token,
            actor: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                role: 'admin',
                org_role: admin.role,
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
            },
        });
    } catch (err) {
        logger.error('admin login error:', err.message);
        res.status(500).json({ error: 'Login failed.' });
    }
}

async function setupPassword(req, res) {
    try {
        const { token, password } = req.body;
        const admin = await Admin.findOne({ onboarding_token: token });
        if (!admin) return res.status(400).json({ error: 'Invalid or expired setup link.' });
        if (admin.onboarding_token_expires_at && new Date() > new Date(admin.onboarding_token_expires_at)) {
            return res.status(400).json({ error: 'Setup link has expired. Contact your platform administrator for a new one.' });
        }

        admin.password_hash = await bcrypt.hash(password, 12);
        admin.onboarding_token = null;
        admin.onboarding_token_expires_at = null;
        await admin.save();

        // Mark org password_set
        await Organization.findByIdAndUpdate(admin.organization_id, { password_set: true });

        auditLog.log('admin', admin._id, 'ADMIN_PASSWORD_SET', 'admin', admin._id, null, req);
        res.json({ message: 'Password set successfully. You can now log in.' });
    } catch (err) {
        logger.error('setupPassword error:', err.message);
        res.status(500).json({ error: 'Failed to set password.' });
    }
}

async function getMe(req, res) {
    try {
        const admin = await Admin.findById(req.actor.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found.' });
        const org = await Organization.findById(admin.organization_id);
        if (!org) return res.status(404).json({ error: 'Organization not found.' });
        res.json({
            actor: {
                id: admin._id,
                email: admin.email,
                name: admin.name,
                role: 'admin',
                org_role: admin.role,
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
            },
        });
    } catch (err) {
        logger.error('admin getMe error:', err.message);
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
}

module.exports = { login, setupPassword, getMe };
