// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const { logger } = require('../config/database');

// For local dev, use in-memory store. Production should use Redis store.
// We try to use rate-limit-redis if Upstash credentials are available.
let storeFactory = null;

if(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
        // rate-limit-redis requires ioredis or similar — for Upstash REST,
        // we use the built-in memory store and rely on Upstash for OTP TTLs instead.
        // This keeps the rate limiter working without ioredis dependency.
        logger.info('RateLimiter: Using in-memory store (Upstash REST is used for OTP/session TTLs)');
    } catch(err) {
        logger.warn('RateLimiter: Falling back to memory store:', err.message);
    }
}

function createLimiter (options) {
    return rateLimit({
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: options.message || 'Too many requests. Please try again later.' },
        ...options,
    });
}

// Registration
const registerSendOtp = createLimiter({
    windowMs: 60 * 60 * 1000,  // 60 min
    max: 10,
    message: 'Too many OTP requests. Try again in an hour.',
    keyGenerator: (req) => req.ip,
});

const registerVerifyOtp = createLimiter({
    windowMs: 15 * 60 * 1000,  // 15 min
    max: 5,
    message: 'Too many verification attempts. Try again later.',
    keyGenerator: (req) => req.ip,
});

const registerSubmit = createLimiter({
    windowMs: 60 * 60 * 1000,  // 60 min
    max: 5,
    message: 'Too many registration attempts. Try again in an hour.',
    keyGenerator: (req) => req.ip,
});

// Super Admin
const superAdminRequestOtp = createLimiter({
    windowMs: 15 * 60 * 1000,  // 15 min
    max: 3,
    message: 'Too many OTP requests. Try again later.',
    keyGenerator: (req) => req.ip,
});

const superAdminVerifyOtp = createLimiter({
    windowMs: 15 * 60 * 1000,  // 15 min
    max: 5,
    message: 'Too many verification attempts. Try again later.',
    keyGenerator: (req) => req.ip,
});

// Admin
const adminLogin = createLimiter({
    windowMs: 15 * 60 * 1000,  // 15 min
    max: 10,
    message: 'Too many login attempts. Try again later.',
    keyGenerator: (req) => req.ip,
});

// User
const userMagicLink = createLimiter({
    windowMs: 15 * 60 * 1000,  // 15 min
    max: 5,
    message: 'Too many magic link requests. Try again later.',
    keyGenerator: (req) => req.body?.email || req.ip,
});

// Memory upload
const memoryUpload = createLimiter({
    windowMs: 60 * 60 * 1000,  // 60 min
    max: 50,
    message: 'Upload rate limit reached. You can upload more memories in an hour.',
    keyGenerator: (req) => req.actor?.id ? `user_${ req.actor.id }` : req.ip,
});

// General API limiter
const generalApi = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Too many requests. Please wait a moment and try again.',
    keyGenerator: (req) => req.ip,
});

module.exports = {
    registerSendOtp,
    registerVerifyOtp,
    registerSubmit,
    superAdminRequestOtp,
    superAdminVerifyOtp,
    adminLogin,
    userMagicLink,
    memoryUpload,
    generalApi,
};
