// backend/routes/billing.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/billing');
const { verifyAdminJWT } = require('../middleware/auth');

router.post('/create-subscription', verifyAdminJWT, controller.createSubscription);
router.get('/invoices', verifyAdminJWT, controller.getInvoices);
// Webhook route is mounted separately in server.js with express.raw()

module.exports = router;
