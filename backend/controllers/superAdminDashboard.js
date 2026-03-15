// backend/controllers/superAdminDashboard.js
const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');
const Organization = require('../models/Organization');
const OrgRegistration = require('../models/OrgRegistration');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Card = require('../models/Card');
const Memory = require('../models/Memory');
const AuditLog = require('../models/AuditLog');
const Payment = require('../models/Payment');
const { deleteAsset, getUsageReport } = require('../utils/cloudinaryHelpers');
const { approvalEmail, rejectionEmail, onboardingEmail } = require('../utils/emailTemplates');
const { sendMail } = require('../config/mailer');
const auditLog = require('../utils/auditLog');
const { cursorPaginate } = require('../utils/pagination');
const crypto = require('crypto');
const { logger } = require('../config/database');

/**
 * GET /api/super-admin/stats
 */
async function getStats(req, res) {
  try {
    const [
      activeOrgs,
      pendingRegistrations,
      totalUsers,
      totalCards,
      totalMemories,
    ] = await Promise.all([
      Organization.count({ where: { status: 'active' } }),
      OrgRegistration.count({ where: { status: 'pending' } }),
      User.count(),
      Card.count(),
      Memory.count(),
    ]);

    // Platform storage (sum of storage_used_gb)
    const storageResult = await Organization.findOne({
      attributes: [[fn('SUM', col('storage_used_gb')), 'total_storage_gb']],
      raw: true,
    });

    // MRR (sum of active subscription payments in last 30 days)
    const mrrResult = await Payment.findOne({
      attributes: [[fn('SUM', col('amount_paise')), 'total_paise']],
      where: {
        status: 'captured',
        created_at: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      raw: true,
    });

    res.json({
      active_organizations: activeOrgs,
      pending_registrations: pendingRegistrations,
      total_users: totalUsers,
      total_cards: totalCards,
      total_memories: totalMemories,
      platform_storage_gb: parseFloat(storageResult?.total_storage_gb || 0).toFixed(2),
      mrr_paise: parseInt(mrrResult?.total_paise || 0),
      mrr_display: `₹${((parseInt(mrrResult?.total_paise || 0)) / 100).toLocaleString('en-IN')}`,
    });
  } catch (err) {
    logger.error('getStats error:', err.message);
    res.status(500).json({ error: 'Failed to load stats.' });
  }
}

/**
 * GET /api/super-admin/registrations
 */
async function getRegistrations(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await OrgRegistration.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
      include: [{ model: Organization, attributes: ['id', 'name', 'status', 'plan'] }],
    });

    res.json({
      registrations: rows,
      total: count,
      page: parseInt(page),
      total_pages: Math.ceil(count / parseInt(limit)),
    });
  } catch (err) {
    logger.error('getRegistrations error:', err.message);
    res.status(500).json({ error: 'Failed to load registrations.' });
  }
}

/**
 * PATCH /api/super-admin/registrations/:id/approve
 */
async function approveRegistration(req, res) {
  try {
    const { id } = req.params;
    const { welcome_note } = req.body;

    const registration = await OrgRegistration.findByPk(id);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found.' });
    }
    if (registration.status !== 'pending') {
      return res.status(400).json({ error: `Registration is already ${registration.status}.` });
    }

    const org = await Organization.findByPk(registration.organization_id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    // Update org status
    await org.update({
      status: 'active',
      approved_by: req.actor.id,
      approved_at: new Date(),
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day trial
    });

    // Update registration status
    await registration.update({
      status: 'approved',
      super_admin_note: welcome_note || null,
    });

    // Create Admin record
    const onboardingToken = crypto.randomBytes(16).toString('hex');
    const admin = await Admin.create({
      organization_id: org.id,
      name: registration.contact_name,
      email: registration.contact_email,
      role: 'owner',
      onboarding_token: onboardingToken,
      onboarding_token_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
    });

    // Send approval + onboarding emails
    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
    const setupUrl = `${appBaseUrl}/admin/setup-password?token=${onboardingToken}`;

    sendMail(
      registration.contact_email,
      `Your Application is Approved — ${org.name}`,
      approvalEmail(registration.contact_name, org.name, setupUrl)
    ).catch((e) => logger.error('Failed to send approval email:', e.message));

    // Audit log
    auditLog.log('super_admin', req.actor.id, 'ORG_APPROVED', 'organization', org.id, {
      registration_id: id,
      welcome_note,
    }, req);

    logger.info(`Organization approved: ${org.name} (ID: ${org.id})`);
    res.json({ message: 'Registration approved.', organization_id: org.id, admin_id: admin.id });
  } catch (err) {
    logger.error('approveRegistration error:', err.message);
    res.status(500).json({ error: 'Failed to approve registration.' });
  }
}

