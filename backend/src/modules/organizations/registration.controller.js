// backend/src/modules/organizations/registration.controller.js
const bcrypt = require('bcryptjs');
const redis = require('../../../config/redis');
const { sendMail } = require('../../../config/mailer');
const { generateRegOTP } = require('../../../utils/otpGenerator');
const { registrationOtpEmail, registrationReceivedEmail, superAdminNewRegistrationAlert } = require('../../../utils/emailTemplates');
const { Organization } = require('../models');
const { OrgRegistration } = require('../models');
const { AlumniRequest } = require('../models');
const { User } = require('../models');
const auditLog = require('../../../utils/auditLog');
const { logger } = require('../../../config/database');

async function sendOtp (req, res) {
    try {
        const { email, contact_name } = req.body;
        const name = contact_name || email.split('@')[ 0 ];

        const existingOrg = await Organization.findOne({ contact_email: email, status: { $ne: 'rejected' } });
        const existingReg = await OrgRegistration.findOne({ contact_email: email, status: { $ne: 'rejected' } });
        if(existingOrg || existingReg) {
            return res.status(409).json({ error: 'This email is already registered and pending or active. Please log in instead.' });
        }

        const existingAttempts = await redis.get(`reg_otp_count:${ email }`);
        if(existingAttempts && parseInt(existingAttempts) >= 10) {
            return res.status(429).json({ error: 'Too many OTP requests for this email. Try again later.' });
        }

        const otp = generateRegOTP();
        const otpHash = await bcrypt.hash(otp, 10);
        await redis.set(`reg_otp:${ email }`, otpHash, 900);

        const count = await redis.incr(`reg_otp_count:${ email }`);
        if(count === 1) await redis.expire(`reg_otp_count:${ email }`, 3600);
        await redis.del(`reg_otp_attempts:${ email }`);

        await sendMail(email, 'Verify Your Email — CampuSync', registrationOtpEmail(name, otp));
        logger.info(`Registration OTP sent to ${ email }`);
        res.json({ message: 'Verification code sent to your email.', email });
    } catch(err) {
        logger.error('sendOtp error:', err.message);
        res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
    }
}

