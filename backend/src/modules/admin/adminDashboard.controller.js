// backend/src/modules/admin/adminDashboard.controller.js
const { parse } = require('csv-parse/sync');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { User, Card, Memory, MemoryReaction, Organization, Admin, Notification, CardScanEvent, AlumniRequest, MentorProfile } = require('../models');
const { createUserNotification } = require('../notifications/notifications.controller');
const { uploadStream, deleteAsset } = require('../../../utils/cloudinaryHelpers');
const { signMagicLinkToken } = require('../../../utils/jwtFactory');
const { cohortMagicLinkEmail, announcementEmail, onboardingEmail } = require('../../../utils/emailTemplates');
const { sendMail } = require('../../../config/mailer');
const { generateQRBatchPDF } = require('../../../utils/qrGenerator');
const auditLog = require('../../../utils/auditLog');
const redis = require('../../../config/redis');
const { logger } = require('../../../config/database');

async function buildUploaderMaps (items) {
    const userUploaderIds = [];
    const adminUploaderIds = [];

    for(const item of items) {
        const uploaderId = item.uploaded_by?.toString();
        if(!uploaderId) continue;

        if((item.uploaded_by_role || 'user') === 'admin') {
            adminUploaderIds.push(uploaderId);
        } else {
            userUploaderIds.push(uploaderId);
        }
    }

    const uniqueUserIds = [ ...new Set(userUploaderIds) ];
    const uniqueAdminIds = [ ...new Set(adminUploaderIds) ];

    const [ users, admins ] = await Promise.all([
        uniqueUserIds.length > 0
            ? User.find({ _id: { $in: uniqueUserIds } }).select('_id name avatar_url branch').lean()
            : Promise.resolve([]),
        uniqueAdminIds.length > 0
            ? Admin.find({ _id: { $in: uniqueAdminIds } }).select('_id name').lean()
            : Promise.resolve([]),
    ]);

    const userMap = {};
    for(const user of users) {
        userMap[ user._id.toString() ] = {
            name: user.name,
            avatar_url: user.avatar_url || null,
            branch: user.branch || null,
            actor_role: 'user',
        };
    }

    const adminMap = {};
    for(const admin of admins) {
        adminMap[ admin._id.toString() ] = {
            name: admin.name,
            avatar_url: null,
            actor_role: 'admin',
        };
    }

    return { userMap, adminMap };
}

function resolveUploader (memory, userMap, adminMap) {
    const uploaderId = memory.uploaded_by?.toString();
    const uploaderRole = memory.uploaded_by_role || 'user';

    const mappedUploader = uploaderRole === 'admin'
        ? adminMap[ uploaderId ]
        : userMap[ uploaderId ];

    if(mappedUploader) return mappedUploader;

    if(memory.uploader_snapshot_name) {
        return {
            name: memory.uploader_snapshot_name,
            avatar_url: memory.uploader_snapshot_avatar || null,
            actor_role: uploaderRole,
        };
    }

    return null;
}

/**
 * GET /api/admin/cohort
 */
