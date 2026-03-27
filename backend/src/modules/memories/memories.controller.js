// backend/src/modules/memories/memories.controller.js
const { Memory, MemoryReaction, User, Admin, SuperAdmin, Organization } = require('../models');
const { createUserNotification, addTransientNotification, emitNotificationToActor } = require('../notifications/notifications.controller');
const { uploadStream } = require('../../../utils/cloudinaryHelpers');
const auditLog = require('../../../utils/auditLog');
const { logger } = require('../../../config/database');
const { FREE_LIMITS } = require('../../../middleware/checkMemoryUploadLimits');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];

async function getMemories(req, res) {
    try {
        const { cursor, limit = 20 } = req.query;
        const query = { organization_id: req.actor.org, is_active: true };

        if (req.query.uploaded_by) query.uploaded_by = req.query.uploaded_by;

        if (req.query.branch) {
            const branchUserIds = (await User.find({ organization_id: req.actor.org, branch: req.query.branch, is_active: true }).select('_id').lean()).map(u => u._id);
            query.uploaded_by = { $in: branchUserIds };
        }

        if (req.query.from_date || req.query.to_date) {
            query.created_at = {};
            if (req.query.from_date) query.created_at.$gte = new Date(req.query.from_date);
            if (req.query.to_date) { const d = new Date(req.query.to_date); d.setHours(23, 59, 59, 999); query.created_at.$lte = d; }
        }

        if (cursor) query._id = { $lt: cursor };

        const memories = await Memory.find(query).sort({ _id: -1 }).limit(parseInt(limit) + 1).lean();
        const hasMore = memories.length > parseInt(limit);
        const items = memories.slice(0, parseInt(limit));
        const nextCursor = hasMore ? items[items.length - 1]._id : null;

        const uploaderIds = [...new Set(items.map(m => m.uploaded_by?.toString()))];
        const uploaders = await User.find({ _id: { $in: uploaderIds } }).select('_id name avatar_url branch').lean();
        const uploaderMap = {};
        for (const u of uploaders) uploaderMap[u._id.toString()] = u;

        const memIds = items.map(m => m._id);
        const reactions = await MemoryReaction.find({ memory_id: { $in: memIds }, is_active: true }).lean();
        const reactionsByMemory = {};
        for (const r of reactions) {
            const key = r.memory_id.toString();
            if (!reactionsByMemory[key]) reactionsByMemory[key] = [];
            reactionsByMemory[key].push(r);
        }

        const result = items.map(memory => {
            const memReactions = reactionsByMemory[memory._id.toString()] || [];
            const reactionCounts = {};
            const viewerReactions = [];
            for (const r of memReactions) {
                reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
                if (r.user_id?.toString() === req.actor.id?.toString()) viewerReactions.push(r.emoji);
            }
            return { ...memory, id: memory._id.toString(), uploader: uploaderMap[memory.uploaded_by?.toString()] || null, reaction_counts: reactionCounts, viewer_reactions: viewerReactions, total_reactions: memReactions.length };
        });

        res.json({ items: result, nextCursor, hasMore });
    } catch (err) {
        logger.error('getMemories error:', err.message);
        res.status(500).json({ error: 'Failed to load memories.' });
    }
}

async function uploadMemory(req, res) {
    try {
        if (!req.file) return res.status(400).json({ error: 'File is required.' });
        if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
            return res.status(400).json({ error: `Invalid file type: ${req.file.mimetype}. Allowed: JPEG, PNG, WebP, MP4, QuickTime.` });
        }

        const isVideo = req.file.mimetype.startsWith('video');
        const mediaType = isVideo ? 'video' : 'photo';
        const org = req.org;

        const uploadResult = await uploadStream(req.file.buffer, {
            folder: `org_${org._id}/memories`,
            resource_type: isVideo ? 'video' : 'image',
        });

        const fileSizeMb = (req.file.size / (1024 * 1024)).toFixed(3);
        const memory = await Memory.create({
            organization_id: org._id,
            uploaded_by: req.actor.id,
            media_type: mediaType,
            cloudinary_url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            thumbnail_url: isVideo ? uploadResult.secure_url.replace(/\.[^/.]+$/, '.jpg') : uploadResult.secure_url,
            width: uploadResult.width || null,
            height: uploadResult.height || null,
            duration_sec: uploadResult.duration ? Math.round(uploadResult.duration) : null,
            file_size_mb: fileSizeMb,
            caption: req.body.caption || null,
        });

        const newStorage = parseFloat(org.storage_used_gb) + parseFloat(fileSizeMb) / 1024;
        org.storage_used_gb = newStorage;
        await org.save();

        const orgUsers = await User.find({ organization_id: org._id, is_active: true }).select('_id').lean();
        for (const u of orgUsers) {
            if (u._id.toString() !== req.actor.id?.toString()) {
                createUserNotification(u._id, { type: 'new_memory', title: 'New memory shared!', body: `${req.actor.name || 'Someone'} uploaded a new ${mediaType}.`, action_url: '/portal' })
                    .catch(e => logger.error(`Notification creation failed for user ${u._id}:`, e.message));
            }
        }

        const orgAdmins = await Admin.find({ organization_id: org._id, is_active: true }).select('_id').lean();
        for (const admin of orgAdmins) {
            const note = addTransientNotification({ role: 'admin', id: admin._id }, { type: 'new_memory', title: 'New memory activity', body: `${req.actor.name || 'A user'} uploaded a new ${mediaType}.`, action_url: '/admin/dashboard' });
            emitNotificationToActor({ role: 'admin', id: admin._id }, note);
        }

        const superAdmins = await SuperAdmin.find({ is_active: true }).select('_id').lean();
        for (const sa of superAdmins) {
            const note = addTransientNotification({ role: 'super_admin', id: sa._id }, { type: 'system', title: 'Platform memory event', body: `${org.name}: new ${mediaType} uploaded.`, action_url: '/super-admin/dashboard' });
            emitNotificationToActor({ role: 'super_admin', id: sa._id }, note);
        }

        res.status(201).json({ message: 'Memory uploaded.', memory });
    } catch (err) {
        logger.error('uploadMemory error:', err.message);
        res.status(500).json({ error: 'Upload failed.' });
    }
}

