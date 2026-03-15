// backend/controllers/notifications.js
const Notification = require('../models/Notification');
const { Op, fn, col } = require('sequelize');
const { logger } = require('../config/database');

/**
 * GET /api/notifications
 */
async function getNotifications(req, res) {
  try {
    // Admins / super-admins don't have per-user notifications yet.
    // Return an empty list so the NotificationBell renders gracefully
    // rather than crashing with a 401.
    if (req.actor.role !== 'user') {
      return res.json({ notifications: [], total: 0, unread_count: 0, page: 1 });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count } = await Notification.findAndCountAll({
      where: { user_id: req.actor.id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    const unreadCount = await Notification.count({
      where: { user_id: req.actor.id, is_read: 0 },
    });

    res.json({
      notifications: rows,
      total: count,
      unread_count: unreadCount,
      page: parseInt(page),
    });
  } catch (err) {
    logger.error('getNotifications error:', err.message);
    res.status(500).json({ error: 'Failed to load notifications.' });
  }
}

/**
 * PATCH /api/notifications/read
 */
async function markRead(req, res) {
  try {
    const { ids, all } = req.body;

    if (all) {
      await Notification.update(
        { is_read: 1 },
        { where: { user_id: req.actor.id, is_read: 0 } }
      );
    } else if (ids && Array.isArray(ids)) {
      await Notification.update(
        { is_read: 1 },
        { where: { id: ids, user_id: req.actor.id } }
      );
    } else {
      return res.status(400).json({ error: 'Provide "ids" array or "all: true".' });
    }

    res.json({ message: 'Notifications marked as read.' });
  } catch (err) {
    logger.error('markRead error:', err.message);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
}

module.exports = { getNotifications, markRead };
