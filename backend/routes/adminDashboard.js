// backend/routes/adminDashboard.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminDashboard');
const { verifyAdminJWT } = require('../middleware/auth');
const { requireOrgActive } = require('../middleware/requireOrgActive');
const multer = require('multer');
const { announcement, coAdminInvite } = require('../middleware/validate');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(verifyAdminJWT);
router.use(requireOrgActive);

router.get('/cohort', controller.getCohort);
router.post('/cohort/import-csv', upload.single('file'), controller.importCsv);
router.post('/cohort/manual', controller.addStudent);
router.post('/cohort/send-magic-links', controller.sendMagicLinks);
router.get('/cohort/qr-batch', controller.downloadQrBatch);
router.post('/cohort/:id/send-magic-link', controller.sendIndividualMagicLink);
router.put('/cohort/:id', controller.editStudent);
router.delete('/cohort/:id', controller.softDeleteStudent);
router.patch('/settings', upload.single('logo'), controller.updateSettings);
router.post('/settings/back-image', upload.single('file'), controller.uploadBackImage);
router.get('/analytics', controller.getAnalytics);
router.get('/memories', controller.getMemories);
router.patch('/memories/:id/flag', controller.flagMemory);
router.delete('/memories/:id', controller.deleteMemory);
router.post('/announce', announcement, controller.announce);
router.post('/co-admins/invite', coAdminInvite, controller.inviteCoAdmin);

module.exports = router;
