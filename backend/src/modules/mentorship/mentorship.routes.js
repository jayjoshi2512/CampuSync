// backend/src/modules/mentorship/mentorship.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('./mentorship.controller');
const { verifyAnyJWT, verifyUserJWT, verifyAdminJWT } = require('../../../middleware/auth');

// ── User / Alumni endpoints ──────────────────────────────────────────────────
router.post('/apply', verifyUserJWT, ctrl.applyMentor);
router.get('/mentors', verifyAnyJWT, ctrl.listMentors);
router.get('/my-profile', verifyAnyJWT, ctrl.getMyMentorProfile);
router.post('/request', verifyUserJWT, ctrl.requestHelp);
router.get('/my-requests', verifyAnyJWT, ctrl.getMyRequests);
router.patch('/request/:id/decide', verifyUserJWT, ctrl.decideRequest);
router.get('/badges', verifyAnyJWT, ctrl.getBadges);

// ── Admin endpoints ──────────────────────────────────────────────────────────
router.get('/admin/applications', verifyAdminJWT, ctrl.adminListApplications);
router.patch('/admin/applications/:id', verifyAdminJWT, ctrl.adminDecideApplication);
router.get('/admin/mentors', verifyAdminJWT, ctrl.adminListMentors);
router.delete('/admin/mentors/:id', verifyAdminJWT, ctrl.adminDeleteMentor);
router.get('/admin/badges', verifyAdminJWT, ctrl.adminBadges);

module.exports = router;
