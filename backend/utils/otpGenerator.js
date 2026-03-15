// backend/utils/otpGenerator.js
const crypto = require('crypto');

/**
 * Generate a 15-character secure OTP for Super Admin authentication.
 * Uses alphanumeric + special symbols, cryptographically random.
 */
const ADMIN_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';

function generateAdminOTP(length = 15) {
  const bytes = crypto.randomBytes(length * 2);
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += ADMIN_CHARSET[bytes[i] % ADMIN_CHARSET.length];
  }
  return otp;
}

/**
 * Generate a 6-digit numeric OTP for registration email verification.
 * Uses crypto.randomInt for uniform distribution.
 */
function generateRegOTP() {
  const num = crypto.randomInt(100000, 999999);
  return String(num);
}

module.exports = { generateAdminOTP, generateRegOTP };
