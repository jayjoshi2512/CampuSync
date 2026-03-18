// backend/controllers/adminDashboard.js
const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');
const { parse } = require('csv-parse/sync');
const crypto = require('crypto');
const User = require('../models/User');
const Card = require('../models/Card');
const Memory = require('../models/Memory');
const MemoryReaction = require('../models/MemoryReaction');
const Organization = require('../models/Organization');
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');
const CardScanEvent = require('../models/CardScanEvent');
const AlumniRequest = require('../models/AlumniRequest');
const { createUserNotification } = require('./notifications');
const { uploadStream, deleteAsset } = require('../utils/cloudinaryHelpers');
const { signMagicLinkToken } = require('../utils/jwtFactory');
const { cohortMagicLinkEmail, announcementEmail, onboardingEmail } = require('../utils/emailTemplates');
const { sendMail } = require('../config/mailer');
const { generateQRBatchPDF } = require('../utils/qrGenerator');
const { cursorPaginate } = require('../utils/pagination');
const auditLog = require('../utils/auditLog');
const redis = require('../config/redis');
const { logger } = require('../config/database');

/**
 * GET /api/admin/cohort
 */
async function getCohort (req, res) {
    try {
        const { page = 1, limit = 20, search, sortBy = 'name', sortDir = 'asc' } = req.query;
        const where = { organization_id: req.actor.org };
        if(search) {
            where[ Op.or ] = [
                { name: { [ Op.like ]: `%${ search }%` } },
                { email: { [ Op.like ]: `%${ search }%` } },
                { roll_number: { [ Op.like ]: `%${ search }%` } },
            ];
        }

        const direction = sortDir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
        let order = [ [ 'name', 'ASC' ] ];

        if([ 'name', 'roll_number', 'branch' ].includes(sortBy)) {
            order = [ [ sortBy, direction ] ];
        } else if(sortBy === 'scans') {
            order = [ [ Card, 'scan_count', direction ] ];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { rows, count } = await User.findAndCountAll({
            where,
            order,
            limit: parseInt(limit),
            offset,
            include: [ { model: Card, attributes: [ 'id', 'qr_hash', 'share_slug', 'scan_count', 'template_id' ] } ],
        });

        res.json({ users: rows, total: count, page: parseInt(page), total_pages: Math.ceil(count / parseInt(limit)) });
    } catch(err) {
        logger.error('getCohort error:', err.message);
        res.status(500).json({ error: 'Failed to load cohort.' });
    }
}

/**
 * POST /api/admin/cohort/import-csv
 */
async function importCsv (req, res) {
    try {
        if(!req.file) {
            return res.status(400).json({ error: 'CSV file is required.' });
        }

        const org = await Organization.findByPk(req.actor.org);
        if(!org) return res.status(404).json({ error: 'Organization not found.' });

        const csvContent = req.file.buffer.toString('utf-8');
        let records;
        try {
            records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });
        } catch(parseErr) {
            return res.status(400).json({ error: 'Invalid CSV format.', details: parseErr.message });
        }

        const errors = [];
        const validUsers = [];
        const existingEmails = new Set(
            (await User.unscoped().findAll({ where: { organization_id: org.id }, attributes: [ 'email' ], raw: true }))
                .map((u) => u.email.toLowerCase())
        );

        // Check card quota
        const currentCardCount = await Card.count({ where: { '$User.organization_id$': org.id }, include: [ { model: User, attributes: [] } ] }).catch(() => 0);

        for(let i = 0;i < records.length;i++) {
            const row = records[ i ];
            const rowNum = i + 2; // Header is row 1
            const email = (row.email || '').trim().toLowerCase();
            const name = (row.name || '').trim();
            const roll_number = (row.roll_number || row.roll || '').trim();
            const branch = (row.branch || row.department || '').trim();
            const batch_year = parseInt(row.batch_year || row.year || '');

            if(!email) {
                errors.push({ row: rowNum, email: '', reason: 'Email is required' });
                continue;
            }
            if(!name) {
                errors.push({ row: rowNum, email, reason: 'Name is required' });
                continue;
            }
            if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push({ row: rowNum, email, reason: 'Invalid email format' });
                continue;
            }
            if(existingEmails.has(email)) {
                errors.push({ row: rowNum, email, reason: 'Email already exists in this organization' });
                continue;
            }

            existingEmails.add(email); // Prevent duplicates within CSV
            validUsers.push({ email, name, roll_number, branch, batch_year: batch_year || null });
        }

        // Check quota
        const totalAfterImport = currentCardCount + validUsers.length;
        if(org.card_quota && totalAfterImport > org.card_quota) {
            return res.status(400).json({
                error: `Import would exceed card quota. Current: ${ currentCardCount }, Import: ${ validUsers.length }, Quota: ${ org.card_quota }`,
            });
        }

        // Bulk create users
        let imported = 0;
        for(const userData of validUsers) {
            const t = await sequelize.transaction();
            try {
                const user = await User.create({
                    organization_id: org.id,
                    name: userData.name,
                    email: userData.email,
                    roll_number: userData.roll_number || null,
                    branch: userData.branch || null,
                    batch_year: userData.batch_year,
                }, { transaction: t });

                // Create card for user
                await Card.create({
                    user_id: user.id,
                    template_id: org.selected_card_template || 'tmpl_midnight',
                    front_data_json: {
                        name: user.name,
                        roll: user.roll_number,
                        branch: user.branch,
                        batch: user.batch_year,
                        org_name: org.name,
                        org_logo: org.logo_url,
                    },
                }, { transaction: t });

                await t.commit();
                imported++;
            } catch(createErr) {
                await t.rollback();
                // Extract a clean message (strip "notNull Violation:" prefix etc.)
                const msg = createErr.errors?.[ 0 ]?.message || createErr.message;
                errors.push({ row: 0, email: userData.email, reason: msg });
            }
        }

        auditLog.log('admin', req.actor.id, 'CSV_IMPORTED', 'organization', org.id, {
            total: records.length, imported, failed: errors.length,
        }, req);

        res.json({
            total: records.length,
            imported,
            failed: errors.length,
            errors,
        });
    } catch(err) {
        logger.error('importCsv error:', err.message);
        res.status(500).json({ error: 'CSV import failed.' });
    }
}

