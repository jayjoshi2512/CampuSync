// backend/routes/adminAuth.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminAuth');
const { adminLogin: adminLoginLimit } = require('../middleware/rateLimiter');
const { adminLogin, adminSetupPassword } = require('../middleware/validate');

router.post('/login', adminLoginLimit, adminLogin, controller.login);
router.post('/setup-password', adminSetupPassword, controller.setupPassword);

module.exports = router;
