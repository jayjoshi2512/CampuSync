// backend/routes/superAdminDashboard.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/superAdminDashboard');
const { verifySuperAdminJWT } = require('../middleware/auth');

// All routes require Super Admin JWT
router.use(verifySuperAdminJWT);

router.get('/stats', controller.getStats);
router.get('/registrations', controller.getRegistrations);
router.patch('/registrations/:id/approve', controller.approveRegistration);
router.patch('/registrations/:id/reject', controller.rejectRegistration);
router.get('/organizations', controller.getOrganizations);
router.patch('/organizations/:id', controller.updateOrganization);
router.get('/audit-logs', controller.getAuditLogs);
router.get('/trash', controller.getTrash);
router.patch('/trash/restore', controller.restoreTrash);
router.delete('/trash/purge', controller.purgeTrash);
router.get('/storage', controller.getStorage);

module.exports = router;