/**
 * POST /api/admin/cohort/manual
 */
async function addStudent (req, res) {
    const t = await sequelize.transaction();
    try {
        const { email, name, roll_number, branch, batch_year, role } = req.body;
        const orgId = req.actor.org;

        if(!email || !name) {
            return res.status(400).json({ error: 'Email and Name are required.' });
        }

        // Check if user exists (including soft deleted)
        const existing = await User.unscoped().findOne({ where: { email, organization_id: orgId } });
        if(existing) {
            if(existing.is_active) {
                return res.status(400).json({ error: 'Email already exists in this organization.' });
            }
            // Reactivate soft-deleted user
            existing.is_active = 1;
            existing.name = name;
            existing.roll_number = roll_number || existing.roll_number;
            existing.branch = branch || existing.branch;
            existing.branch = branch || existing.branch;
            existing.batch_year = batch_year || existing.batch_year;
            if(role && [ 'user', 'alumni' ].includes(role)) existing.role = role;
            await existing.save({ transaction: t });

            // Ensure card exists or update it
            let card = await Card.unscoped().findOne({ where: { user_id: existing.id } });
            if(card) {
                card.is_active = 1;
                await card.save({ transaction: t });
            } else {
                await Card.create({
                    user_id: existing.id,
                    template_id: (await Organization.findByPk(orgId)).selected_card_template || 'tmpl_midnight',
                    front_data_json: { name: existing.name, roll: existing.roll_number, branch: existing.branch, org_name: (await Organization.findByPk(orgId)).name },
                }, { transaction: t });
            }

            await t.commit();
            return res.json({ message: 'Student reactivated successfully.', user: existing });
        }

        const user = await User.create({
            organization_id: orgId,
            email,
            name,
            roll_number,
            branch,
            batch_year,
            role: role && [ 'user', 'alumni' ].includes(role) ? role : 'user',
        }, { transaction: t });

        const org = await Organization.findByPk(orgId);
        await Card.create({
            user_id: user.id,
            template_id: org.selected_card_template || 'tmpl_midnight',
            front_data_json: {
                name: user.name,
                roll: user.roll_number,
                branch: user.branch,
                batch: user.batch_year,
                org_name: org.name,
                org_logo: org.logo_url,
            },
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ message: 'Student added successfully.', user });
    } catch(err) {
        await t.rollback();
        logger.error('addStudent error:', err.message);
        res.status(500).json({ error: 'Failed to add student.' });
    }
}

