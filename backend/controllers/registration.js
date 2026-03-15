// backend/controllers/registration.js
const bcrypt = require('bcryptjs');
const redis = require('../config/redis');
const { sendMail } = require('../config/mailer');
const { generateRegOTP } = require('../utils/otpGenerator');
const { registrationOtpEmail, registrationReceivedEmail, superAdminNewRegistrationAlert } = require('../utils/emailTemplates');
const Organization = require('../models/Organization');
const OrgRegistration = require('../models/OrgRegistration');
const auditLog = require('../utils/auditLog');
const { logger } = require('../config/database');

/**
 * POST /api/register/send-otp
 * Generate 6-digit OTP, hash, store in Redis (15min TTL), send email
 */
async function sendOtp(req, res) {
  try {
    const { email, contact_name } = req.body;
    const name = contact_name || email.split('@')[0];
    // Check if email already registered (and not rejected)
    const { Op } = require('sequelize');
    const existingOrg = await Organization.findOne({ where: { contact_email: email, status: { [Op.ne]: 'rejected' } } });
    const existingReg = await OrgRegistration.findOne({ where: { contact_email: email, status: { [Op.ne]: 'rejected' } } });
    
    if (existingOrg || existingReg) {
      return res.status(409).json({ error: 'This email is already registered and pending or active. Please log in instead.' });
    }

    // Check if OTP already sent recently (rate limiting at app level)
    const existingAttempts = await redis.get(`reg_otp_count:${email}`);
    if (existingAttempts && parseInt(existingAttempts) >= 10) {
      return res.status(429).json({ error: 'Too many OTP requests for this email. Try again later.' });
    }

    // Generate OTP
    const otp = generateRegOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    // Store hash in Redis with 15 min TTL
    await redis.set(`reg_otp:${email}`, otpHash, 900);

    // Track OTP request count per email (1 hour window)
    const count = await redis.incr(`reg_otp_count:${email}`);
    if (count === 1) {
      await redis.expire(`reg_otp_count:${email}`, 3600);
    }

    // Reset verify attempts counter
    await redis.del(`reg_otp_attempts:${email}`);

    // Send OTP email
    await sendMail(email, 'Verify Your Email — Phygital SaaS', registrationOtpEmail(name, otp));

    logger.info(`Registration OTP sent to ${email}`);
    res.json({ message: 'Verification code sent to your email.', email });
  } catch (err) {
    logger.error('sendOtp error:', err.message);
    res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
}

/**
 * POST /api/register/verify-otp
 * Verify OTP hash from Redis, mark email as verified
 */
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    // Check attempt count
    const attempts = await redis.incr(`reg_otp_attempts:${email}`);
    if (attempts === 1) {
      await redis.expire(`reg_otp_attempts:${email}`, 900); // 15 min window
    }
    if (attempts > 5) {
      return res.status(429).json({ error: 'Too many verification attempts. Request a new code.' });
    }

    // Get stored hash
    const storedHash = await redis.get(`reg_otp:${email}`);
    if (!storedHash) {
      return res.status(400).json({ error: 'Verification code expired or not found. Please request a new one.' });
    }

    // Compare OTP
    const isValid = await bcrypt.compare(otp, storedHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // Mark email as verified in Redis (30 min TTL)
    await redis.set(`reg_verified:${email}`, '1', 1800);

    // Delete OTP key (consumed)
    await redis.del(`reg_otp:${email}`);
    await redis.del(`reg_otp_attempts:${email}`);

    logger.info(`Registration email verified: ${email}`);
    res.json({ message: 'Email verified successfully.', verified: true });
  } catch (err) {
    logger.error('verifyOtp error:', err.message);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
}

/**
 * POST /api/register/submit
 * Submit institution registration form
 */
async function submit(req, res) {
  try {
    const {
      institution_name,
      institution_type,
      institution_website,
      contact_name,
      contact_email,
      contact_phone,
      registration_reason,
    } = req.body;

    // Check email was verified
    const isVerified = await redis.get(`reg_verified:${contact_email}`);
    if (!isVerified) {
      return res.status(400).json({ error: 'Email must be verified before submitting. Please verify your email first.' });
    }

    // Check if organization with this email already exists
    const existingOrg = await Organization.findOne({ where: { contact_email } });
    if (existingOrg) {
      return res.status(409).json({ error: 'An organization with this email already exists.' });
    }

    // Generate slug from institution name
    const slug = institution_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);

    // Check slug uniqueness, append random if needed
    const existingSlug = await Organization.findOne({ where: { slug } });
    const finalSlug = existingSlug
      ? `${slug}-${Date.now().toString(36)}`
      : slug;

    // Create Organization record
    const org = await Organization.create({
      name: institution_name,
      slug: finalSlug,
      type: institution_type,
      contact_name,
      contact_email,
      contact_phone,
      institution_website: institution_website || null,
      registration_reason,
      email_verified: 1,
      email_verified_at: new Date(),
      status: 'pending',
    });

    // Create OrgRegistration (immutable audit record)
    await OrgRegistration.create({
      organization_id: org.id,
      contact_email,
      contact_name,
      institution_name,
      submitted_data_json: {
        institution_name,
        institution_type,
        institution_website,
        contact_name,
        contact_email,
        contact_phone,
        registration_reason,
      },
      email_verified: 1,
      status: 'pending',
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.get('user-agent'),
    });

    // Clean up verification flag
    await redis.del(`reg_verified:${contact_email}`);

    // Audit log
    auditLog.log('system', null, 'ORG_REGISTRATION_SUBMITTED', 'organization', org.id, {
      institution_name,
      contact_email,
    }, req);

    // Send confirmation email to applicant
    sendMail(
      contact_email,
      'Application Received — Phygital SaaS',
      registrationReceivedEmail(contact_name, institution_name)
    ).catch((err) => logger.error('Failed to send confirmation email:', err.message));

    // Send alert email to Super Admin
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    if (superAdminEmail) {
      sendMail(
        superAdminEmail,
        `New Registration Pending: ${institution_name}`,
        superAdminNewRegistrationAlert(institution_name, contact_name, contact_email)
      ).catch((err) => logger.error('Failed to send SA alert:', err.message));
    }

    logger.info(`Registration submitted: ${institution_name} (${contact_email})`);
    res.status(201).json({
      message: 'Application submitted successfully! Check your email for confirmation.',
      organization_id: org.id,
    });
  } catch (err) {
    logger.error('submit error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

module.exports = { sendOtp, verifyOtp, submit };
