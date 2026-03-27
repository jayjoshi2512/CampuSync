// backend/routes/billing.js
const express = require('express');
const router = express.Router();
const controller = require('./billing.controller');
const { verifyAdminJWT } = require('../../../middleware/auth');

router.post('/create-subscription', verifyAdminJWT, controller.createSubscription);
router.post('/demo-upgrade', verifyAdminJWT, controller.demoUpgrade);
router.get('/invoices', verifyAdminJWT, controller.getInvoices);
// Webhook route is mounted separately in server.js with express.raw()

module.exports = router;