/**
 * PUT /api/admin/cohort/:id
 */
async function editStudent (req, res) {
    try {
        const { id } = req.params;
        const { name, email, roll_number, branch, batch_year, role } = req.body;
        const orgId = req.actor.org;

        const user = await User.findOne({ where: { id, organization_id: orgId } });
        if(!user) {
            return res.status(404).json({ error: 'Student not found.' });
        }

        // Check if new email is already taken by another user in the same org
        if(email !== user.email) {
            const existingEmail = await User.findOne({ where: { email, organization_id: orgId } });
            if(existingEmail && existingEmail.id !== user.id) {
                return res.status(400).json({ error: 'Email is already taken by another student.' });
            }
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.roll_number = roll_number !== undefined ? roll_number : user.roll_number;
        user.branch = branch !== undefined ? branch : user.branch;
        user.batch_year = batch_year !== undefined ? batch_year : user.batch_year;
        if(role && [ 'user', 'alumni' ].includes(role)) user.role = role;

        await user.save();

        // Re-generate card data with new info if needed
        const card = await Card.findOne({ where: { user_id: user.id } });
        if(card) {
            const org = await Organization.findByPk(orgId);
            card.front_data_json = {
                ...card.front_data_json,
                name: user.name,
                roll: user.roll_number,
                branch: user.branch,
                batch: user.batch_year,
                org_name: org.name,
                org_logo: org.logo_url
            };
            await card.save();
        }

        res.json({ message: 'Student updated successfully.', user });
    } catch(err) {
        logger.error('editStudent error:', err.message);
        res.status(500).json({ error: 'Failed to update student.' });
    }
}

/**
 * POST /api/admin/cohort/send-magic-links
 */
async function sendMagicLinks (req, res) {
    try {
        const org = await Organization.findByPk(req.actor.org);
        if(!org) return res.status(404).json({ error: 'Organization not found.' });

        const users = await User.findAll({
            where: { organization_id: org.id, last_login_at: null, is_active: 1 },
        });

        if(users.length === 0) {
            return res.json({ message: 'All users have already logged in.', queued: 0 });
        }

        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
        let queued = 0;

        for(const user of users) {
            const magicToken = signMagicLinkToken(user.id, org.id);
            await redis.set(`magic_link:${ magicToken }`, user.id.toString(), 86400); // 24h TTL
            const link = `${ appBaseUrl }/portal?magic=${ magicToken }`;

            sendMail(
                user.email,
                `Welcome to ${ org.name } — Access Your Card`,
                cohortMagicLinkEmail(user.name, org.name, link)
            ).catch((e) => logger.error(`Failed to send magic link to ${ user.email }:`, e.message));

            queued++;
        }

        auditLog.log('admin', req.actor.id, 'MAGIC_LINKS_SENT', 'organization', org.id, { recipients: queued }, req);
        res.json({ message: `Magic links sent to ${ queued } users.`, queued });
    } catch(err) {
        logger.error('sendMagicLinks error:', err.message);
        res.status(500).json({ error: 'Failed to send magic links.' });
    }
}

/**
 * POST /api/admin/cohort/:id/send-magic-link
 */
async function sendIndividualMagicLink (req, res) {
    try {
        const { id } = req.params;
        const user = await User.findOne({ where: { id, organization_id: req.actor.org, is_active: 1 } });
        if(!user) return res.status(404).json({ error: 'User not found or inactive.' });

        const org = await Organization.findByPk(req.actor.org);
        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';

        const magicToken = signMagicLinkToken(user.id, org.id);
        await redis.set(`magic_link:${ magicToken }`, user.id.toString(), 86400);

        const link = `${ appBaseUrl }/portal?magic=${ magicToken }`;
        sendMail(
            user.email,
            `Your Magic Link — ${ org.name }`,
            cohortMagicLinkEmail(user.name, org.name, link)
        ).catch(e => logger.error('Failed to send individual magic link:', e.message));

        auditLog.log('admin', req.actor.id, 'INDIVIDUAL_MAGIC_LINK_SENT', 'user', user.id, { email: user.email }, req);
        res.json({ message: 'Magic link sent successfully.' });
    } catch(err) {
        logger.error('sendIndividualMagicLink error:', err.message);
        res.status(500).json({ error: 'Failed to send magic link.' });
    }
}

/**
 * GET /api/admin/cohort/qr-batch
 */
async function downloadQrBatch (req, res) {
    try {
        const users = await User.findAll({ where: { organization_id: req.actor.org } });
        const cards = await Card.findAll({
            where: { user_id: users.map((u) => u.id) },
        });
        const org = await Organization.findByPk(req.actor.org);

        const pdfBuffer = await generateQRBatchPDF(users, cards, org?.name || 'Organization');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${ (org?.slug || 'org') }-qr-batch.pdf"`);
        res.send(pdfBuffer);
    } catch(err) {
        logger.error('downloadQrBatch error:', err.message);
        res.status(500).json({ error: 'Failed to generate QR batch.' });
    }
}

/**
 * PATCH /api/admin/settings
 */
async function updateSettings (req, res) {
    try {
        const org = await Organization.findByPk(req.actor.org);
        if(!org) return res.status(404).json({ error: 'Organization not found.' });

        const updates = {};
        const allowedFields = [ 'name', 'brand_color', 'selected_card_template' ];
        for(const field of allowedFields) {
            if(req.body[ field ] !== undefined) updates[ field ] = req.body[ field ];
        }

        // Handle logo upload
        if(req.file) {
            // Delete old logo if exists
            if(org.logo_public_id) {
                deleteAsset(org.logo_public_id).catch(() => {});
            }
            const result = await uploadStream(req.file.buffer, {
                folder: `org_${ org.id }/branding`,
                resource_type: 'image',
            });
            updates.logo_url = result.secure_url;
            updates.logo_public_id = result.public_id;
        }

        await org.update(updates);
        auditLog.log('admin', req.actor.id, 'ORG_SETTINGS_UPDATED', 'organization', org.id, updates, req);

        res.json({ message: 'Settings updated.', organization: org });
    } catch(err) {
        logger.error('updateSettings error:', err.message);
        res.status(500).json({ error: 'Failed to update settings.' });
    }
}

/**
 * GET /api/admin/analytics
 */
async function getAnalytics (req, res) {
    try {
        const orgId = req.actor.org;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [ memoryCount, totalUsers, activeUsers, org ] = await Promise.all([
            Memory.count({ where: { organization_id: orgId } }),
            User.count({ where: { organization_id: orgId } }),
            User.count({ where: { organization_id: orgId, last_login_at: { [ Op.gte ]: thirtyDaysAgo } } }),
            Organization.findByPk(orgId, { attributes: [ 'storage_used_gb', 'storage_limit_gb' ] }),
        ]);

        // Scan count total
        const userIds = (await User.findAll({ where: { organization_id: orgId }, attributes: [ 'id' ], raw: true })).map((u) => u.id);
        const scanTotal = await Card.sum('scan_count', { where: { user_id: userIds } }) || 0;

        res.json({
            memories: memoryCount,
            total_users: totalUsers,
            active_users: activeUsers,
            storage_used_gb: parseFloat(org?.storage_used_gb || 0),
            storage_limit_gb: parseFloat(org?.storage_limit_gb || 0),
            storage_percent: org && parseFloat(org.storage_limit_gb) > 0
                ? ((parseFloat(org.storage_used_gb) / parseFloat(org.storage_limit_gb)) * 100).toFixed(1)
                : 0,
            total_scans: scanTotal,
        });
    } catch(err) {
        logger.error('getAnalytics error:', err.message);
        res.status(500).json({ error: 'Failed to load analytics.' });
    }
}

/**
 * GET /api/admin/memories
 */
async function getMemories (req, res) {
    try {
        const { cursor, limit = 20, flagged } = req.query;
        const where = { organization_id: req.actor.org, is_active: 1 };
        if(flagged === 'true') where.is_flagged = 1;

        const result = await cursorPaginate(Memory, where, cursor, limit, [ [ 'id', 'DESC' ] ], {
            include: [
                { model: User, as: 'uploader', attributes: [ 'id', 'name', 'avatar_url' ], required: false },
                { model: MemoryReaction, attributes: [ 'id', 'emoji', 'user_id' ], required: false },
            ],
        });

        // Process items to include reaction counts and viewer's own reactions
        const items = result.items.map((memory) => {
            const memObj = memory.toJSON();
            const reactions = memObj.MemoryReactions || [];

            const reactionCounts = {};
            const viewerReactions = [];
            for(const r of reactions) {
                reactionCounts[ r.emoji ] = (reactionCounts[ r.emoji ] || 0) + 1;
                if(r.user_id === req.actor.id) {
                    viewerReactions.push(r.emoji);
                }
            }

            delete memObj.MemoryReactions;
            return {
                ...memObj,
                reaction_counts: reactionCounts,
                viewer_reactions: viewerReactions,
                total_reactions: reactions.length,
            };
        });

        res.json({ items, nextCursor: result.nextCursor, hasMore: result.hasMore });
    } catch(err) {
        logger.error('getMemories error:', err.message);
        res.status(500).json({ error: 'Failed to load memories.' });
    }
}

/**
 * PATCH /api/admin/memories/:id/flag
 */
async function flagMemory (req, res) {
    try {
        const memory = await Memory.findByPk(req.params.id);
        if(!memory || memory.organization_id !== req.actor.org) {
            return res.status(404).json({ error: 'Memory not found.' });
        }
        await memory.update({ is_flagged: memory.is_flagged ? 0 : 1 });
        res.json({ message: `Memory ${ memory.is_flagged ? 'flagged' : 'unflagged' }.`, is_flagged: memory.is_flagged });
    } catch(err) {
        logger.error('flagMemory error:', err.message);
        res.status(500).json({ error: 'Failed to flag memory.' });
    }
}

/**
 * DELETE /api/admin/memories/:id
 */
async function deleteMemory (req, res) {
    try {
        const memory = await Memory.findByPk(req.params.id);
        if(!memory || memory.organization_id !== req.actor.org) {
            return res.status(404).json({ error: 'Memory not found.' });
        }
        await memory.update({ is_active: 0 });
        auditLog.log('admin', req.actor.id, 'MEMORY_DELETED', 'memory', memory.id, null, req);
        res.json({ message: 'Memory deleted.' });
    } catch(err) {
        logger.error('deleteMemory error:', err.message);
        res.status(500).json({ error: 'Failed to delete memory.' });
    }
}

/**
 * POST /api/admin/announce
 */
async function announce (req, res) {
    try {
        const { subject, body } = req.body;
        const org = await Organization.findByPk(req.actor.org);
        const users = await User.findAll({ where: { organization_id: req.actor.org } });

        let sent = 0;
        for(const user of users) {
            await Notification.create({
                user_id: user.id,
                type: 'announcement',
                title: subject,
                body,
            });

            sendMail(
                user.email,
                `${ subject } — ${ org.name }`,
                announcementEmail(user.name, org.name, subject, body)
            ).catch(() => {});
            sent++;
        }

        auditLog.log('admin', req.actor.id, 'ANNOUNCEMENT_SENT', 'organization', org.id, { subject, recipients: sent }, req);
        res.json({ message: `Announcement sent to ${ sent } users.`, sent });
    } catch(err) {
        logger.error('announce error:', err.message);
        res.status(500).json({ error: 'Failed to send announcement.' });
    }
}

/**
 * POST /api/admin/co-admins/invite
 */
async function inviteCoAdmin (req, res) {
    try {
        const { email, name } = req.body;
        const org = await Organization.findByPk(req.actor.org);

        const existing = await Admin.findOne({ where: { email } });
        if(existing) {
            return res.status(409).json({ error: 'An admin with this email already exists.' });
        }

        const onboardingToken = crypto.randomBytes(16).toString('hex');
        const admin = await Admin.create({
            organization_id: org.id,
            name,
            email,
            role: 'co_admin',
            onboarding_token: onboardingToken,
            onboarding_token_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000),
        });

        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
        const setupUrl = `${ appBaseUrl }/admin/setup-password?token=${ onboardingToken }`;

        sendMail(
            email,
            `You're invited to manage ${ org.name }`,
            onboardingEmail(name, org.name, setupUrl)
        ).catch((e) => logger.error('Failed to send co-admin invite:', e.message));

        auditLog.log('admin', req.actor.id, 'CO_ADMIN_INVITED', 'admin', admin.id, { email }, req);
        res.json({ message: 'Co-admin invited.', admin_id: admin.id });
    } catch(err) {
        logger.error('inviteCoAdmin error:', err.message);
        res.status(500).json({ error: 'Failed to invite co-admin.' });
    }
}

