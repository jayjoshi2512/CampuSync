// backend/controllers/superAdminAuth.js
const bcrypt = require('bcryptjs');
const redis = require('../../../config/redis');
const { sendMail } = require('../../../config/mailer');
const { SuperAdmin } = require('../models');
const { generateAdminOTP } = require('../../../utils/otpGenerator');
const { signSuperAdminToken } = require('../../../utils/jwtFactory');
const { superAdminOtpEmail } = require('../../../utils/emailTemplates');
const auditLog = require('../../../utils/auditLog');
const { logger } = require('../../../config/database');

/**
 * Mask an email for display: "admin@platform.com" → "a***n@p***m.com"
 */
function maskEmail (email) {
    const [ local, domain ] = email.split('@');
    const maskedLocal = local.length > 2
        ? local[ 0 ] + '***' + local[ local.length - 1 ]
        : local[ 0 ] + '***';
    const domainParts = domain.split('.');
    const maskedDomain = domainParts[ 0 ][ 0 ] + '***' + domainParts[ 0 ][ domainParts[ 0 ].length - 1 ];
    return `${ maskedLocal }@${ maskedDomain }.${ domainParts.slice(1).join('.') }`;
}

/**
 * POST /api/super-admin/request-otp
 * NO email input from frontend — uses SUPER_ADMIN_EMAIL from env
 */
async function requestOtp (req, res) {
    try {
        // Email comes from backend env — never from the frontend
        const email = process.env.SUPER_ADMIN_EMAIL;

        if(!email) {
            logger.error('SUPER_ADMIN_EMAIL not set in environment variables');
            return res.status(503).json({ error: 'Super Admin access is not configured.' });
        }

        // Find super admin by email
        const superAdmin = await SuperAdmin.findOne({ email });
        if(!superAdmin) {
            // Super admin email is set but no row exists — create hint
            return res.status(503).json({
                error: 'Super Admin account not found. Please seed the database.',
            });
        }

        // Check rate limit at app level
        const otpCount = await redis.get(`sa_otp_count:${ email }`);
        if(otpCount && parseInt(otpCount) >= 20) {
            return res.status(429).json({ error: 'Too many code requests. Try again later.' });
        }

        // Generate 15-char OTP
        const otp = generateAdminOTP(15);
        const otpHash = await bcrypt.hash(otp, 12);

        // Store hash in DB
        superAdmin.current_otp_hash = otpHash;
        superAdmin.otp_expires_at = new Date(Date.now() + 600000); // 10 minutes
        await superAdmin.save();

        // Store in Redis with 600s TTL (consumed on first use)
        await redis.set(`super_admin_otp:${ email }`, otpHash, 600);

        // Track request count
        const count = await redis.incr(`sa_otp_count:${ email }`);
        if(count === 1) {
            await redis.expire(`sa_otp_count:${ email }`, 900); // 15 min window
        }

        // Send OTP email
        await sendMail(email, 'Super Admin Access Code', superAdminOtpEmail(otp));

        logger.info(`Super Admin OTP sent to ${ maskEmail(email) }`);
        res.json({
            message: 'Access code sent to your registered email.',
            masked_email: maskEmail(email),
        });
    } catch(err) {
        logger.error('SA requestOtp error:', err.message);
        res.status(500).json({ error: 'Failed to process request.' });
    }
}

/**
 * POST /api/super-admin/verify-otp
 * Only requires OTP — email comes from env
 */
async function verifyOtp (req, res) {
    try {
        const { otp } = req.body;
        const email = process.env.SUPER_ADMIN_EMAIL;

        if(!email) {
            return res.status(503).json({ error: 'Super Admin access not configured.' });
        }

        if(!otp) {
            return res.status(400).json({ error: 'Access code is required.' });
        }

        // Check if OTP exists in Redis (not consumed yet)
        const redisOtpHash = await redis.get(`super_admin_otp:${ email }`);
        if(!redisOtpHash) {
            return res.status(400).json({ error: 'Access code expired or already used. Request a new one.' });
        }

        // Find super admin
        const superAdmin = await SuperAdmin.findOne({ email });
        if(!superAdmin) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Verify OTP against stored hash
        const isValid = await superAdmin.isOtpValid(otp);
        if(!isValid) {
            // Track verify attempts
            const attempts = await redis.incr(`sa_otp_verify_attempts:${ email }`);
            if(attempts === 1) {
                await redis.expire(`sa_otp_verify_attempts:${ email }`, 900);
            }
            if(attempts >= 5) {
                await redis.del(`super_admin_otp:${ email }`);
                return res.status(429).json({ error: 'Too many failed attempts. Request a new access code.' });
            }
            return res.status(401).json({ error: 'Invalid access code.' });
        }

        // Consume OTP — delete from Redis (one-time use)
        await redis.del(`super_admin_otp:${ email }`);
        await redis.del(`sa_otp_verify_attempts:${ email }`);

        // Clear OTP from DB
        superAdmin.current_otp_hash = null;
        superAdmin.otp_expires_at = null;
        superAdmin.last_login_at = new Date();
        superAdmin.last_login_ip = req.ip || req.connection?.remoteAddress;
        await superAdmin.save();

        // Issue JWT with jti stored in Redis for revocation
        const { token, jti } = signSuperAdminToken(superAdmin.id);

        // Store jti in Redis (2h TTL, same as token expiry)
        await redis.set(`sa_active_jti:${ jti }`, superAdmin.id.toString(), 7200);

        // Audit log
        auditLog.log('super_admin', superAdmin.id, 'SUPER_ADMIN_LOGIN', null, null, {
            ip: req.ip,
        }, req);

        logger.info(`Super Admin authenticated: ${ maskEmail(email) }`);
        res.json({
            message: 'Authentication successful.',
            token,
            actor: {
                id: superAdmin.id,
                email: maskEmail(email),
                role: 'super_admin',
            },
        });
    } catch(err) {
        logger.error('SA verifyOtp error:', err.message);
        res.status(500).json({ error: 'Authentication failed.' });
    }
}

module.exports = { requestOtp, verifyOtp };

