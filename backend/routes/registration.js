// backend/routes/registration.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/registration');
const { blockTempMail } = require('../middleware/blockTempMail');
const { verifyTurnstile } = require('../middleware/turnstile');
const { registerSendOtp, registerVerifyOtp, registerSubmit } = require('../middleware/rateLimiter');
const { registrationForm, otpSubmission, emailOnly } = require('../middleware/validate');

// POST /api/register/send-otp
router.post('/send-otp', registerSendOtp, blockTempMail, verifyTurnstile, controller.sendOtp);

// POST /api/register/verify-otp
router.post('/verify-otp', registerVerifyOtp, controller.verifyOtp);

// POST /api/register/submit
router.post('/submit', registerSubmit, registrationForm, controller.submit);

module.exports = router;