/**
 * DELETE /api/admin/cohort/:id (soft delete)
 */
async function softDeleteStudent (req, res) {
    try {
        const user = await User.findByPk(req.params.id);
        if(!user || user.organization_id !== req.actor.org) {
            return res.status(404).json({ error: 'Student not found.' });
        }
        await user.update({ is_active: 0, deleted_at: new Date() });
        auditLog.log('admin', req.actor.id, 'USER_SOFT_DELETED', 'user', user.id, { name: user.name }, req);
        res.json({ message: `${ user.name } has been removed.` });
    } catch(err) {
        logger.error('softDeleteStudent error:', err.message);
        res.status(500).json({ error: 'Failed to remove student.' });
    }
}

/**
 * POST /api/admin/settings/back-image
 */
async function uploadBackImage (req, res) {
    try {
        if(!req.file) return res.status(400).json({ error: 'Image file is required.' });
        const org = await Organization.findByPk(req.actor.org);
        if(!org) return res.status(404).json({ error: 'Organization not found.' });

        // Delete old back image if exists
        if(org.card_back_public_id) {
            deleteAsset(org.card_back_public_id).catch(() => {});
        }

        const result = await uploadStream(req.file.buffer, {
            folder: `org_${ org.id }/branding`,
            resource_type: 'image',
        });

        await org.update({
            card_back_image_url: result.secure_url,
            card_back_public_id: result.public_id,
        });

        auditLog.log('admin', req.actor.id, 'BACK_IMAGE_UPLOADED', 'organization', org.id, null, req);
        res.json({ message: 'Back image uploaded.', url: result.secure_url });
    } catch(err) {
        logger.error('uploadBackImage error:', err.message);
        res.status(500).json({ error: 'Failed to upload back image.' });
    }
}

