// backend/controllers/notifications.js
const { Notification } = require('../models');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../../../utils/jwtFactory');
const { logger } = require('../../../config/database');

const streamClients = new Map();
const transientNotifications = new Map();

function actorKey (actor) {
    return `${ actor.role }:${ actor.id }`;
}

function addTransientNotification (actor, payload) {
    const key = actorKey(actor);
    const existing = transientNotifications.get(key) || [];
    const notification = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type: payload.type || 'system',
        title: payload.title,
        body: payload.body || null,
        action_url: payload.action_url || null,
        is_read: 0,
        is_active: 1,
        created_at: new Date().toISOString(),
    };
    transientNotifications.set(key, [ notification, ...existing ].slice(0, 100));
    return notification;
}

function emitNotificationToActor (actor, notification) {
    const key = actorKey(actor);
    const clients = streamClients.get(key);
    if(!clients || clients.size === 0) return;

    const payload = `event: notification\ndata: ${ JSON.stringify(notification) }\n\n`;
    for(const res of clients) {
        res.write(payload);
    }
}

async function createUserNotification (userId, payload) {
    const notification = await Notification.create({
        user_id: userId,
        type: payload.type || 'system',
        title: payload.title,
        body: payload.body || null,
        action_url: payload.action_url || null,
    });

    emitNotificationToActor({ role: 'user', id: userId }, notification.toJSON());
    return notification;
}

function parseStreamToken (token) {
    if(!token) return null;
    const decoded = jwt.decode(token);
    if(!decoded || !decoded.role || !decoded.sub) return null;

    const roleToType = {
        super_admin: 'super_admin',
        admin: 'admin',
        user: 'user',
    };

    const tokenType = roleToType[ decoded.role ];
    if(!tokenType) return null;

    verifyToken(token, tokenType);
    return { role: decoded.role, id: decoded.sub, org: decoded.org };
}

/**
 * GET /api/notifications
 */
async function getNotifications (req, res) {
    try {
        if(req.actor.role !== 'user') {
            const key = actorKey(req.actor);
            const notifications = transientNotifications.get(key) || [];
            const unreadCount = notifications.filter((n) => !n.is_read).length;
            return res.json({
                notifications,
                total: notifications.length,
                unread_count: unreadCount,
                page: 1,
            });
        }

        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { rows, count } = await Notification.findAndCountAll({
            where: { user_id: req.actor.id },
            order: [ [ 'created_at', 'DESC' ] ],
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
    } catch(err) {
        logger.error('getNotifications error:', err.message);
        res.status(500).json({ error: 'Failed to load notifications.' });
    }
}

/**
 * PATCH /api/notifications/read
 */
async function markRead (req, res) {
    try {
        const { ids, all } = req.body;

        if(req.actor.role !== 'user') {
            const key = actorKey(req.actor);
            const notifications = transientNotifications.get(key) || [];
            const next = notifications.map((n) => {
                if(all) return { ...n, is_read: 1 };
                if(ids && Array.isArray(ids) && ids.includes(n.id)) return { ...n, is_read: 1 };
                return n;
            });
            transientNotifications.set(key, next);
            return res.json({ message: 'Notifications marked as read.' });
        }

        if(all) {
            await Notification.update(
                { is_read: 1 },
                { where: { user_id: req.actor.id, is_read: 0 } }
            );
        } else if(ids && Array.isArray(ids)) {
            await Notification.update(
                { is_read: 1 },
                { where: { id: ids, user_id: req.actor.id } }
            );
        } else {
            return res.status(400).json({ error: 'Provide "ids" array or "all: true".' });
        }

        res.json({ message: 'Notifications marked as read.' });
    } catch(err) {
        logger.error('markRead error:', err.message);
        res.status(500).json({ error: 'Failed to update notifications.' });
    }
}

/**
 * GET /api/notifications/stream?token=...
 */
function streamNotifications (req, res) {
    try {
        const actor = parseStreamToken(req.query.token);
        if(!actor) {
            return res.status(401).json({ error: 'Invalid stream token.' });
        }

        const key = actorKey(actor);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        if(!streamClients.has(key)) {
            streamClients.set(key, new Set());
        }
        streamClients.get(key).add(res);

        res.write(`event: connected\ndata: ${ JSON.stringify({ ok: true, ts: Date.now() }) }\n\n`);

        const heartbeat = setInterval(() => {
            res.write('event: ping\ndata: {}\n\n');
        }, 25000);

        req.on('close', () => {
            clearInterval(heartbeat);
            const clients = streamClients.get(key);
            if(clients) {
                clients.delete(res);
                if(clients.size === 0) {
                    streamClients.delete(key);
                }
            }
        });
    } catch(err) {
        logger.error('streamNotifications error:', err.message);
        return res.status(401).json({ error: 'Failed to start notification stream.' });
    }
}

module.exports = {
    getNotifications,
    markRead,
    streamNotifications,
    emitNotificationToActor,
    addTransientNotification,
    createUserNotification,
};

