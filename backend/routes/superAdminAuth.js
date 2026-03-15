// backend/routes/superAdminAuth.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/superAdminAuth');
const { superAdminRequestOtp, superAdminVerifyOtp } = require('../middleware/rateLimiter');

// POST /api/super-admin/request-otp
router.post('/request-otp', superAdminRequestOtp, controller.requestOtp);

// POST /api/super-admin/verify-otp
router.post('/verify-otp', superAdminVerifyOtp, controller.verifyOtp);

module.exports = router;
