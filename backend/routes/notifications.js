// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/notifications');
const { verifyAnyJWT } = require('../middleware/auth');

router.get('/stream', controller.streamNotifications);

// Accept admin, user, and super_admin tokens so the NotificationBell
// works in all dashboards without triggering a 401 redirect.
router.use(verifyAnyJWT);
router.get('/', controller.getNotifications);
router.patch('/read', controller.markRead);

module.exports = router;
