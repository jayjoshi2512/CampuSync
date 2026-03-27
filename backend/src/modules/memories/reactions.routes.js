// backend/routes/reactions.js
const express = require('express');
const router = express.Router();
const controller = require('./reactions.controller');
const { verifyAnyJWT } = require('../../../middleware/auth');

router.use(verifyAnyJWT);

router.post('/:memoryId/reactions', controller.addReaction);
router.delete('/:memoryId/reactions/:emoji', controller.removeReaction);

module.exports = router;