/**
 * GET /api/admin/alumni-requests
 */
async function getAlumniRequests (req, res) {
    try {
        const { status = 'pending' } = req.query;
        const where = {
            organization_id: req.actor.org,
            status,
        };

        const requests = await AlumniRequest.findAll({
            where,
            order: [ [ 'created_at', 'DESC' ] ],
        });

        res.json({ requests });
    } catch(err) {
        logger.error('getAlumniRequests error:', err.message);
        res.status(500).json({ error: 'Failed to load alumni requests.' });
    }
}

/**
 * PATCH /api/admin/alumni-requests/:id/approve
 */
async function approveAlumniRequest (req, res) {
    const t = await sequelize.transaction();
    try {
        const requestRow = await AlumniRequest.findOne({
            where: {
                id: req.params.id,
                organization_id: req.actor.org,
                status: 'pending',
            },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        if(!requestRow) {
            await t.rollback();
            return res.status(404).json({ error: 'Alumni request not found.' });
        }

        let user = null;
        if(requestRow.user_id) {
            user = await User.scope('withInactive').findOne({
                where: { id: requestRow.user_id, organization_id: req.actor.org },
                transaction: t,
            });
        }

        if(!user) {
            user = await User.scope('withInactive').findOne({
                where: {
                    organization_id: req.actor.org,
                    email: requestRow.email,
                },
                transaction: t,
            });
        }

        if(!user) {
            user = await User.create({
                organization_id: req.actor.org,
                name: requestRow.name,
                email: requestRow.email,
                branch: requestRow.branch,
                batch_year: requestRow.batch_year,
                role: 'alumni',
            }, { transaction: t });
        } else {
            await user.update({ role: 'alumni', is_active: 1 }, { transaction: t });
        }

        await requestRow.update({
            status: 'approved',
            reviewed_by: req.actor.id,
            reviewed_at: new Date(),
            user_id: user.id,
            rejection_reason: null,
        }, { transaction: t });

        await t.commit();

        createUserNotification(user.id, {
            type: 'approval',
            title: 'Alumni request approved',
            body: 'Your alumni access is now active.',
            action_url: '/alumni',
        }).catch(() => {});

        auditLog.log('admin', req.actor.id, 'ALUMNI_REQUEST_APPROVED', 'alumni_request', requestRow.id, {
            user_id: user.id,
        }, req);

        res.json({ message: 'Alumni request approved.', user_id: user.id });
    } catch(err) {
        await t.rollback();
        logger.error('approveAlumniRequest error:', err.message);
        res.status(500).json({ error: 'Failed to approve alumni request.' });
    }
}

/**
 * PATCH /api/admin/alumni-requests/:id/reject
 */
async function rejectAlumniRequest (req, res) {
    try {
        const { reason } = req.body;
        const requestRow = await AlumniRequest.findOne({
            where: {
                id: req.params.id,
                organization_id: req.actor.org,
                status: 'pending',
            },
        });

        if(!requestRow) {
            return res.status(404).json({ error: 'Alumni request not found.' });
        }

        await requestRow.update({
            status: 'rejected',
            rejection_reason: reason || 'Request rejected by admin.',
            reviewed_by: req.actor.id,
            reviewed_at: new Date(),
        });

        if(requestRow.user_id) {
            createUserNotification(requestRow.user_id, {
                type: 'system',
                title: 'Alumni request update',
                body: requestRow.rejection_reason,
                action_url: '/portal?tab=profile',
            }).catch(() => {});
        }

        auditLog.log('admin', req.actor.id, 'ALUMNI_REQUEST_REJECTED', 'alumni_request', requestRow.id, {
            reason: requestRow.rejection_reason,
        }, req);

        res.json({ message: 'Alumni request rejected.' });
    } catch(err) {
        logger.error('rejectAlumniRequest error:', err.message);
        res.status(500).json({ error: 'Failed to reject alumni request.' });
    }
}

module.exports = {
    getCohort, importCsv, addStudent, sendMagicLinks, sendIndividualMagicLink, downloadQrBatch, updateSettings,
    getAnalytics, getMemories, flagMemory, deleteMemory, announce, inviteCoAdmin, editStudent,
    softDeleteStudent, uploadBackImage, getAlumniRequests, approveAlumniRequest, rejectAlumniRequest,
};