async function getCohort (req, res) {
    try {
        const { page = 1, limit = 20, search, sortBy = 'name', sortDir = 'asc' } = req.query;
        const query = { organization_id: req.actor.org, is_active: true };
        if(search) {
            const re = new RegExp(search, 'i');
            query.$or = [ { name: re }, { email: re }, { roll_number: re } ];
        }

        const sortField = [ 'name', 'roll_number', 'branch' ].includes(sortBy) ? sortBy : 'name';
        const sortOrder = sortDir.toLowerCase() === 'desc' ? -1 : 1;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const [ rows, count ] = await Promise.all([
            User.find(query).sort({ [ sortField ]: sortOrder }).skip(offset).limit(parseInt(limit)).lean(),
            User.countDocuments(query),
        ]);

        // Attach card info
        const userIds = rows.map(u => u._id);
        const cards = await Card.find({ user_id: { $in: userIds }, is_active: true })
            .select('user_id qr_hash share_slug scan_count template_id');
        const cardMap = {};
        for(const c of cards) cardMap[ c.user_id.toString() ] = c;
        const users = rows.map(u => ({ ...u, id: u._id.toString(), Card: cardMap[ u._id.toString() ] || null }));

        res.json({ users, total: count, page: parseInt(page), total_pages: Math.ceil(count / parseInt(limit)) });
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
        if(!req.file) return res.status(400).json({ error: 'CSV file is required.' });

        const org = await Organization.findById(req.actor.org);
        if(!org) return res.status(404).json({ error: 'Organization not found.' });

        const csvContent = req.file.buffer.toString('utf-8');
        let records;
        try {
            records = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
        } catch(parseErr) {
            return res.status(400).json({ error: 'Invalid CSV format.', details: parseErr.message });
        }

        const errors = [];
        const validUsers = [];
        const existingDocs = await User.find({ organization_id: org._id }).select('email').lean();
        const existingEmails = new Set(existingDocs.map(u => u.email.toLowerCase()));

        const currentCardCount = await Card.countDocuments({
            user_id: { $in: (await User.find({ organization_id: org._id }).select('_id').lean()).map(u => u._id) }
        }).catch(() => 0);

        for(let i = 0;i < records.length;i++) {
            const row = records[ i ];
            const rowNum = i + 2;
            const email = (row.email || '').trim().toLowerCase();
            const name = (row.name || '').trim();
            const roll_number = (row.roll_number || row.roll || '').trim();
            const branch = (row.branch || row.department || '').trim();
            const batch_year = parseInt(row.batch_year || row.year || '');
            if(!email) { errors.push({ row: rowNum, email: '', reason: 'Email is required' }); continue; }
            if(!name) { errors.push({ row: rowNum, email, reason: 'Name is required' }); continue; }
            if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errors.push({ row: rowNum, email, reason: 'Invalid email format' }); continue; }
            if(existingEmails.has(email)) { errors.push({ row: rowNum, email, reason: 'Email already exists' }); continue; }
            existingEmails.add(email);
            validUsers.push({ email, name, roll_number, branch, batch_year: batch_year || null });
        }

        if(org.card_quota && (currentCardCount + validUsers.length) > org.card_quota) {
            return res.status(400).json({
                error: `Import would exceed card quota. Current: ${ currentCardCount }, Import: ${ validUsers.length }, Quota: ${ org.card_quota }`,
            });
        }

        let imported = 0;
        for(const userData of validUsers) {
            try {
                const user = new User({
                    organization_id: org._id,
                    name: userData.name,
                    email: userData.email,
                    roll_number: userData.roll_number || null,
                    branch: userData.branch || null,
                    batch_year: userData.batch_year,
                });
                await user.save();
                await Card.create([ {
                    user_id: user._id,
                    template_id: org.selected_card_template || 'tmpl_midnight',
                    front_data_json: { name: user.name, roll: user.roll_number, branch: user.branch, batch: user.batch_year, org_name: org.name, org_logo: org.logo_url },
                } ]);
                imported++;
            } catch(createErr) {
                const msg = createErr.message;
                errors.push({ row: 0, email: userData.email, reason: msg });
            }
        }

        if (imported > 0) {
            const io = req.app.get('io');
            if (io) {
                io.to(`org:${ org._id }`).emit('cohort:student-added', {
                    timestamp: new Date().toISOString(),
                    batch: true,
                    count: imported
                });
            }
        }

        auditLog.log('admin', req.actor.id, 'CSV_IMPORTED', 'organization', org._id, { total: records.length, imported, failed: errors.length }, req);
        res.json({ total: records.length, imported, failed: errors.length, errors });
    } catch(err) {
        logger.error('importCsv error:', err.message);
        res.status(500).json({ error: 'CSV import failed.' });
    }
}

/**
 * POST /api/admin/cohort/manual
 */
