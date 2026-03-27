// backend/src/modules/mentorship/mentorship.controller.js
const MentorProfile = require('./MentorProfile.model');
const MentorshipRequest = require('./MentorshipRequest.model');
const { User } = require('../models');
const { logger } = require('../../../config/database');
const { createUserNotification } = require('../notifications/notifications.controller');

// ─── Alumni applies to become a mentor ───────────────────────────────────────
async function applyMentor(req, res) {
    try {
        const user = await User.findById(req.actor.id);
        if (!user || user.role !== 'alumni') {
            return res.status(403).json({ error: 'Only alumni can apply to become mentors.' });
        }

        const existing = await MentorProfile.findOne({ user_id: user._id });
        if (existing) {
            if (existing.status === 'pending') return res.status(409).json({ error: 'You already have a pending application.' });
            if (existing.status === 'approved') return res.status(409).json({ error: 'You are already an approved mentor.' });
            // If rejected, allow re-application
            existing.status = 'pending';
            existing.role_title = req.body.role_title;
            existing.company = req.body.company;
            existing.expertise = Array.isArray(req.body.expertise) ? req.body.expertise : (req.body.expertise || '').split(',').map(s => s.trim()).filter(Boolean);
            existing.bio = req.body.bio || '';
            existing.reviewed_by = null;
            existing.reviewed_at = null;
            await existing.save();
            return res.json({ message: 'Mentor application re-submitted!', profile: existing });
        }

        const { role_title, company, expertise, bio } = req.body;
        if (!role_title || !company || !expertise) {
            return res.status(400).json({ error: 'role_title, company, and expertise are required.' });
        }

        const profile = await MentorProfile.create({
            user_id: user._id,
            organization_id: user.organization_id,
            role_title,
            company,
            expertise: Array.isArray(expertise) ? expertise : expertise.split(',').map(s => s.trim()).filter(Boolean),
            bio: bio || '',
        });

        res.status(201).json({ message: 'Mentor application submitted!', profile });
    } catch (err) {
        logger.error('applyMentor error:', err.message);
        res.status(500).json({ error: 'Failed to submit mentor application.' });
    }
}

// ─── List approved mentors for the org ───────────────────────────────────────
async function listMentors(req, res) {
    try {
        const mentors = await MentorProfile.find({
            organization_id: req.actor.org,
            status: 'approved',
        }).populate('user_id', 'name email avatar_url branch batch_year').lean();

        const result = mentors.map(m => ({
            _id: m._id,
            user_id: m.user_id?._id,
            user_name: m.user_id?.name || 'Unknown',
            user_email: m.user_id?.email || '',
            user_avatar: m.user_id?.avatar_url || null,
            role_title: m.role_title,
            company: m.company,
            expertise: m.expertise,
            bio: m.bio,
            slots: m.slots,
        }));

        res.json({ mentors: result });
    } catch (err) {
        logger.error('listMentors error:', err.message);
        res.status(500).json({ error: 'Failed to load mentors.' });
    }
}

// ─── Get my mentor profile ───────────────────────────────────────────────────
async function getMyMentorProfile(req, res) {
    try {
        const profile = await MentorProfile.findOne({ user_id: req.actor.id }).lean();
        res.json({ profile: profile || null });
    } catch (err) {
        logger.error('getMyMentorProfile error:', err.message);
        res.status(500).json({ error: 'Failed to load profile.' });
    }
}

// ─── Student requests help from a mentor ─────────────────────────────────────
async function requestHelp(req, res) {
    try {
        const user = await User.findById(req.actor.id);
        if (!user || user.role !== 'user') {
            return res.status(403).json({ error: 'Only students can request mentorship.' });
        }

        const { mentor_id, message } = req.body;
        if (!mentor_id) return res.status(400).json({ error: 'mentor_id is required.' });

        const mentor = await MentorProfile.findById(mentor_id);
        if (!mentor || mentor.status !== 'approved' || mentor.organization_id.toString() !== user.organization_id.toString()) {
            return res.status(404).json({ error: 'Mentor not found.' });
        }

        // Check for existing pending request
        const existing = await MentorshipRequest.findOne({
            student_id: user._id,
            mentor_id: mentor._id,
            status: 'pending',
        });
        if (existing) {
            return res.status(409).json({ error: 'You already have a pending request for this mentor.' });
        }

        const request = await MentorshipRequest.create({
            student_id: user._id,
            mentor_id: mentor._id,
            organization_id: user.organization_id,
            message: message || '',
        });

        // Notify the mentor
        await createUserNotification(mentor.user_id, {
            type: 'mentorship',
            title: 'New Mentorship Request',
            body: `${user.name} has requested your mentorship.`,
        });

        res.status(201).json({ message: 'Mentorship request sent!', request });
    } catch (err) {
        logger.error('requestHelp error:', err.message);
        res.status(500).json({ error: 'Failed to send mentorship request.' });
    }
}

