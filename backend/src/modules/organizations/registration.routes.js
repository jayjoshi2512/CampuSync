// backend/routes/registration.js
const express = require('express');
const router = express.Router();
const controller = require('./registration.controller');
const { blockTempMail } = require('../../../middleware/blockTempMail');
// Turnstile removed
// Rate limiters removed temporarily from registration flow
const { registrationForm, otpSubmission, emailOnly } = require('../../../middleware/validate');
const { verifyUserJWT } = require('../../../middleware/auth');

// POST /api/register/send-otp
router.post('/send-otp', blockTempMail, controller.sendOtp);

// POST /api/register/verify-otp
router.post('/verify-otp', controller.verifyOtp);

// POST /api/register/submit
router.post('/submit', registrationForm, controller.submit);

// Alumni public registration
router.get('/alumni/organizations', controller.listAlumniOrganizations);
router.get('/alumni-organizations', controller.listAlumniOrganizations);
router.post('/alumni/send-otp', blockTempMail, controller.sendAlumniOtp);
router.post('/alumni/verify-otp', controller.verifyAlumniOtp);
router.post('/alumni/submit', blockTempMail, controller.submitAlumniRequest);

// Existing user upgrade flow
router.post('/alumni/request-upgrade', verifyUserJWT, controller.requestAlumniUpgrade);

module.exports = router;