async function verifyOtp (req, res) {
    try {
        const { email, otp } = req.body;
        if(!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

        const attempts = await redis.incr(`reg_otp_attempts:${ email }`);
        if(attempts === 1) await redis.expire(`reg_otp_attempts:${ email }`, 900);
        if(attempts > 5) return res.status(429).json({ error: 'Too many verification attempts. Request a new code.' });

        const storedHash = await redis.get(`reg_otp:${ email }`);
        if(!storedHash) return res.status(400).json({ error: 'Verification code expired or not found. Please request a new one.' });

        const isValid = await bcrypt.compare(otp, storedHash);
        if(!isValid) return res.status(400).json({ error: 'Invalid verification code.' });

        await redis.set(`reg_verified:${ email }`, '1', 1800);
        await redis.del(`reg_otp:${ email }`);
        await redis.del(`reg_otp_attempts:${ email }`);

        logger.info(`Registration email verified: ${ email }`);
        res.json({ message: 'Email verified successfully.', verified: true });
    } catch(err) {
        logger.error('verifyOtp error:', err.message);
        res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
}

async function submit (req, res) {
    try {
        const { institution_name, institution_type, institution_website, contact_name, contact_email, contact_phone, registration_reason } = req.body;

        const isVerified = await redis.get(`reg_verified:${ contact_email }`);
        if(!isVerified) return res.status(400).json({ error: 'Email must be verified before submitting. Please verify your email first.' });

        const existingOrg = await Organization.findOne({ contact_email });
        if(existingOrg) return res.status(409).json({ error: 'An organization with this email already exists.' });

        const slug = institution_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 100);
        const existingSlug = await Organization.findOne({ slug });
        const finalSlug = existingSlug ? `${ slug }-${ Date.now().toString(36) }` : slug;

        let org;
        try {
            org = await Organization.create({
                name: institution_name,
                slug: finalSlug,
                type: institution_type,
                contact_name,
                contact_email,
                contact_phone,
                institution_website: institution_website || null,
                registration_reason,
                email_verified: true,
                email_verified_at: new Date(),
                status: 'pending',
            });
        } catch(err) {
            if(err?.code === 11000) {
                return res.status(409).json({
                    error: 'This registration already exists or was just submitted. Please refresh and try again.',
                });
            }
            throw err;
        }

        await OrgRegistration.create({
            organization_id: org._id,
            contact_email,
            contact_name,
            institution_name,
            submitted_data_json: { institution_name, institution_type, institution_website, contact_name, contact_email, contact_phone, registration_reason },
            email_verified: true,
            status: 'pending',
            ip_address: req.ip || req.connection?.remoteAddress,
            user_agent: req.get('user-agent'),
        });

        await redis.del(`reg_verified:${ contact_email }`);
        auditLog.log('system', null, 'ORG_REGISTRATION_SUBMITTED', 'organization', org._id, { institution_name, contact_email }, req);

        sendMail(contact_email, 'Application Received — CampuSync', registrationReceivedEmail(contact_name, institution_name))
            .catch(err => logger.error('Failed to send confirmation email:', err.message));

        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
        if(superAdminEmail) {
            sendMail(superAdminEmail, `New Registration Pending: ${ institution_name }`, superAdminNewRegistrationAlert(institution_name, contact_name, contact_email))
                .catch(err => logger.error('Failed to send SA alert:', err.message));
        }

        logger.info(`Registration submitted: ${ institution_name } (${ contact_email })`);
        res.status(201).json({ message: 'Application submitted successfully! Check your email for confirmation.', organization_id: org._id });
    } catch(err) {
        logger.error(`submit error: ${ err.message }`);
        console.error(err);
        res.status(500).json({ error: 'Registration failed. Please try again.', details: err.message, stack: err.stack });
    }
}

async function listAlumniOrganizations (req, res) {
    try {
        const organizations = await Organization.find({ status: { $in: [ 'active', 'trial' ] }, is_active: true }).select('_id name slug').sort({ name: 1 }).lean();
        return res.json({ organizations });
    } catch(err) {
        logger.error('listAlumniOrganizations error:', err.message);
        return res.status(500).json({ error: 'Failed to load organizations.' });
    }
}

async function sendAlumniOtp (req, res) {
    try {
        const { email, name } = req.body;
        if(!email) return res.status(400).json({ error: 'Email is required.' });

        const otp = generateRegOTP();
        const otpHash = await bcrypt.hash(otp, 10);
        await redis.set(`alumni_reg_otp:${ email }`, otpHash, 900);
        await redis.del(`alumni_reg_otp_attempts:${ email }`);

        await sendMail(email, 'Verify Alumni Registration Email — CampuSync', registrationOtpEmail(name || email.split('@')[ 0 ], otp));
        return res.json({ message: 'Verification code sent to your email.', email });
    } catch(err) {
        logger.error('sendAlumniOtp error:', err.message);
        return res.status(500).json({ error: 'Failed to send verification code.' });
    }
}

async function verifyAlumniOtp (req, res) {
    try {
        const { email, otp } = req.body;
        if(!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

        const attempts = await redis.incr(`alumni_reg_otp_attempts:${ email }`);
        if(attempts === 1) await redis.expire(`alumni_reg_otp_attempts:${ email }`, 900);
        if(attempts > 5) return res.status(429).json({ error: 'Too many verification attempts. Request a new code.' });

        const storedHash = await redis.get(`alumni_reg_otp:${ email }`);
        if(!storedHash) return res.status(400).json({ error: 'Verification code expired or not found.' });

        const isValid = await bcrypt.compare(otp, storedHash);
        if(!isValid) return res.status(400).json({ error: 'Invalid verification code.' });

        await redis.set(`alumni_reg_verified:${ email }`, '1', 1800);
        await redis.del(`alumni_reg_otp:${ email }`);
        await redis.del(`alumni_reg_otp_attempts:${ email }`);

        return res.json({ message: 'Email verified successfully.', verified: true });
    } catch(err) {
        logger.error('verifyAlumniOtp error:', err.message);
        return res.status(500).json({ error: 'Verification failed.' });
    }
}

async function submitAlumniRequest (req, res) {
    try {
        const { organization_id, name, email, branch, batch_year, linkedin_url, reason } = req.body;
        if(!organization_id || !name || !email) return res.status(400).json({ error: 'Organization, name, and email are required.' });

        const isVerified = await redis.get(`alumni_reg_verified:${ email }`);
        if(!isVerified) return res.status(400).json({ error: 'Email must be verified before submitting.' });

        const org = await Organization.findOne({ _id: organization_id, is_active: true });
        if(!org) return res.status(404).json({ error: 'Organization not found.' });

        const existingPending = await AlumniRequest.findOne({ organization_id, email, status: 'pending' });
        if(existingPending) return res.status(409).json({ error: 'An alumni request is already pending for this email.' });

        const reqRow = await AlumniRequest.create({
            organization_id,
            name,
            email,
            branch: branch || null,
            batch_year: batch_year || null,
            linkedin_url: linkedin_url || null,
            reason: reason || null,
            status: 'pending',
        });

        await redis.del(`alumni_reg_verified:${ email }`);
        auditLog.log('system', null, 'ALUMNI_REQUEST_SUBMITTED', 'alumni_request', reqRow._id, { email, organization_id }, req);

        return res.status(201).json({ message: 'Alumni request submitted. Your admin will review it soon.', request_id: reqRow._id });
    } catch(err) {
        logger.error('submitAlumniRequest error:', err.message);
        return res.status(500).json({ error: 'Failed to submit alumni request.' });
    }
}

async function requestAlumniUpgrade (req, res) {
    try {
        const requester = await User.findOne({ _id: req.actor.id, organization_id: req.actor.org });
        if(!requester) return res.status(404).json({ error: 'User not found.' });

        const existingPending = await AlumniRequest.findOne({ organization_id: requester.organization_id, user_id: requester._id, status: 'pending' });
        if(existingPending) return res.status(409).json({ error: 'An alumni upgrade request is already pending.' });

        const reqRow = await AlumniRequest.create({
            organization_id: requester.organization_id,
            user_id: requester._id,
            name: requester.name,
            email: requester.email,
            branch: requester.branch,
            batch_year: requester.batch_year,
            linkedin_url: requester.linkedin_url,
            reason: req.body.reason || null,
            status: 'pending',
        });

        auditLog.log('user', requester._id, 'ALUMNI_UPGRADE_REQUESTED', 'alumni_request', reqRow._id, null, req);
        return res.status(201).json({ message: 'Alumni upgrade request submitted.', request_id: reqRow._id });
    } catch(err) {
        logger.error('requestAlumniUpgrade error:', err.message);
        return res.status(500).json({ error: 'Failed to submit alumni upgrade request.' });
    }
}

module.exports = { sendOtp, verifyOtp, submit, sendAlumniOtp, verifyAlumniOtp, submitAlumniRequest, requestAlumniUpgrade, listAlumniOrganizations };