// ─── Get my requests (student sees sent, mentor sees received) ───────────────
async function getMyRequests(req, res) {
    try {
        const profile = await MentorProfile.findOne({ user_id: req.actor.id, status: 'approved' });

        // Mentor: get received requests
        let received = [];
        if (profile) {
            received = await MentorshipRequest.find({ mentor_id: profile._id })
                .populate('student_id', 'name email avatar_url branch batch_year')
                .sort({ created_at: -1 })
                .lean();
            received = received.map(r => ({
                ...r,
                student_name: r.student_id?.name || 'Unknown',
                student_email: r.student_id?.email || '',
                student_avatar: r.student_id?.avatar_url || null,
                student_branch: r.student_id?.branch || null,
                student_batch_year: r.student_id?.batch_year || null,
            }));
        }

        // Student (or anyone): get sent requests
        const sent = await MentorshipRequest.find({ student_id: req.actor.id })
            .populate({
                path: 'mentor_id',
                select: 'role_title company user_id',
                populate: { path: 'user_id', select: 'name' },
            })
            .sort({ created_at: -1 })
            .lean();

        const sentEnriched = sent.map(r => ({
            ...r,
            mentor_name: r.mentor_id?.user_id?.name || 'Unknown',
            mentor_role: r.mentor_id?.role_title || '',
            mentor_company: r.mentor_id?.company || '',
        }));

        res.json({ received, sent: sentEnriched });
    } catch (err) {
        logger.error('getMyRequests error:', err.message);
        res.status(500).json({ error: 'Failed to load requests.' });
    }
}

// ─── Mentor decides a student request ────────────────────────────────────────
async function decideRequest(req, res) {
    try {
        const { id } = req.params;
        const { action, mentor_reply } = req.body;
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'action must be approve or reject.' });
        }

        const request = await MentorshipRequest.findById(id);
        if (!request) return res.status(404).json({ error: 'Request not found.' });

        const profile = await MentorProfile.findById(request.mentor_id);
        if (!profile || profile.user_id.toString() !== req.actor.id) {
            return res.status(403).json({ error: 'You are not authorized to decide this request.' });
        }

        request.status = action === 'approve' ? 'approved' : 'rejected';
        request.decided_at = new Date();
        if (action === 'approve' && mentor_reply) {
            request.mentor_reply = mentor_reply;
        }
        await request.save();

        // Notify the student
        const mentorUser = await User.findById(profile.user_id).select('name').lean();
        const replyNote = mentor_reply ? ` Note: "${mentor_reply}"` : '';
        await createUserNotification(request.student_id, {
            type: 'mentorship',
            title: `Mentorship Request ${action === 'approve' ? 'Approved' : 'Declined'}`,
            body: `${mentorUser?.name || 'Mentor'} has ${action === 'approve' ? 'approved' : 'declined'} your request.${replyNote}`,
        });

        res.json({ message: `Request ${action}d.`, request });
    } catch (err) {
        logger.error('decideRequest error:', err.message);
        res.status(500).json({ error: 'Failed to process request.' });
    }
}

// ─── Badge counts ────────────────────────────────────────────────────────────
async function getBadges(req, res) {
    try {
        const profile = await MentorProfile.findOne({ user_id: req.actor.id, status: 'approved' });
        let pendingStudentRequests = 0;
        if (profile) {
            pendingStudentRequests = await MentorshipRequest.countDocuments({
                mentor_id: profile._id,
                status: 'pending',
            });
        }
        res.json({ pending_student_requests: pendingStudentRequests });
    } catch (err) {
        logger.error('getBadges error:', err.message);
        res.status(500).json({ error: 'Failed to load badges.' });
    }
}

