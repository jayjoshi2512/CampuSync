// backend/routes/userAuth.js
const express = require('express');
const router = express.Router();
const controller = require('./userAuth.controller');
const { userMagicLink } = require('../../../middleware/rateLimiter');
const { emailOnly } = require('../../../middleware/validate');
const { verifyUserJWT } = require('../../../middleware/auth');

router.post('/magic-link', userMagicLink, emailOnly, controller.requestMagicLink);
router.get('/verify-magic-link/:token', controller.verifyMagicLink);
router.get('/qr-login/:qr_hash', controller.qrLogin);
router.post('/login', controller.login);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.post('/change-password', verifyUserJWT, controller.changePassword);
router.get('/me', verifyUserJWT, controller.getMe);

module.exports = router;

