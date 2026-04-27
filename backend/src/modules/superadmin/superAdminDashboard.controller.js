// backend/src/modules/superadmin/superAdminDashboard.controller.js
const mongoose = require('mongoose');
const { Organization, OrgRegistration, Admin, User, Card, Memory, AuditLog, Payment, AlumniRequest } = require('../models');
const { deleteAsset, getUsageReport } = require('../../../utils/cloudinaryHelpers');
const { approvalEmail, rejectionEmail, onboardingEmail } = require('../../../utils/emailTemplates');
const { sendMail } = require('../../../config/mailer');
const auditLog = require('../../../utils/auditLog');
const crypto = require('crypto');
const { logger } = require('../../../config/database');

async function getStats(req, res) {
    try {
        const [activeOrgs, pendingRegistrations, totalUsers, totalCards, totalMemories, totalAlumniRequests] = await Promise.all([
            Organization.countDocuments({ status: 'active', is_active: true }),
            OrgRegistration.countDocuments({ status: 'pending', is_active: true }),
            User.countDocuments({ is_active: true }),
            Card.countDocuments({ is_active: true }),
            Memory.countDocuments({ is_active: true }),
            AlumniRequest.countDocuments({ is_active: true }),
        ]);

        const storageResult = await Organization.aggregate([{ $group: { _id: null, total: { $sum: '$storage_used_gb' } } }]);
        const mrrResult = await Payment.aggregate([
            { $match: { status: 'captured', created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
            { $group: { _id: null, total: { $sum: '$amount_paise' } } },
        ]);

        const totalStorageGb = storageResult[0]?.total || 0;
        const mrrPaise = mrrResult[0]?.total || 0;

        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 6);
        dateLimit.setHours(0, 0, 0, 0);

        const trendResult = await Organization.aggregate([
            { $match: { created_at: { $gte: dateLimit } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const trendMap = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            trendMap[d.toISOString().split('T')[0]] = 0;
        }
        trendResult.forEach(t => {
            if (trendMap[t._id] !== undefined) trendMap[t._id] = t.count;
        });
        const registrationTrend = Object.keys(trendMap).map(k => ({ day: k.substring(5), count: trendMap[k] }));

        res.json({
            active_organizations: activeOrgs,
            pending_registrations: pendingRegistrations,
            total_users: totalUsers,
            total_cards: totalCards,
            total_memories: totalMemories,
            total_alumni_requests: totalAlumniRequests,
            platform_storage_gb: parseFloat(totalStorageGb).toFixed(2),
            mrr_paise: mrrPaise,
            mrr_display: `₹${(mrrPaise / 100).toLocaleString('en-IN')}`,
            registrationTrend,
        });
    } catch (err) {
        logger.error('getStats error:', err.message);
        res.status(500).json({ error: 'Failed to load stats.' });
    }
}

async function getRegistrations(req, res) {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = { is_active: true };
        if (status) query.status = status;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const [rows, count] = await Promise.all([
            OrgRegistration.find(query).sort({ created_at: -1 }).skip(offset).limit(parseInt(limit)).populate('organization_id', 'name status plan'),
            OrgRegistration.countDocuments(query),
        ]);

        res.json({ registrations: rows, total: count, page: parseInt(page), total_pages: Math.ceil(count / parseInt(limit)) });
    } catch (err) {
        logger.error('getRegistrations error:', err.message);
        res.status(500).json({ error: 'Failed to load registrations.' });
    }
}

async function approveRegistration(req, res) {
    try {
        const { id } = req.params;
        const { welcome_note } = req.body;

        const registration = await OrgRegistration.findById(id);
        if (!registration) return res.status(404).json({ error: 'Registration not found.' });
        if (registration.status !== 'pending') return res.status(400).json({ error: `Registration is already ${registration.status}.` });

        const org = await Organization.findById(registration.organization_id);
        if (!org) return res.status(404).json({ error: 'Organization not found.' });

        org.status = 'active';
        org.approved_by = req.actor.id;
        org.approved_at = new Date();
        org.trial_ends_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await org.save();

        registration.status = 'approved';
        registration.super_admin_note = welcome_note || null;
        await registration.save();

        const onboardingToken = crypto.randomBytes(16).toString('hex');
        
        let admin = await Admin.findOne({ email: registration.contact_email });
        if (admin) {
            admin.organization_id = org._id;
            admin.name = registration.contact_name;
            admin.role = 'owner';
            admin.onboarding_token = onboardingToken;
            admin.onboarding_token_expires_at = new Date(Date.now() + 72 * 60 * 60 * 1000);
            admin.is_active = true;
            await admin.save();
        } else {
            admin = await Admin.create({
                organization_id: org._id,
                name: registration.contact_name,
                email: registration.contact_email,
                role: 'owner',
                onboarding_token: onboardingToken,
                onboarding_token_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000),
            });
        }

        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
        const setupUrl = `${appBaseUrl}/admin/setup-password?token=${onboardingToken}`;
        sendMail(registration.contact_email, `Your Application is Approved — ${org.name}`, approvalEmail(registration.contact_name, org.name, setupUrl))
            .catch(e => logger.error('Failed to send approval email:', e.message));

        auditLog.log('super_admin', req.actor.id, 'ORG_APPROVED', 'organization', org._id, { registration_id: id, welcome_note }, req);
        logger.info(`Organization approved: ${org.name}`);
        res.json({ message: 'Registration approved.', organization_id: org._id, admin_id: admin._id });
    } catch (err) {
        logger.error('approveRegistration error:', err.message);
        res.status(500).json({ error: 'Failed to approve registration.' });
    }
}

async function rejectRegistration(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason || reason.trim().length < 10) return res.status(400).json({ error: 'Rejection reason is required (min 10 characters).' });

        const registration = await OrgRegistration.findById(id);
        if (!registration) return res.status(404).json({ error: 'Registration not found.' });
        if (registration.status !== 'pending') return res.status(400).json({ error: `Registration is already ${registration.status}.` });

        const org = await Organization.findById(registration.organization_id);
        if (org) {
            org.status = 'rejected';
            org.rejection_reason = reason;
            await org.save();
        }

        registration.status = 'rejected';
        registration.super_admin_note = reason;
        await registration.save();

        sendMail(registration.contact_email, `Registration Update — ${registration.institution_name}`, rejectionEmail(registration.contact_name, registration.institution_name, reason))
            .catch(e => logger.error('Failed to send rejection email:', e.message));

        auditLog.log('super_admin', req.actor.id, 'ORG_REJECTED', 'organization', org?._id, { reason }, req);
        res.json({ message: 'Registration rejected.' });
    } catch (err) {
        logger.error('rejectRegistration error:', err.message);
        res.status(500).json({ error: 'Failed to reject registration.' });
    }
}

