// backend/controllers/memories.js
const Memory = require('../models/Memory');
const MemoryReaction = require('../models/MemoryReaction');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Notification = require('../models/Notification');
const { uploadStream } = require('../utils/cloudinaryHelpers');
const { cursorPaginate } = require('../utils/pagination');
const auditLog = require('../utils/auditLog');
const { logger } = require('../config/database');
const { fn, col, literal } = require('sequelize');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];

/**
 * GET /api/memories
 */
async function getMemories(req, res) {
  try {
    const { cursor, limit = 20 } = req.query;
    const where = { organization_id: req.actor.org, is_active: 1 };

    const result = await cursorPaginate(Memory, where, cursor, limit, [['id', 'DESC']], {
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'name', 'avatar_url'], required: false },
        { model: MemoryReaction, attributes: ['id', 'emoji', 'user_id'], required: false },
      ],
    });

    // Process items to include reaction counts and viewer's own reactions
    const items = result.items.map((memory) => {
      const memObj = memory.toJSON();
      const reactions = memObj.MemoryReactions || [];

      // Count per emoji
      const reactionCounts = {};
      const viewerReactions = [];
      for (const r of reactions) {
        reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
        if (r.user_id === req.actor.id) {
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
  } catch (err) {
    logger.error('getMemories error:', err.message);
    res.status(500).json({ error: 'Failed to load memories.' });
  }
}

/**
 * POST /api/memories/upload
 */
async function uploadMemory(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required.' });
    }

    // MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: `Invalid file type: ${req.file.mimetype}. Allowed: JPEG, PNG, WebP, MP4, QuickTime.`,
      });
    }

    const isVideo = req.file.mimetype.startsWith('video');
    const mediaType = isVideo ? 'video' : 'photo';
    const org = req.org; // Attached by checkStorageLimit middleware

    // Upload to Cloudinary
    const uploadResult = await uploadStream(req.file.buffer, {
      folder: `org_${org.id}/memories`,
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
      attributes: ['id'],
      raw: true,
    });
    for (const u of orgUsers) {
      if (u.id !== req.actor.id) {
        Notification.create({
          user_id: u.id,
          type: 'new_memory',
          title: 'New memory shared!',
          body: `${req.actor.name || 'Someone'} uploaded a new ${mediaType}.`,
          action_url: '/portal',
        }).catch((e) => logger.error(`Notification creation failed for user ${u.id}:`, e.message));
      }
    }

    res.status(201).json({ message: 'Memory uploaded.', memory });
  } catch (err) {
    logger.error('uploadMemory error:', err.message);
    res.status(500).json({ error: 'Upload failed.' });
  }
}

/**
 * DELETE /api/memories/:id
 */
async function deleteMemory(req, res) {
  try {
    const memory = await Memory.findByPk(req.params.id);
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found.' });
    }

    // Only uploader or admin (checked via org) can delete
    if (memory.uploaded_by !== req.actor.id) {
      return res.status(403).json({ error: 'You can only delete your own memories.' });
    }

    await memory.update({ is_active: 0 });
    auditLog.log('user', req.actor.id, 'MEMORY_DELETED', 'memory', memory.id, null, req);

    res.json({ message: 'Memory deleted.' });
  } catch (err) {
    logger.error('deleteMemory error:', err.message);
    res.status(500).json({ error: 'Failed to delete memory.' });
  }
}

module.exports = { getMemories, uploadMemory, deleteMemory };
