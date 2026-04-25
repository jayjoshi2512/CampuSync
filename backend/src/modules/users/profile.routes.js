// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const controller = require('./profile.controller');
const { verifyUserJWT } = require('../../../middleware/auth');
const { profileUpdate } = require('../../../middleware/validate');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(verifyUserJWT);
router.get('/', controller.getProfile);
router.patch('/', upload.single('avatar'), profileUpdate, controller.updateProfile);
router.delete('/avatar', controller.deleteAvatar);

module.exports = router;