async function addStudent (req, res) {
    try {
        const { email, name, roll_number, branch, batch_year, role } = req.body;
        const orgId = req.actor.org;
        if(!email || !name) return res.status(400).json({ error: 'Email and Name are required.' });

        const existing = await User.findOne({ email, organization_id: orgId }).setOptions({ strict: false });
        if(existing) {
            if(existing.is_active) {
                return res.status(400).json({ error: 'Email already exists in this organization.' });
            }
            existing.is_active = true;
            existing.name = name;
            existing.roll_number = roll_number || existing.roll_number;
            existing.branch = branch || existing.branch;
            existing.batch_year = batch_year || existing.batch_year;
            if(role && [ 'user', 'alumni' ].includes(role)) existing.role = role;
            await existing.save();

            let card = await Card.findOne({ user_id: existing._id }).setOptions({ strict: false });
            if(card) {
                card.is_active = true;
                await card.save();
            } else {
                const org = await Organization.findById(orgId);
                await Card.create([ { user_id: existing._id, template_id: org?.selected_card_template || 'tmpl_midnight', front_data_json: { name: existing.name, roll: existing.roll_number, branch: existing.branch, org_name: org?.name } } ]);
            }
            return res.json({ message: 'Student reactivated successfully.', user: existing });
        }

        const user = new User({ organization_id: orgId, email, name, roll_number, branch, batch_year, role: role && [ 'user', 'alumni' ].includes(role) ? role : 'user' });
        await user.save();
        const org = await Organization.findById(orgId);
        await Card.create([ {
            user_id: user._id,
            template_id: org?.selected_card_template || 'tmpl_midnight',
            front_data_json: { name: user.name, roll: user.roll_number, branch: user.branch, batch: user.batch_year, org_name: org?.name, org_logo: org?.logo_url },
        } ]);
        // Notify org members in real-time
        const io = req.app.get('io');
        if (io) {
            io.to(`org:${ orgId }`).emit('cohort:student-added', {
                user: { id: user._id, name: user.name, email: user.email, role: user.role },
                timestamp: new Date().toISOString(),
            });
        }
        res.status(201).json({ message: 'Student added successfully.', user });
    } catch(err) {
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

        const user = await User.findOne({ _id: id, organization_id: orgId, is_active: true });
        if(!user) return res.status(404).json({ error: 'Student not found.' });

        if(email && email !== user.email) {
            const existingEmail = await User.findOne({ email, organization_id: orgId, is_active: true });
            if(existingEmail && existingEmail._id.toString() !== user._id.toString()) {
                return res.status(400).json({ error: 'Email is already taken by another student.' });
            }
        }

        if(name !== undefined) user.name = name;
        if(email !== undefined) user.email = email;
        if(roll_number !== undefined) user.roll_number = roll_number;
        if(branch !== undefined) user.branch = branch;
        if(batch_year !== undefined) user.batch_year = batch_year;
        if(role && [ 'user', 'alumni' ].includes(role)) user.role = role;
        await user.save();

        const card = await Card.findOne({ user_id: user._id, is_active: true });
        if(card) {
            const org = await Organization.findById(orgId);
            card.front_data_json = { ...card.front_data_json, name: user.name, roll: user.roll_number, branch: user.branch, batch: user.batch_year, org_name: org?.name, org_logo: org?.logo_url };
            await card.save();
        }

        // Notify org + the specific user to sync session
        const io = req.app.get('io');
        if (io) {
            io.to(`org:${ orgId }`).emit('cohort:student-updated', {
                user: { id: user._id, name: user.name, email: user.email, role: user.role },
                timestamp: new Date().toISOString(),
            });
            // Force the affected user to refresh their session data
            io.to(`user:${ user._id }`).emit('session:sync-required', { reason: 'student_updated', timestamp: new Date().toISOString() });
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
        const org = await Organization.findById(req.actor.org);
        if(!org) return res.status(404).json({ error: 'Organization not found.' });

        const users = await User.find({ organization_id: org._id, last_login_at: null, is_active: true });
        if(users.length === 0) return res.json({ message: 'All users have already logged in.', queued: 0 });

        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
        let queued = 0;
        for(const user of users) {
            const magicToken = signMagicLinkToken(user._id, org._id);
            await redis.set(`magic_link:${ magicToken }`, user._id.toString(), 86400);
            const link = `${ appBaseUrl }/setup-password?token=${ magicToken }`;
            sendMail(user.email, `Welcome to ${ org.name } — Access Your Card`, cohortMagicLinkEmail(user.name, org.name, link))
                .catch(e => logger.error(`Failed to send magic link to ${ user.email }:`, e.message));
            queued++;
        }

        auditLog.log('admin', req.actor.id, 'MAGIC_LINKS_SENT', 'organization', org._id, { recipients: queued }, req);
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
        const user = await User.findOne({ _id: id, organization_id: req.actor.org, is_active: true });
        if(!user) return res.status(404).json({ error: 'User not found or inactive.' });

        const org = await Organization.findById(req.actor.org);
        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
        const magicToken = signMagicLinkToken(user._id, org._id);
        await redis.set(`magic_link:${ magicToken }`, user._id.toString(), 86400);
        const link = `${ appBaseUrl }/setup-password?token=${ magicToken }`;
        sendMail(user.email, `Your Magic Link — ${ org.name }`, cohortMagicLinkEmail(user.name, org.name, link))
            .catch(e => logger.error('Failed to send individual magic link:', e.message));

        auditLog.log('admin', req.actor.id, 'INDIVIDUAL_MAGIC_LINK_SENT', 'user', user._id, { email: user.email }, req);
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
        const users = await User.find({ organization_id: req.actor.org, is_active: true }).lean();
        const userIds = users.map(u => u._id);
        const cards = await Card.find({ user_id: { $in: userIds }, is_active: true }).lean();
        const org = await Organization.findById(req.actor.org).lean();

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
        const org = await Organization.findById(req.actor.org);
        if(!org) return res.status(404).json({ error: 'Organization not found.' });

        const allowedFields = [ 'name', 'brand_color', 'selected_card_template' ];
        for(const field of allowedFields) {
            if(req.body[ field ] !== undefined) org[ field ] = req.body[ field ];
        }

        if(req.file) {
            if(org.logo_public_id) deleteAsset(org.logo_public_id).catch(() => {});
            const result = await uploadStream(req.file.buffer, { folder: `org_${ org._id }/branding`, resource_type: 'image' });
            org.logo_url = result.secure_url;
            org.logo_public_id = result.public_id;
        }

        await org.save();
        auditLog.log('admin', req.actor.id, 'ORG_SETTINGS_UPDATED', 'organization', org._id, req.body, req);

        // Notify all org members to refresh org data
        const io = req.app.get('io');
        if (io) {
            io.to(`org:${ req.actor.org }`).emit('org:updated', {
                organization_id: org._id.toString(),
                timestamp: new Date().toISOString(),
            });
        }
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

        const userDocs = await User.find({ organization_id: orgId, is_active: true }).select('_id last_login_at').lean();
        const userIds = userDocs.map(u => u._id);

        const [ memoryCount, totalUsers, activeUsers, orgDoc, pendingAlumniRequests ] = await Promise.all([
            Memory.countDocuments({ organization_id: orgId, is_active: true }),
            User.countDocuments({ organization_id: orgId, is_active: true }),
            User.countDocuments({ organization_id: orgId, is_active: true, last_login_at: { $gte: thirtyDaysAgo } }),
            Organization.findById(orgId).select('storage_used_gb storage_limit_gb features_data').lean(),
            AlumniRequest.countDocuments({ organization_id: orgId, status: 'pending', is_active: true }),
        ]);
        const org = orgDoc;
        const pendingMentorRequests = await MentorProfile.countDocuments({ organization_id: orgId, status: 'pending' });

        const cardCount = userIds.length > 0 ? await Card.countDocuments({ user_id: { $in: userIds }, is_active: true }) : 0;
        const scanAgg = userIds.length > 0 ? await Card.aggregate([
            { $match: { user_id: { $in: userIds }, is_active: true } },
            { $group: { _id: null, total: { $sum: '$scan_count' } } },
        ]) : [];
        const scanTotal = scanAgg[ 0 ]?.total || 0;

        const memoryIds = (await Memory.find({ organization_id: orgId, is_active: true }).select('_id').lean()).map(m => m._id);
        const reactionCount = memoryIds.length > 0 ? await MemoryReaction.countDocuments({ memory_id: { $in: memoryIds }, is_active: true }) : 0;

        const uploadTrend = [];
        for(let i = 6;i >= 0;i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
            const count = await Memory.countDocuments({ organization_id: orgId, created_at: { $gte: dayStart, $lte: dayEnd }, is_active: true });
            uploadTrend.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), uploads: count });
        }

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
            card_count: cardCount,
            reaction_count: reactionCount,
            upload_trend: uploadTrend,
            pendingAlumniRequests,
            pendingMentorRequests,
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
        const { cursor, limit = 20, flagged, uploaded_by, branch, from_date, to_date } = req.query;
        const where = { organization_id: req.actor.org, is_active: true };
        if(flagged === 'true') where.is_flagged = true;
        if(uploaded_by) where.uploaded_by = uploaded_by;
        if(from_date || to_date) {
            where.created_at = {};
            if(from_date) where.created_at.$gte = new Date(from_date);
            if(to_date) { const d = new Date(to_date); d.setHours(23, 59, 59, 999); where.created_at.$lte = d; }
        }
        if(cursor) where._id = { $lt: cursor };

        if(branch) {
            // need to filter by uploader branch — get user IDs first
            const branchUserIds = (await User.find({ organization_id: req.actor.org, branch, is_active: true }).select('_id').lean()).map(u => u._id);
            where.uploaded_by = { $in: branchUserIds };
        }

        const memories = await Memory.find(where).sort({ _id: -1 }).limit(parseInt(limit) + 1).lean();
        const hasMore = memories.length > parseInt(limit);
        const items = memories.slice(0, parseInt(limit));
        const nextCursor = hasMore ? items[ items.length - 1 ]._id : null;

        // Attach uploader and reactions
        const { userMap, adminMap } = await buildUploaderMaps(items);

        const memIds = items.map(m => m._id);
        const reactions = await MemoryReaction.find({ memory_id: { $in: memIds }, is_active: true }).lean();
        const reactionsByMemory = {};
        for(const r of reactions) {
            const key = r.memory_id.toString();
            if(!reactionsByMemory[ key ]) reactionsByMemory[ key ] = [];
            reactionsByMemory[ key ].push(r);
        }

        const result = items.map(memory => {
            const memReactions = reactionsByMemory[ memory._id.toString() ] || [];
            const reactionCounts = {};
            const viewerReactions = [];
            for(const r of memReactions) {
                reactionCounts[ r.emoji ] = (reactionCounts[ r.emoji ] || 0) + 1;
                if(r.user_id?.toString() === req.actor.id?.toString()) viewerReactions.push(r.emoji);
            }
            return {
                ...memory,
                id: memory._id.toString(),
                uploader: resolveUploader(memory, userMap, adminMap),
                reaction_counts: reactionCounts,
                viewer_reactions: viewerReactions,
                total_reactions: memReactions.length,
            };
        });

        res.json({ items: result, nextCursor, hasMore });
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
        const memory = await Memory.findOne({ _id: req.params.id, organization_id: req.actor.org });
        if(!memory) return res.status(404).json({ error: 'Memory not found.' });
        memory.is_flagged = !memory.is_flagged;
        await memory.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`org:${ req.actor.org }`).emit('memory:updated', {
                action: memory.is_flagged ? 'flagged' : 'unflagged',
                memory_id: memory._id.toString(),
                timestamp: new Date().toISOString(),
            });
        }
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
        const memory = await Memory.findOne({ _id: req.params.id, organization_id: req.actor.org });
        if(!memory) return res.status(404).json({ error: 'Memory not found.' });
        memory.is_active = false;
        await memory.save();
        auditLog.log('admin', req.actor.id, 'MEMORY_DELETED', 'memory', memory._id, null, req);

        const io = req.app.get('io');
        if (io) {
            io.to(`org:${ req.actor.org }`).emit('memory:updated', {
                action: 'deleted',
                memory_id: memory._id.toString(),
                deleted_by: req.actor.id,
                timestamp: new Date().toISOString(),
            });
        }
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
        const org = await Organization.findById(req.actor.org);
        const users = await User.find({ organization_id: req.actor.org, is_active: true });
        const io = req.app.get('io');
        let sent = 0;
        for(const user of users) {
            await Notification.create({ user_id: user._id, type: 'announcement', title: subject, body });
            sendMail(user.email, `${ subject } — ${ org.name }`, announcementEmail(user.name, org.name, subject, body)).catch(() => {});
            // Push notification badge update live
            if (io) {
                io.to(`user:${ user._id }`).emit('notification:new', {
                    type: 'announcement',
                    title: subject,
                    message: body,
                    timestamp: new Date().toISOString(),
                });
            }
            sent++;
        }
        auditLog.log('admin', req.actor.id, 'ANNOUNCEMENT_SENT', 'organization', org._id, { subject, recipients: sent }, req);
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
        const org = await Organization.findById(req.actor.org);
        const existing = await Admin.findOne({ email });
        if(existing) return res.status(409).json({ error: 'An admin with this email already exists.' });

        const onboardingToken = crypto.randomBytes(16).toString('hex');
        const admin = await Admin.create({
            organization_id: org._id, name, email, role: 'co_admin',
            onboarding_token: onboardingToken,
            onboarding_token_expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000),
        });

        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
        const setupUrl = `${ appBaseUrl }/admin/setup-password?token=${ onboardingToken }`;
        sendMail(email, `You're invited to manage ${ org.name }`, onboardingEmail(name, org.name, setupUrl))
            .catch(e => logger.error('Failed to send co-admin invite:', e.message));

        auditLog.log('admin', req.actor.id, 'CO_ADMIN_INVITED', 'admin', admin._id, { email }, req);
        res.json({ message: 'Co-admin invited.', admin_id: admin._id });
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
        const user = await User.findOne({ _id: req.params.id, organization_id: req.actor.org, is_active: true });
        if(!user) return res.status(404).json({ error: 'Student not found.' });
        user.is_active = false;
        await user.save();
        auditLog.log('admin', req.actor.id, 'USER_SOFT_DELETED', 'user', user._id, { name: user.name }, req);

        const io = req.app.get('io');
        if (io) {
            io.to(`org:${ req.actor.org }`).emit('cohort:student-removed', {
                user_id: user._id.toString(),
                name: user.name,
                timestamp: new Date().toISOString(),
            });
        }
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
        const org = await Organization.findById(req.actor.org);
        if(!org) return res.status(404).json({ error: 'Organization not found.' });

        if(org.card_back_public_id) deleteAsset(org.card_back_public_id).catch(() => {});
        const result = await uploadStream(req.file.buffer, { folder: `org_${ org._id }/branding`, resource_type: 'image' });
        org.card_back_image_url = result.secure_url;
        org.card_back_public_id = result.public_id;
        await org.save();

        auditLog.log('admin', req.actor.id, 'BACK_IMAGE_UPLOADED', 'organization', org._id, null, req);
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
        const requests = await AlumniRequest.find({ organization_id: req.actor.org, status, is_active: true }).sort({ created_at: -1 });
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
    try {
        const requestRow = await AlumniRequest.findOne({
            _id: req.params.id, organization_id: req.actor.org, status: 'pending',
        });
        if(!requestRow) {
            return res.status(404).json({ error: 'Alumni request not found.' });
        }

        let user = null;
        if(requestRow.user_id) {
            user = await User.findOne({ _id: requestRow.user_id, organization_id: req.actor.org });
        }
        if(!user) {
            user = await User.findOne({ organization_id: req.actor.org, email: requestRow.email });
        }
        if(!user) {
            user = new User({ organization_id: req.actor.org, name: requestRow.name, email: requestRow.email, branch: requestRow.branch, batch_year: requestRow.batch_year, role: 'alumni' });
            await user.save();
        } else {
            user.role = 'alumni';
            user.is_active = true;
            await user.save();
        }

        requestRow.status = 'approved';
        requestRow.reviewed_by = req.actor.id;
        requestRow.reviewed_at = new Date();
        requestRow.user_id = user._id;
        requestRow.rejection_reason = null;
        await requestRow.save();

        createUserNotification(user._id, { type: 'approval', title: 'Alumni request approved', body: 'Your alumni access is now active.', action_url: '/alumni' }).catch(() => {});
        auditLog.log('admin', req.actor.id, 'ALUMNI_REQUEST_APPROVED', 'alumni_request', requestRow._id, { user_id: user._id }, req);

        const io = req.app.get('io');
        if (io) {
            // Force the user to refresh — their role just changed to alumni
            io.to(`user:${ user._id }`).emit('session:sync-required', { reason: 'alumni_approved', timestamp: new Date().toISOString() });
            io.to(`org:${ req.actor.org }`).emit('alumni:request-updated', {
                request_id: requestRow._id.toString(),
                status: 'approved',
                user_id: user._id.toString(),
                timestamp: new Date().toISOString(),
            });
        }
        res.json({ message: 'Alumni request approved.', user_id: user._id });
    } catch(err) {
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
        const requestRow = await AlumniRequest.findOne({ _id: req.params.id, organization_id: req.actor.org, status: 'pending' });
        if(!requestRow) return res.status(404).json({ error: 'Alumni request not found.' });

        requestRow.status = 'rejected';
        requestRow.rejection_reason = reason || 'Request rejected by admin.';
        requestRow.reviewed_by = req.actor.id;
        requestRow.reviewed_at = new Date();
        await requestRow.save();

        if(requestRow.user_id) {
            createUserNotification(requestRow.user_id, { type: 'system', title: 'Alumni request update', body: requestRow.rejection_reason, action_url: '/portal?tab=profile' }).catch(() => {});
        }

        auditLog.log('admin', req.actor.id, 'ALUMNI_REQUEST_REJECTED', 'alumni_request', requestRow._id, { reason: requestRow.rejection_reason }, req);

        const io = req.app.get('io');
        if (io) {
            io.to(`org:${ req.actor.org }`).emit('alumni:request-updated', {
                request_id: requestRow._id.toString(),
                status: 'rejected',
                user_id: requestRow.user_id?.toString() || null,
                timestamp: new Date().toISOString(),
            });
            if (requestRow.user_id) {
                io.to(`user:${ requestRow.user_id }`).emit('notification:new', {
                    type: 'system',
                    title: 'Alumni request update',
                    message: requestRow.rejection_reason,
                    timestamp: new Date().toISOString(),
                });
            }
        }
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
