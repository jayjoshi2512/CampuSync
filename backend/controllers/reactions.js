// backend/controllers/reactions.js
const MemoryReaction = require('../models/MemoryReaction');
const Memory = require('../models/Memory');
const User = require('../models/User');
const Admin = require('../models/Admin');
const SuperAdmin = require('../models/SuperAdmin');
const { fn, col } = require('sequelize');
const { logger } = require('../config/database');
const {
    createUserNotification,
    addTransientNotification,
    emitNotificationToActor,
} = require('./notifications');

const ALLOWED_EMOJIS = [ '❤️', '🔥', '😂', '😮', '😢' ];

/**
 * POST /api/reactions/:memoryId/reactions
 */
async function addReaction (req, res) {
    try {
        const { memoryId } = req.params;
        const { emoji } = req.body;

        if(req.actor.role !== 'user') {
            return res.status(403).json({ error: 'Only student and alumni accounts can react to memories.' });
        }

        if(!ALLOWED_EMOJIS.includes(emoji)) {
            return res.status(400).json({ error: `Invalid emoji. Allowed: ${ ALLOWED_EMOJIS.join(' ') }` });
        }

        const memory = await Memory.findByPk(memoryId);
        if(!memory) {
            return res.status(404).json({ error: 'Memory not found.' });
        }

        const reactor = await User.scope('withInactive').findByPk(req.actor.id, {
            attributes: [ 'id', 'name', 'organization_id' ],
        });

        // Upsert — find existing (including soft-deleted) or create
        const [ reaction, created ] = await MemoryReaction.scope('withInactive').findOrCreate({
            where: { memory_id: memoryId, user_id: req.actor.id, emoji },
            defaults: { is_active: 1 },
        });

        // If was soft-deleted, restore it
        if(!created && reaction.is_active === 0) {
            await reaction.update({ is_active: 1 });
        }

        // Get updated counts
        const counts = await MemoryReaction.findAll({
            where: { memory_id: memoryId },
            attributes: [ 'emoji', [ fn('COUNT', col('id')), 'count' ] ],
            group: [ 'emoji' ],
            raw: true,
        });

        const reactionCounts = {};
        for(const c of counts) {
            reactionCounts[ c.emoji ] = parseInt(c.count);
        }

        const viewerRows = await MemoryReaction.findAll({
            where: { memory_id: memoryId, user_id: req.actor.id },
            attributes: [ 'emoji' ],
            raw: true,
        });
        const viewerReactions = viewerRows.map((r) => r.emoji);

        if(memory.uploaded_by !== req.actor.id) {
            createUserNotification(memory.uploaded_by, {
                type: 'system',
                title: 'New reaction on your memory',
                body: `${ reactor?.name || 'Someone' } reacted ${ emoji } to your memory.`,
                action_url: '/portal?tab=memories',
            }).catch((e) => logger.error('Failed to create reaction notification:', e.message));
        }

        if(reactor?.organization_id) {
            const orgAdmins = await Admin.findAll({
                where: { organization_id: reactor.organization_id },
                attributes: [ 'id' ],
                raw: true,
            });
            for(const admin of orgAdmins) {
                const note = addTransientNotification(
                    { role: 'admin', id: admin.id },
                    {
                        type: 'system',
                        title: 'Memory engagement update',
                        body: `${ reactor?.name || 'A user' } reacted ${ emoji } on a memory.`,
                        action_url: '/admin/dashboard?tab=memories',
                    }
                );
                emitNotificationToActor({ role: 'admin', id: admin.id }, note);
            }
        }

        const superAdmins = await SuperAdmin.findAll({ attributes: [ 'id' ], raw: true });
        for(const sa of superAdmins) {
            const note = addTransientNotification(
                { role: 'super_admin', id: sa.id },
                {
                    type: 'system',
                    title: 'Memory reaction event',
                    body: `${ reactor?.name || 'A user' } reacted ${ emoji } on a memory.`,
                    action_url: '/super-admin/dashboard',
                }
            );
            emitNotificationToActor({ role: 'super_admin', id: sa.id }, note);
        }

        res.json({
            message: 'Reaction added.',
            reaction_counts: reactionCounts,
            viewer_reactions: viewerReactions,
        });
    } catch(err) {
        logger.error('addReaction error:', err.message);
        res.status(500).json({ error: 'Failed to add reaction.' });
    }
}

/**
 * DELETE /api/reactions/:memoryId/reactions/:emoji
 */
async function removeReaction (req, res) {
    try {
        const { memoryId, emoji } = req.params;
        const decodedEmoji = decodeURIComponent(emoji);

        if(req.actor.role !== 'user') {
            return res.status(403).json({ error: 'Only student and alumni accounts can react to memories.' });
        }

        const reaction = await MemoryReaction.findOne({
            where: { memory_id: memoryId, user_id: req.actor.id, emoji: decodedEmoji },
        });

        if(!reaction) {
            return res.status(404).json({ error: 'Reaction not found.' });
        }

        await reaction.update({ is_active: 0 });

        // Get updated counts
        const counts = await MemoryReaction.findAll({
            where: { memory_id: memoryId },
            attributes: [ 'emoji', [ fn('COUNT', col('id')), 'count' ] ],
            group: [ 'emoji' ],
            raw: true,
        });

        const reactionCounts = {};
        for(const c of counts) {
            reactionCounts[ c.emoji ] = parseInt(c.count);
        }

        const viewerRows = await MemoryReaction.findAll({
            where: { memory_id: memoryId, user_id: req.actor.id },
            attributes: [ 'emoji' ],
            raw: true,
        });
        const viewerReactions = viewerRows.map((r) => r.emoji);

        res.json({
            message: 'Reaction removed.',
            reaction_counts: reactionCounts,
            viewer_reactions: viewerReactions,
        });
    } catch(err) {
        logger.error('removeReaction error:', err.message);
        res.status(500).json({ error: 'Failed to remove reaction.' });
    }
}

module.exports = { addReaction, removeReaction };
