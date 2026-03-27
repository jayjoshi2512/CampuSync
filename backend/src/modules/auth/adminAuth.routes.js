// backend/routes/adminAuth.js
const express = require('express');
const router = express.Router();
const controller = require('./adminAuth.controller');
const { adminLogin: adminLoginLimit } = require('../../../middleware/rateLimiter');
const { adminLogin, adminSetupPassword } = require('../../../middleware/validate');
const { verifyAdminJWT } = require('../../../middleware/auth');

router.post('/login', adminLoginLimit, adminLogin, controller.login);
router.post('/setup-password', adminSetupPassword, controller.setupPassword);
router.get('/me', verifyAdminJWT, controller.getMe);

module.exports = router;

