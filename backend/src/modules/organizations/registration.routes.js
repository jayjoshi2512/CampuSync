// backend/routes/registration.js
const express = require('express');
const router = express.Router();
const controller = require('./registration.controller');
const { blockTempMail } = require('../../../middleware/blockTempMail');
const { verifyTurnstile } = require('../../../middleware/turnstile');
const { registerSendOtp, registerVerifyOtp, registerSubmit } = require('../../../middleware/rateLimiter');
const { registrationForm, otpSubmission, emailOnly } = require('../../../middleware/validate');
const { verifyUserJWT } = require('../../../middleware/auth');

// POST /api/register/send-otp
router.post('/send-otp', registerSendOtp, blockTempMail, verifyTurnstile, controller.sendOtp);

// POST /api/register/verify-otp
router.post('/verify-otp', registerVerifyOtp, controller.verifyOtp);

// POST /api/register/submit
router.post('/submit', registerSubmit, registrationForm, controller.submit);

// Alumni public registration
router.get('/alumni/organizations', controller.listAlumniOrganizations);
router.get('/alumni-organizations', controller.listAlumniOrganizations);
router.post('/alumni/send-otp', registerSendOtp, blockTempMail, verifyTurnstile, controller.sendAlumniOtp);
router.post('/alumni/verify-otp', registerVerifyOtp, controller.verifyAlumniOtp);
router.post('/alumni/submit', registerSubmit, blockTempMail, verifyTurnstile, controller.submitAlumniRequest);

// Existing user upgrade flow
router.post('/alumni/request-upgrade', verifyUserJWT, controller.requestAlumniUpgrade);

module.exports = router;

