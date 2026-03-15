// backend/middleware/turnstile.js
const { logger } = require('../config/database');

/**
 * Middleware to verify Cloudflare Turnstile token.
 * Extracts token from req.body.turnstile_token
 */
async function verifyTurnstile(req, res, next) {
  const token = req.body.turnstile_token;

  // In development with test keys, skip verification if no token
  if (process.env.NODE_ENV === 'development' && !token) {
    logger.warn('Turnstile: Skipping verification in development (no token provided)');
    return next();
  }

  if (!token) {
    return res.status(400).json({ error: 'Bot verification required. Please complete the challenge.' });
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.CLOUDFLARE_TURNSTILE_SECRET,
        response: token,
        remoteip: req.ip,
      }),
    });

    const data = await response.json();

    if (data.success !== true) {
      logger.warn(`Turnstile verification failed for IP ${req.ip}:`, data['error-codes']);
      return res.status(400).json({ error: 'Bot verification failed. Please try again.' });
    }

    next();
  } catch (err) {
    logger.error('Turnstile verification error:', err.message);
    // In case of network error, allow the request in development
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Turnstile: Allowing request despite error (development mode)');
      return next();
    }
    return res.status(500).json({ error: 'Verification service temporarily unavailable.' });
  }
}

module.exports = { verifyTurnstile };