/**
 * PATCH /api/super-admin/registrations/:id/reject
 */
async function rejectRegistration(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: 'Rejection reason is required (min 10 characters).' });
    }

    const registration = await OrgRegistration.findByPk(id);
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found.' });
    }
    if (registration.status !== 'pending') {
      return res.status(400).json({ error: `Registration is already ${registration.status}.` });
    }

    const org = await Organization.findByPk(registration.organization_id);
    if (org) {
      await org.update({ status: 'rejected', rejection_reason: reason });
    }

    await registration.update({
      status: 'rejected',
      super_admin_note: reason,
    });

    // Send rejection email
    sendMail(
      registration.contact_email,
      `Registration Update — ${registration.institution_name}`,
      rejectionEmail(registration.contact_name, registration.institution_name, reason)
    ).catch((e) => logger.error('Failed to send rejection email:', e.message));

    auditLog.log('super_admin', req.actor.id, 'ORG_REJECTED', 'organization', org?.id, { reason }, req);

    res.json({ message: 'Registration rejected.' });
  } catch (err) {
    logger.error('rejectRegistration error:', err.message);
    res.status(500).json({ error: 'Failed to reject registration.' });
  }
}

/**
 * GET /api/super-admin/organizations
 */
async function getOrganizations(req, res) {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { contact_email: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await Organization.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      organizations: rows,
      total: count,
      page: parseInt(page),
      total_pages: Math.ceil(count / parseInt(limit)),
    });
  } catch (err) {
    logger.error('getOrganizations error:', err.message);
    res.status(500).json({ error: 'Failed to load organizations.' });
  }
}

/**
 * PATCH /api/super-admin/organizations/:id
 */
