const express = require('express');
const router = express.Router();
const controller = require('./features.controller');
const { verifyAnyJWT } = require('../../../middleware/auth');

// Any authenticated user can read features and directory
router.get('/', verifyAnyJWT, controller.getFeatures);
router.get('/directory', verifyAnyJWT, controller.getDirectory);

// Any authenticated user can update features (events, jobs data)
router.post('/', verifyAnyJWT, controller.updateFeatures);

module.exports = router;
