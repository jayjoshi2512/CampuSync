// backend/routes/cards.js
const express = require('express');
const router = express.Router();
const controller = require('./cards.controller');
const { verifyUserJWT } = require('../../../middleware/auth');

// Public route
router.get('/share/:slug', controller.getPublicCard);

// Authenticated routes
router.get('/mine', verifyUserJWT, controller.getMyCard);
router.patch('/mine/share-toggle', verifyUserJWT, controller.toggleShare);
router.post('/mine/download', verifyUserJWT, controller.downloadCard);

module.exports = router;

