// backend/src/modules/memories/reactions.controller.js
const { MemoryReaction, Memory, User, Admin, SuperAdmin } = require('../models');
const { logger } = require('../../../config/database');
const { createUserNotification, addTransientNotification, emitNotificationToActor } = require('../notifications/notifications.controller');

const ALLOWED_EMOJIS = [ '❤️', '🔥', '😂', '😮', '😢' ];

async function addReaction (req, res) {
    try {
        const { memoryId } = req.params;
        const { emoji } = req.body;

        if(req.actor.role !== 'user') return res.status(403).json({ error: 'Only student and alumni accounts can react to memories.' });
        if(!ALLOWED_EMOJIS.includes(emoji)) return res.status(400).json({ error: `Invalid emoji. Allowed: ${ ALLOWED_EMOJIS.join(' ') }` });

        const memory = await Memory.findById(memoryId);
        if(!memory) return res.status(404).json({ error: 'Memory not found.' });

        const reactor = await User.findById(req.actor.id).select('_id name organization_id').lean();

        // Upsert
        let reaction = await MemoryReaction.findOne({ memory_id: memoryId, user_id: req.actor.id, emoji });
        if(!reaction) {
            reaction = await MemoryReaction.create({ memory_id: memoryId, user_id: req.actor.id, emoji, is_active: true });
        } else if(!reaction.is_active) {
            reaction.is_active = true;
            await reaction.save();
        }

        // Get updated counts
        const counts = await MemoryReaction.aggregate([
            { $match: { memory_id: memory._id, is_active: true } },
            { $group: { _id: '$emoji', count: { $sum: 1 } } },
        ]);
        const reactionCounts = {};
        for(const c of counts) reactionCounts[ c._id ] = c.count;

        const viewerRows = await MemoryReaction.find({ memory_id: memoryId, user_id: req.actor.id, is_active: true }).select('emoji').lean();
        const viewerReactions = viewerRows.map(r => r.emoji);

        if(memory.uploaded_by?.toString() !== req.actor.id?.toString()) {
            if((memory.uploaded_by_role || 'user') === 'admin') {
                const note = addTransientNotification(
                    { role: 'admin', id: memory.uploaded_by },
                    {
                        type: 'system',
                        title: 'New reaction on your memory',
                        body: `${ reactor?.name || 'Someone' } reacted ${ emoji } to your memory.`,
                        action_url: '/admin/dashboard?tab=memories',
                    },
                );
                emitNotificationToActor({ role: 'admin', id: memory.uploaded_by }, note);
            } else {
                createUserNotification(memory.uploaded_by, {
                    type: 'system',
                    title: 'New reaction on your memory',
                    body: `${ reactor?.name || 'Someone' } reacted ${ emoji } to your memory.`,
                    action_url: '/portal?tab=memories',
                }).catch(e => logger.error('Failed to create reaction notification:', e.message));
            }
        }

        if(reactor?.organization_id) {
            const orgAdmins = await Admin.find({ organization_id: reactor.organization_id, is_active: true }).select('_id').lean();
            for(const admin of orgAdmins) {
                const note = addTransientNotification({ role: 'admin', id: admin._id }, { type: 'system', title: 'Memory engagement update', body: `${ reactor?.name || 'A user' } reacted ${ emoji } on a memory.`, action_url: '/admin/dashboard?tab=memories' });
                emitNotificationToActor({ role: 'admin', id: admin._id }, note);
            }
        }

        const superAdmins = await SuperAdmin.find({ is_active: true }).select('_id').lean();
        for(const sa of superAdmins) {
            const note = addTransientNotification({ role: 'super_admin', id: sa._id }, { type: 'system', title: 'Memory reaction event', body: `${ reactor?.name || 'A user' } reacted ${ emoji } on a memory.`, action_url: '/super-admin/dashboard' });
            emitNotificationToActor({ role: 'super_admin', id: sa._id }, note);
        }

        res.json({ message: 'Reaction added.', reaction_counts: reactionCounts, viewer_reactions: viewerReactions });
    } catch(err) {
        logger.error('addReaction error:', err.message);
        res.status(500).json({ error: 'Failed to add reaction.' });
    }
}

async function removeReaction (req, res) {
    try {
        const { memoryId, emoji } = req.params;
        const decodedEmoji = decodeURIComponent(emoji);

        if(req.actor.role !== 'user') return res.status(403).json({ error: 'Only student and alumni accounts can react to memories.' });

        const reaction = await MemoryReaction.findOne({ memory_id: memoryId, user_id: req.actor.id, emoji: decodedEmoji, is_active: true });
        if(!reaction) return res.status(404).json({ error: 'Reaction not found.' });

        reaction.is_active = false;
        await reaction.save();

        const memory = await Memory.findById(memoryId);
        const counts = await MemoryReaction.aggregate([
            { $match: { memory_id: memory?._id, is_active: true } },
            { $group: { _id: '$emoji', count: { $sum: 1 } } },
        ]);
        const reactionCounts = {};
        for(const c of counts) reactionCounts[ c._id ] = c.count;

        const viewerRows = await MemoryReaction.find({ memory_id: memoryId, user_id: req.actor.id, is_active: true }).select('emoji').lean();
        const viewerReactions = viewerRows.map(r => r.emoji);

        res.json({ message: 'Reaction removed.', reaction_counts: reactionCounts, viewer_reactions: viewerReactions });
    } catch(err) {
        logger.error('removeReaction error:', err.message);
        res.status(500).json({ error: 'Failed to remove reaction.' });
    }
}

module.exports = { addReaction, removeReaction };
