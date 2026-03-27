// backend/routes/memories.js
const express = require('express');
const router = express.Router();
const controller = require('./memories.controller');
const { verifyUserJWT } = require('../../../middleware/auth');
const { checkStorageLimit } = require('../../../middleware/checkStorageLimit');
const { checkMemoryUploadLimits } = require('../../../middleware/checkMemoryUploadLimits');
const { memoryUpload: memoryUploadLimit } = require('../../../middleware/rateLimiter');
const { memoryUpload: memoryUploadValidate } = require('../../../middleware/validate');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB hard cap (videos)
});

// PUBLIC: View a user's memory profile (by ID)
router.get('/profile/:user_id', controller.getPublicUserMemories);

router.use(verifyUserJWT);

router.get('/', controller.getMemories);
router.get('/usage', controller.getMyMemoryUsage);
router.get('/stats/summary', controller.getMemoryStats);
router.post('/upload', memoryUploadLimit, checkStorageLimit, upload.single('file'), checkMemoryUploadLimits, memoryUploadValidate, controller.uploadMemory);
router.delete('/:id', controller.deleteMemory);

module.exports = router;

