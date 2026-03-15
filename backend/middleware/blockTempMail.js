// backend/middleware/blockTempMail.js
const { isDisposableEmail } = require('../utils/disposableDomains');

/**
 * Middleware to block disposable/temporary email addresses.
 * Extracts email from req.body.email or req.body.contact_email
 */
function blockTempMail(req, res, next) {
  const email = req.body.email || req.body.contact_email;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  if (isDisposableEmail(email)) {
    return res.status(400).json({
      error: 'Disposable or temporary email addresses are not allowed. Please use a permanent email address.',
    });
  }

  next();
}

module.exports = { blockTempMail };
