// backend/routes/memories.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/memories');
const { verifyUserJWT } = require('../middleware/auth');
const { checkStorageLimit } = require('../middleware/checkStorageLimit');
const { memoryUpload: memoryUploadLimit } = require('../middleware/rateLimiter');
const { memoryUpload: memoryUploadValidate } = require('../middleware/validate');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

router.use(verifyUserJWT);

router.get('/', controller.getMemories);
router.post('/upload', memoryUploadLimit, checkStorageLimit, upload.single('file'), memoryUploadValidate, controller.uploadMemory);
router.delete('/:id', controller.deleteMemory);

module.exports = router;