async function getOrganizations(req, res) {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status) query.status = status;
        if (search) {
            const re = new RegExp(search, 'i');
            query.$or = [{ name: re }, { contact_email: re }];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const [rows, count] = await Promise.all([
            Organization.find(query).sort({ created_at: -1 }).skip(offset).limit(parseInt(limit)).lean(),
            Organization.countDocuments(query),
        ]);

        const enrichedOrgs = await Promise.all(rows.map(async (org) => {
            const user_count = await User.countDocuments({ organization_id: org._id, is_active: true });
            const card_count = await Card.countDocuments({ organization_id: org._id, is_active: true });
            return {
                ...org,
                id: org._id,
                user_count,
                card_count,
                admin_email: org.contact_email,
            };
        }));

        res.json({ organizations: enrichedOrgs, total: count, page: parseInt(page), total_pages: Math.ceil(count / parseInt(limit)) });
    } catch (err) {
        logger.error('getOrganizations error:', err.message);
        res.status(500).json({ error: 'Failed to load organizations.' });
    }
}

async function updateOrganization(req, res) {
    try {
        const { id } = req.params;
        const org = await Organization.findById(id);
        if (!org) return res.status(404).json({ error: 'Organization not found.' });

        const allowedFields = ['status', 'card_quota', 'storage_limit_gb', 'plan'];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) { org[field] = req.body[field]; updates[field] = req.body[field]; }
        }
        await org.save();

        auditLog.log('super_admin', req.actor.id, 'ORG_UPDATED', 'organization', org._id, updates, req);
        res.json({ message: 'Organization updated.', organization: org });
    } catch (err) {
        logger.error('updateOrganization error:', err.message);
        res.status(500).json({ error: 'Failed to update organization.' });
    }
}