async function updateOrganization(req, res) {
  try {
    const { id } = req.params;
    const org = await Organization.findByPk(id);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const allowedFields = ['status', 'card_quota', 'storage_limit_gb', 'plan'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    await org.update(updates);
    auditLog.log('super_admin', req.actor.id, 'ORG_UPDATED', 'organization', org.id, updates, req);

    res.json({ message: 'Organization updated.', organization: org });
  } catch (err) {
    logger.error('updateOrganization error:', err.message);
    res.status(500).json({ error: 'Failed to update organization.' });
  }
}

/**
 * GET /api/super-admin/audit-logs
 */
async function getAuditLogs(req, res) {
  try {
    const { actor_type, action, start_date, end_date, page = 1, limit = 50, format } = req.query;
    const where = {};
    if (actor_type) where.actor_type = actor_type;
    if (action) where.action = { [Op.like]: `%${action}%` };
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    // CSV export
    if (format === 'csv') {
      const csv = [
        'ID,Timestamp,Actor Type,Actor ID,Action,Target Type,Target ID,IP Address',
        ...rows.map((r) =>
          `${r.id},"${r.created_at}",${r.actor_type},${r.actor_id || ''},${r.action},${r.target_type || ''},${r.target_id || ''},${r.ip_address || ''}`
        ),
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
      return res.send(csv);
    }

    res.json({
      audit_logs: rows,
      total: count,
      page: parseInt(page),
      total_pages: Math.ceil(count / parseInt(limit)),
    });
  } catch (err) {
    logger.error('getAuditLogs error:', err.message);
    res.status(500).json({ error: 'Failed to load audit logs.' });
  }
}

/**
 * GET /api/super-admin/trash
 */
async function getTrash(req, res) {
  try {
    const { table = 'organizations', page = 1, limit = 20 } = req.query;
    const modelMap = {
      organizations: Organization,
      users: User,
      memories: Memory,
      cards: Card,
    };
    const Model = modelMap[table];
    if (!Model) {
      return res.status(400).json({ error: `Invalid table: ${table}. Allowed: ${Object.keys(modelMap).join(', ')}` });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows, count } = await Model.scope('withInactive').findAndCountAll({
      where: { is_active: 0 },
      order: [['updated_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({ items: rows, total: count, table, page: parseInt(page) });
  } catch (err) {
    logger.error('getTrash error:', err.message);
    res.status(500).json({ error: 'Failed to load trash.' });
  }
}

/**
 * PATCH /api/super-admin/trash/restore
 */
async function restoreTrash(req, res) {
  try {
    const { table, id } = req.body;
    const modelMap = { organizations: Organization, users: User, memories: Memory, cards: Card };
    const Model = modelMap[table];
    if (!Model || !id) {
      return res.status(400).json({ error: 'Table and ID are required.' });
    }

    const record = await Model.scope('withInactive').findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    await record.update({ is_active: 1 });
    auditLog.log('super_admin', req.actor.id, 'RECORD_RESTORED', table, id, null, req);

    res.json({ message: 'Record restored.' });
  } catch (err) {
    logger.error('restoreTrash error:', err.message);
    res.status(500).json({ error: 'Failed to restore record.' });
  }
}

/**
 * DELETE /api/super-admin/trash/purge
 */
async function purgeTrash(req, res) {
  try {
    const { table, id, confirm } = req.body;
    if (confirm !== 'PERMANENTLY_DELETE') {
      return res.status(400).json({ error: 'Confirmation required: set confirm to "PERMANENTLY_DELETE".' });
    }

    const modelMap = { organizations: Organization, users: User, memories: Memory, cards: Card };
    const Model = modelMap[table];
    if (!Model || !id) {
      return res.status(400).json({ error: 'Table and ID are required.' });
    }

    const record = await Model.scope('withInactive').findByPk(id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    // Delete Cloudinary assets if applicable
    const publicIdFields = ['public_id', 'logo_public_id', 'avatar_public_id', 'back_image_public_id', 'card_download_public_id'];
    for (const field of publicIdFields) {
      if (record[field]) {
        try {
          await deleteAsset(record[field]);
        } catch (e) {
          logger.warn(`Failed to delete Cloudinary asset ${record[field]}:`, e.message);
        }
      }
    }

    // Hard delete from DB
    await record.destroy({ force: true });
    auditLog.log('super_admin', req.actor.id, 'RECORD_PURGED', table, id, null, req);

    res.json({ message: 'Record permanently deleted.' });
  } catch (err) {
    logger.error('purgeTrash error:', err.message);
    res.status(500).json({ error: 'Failed to purge record.' });
  }
}

/**
 * GET /api/super-admin/storage
 */
async function getStorage(req, res) {
  try {
    const orgs = await Organization.findAll({
      attributes: ['id', 'name', 'storage_used_gb', 'storage_limit_gb', 'plan'],
      order: [['storage_used_gb', 'DESC']],
    });

    let cloudinaryUsage = null;
    try {
      cloudinaryUsage = await getUsageReport();
    } catch (e) {
      logger.warn('Could not fetch Cloudinary usage:', e.message);
    }

    res.json({
      organizations: orgs.map((o) => ({
        id: o.id,
        name: o.name,
        storage_used_gb: parseFloat(o.storage_used_gb),
        storage_limit_gb: parseFloat(o.storage_limit_gb),
        usage_percent: parseFloat(o.storage_limit_gb) > 0
          ? ((parseFloat(o.storage_used_gb) / parseFloat(o.storage_limit_gb)) * 100).toFixed(1)
          : 0,
        plan: o.plan,
      })),
      cloudinary: cloudinaryUsage,
    });
  } catch (err) {
    logger.error('getStorage error:', err.message);
    res.status(500).json({ error: 'Failed to load storage data.' });
  }
}

module.exports = {
  getStats,
  getRegistrations,
  approveRegistration,
  rejectRegistration,
  getOrganizations,
  updateOrganization,
  getAuditLogs,
  getTrash,
  restoreTrash,
  purgeTrash,
  getStorage,
};
