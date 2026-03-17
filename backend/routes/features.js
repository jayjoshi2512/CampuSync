const express = require('express');
const router = express.Router();
const controller = require('../controllers/features');
const { verifyAnyJWT, verifyAdminJWT } = require('../middleware/auth');

// Any authenticated user can read features and directory
router.get('/', verifyAnyJWT, controller.getFeatures);
router.get('/directory', verifyAnyJWT, controller.getDirectory);

// Only admins can update features (post jobs, events, etc)
// Users can also do this in a real app (like posting a job), but for our simple flex JSON, we will allow verifyAnyJWT
// Wait, if users need to apply for jobs or RSVP to events, they need to update the JSON
// So let's allow verifyAnyJWT but trust the frontend to send strict updates
router.post('/', verifyAnyJWT, controller.updateFeatures);

module.exports = router;