// ════════════════════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

// ─── List pending mentor applications ────────────────────────────────────────
async function adminListApplications(req, res) {
    try {
        const applications = await MentorProfile.find({
            organization_id: req.actor.org,
            status: 'pending',
        }).populate('user_id', 'name email avatar_url branch batch_year').sort({ created_at: -1 }).lean();

        const result = applications.map(a => ({
            _id: a._id,
            user_name: a.user_id?.name || 'Unknown',
            user_email: a.user_id?.email || '',
            role_title: a.role_title,
            company: a.company,
            expertise: a.expertise,
            bio: a.bio,
            created_at: a.created_at,
        }));

        res.json({ applications: result });
    } catch (err) {
        logger.error('adminListApplications error:', err.message);
        res.status(500).json({ error: 'Failed to load applications.' });
    }
}

// ─── Admin decides a mentor application ──────────────────────────────────────
async function adminDecideApplication(req, res) {
    try {
        const { id } = req.params;
        const { action } = req.body;
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'action must be approve or reject.' });
        }

        const profile = await MentorProfile.findOne({ _id: id, organization_id: req.actor.org });
        if (!profile) return res.status(404).json({ error: 'Application not found.' });

        profile.status = action === 'approve' ? 'approved' : 'rejected';
        profile.reviewed_by = req.actor.id;
        profile.reviewed_at = new Date();
        await profile.save();

        // Notify the applicant
        await createUserNotification(profile.user_id, {
            type: 'mentorship',
            title: `Mentor Application ${action === 'approve' ? 'Approved' : 'Rejected'}`,
            body: action === 'approve'
                ? 'Congratulations! You are now an approved mentor. Students can now request your help.'
                : 'Your mentor application was not approved at this time.',
        });

        res.json({ message: `Application ${action}d.`, profile });
    } catch (err) {
        logger.error('adminDecideApplication error:', err.message);
        res.status(500).json({ error: 'Failed to process application.' });
    }
}

// ─── Admin list all approved mentors ─────────────────────────────────────────
async function adminListMentors(req, res) {
    try {
        const mentors = await MentorProfile.find({
            organization_id: req.actor.org,
            status: 'approved',
        }).populate('user_id', 'name email avatar_url').sort({ created_at: -1 }).lean();

        const result = mentors.map(m => ({
            _id: m._id,
            user_name: m.user_id?.name || 'Unknown',
            user_email: m.user_id?.email || '',
            role_title: m.role_title,
            company: m.company,
            expertise: m.expertise,
            bio: m.bio,
            slots: m.slots,
            created_at: m.created_at,
        }));

        res.json({ mentors: result });
    } catch (err) {
        logger.error('adminListMentors error:', err.message);
        res.status(500).json({ error: 'Failed to load mentors.' });
    }
}

// ─── Admin removes a mentor ──────────────────────────────────────────────────
async function adminDeleteMentor(req, res) {
    try {
        const { id } = req.params;
        const profile = await MentorProfile.findOne({ _id: id, organization_id: req.actor.org });
        if (!profile) return res.status(404).json({ error: 'Mentor not found.' });

        // Delete associated requests
        await MentorshipRequest.deleteMany({ mentor_id: profile._id });
        await MentorProfile.deleteOne({ _id: profile._id });

        res.json({ message: 'Mentor removed successfully.' });
    } catch (err) {
        logger.error('adminDeleteMentor error:', err.message);
        res.status(500).json({ error: 'Failed to remove mentor.' });
    }
}

// ─── Admin badge count ───────────────────────────────────────────────────────
async function adminBadges(req, res) {
    try {
        const pendingApplications = await MentorProfile.countDocuments({
            organization_id: req.actor.org,
            status: 'pending',
        });
        res.json({ pending_applications: pendingApplications });
    } catch (err) {
        logger.error('adminBadges error:', err.message);
        res.status(500).json({ error: 'Failed to load badges.' });
    }
}

module.exports = {
    applyMentor,
    listMentors,
    getMyMentorProfile,
    requestHelp,
    getMyRequests,
    decideRequest,
    getBadges,
    adminListApplications,
    adminDecideApplication,
    adminListMentors,
    adminDeleteMentor,
    adminBadges,
};