async function getAuditLogs(req, res) {
    try {
        const { actor_type, action, start_date, end_date, page = 1, limit = 50, format } = req.query;
        const query = {};
        if (actor_type) query.actor_type = actor_type;
        if (action) query.action = new RegExp(action, 'i');
        if (start_date || end_date) {
            query.created_at = {};
            if (start_date) query.created_at.$gte = new Date(start_date);
            if (end_date) query.created_at.$lte = new Date(end_date);
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const [rows, count] = await Promise.all([
            AuditLog.find(query).sort({ created_at: -1 }).skip(offset).limit(parseInt(limit)),
            AuditLog.countDocuments(query),
        ]);

        if (format === 'csv') {
            const csv = [
                'ID,Timestamp,Actor Type,Actor ID,Action,Target Type,Target ID,IP Address',
                ...rows.map(r => `${r._id},"${r.created_at}",${r.actor_type},${r.actor_id || ''},${r.action},${r.target_type || ''},${r.target_id || ''},${r.ip_address || ''}`),
            ].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
            return res.send(csv);
        }

        res.json({ audit_logs: rows, total: count, page: parseInt(page), total_pages: Math.ceil(count / parseInt(limit)) });
    } catch (err) {
        logger.error('getAuditLogs error:', err.message);
        res.status(500).json({ error: 'Failed to load audit logs.' });
    }
}

async function getTrash(req, res) {
    try {
        const { table = 'organizations', page = 1, limit = 20 } = req.query;
        const modelMap = { organizations: Organization, users: User, memories: Memory, cards: Card };
        const Model = modelMap[table];
        if (!Model) return res.status(400).json({ error: `Invalid table: ${table}. Allowed: ${Object.keys(modelMap).join(', ')}` });

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const [rows, count] = await Promise.all([
            Model.find({ is_active: false }).sort({ updated_at: -1 }).skip(offset).limit(parseInt(limit)),
            Model.countDocuments({ is_active: false }),
        ]);

        const mappedRows = rows.map(r => {
            const doc = r.toObject ? r.toObject() : r;
            let name = `ID: ${doc._id}`;
            if (doc.name) name = doc.name;
            else if (doc.user_name) name = doc.user_name;
            else if (doc.title) name = doc.title;
            else if (doc.caption) name = doc.caption;

            return {
                ...doc,
                id: doc._id,
                type: table.slice(0, -1),
                name,
                deleted_at: doc.updated_at
            };
        });

        res.json({ items: mappedRows, total: count, table, page: parseInt(page) });
    } catch (err) {
        logger.error('getTrash error:', err.message);
        res.status(500).json({ error: 'Failed to load trash.' });
    }
}

async function restoreTrash(req, res) {
    try {
        const { table, id } = req.body;
        const modelMap = { organizations: Organization, users: User, memories: Memory, cards: Card };
        const Model = modelMap[table];
        if (!Model || !id) return res.status(400).json({ error: 'Table and ID are required.' });

        const record = await Model.findOne({ _id: id, is_active: false });
        if (!record) return res.status(404).json({ error: 'Record not found.' });

        record.is_active = true;
        await record.save();
        auditLog.log('super_admin', req.actor.id, 'RECORD_RESTORED', table, id, null, req);
        res.json({ message: 'Record restored.' });
    } catch (err) {
        logger.error('restoreTrash error:', err.message);
        res.status(500).json({ error: 'Failed to restore record.' });
    }
}

async function purgeTrash(req, res) {
    try {
        const { table, id, confirm } = req.body;
        if (confirm !== 'PERMANENTLY_DELETE') return res.status(400).json({ error: 'Confirmation required: set confirm to "PERMANENTLY_DELETE".' });

        const modelMap = { organizations: Organization, users: User, memories: Memory, cards: Card };
        const Model = modelMap[table];
        if (!Model || !id) return res.status(400).json({ error: 'Table and ID are required.' });

        const record = await Model.findOne({ _id: id, is_active: false });
        if (!record) return res.status(404).json({ error: 'Record not found.' });

        const publicIdFields = ['public_id', 'logo_public_id', 'avatar_public_id', 'back_image_public_id', 'card_download_public_id'];
        for (const field of publicIdFields) {
            if (record[field]) {
                try { await deleteAsset(record[field]); } catch (e) { logger.warn(`Failed to delete Cloudinary asset ${record[field]}:`, e.message); }
            }
        }

        if (table === 'organizations') {
            await Admin.deleteOne({ organization_id: record._id });
        }

        await record.deleteOne();
        auditLog.log('super_admin', req.actor.id, 'RECORD_PURGED', table, id, null, req);
        res.json({ message: 'Record permanently deleted.' });
    } catch (err) {
        logger.error('purgeTrash error:', err.message);
        res.status(500).json({ error: 'Failed to purge record.' });
    }
}

async function getStorage(req, res) {
    try {
        const orgs = await Organization.find().select('name storage_used_gb storage_limit_gb plan').sort({ storage_used_gb: -1 });

        let cloudinaryUsage = null;
        try { cloudinaryUsage = await getUsageReport(); } catch (e) { logger.warn('Could not fetch Cloudinary usage:', e.message); }

        res.json({
            organizations: orgs.map(o => ({
                id: o._id,
                name: o.name,
                storage_used_gb: parseFloat(o.storage_used_gb),
                storage_limit_gb: parseFloat(o.storage_limit_gb),
                usage_percent: parseFloat(o.storage_limit_gb) > 0
                    ? ((parseFloat(o.storage_used_gb) / parseFloat(o.storage_limit_gb)) * 100).toFixed(1) : 0,
                plan: o.plan,
            })),
            cloudinary: cloudinaryUsage,
        });
    } catch (err) {
        logger.error('getStorage error:', err.message);
        res.status(500).json({ error: 'Failed to load storage data.' });
    }
}

module.exports = { getStats, getRegistrations, approveRegistration, rejectRegistration, getOrganizations, updateOrganization, getAuditLogs, getTrash, restoreTrash, purgeTrash, getStorage };
