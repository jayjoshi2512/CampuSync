// backend/controllers/reactions.js
const MemoryReaction = require('../models/MemoryReaction');
const Memory = require('../models/Memory');
const { fn, col } = require('sequelize');
const { logger } = require('../config/database');

const ALLOWED_EMOJIS = ['❤️', '🔥', '😂', '😮', '😢'];

/**
 * POST /api/reactions/:memoryId/reactions
 */
async function addReaction(req, res) {
  try {
    const { memoryId } = req.params;
    const { emoji } = req.body;

    if (!ALLOWED_EMOJIS.includes(emoji)) {
      return res.status(400).json({ error: `Invalid emoji. Allowed: ${ALLOWED_EMOJIS.join(' ')}` });
    }

    const memory = await Memory.findByPk(memoryId);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found.' });
    }

    // Upsert — find existing (including soft-deleted) or create
    const [reaction, created] = await MemoryReaction.scope('withInactive').findOrCreate({
      where: { memory_id: memoryId, user_id: req.actor.id, emoji },
      defaults: { is_active: 1 },
    });

    // If was soft-deleted, restore it
    if (!created && reaction.is_active === 0) {
      await reaction.update({ is_active: 1 });
    }

    // Get updated counts
    const counts = await MemoryReaction.findAll({
      where: { memory_id: memoryId },
      attributes: ['emoji', [fn('COUNT', col('id')), 'count']],
      group: ['emoji'],
      raw: true,
    });

    const reactionCounts = {};
    for (const c of counts) {
      reactionCounts[c.emoji] = parseInt(c.count);
    }

    res.json({ message: 'Reaction added.', reaction_counts: reactionCounts });
  } catch (err) {
    logger.error('addReaction error:', err.message);
    res.status(500).json({ error: 'Failed to add reaction.' });
  }
}

/**
 * DELETE /api/reactions/:memoryId/reactions/:emoji
 */
async function removeReaction(req, res) {
  try {
    const { memoryId, emoji } = req.params;
    const decodedEmoji = decodeURIComponent(emoji);

    const reaction = await MemoryReaction.findOne({
      where: { memory_id: memoryId, user_id: req.actor.id, emoji: decodedEmoji },
    });

    if (!reaction) {
      return res.status(404).json({ error: 'Reaction not found.' });
    }

    await reaction.update({ is_active: 0 });

    // Get updated counts
    const counts = await MemoryReaction.findAll({
      where: { memory_id: memoryId },
      attributes: ['emoji', [fn('COUNT', col('id')), 'count']],
      group: ['emoji'],
      raw: true,
    });

    const reactionCounts = {};
    for (const c of counts) {
      reactionCounts[c.emoji] = parseInt(c.count);
    }

    res.json({ message: 'Reaction removed.', reaction_counts: reactionCounts });
  } catch (err) {
    logger.error('removeReaction error:', err.message);
    res.status(500).json({ error: 'Failed to remove reaction.' });
  }
}

module.exports = { addReaction, removeReaction };
