/**
 * Socket.io Event Emitter
 * Usage in any controller/route: const { emitSessionSync, emitOrgUpdate, emitPaymentSuccess, emitNotification } = require('../utils/socketEvents');
 */

const emitSessionSync = (io, userId) => {
    if (!io) return;
    io.to(`user:${userId}`).emit('session:sync-required', {
        type: 'session',
        timestamp: new Date().toISOString(),
        message: 'Session data updated. Refetch /me endpoint.',
    });
};

const emitOrgUpdate = (io, orgId, userId) => {
    if (!io) return;
    io.to(`user:${userId}`).emit('org:updated', {
        type: 'organization',
        orgId,
        timestamp: new Date().toISOString(),
        message: 'Organization data changed. Refetch org details.',
    });
};

const emitPaymentSuccess = (io, userId, paymentData) => {
    if (!io) return;
    io.to(`user:${userId}`).emit('payment:success', {
        type: 'payment',
        status: 'success',
        subscriptionId: paymentData.subscriptionId,
        planKey: paymentData.planKey,
        amount: paymentData.amount,
        timestamp: new Date().toISOString(),
        message: `Payment successful! Plan upgraded to ${paymentData.planKey}`,
    });
};

const emitNotification = (io, userId, notificationData) => {
    if (!io) return;
    io.to(`user:${userId}`).emit('notification:new', {
        type: 'notification',
        notificationId: notificationData.notificationId,
        title: notificationData.title,
        message: notificationData.message,
        icon: notificationData.icon,
        timestamp: new Date().toISOString(),
    });
};

const emitBroadcast = (io, role, eventName, data) => {
    if (!io) return;
    io.to(`role:${role}`).emit(eventName, {
        ...data,
        timestamp: new Date().toISOString(),
    });
};

const emitToAllUsers = (io, eventName, data) => {
    if (!io) return;
    io.emit(eventName, {
        ...data,
        timestamp: new Date().toISOString(),
    });
};

module.exports = {
    emitSessionSync,
    emitOrgUpdate,
    emitPaymentSuccess,
    emitNotification,
    emitBroadcast,
    emitToAllUsers,
};