async function deleteMemory(req, res) {
    try {
        const memory = await Memory.findById(req.params.id);
        if (!memory) return res.status(404).json({ error: 'Memory not found.' });
        if (memory.uploaded_by?.toString() !== req.actor.id?.toString()) {
            return res.status(403).json({ error: 'You can only delete your own memories.' });
        }
        memory.is_active = false;
        await memory.save();
        auditLog.log('user', req.actor.id, 'MEMORY_DELETED', 'memory', memory._id, null, req);
        res.json({ message: 'Memory deleted.' });
    } catch (err) {
        logger.error('deleteMemory error:', err.message);
        res.status(500).json({ error: 'Failed to delete memory.' });
    }
}

async function getMyMemoryUsage(req, res) {
    try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

        const baseQuery = { organization_id: req.actor.org, uploaded_by: req.actor.id, is_active: true, created_at: { $gte: start, $lt: end } };
        const [photoCount, videoCount] = await Promise.all([
            Memory.countDocuments({ ...baseQuery, media_type: 'photo' }),
            Memory.countDocuments({ ...baseQuery, media_type: 'video' }),
        ]);

        const org = await Organization.findById(req.actor.org).select('plan').lean();
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
    } catch (err) {
        logger.error('getMyMemoryUsage error:', err.message);
        return res.status(500).json({ error: 'Failed to load memory usage.' });
    }
}

async function getPublicUserMemories(req, res) {
    try {
        const { user_id } = req.params;
        const { cursor, limit = 20 } = req.query;

        const user = await User.findById(user_id).select('_id name organization_id branch batch_year avatar_url').lean();
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const query = { organization_id: user.organization_id, uploaded_by: user._id, is_active: true };
        if (cursor) query._id = { $lt: cursor };

        const memories = await Memory.find(query).sort({ _id: -1 }).limit(parseInt(limit) + 1).lean();
        const hasMore = memories.length > parseInt(limit);
        const items = memories.slice(0, parseInt(limit));
        const nextCursor = hasMore ? items[items.length - 1]._id : null;

        const memIds = items.map(m => m._id);
        const reactions = await MemoryReaction.find({ memory_id: { $in: memIds }, is_active: true }).lean();
        const reactionsByMemory = {};
        for (const r of reactions) {
            const key = r.memory_id.toString();
            if (!reactionsByMemory[key]) reactionsByMemory[key] = [];
            reactionsByMemory[key].push(r);
        }

        const result = items.map(memory => {
            const memReactions = reactionsByMemory[memory._id.toString()] || [];
            const reactionCounts = {};
            for (const r of memReactions) reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
            return { ...memory, id: memory._id.toString(), reaction_counts: reactionCounts, total_reactions: memReactions.length };
        });

        res.json({ user: { id: user._id, name: user.name, avatar_url: user.avatar_url, branch: user.branch, batch_year: user.batch_year }, memories: result, nextCursor, hasMore });
    } catch (err) {
        logger.error('getPublicUserMemories error:', err.message);
        res.status(500).json({ error: 'Failed to load user memories.' });
    }
}

async function getMemoryStats(req, res) {
    try {
        const orgId = req.actor.org;

        const [totalMemories, photoCount, videoCount] = await Promise.all([
            Memory.countDocuments({ organization_id: orgId, is_active: true }),
            Memory.countDocuments({ organization_id: orgId, media_type: 'photo', is_active: true }),
            Memory.countDocuments({ organization_id: orgId, media_type: 'video', is_active: true }),
        ]);

        const storageAgg = await Memory.aggregate([
            { $match: { organization_id: new mongoose.Types.ObjectId(orgId), is_active: true } },
            { $group: { _id: null, total: { $sum: '$file_size_mb' } } },
        ]);
        const totalSizeMb = parseFloat(storageAgg[0]?.total || 0);

        const reactionStats = await MemoryReaction.aggregate([
            { $lookup: { from: 'memories', localField: 'memory_id', foreignField: '_id', as: 'memory' } },
            { $unwind: '$memory' },
            { $match: { 'memory.organization_id': new mongoose.Types.ObjectId(orgId), 'memory.is_active': true, is_active: true } },
            { $group: { _id: '$emoji', count: { $sum: 1 } } },
        ]);

        const topContributors = await Memory.aggregate([
            { $match: { organization_id: new mongoose.Types.ObjectId(orgId), is_active: true } },
            { $group: { _id: '$uploaded_by', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
        ]);

        res.json({
            stats: { total_memories: totalMemories, photo_count: photoCount, video_count: videoCount, total_storage_mb: Number(totalSizeMb.toFixed(2)) },
            reactions: reactionStats.map(r => ({ emoji: r._id, count: Number(r.count) })),
            top_contributors: topContributors.map(row => ({ user_id: row._id, count: Number(row.count), name: row.user?.name || 'Unknown', avatar_url: row.user?.avatar_url || null })),
        });
    } catch (err) {
        logger.error('getMemoryStats error:', err.message);
        res.status(500).json({ error: 'Failed to load memory stats.' });
    }
}

// import mongoose for ObjectId casting in aggregations
const mongoose = require('mongoose');

module.exports = { getMemories, getMyMemoryUsage, uploadMemory, deleteMemory, getPublicUserMemories, getMemoryStats };
