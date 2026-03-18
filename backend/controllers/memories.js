// backend/controllers/memories.js
const Memory = require('../models/Memory');
const MemoryReaction = require('../models/MemoryReaction');
const User = require('../models/User');
const Admin = require('../models/Admin');
const SuperAdmin = require('../models/SuperAdmin');
const Organization = require('../models/Organization');
const {
    createUserNotification,
    addTransientNotification,
    emitNotificationToActor,
} = require('./notifications');
const { uploadStream } = require('../utils/cloudinaryHelpers');
const { cursorPaginate } = require('../utils/pagination');
const auditLog = require('../utils/auditLog');
const { logger } = require('../config/database');
const { fn, col, literal, Op } = require('sequelize');
const { FREE_LIMITS } = require('../middleware/checkMemoryUploadLimits');

const ALLOWED_MIME_TYPES = [ 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime' ];

/**
 * GET /api/memories
 */
async function getMemories (req, res) {
    try {
        const { cursor, limit = 20 } = req.query;
        const where = { organization_id: req.actor.org, is_active: 1 };

        // Apply filters if provided
        // Filter by uploader (user_id)
        if(req.query.uploaded_by) {
            where.uploaded_by = parseInt(req.query.uploaded_by);
        }

        const uploaderInclude = {
            model: User,
            as: 'uploader',
            attributes: [ 'id', 'name', 'avatar_url', 'branch' ],
            required: !!req.query.branch,
        };

        // Filter by department (uploader branch)
        if(req.query.branch) {
            uploaderInclude.where = {
                branch: req.query.branch,
                organization_id: req.actor.org,
            };
        }

        // Filter by date range
        if(req.query.from_date || req.query.to_date) {
            where.created_at = {};
            if(req.query.from_date) {
                where.created_at[ Op.gte ] = new Date(req.query.from_date);
            }
            if(req.query.to_date) {
                const toDate = new Date(req.query.to_date);
                toDate.setHours(23, 59, 59, 999);
                where.created_at[ Op.lte ] = toDate;
            }
        }

        const result = await cursorPaginate(Memory, where, cursor, limit, [ [ 'id', 'DESC' ] ], {
            include: [
                uploaderInclude,
                { model: MemoryReaction, attributes: [ 'id', 'emoji', 'user_id' ], required: false },
            ],
        });

        // Process items to include reaction counts and viewer's own reactions
        const items = result.items.map((memory) => {
            const memObj = memory.toJSON();
            const reactions = memObj.MemoryReactions || [];

            // Count per emoji
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
 * POST /api/memories/upload
 */
async function uploadMemory (req, res) {
    try {
        if(!req.file) {
            return res.status(400).json({ error: 'File is required.' });
        }

        // MIME type validation
        if(!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
            return res.status(400).json({
                error: `Invalid file type: ${ req.file.mimetype }. Allowed: JPEG, PNG, WebP, MP4, QuickTime.`,
            });
        }

        const isVideo = req.file.mimetype.startsWith('video');
        const mediaType = isVideo ? 'video' : 'photo';
        const org = req.org; // Attached by checkStorageLimit middleware

        // Upload to Cloudinary
        const uploadResult = await uploadStream(req.file.buffer, {
            folder: `org_${ org.id }/memories`,
            resource_type: isVideo ? 'video' : 'image',
        });

        const fileSizeMb = (req.file.size / (1024 * 1024)).toFixed(3);

        // Create Memory record
        const memory = await Memory.create({
            organization_id: org.id,
            uploaded_by: req.actor.id,
            media_type: mediaType,
            cloudinary_url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            thumbnail_url: isVideo
                ? uploadResult.secure_url.replace(/\.[^/.]+$/, '.jpg')
                : uploadResult.secure_url,
            width: uploadResult.width || null,
            height: uploadResult.height || null,
            duration_sec: uploadResult.duration ? Math.round(uploadResult.duration) : null,
            file_size_mb: fileSizeMb,
            caption: req.body.caption || null,
        });

        // Update org storage_used_gb
        const newStorage = parseFloat(org.storage_used_gb) + parseFloat(fileSizeMb) / 1024;
        await org.update({ storage_used_gb: newStorage.toFixed(4) });

        // Create notifications for org users (fire and forget)
        const orgUsers = await User.findAll({
            where: { organization_id: org.id },
            attributes: [ 'id' ],
            raw: true,
        });

        for(const u of orgUsers) {
            if(u.id !== req.actor.id) {
                createUserNotification(u.id, {
                    type: 'new_memory',
                    title: 'New memory shared!',
                    body: `${ req.actor.name || 'Someone' } uploaded a new ${ mediaType }.`,
                    action_url: '/portal',
                }).catch((e) => logger.error(`Notification creation failed for user ${ u.id }:`, e.message));
            }
        }

        const orgAdmins = await Admin.findAll({
            where: { organization_id: org.id },
            attributes: [ 'id' ],
            raw: true,
        });
        for(const admin of orgAdmins) {
            const note = addTransientNotification(
                { role: 'admin', id: admin.id },
                {
                    type: 'new_memory',
                    title: 'New memory activity',
                    body: `${ req.actor.name || 'A user' } uploaded a new ${ mediaType }.`,
                    action_url: '/admin/dashboard',
                }
            );
            emitNotificationToActor({ role: 'admin', id: admin.id }, note);
        }

        const superAdmins = await SuperAdmin.findAll({ attributes: [ 'id' ], raw: true });
        for(const sa of superAdmins) {
            const note = addTransientNotification(
                { role: 'super_admin', id: sa.id },
                {
                    type: 'system',
                    title: 'Platform memory event',
                    body: `${ org.name }: new ${ mediaType } uploaded.`,
                    action_url: '/super-admin/dashboard',
                }
            );
            emitNotificationToActor({ role: 'super_admin', id: sa.id }, note);
        }

        res.status(201).json({ message: 'Memory uploaded.', memory });
    } catch(err) {
        logger.error('uploadMemory error:', err.message);
        res.status(500).json({ error: 'Upload failed.' });
    }
}

/**
 * DELETE /api/memories/:id
 */
async function deleteMemory (req, res) {
    try {
        const memory = await Memory.findByPk(req.params.id);
        if(!memory) {
            return res.status(404).json({ error: 'Memory not found.' });
        }

        // Only uploader or admin (checked via org) can delete
        if(memory.uploaded_by !== req.actor.id) {
            return res.status(403).json({ error: 'You can only delete your own memories.' });
        }

        await memory.update({ is_active: 0 });
        auditLog.log('user', req.actor.id, 'MEMORY_DELETED', 'memory', memory.id, null, req);

        res.json({ message: 'Memory deleted.' });
    } catch(err) {
        logger.error('deleteMemory error:', err.message);
        res.status(500).json({ error: 'Failed to delete memory.' });
    }
}

/**
 * GET /api/memories/profile/:user_id (PUBLIC)
 */
async function getMyMemoryUsage (req, res) {
    try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

        const baseWhere = {
            organization_id: req.actor.org,
            uploaded_by: req.actor.id,
            is_active: 1,
            created_at: {
                [ Op.gte ]: start,
                [ Op.lt ]: end,
            },
        };

        const [ photoCount, videoCount ] = await Promise.all([
            Memory.count({ where: { ...baseWhere, media_type: 'photo' } }),
            Memory.count({ where: { ...baseWhere, media_type: 'video' } }),
        ]);

        const org = await Organization.findByPk(req.actor.org, {
            attributes: [ 'plan' ],
        });

        const plan = (org?.plan || 'free').toLowerCase();
        const imageLimit = plan === 'free' ? FREE_LIMITS.imageCount : null;
        const videoLimit = plan === 'free' ? FREE_LIMITS.videoCount : null;

        return res.json({
            usage: {
                plan,
                photo_count: photoCount,
                video_count: videoCount,
                photo_limit: imageLimit,
                video_limit: videoLimit,
                remaining_photos: imageLimit === null ? null : Math.max(0, imageLimit - photoCount),
                remaining_videos: videoLimit === null ? null : Math.max(0, videoLimit - videoCount),
                image_size_limit_mb: FREE_LIMITS.imageSizeMb,
                video_size_limit_mb: FREE_LIMITS.videoSizeMb,
            },
        });
    } catch(err) {
        logger.error('getMyMemoryUsage error:', err.message);
        return res.status(500).json({ error: 'Failed to load memory usage.' });
    }
}

async function getPublicUserMemories (req, res) {
    try {
        const { user_id } = req.params;
        const { cursor, limit = 20 } = req.query;

        // Get user details
        const user = await User.findByPk(user_id, {
            attributes: [ 'id', 'name', 'organization_id', 'branch', 'batch_year', 'avatar_url' ],
        });

        if(!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Get user's memories
        const where = { organization_id: user.organization_id, uploaded_by: user_id, is_active: 1 };
        const result = await cursorPaginate(Memory, where, cursor, limit, [ [ 'created_at', 'DESC' ] ], {
            include: [
                { model: User, as: 'uploader', attributes: [ 'id', 'name', 'avatar_url' ], required: false },
                { model: MemoryReaction, attributes: [ 'id', 'emoji', 'user_id' ], required: false },
            ],
        });

        // Process reaction counts
        const items = result.items.map((memory) => {
            const memObj = memory.toJSON();
            const reactions = memObj.MemoryReactions || [];
            const reactionCounts = {};
            for(const r of reactions) {
                reactionCounts[ r.emoji ] = (reactionCounts[ r.emoji ] || 0) + 1;
            }
            delete memObj.MemoryReactions;
            return { ...memObj, reaction_counts: reactionCounts, total_reactions: reactions.length };
        });

        res.json({
            user: { id: user.id, name: user.name, avatar_url: user.avatar_url, branch: user.branch, batch_year: user.batch_year },
            memories: items,
            nextCursor: result.nextCursor,
            hasMore: result.hasMore,
        });
    } catch(err) {
        logger.error('getPublicUserMemories error:', err.message);
        res.status(500).json({ error: 'Failed to load user memories.' });
    }
}

/**
 * GET /api/memories/stats/summary (AUTH)
 */
async function getMemoryStats (req, res) {
    try {
        const orgId = req.actor.org;

        const totalMemories = await Memory.count({ where: { organization_id: orgId, is_active: 1 } });
        const photoCount = await Memory.count({ where: { organization_id: orgId, media_type: 'photo', is_active: 1 } });
        const videoCount = await Memory.count({ where: { organization_id: orgId, media_type: 'video', is_active: 1 } });

        const storageResult = await Memory.findOne({
            where: { organization_id: orgId, is_active: 1 },
            attributes: [ [ fn('SUM', col('file_size_mb')), 'total_size' ] ],
            raw: true,
        });
        const totalSizeMb = parseFloat(storageResult?.total_size || 0);

        const reactionStats = await MemoryReaction.findAll({
            attributes: [ 'emoji', [ fn('COUNT', col('id')), 'count' ] ],
            where: { '$Memory.organization_id$': orgId, '$Memory.is_active$': 1 },
            include: [ { model: Memory, attributes: [], required: true } ],
            group: [ 'MemoryReaction.emoji' ],
            raw: true,
            subQuery: false,
        });

        const topContributors = await Memory.findAll({
            attributes: [ 'uploaded_by', [ fn('COUNT', col('id')), 'count' ] ],
            where: { organization_id: orgId, is_active: 1 },
            include: [ { model: User, as: 'uploader', attributes: [ 'id', 'name', 'avatar_url' ], required: true } ],
            group: [ 'uploaded_by' ],
            order: [ [ fn('COUNT', col('id')), 'DESC' ] ],
            limit: 5,
            subQuery: false,
            raw: true,
        });

        res.json({
            stats: {
                total_memories: totalMemories,
                photo_count: photoCount,
                video_count: videoCount,
                total_storage_mb: Number(totalSizeMb.toFixed(2)),
            },
            reactions: reactionStats.map((r) => ({
                emoji: r.emoji,
                count: Number(r.count),
            })),
            top_contributors: topContributors.map((row) => ({
                user_id: row.uploaded_by,
                count: Number(row.count),
                name: row[ 'uploader.name' ] || 'Unknown',
                avatar_url: row[ 'uploader.avatar_url' ] || null,
            })),
        });
    } catch(err) {
        logger.error('getMemoryStats error:', err.message);
        res.status(500).json({ error: 'Failed to load memory stats.' });
    }
}

module.exports = {
    getMemories,
    getMyMemoryUsage,
    uploadMemory,
    deleteMemory,
    getPublicUserMemories,
    getMemoryStats,
};
