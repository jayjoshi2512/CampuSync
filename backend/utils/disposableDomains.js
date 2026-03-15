// backend/utils/disposableDomains.js
let disposableDomains = [];
try {
  disposableDomains = require('disposable-email-domains');
} catch (e) {
  // Package not installed — use custom blocklist only
}

const CUSTOM_BLOCKLIST = [
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'throwam.com',
  'sharklasers.com',
  'spam4.me',
  'yopmail.com',
  'trashmail.com',
  'maildrop.cc',
  'dispostable.com',
  'fakeinbox.com',
  '10minutemail.com',
  'guerrillamail.info',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'pokemail.net',
  'temp-mail.org',
  'throwaway.email',
  'tmpmail.net',
  'tmpmail.org',
  'mailnesia.com',
  'mailcatch.com',
  'mytemp.email',
  'tempr.email',
  'temp-mail.io',
  'mohmal.com',
  'getnada.com',
  'emailondeck.com',
  'harakirimail.com',
  'jetable.org',
  'tempail.com',
  'crazymailing.com',
  'disposableaddress.com',
  'MailExpire.com',
  'mailforspam.com',
  'guerrillamail.com',
];

// Create a Set for O(1) lookups
const blockedDomains = new Set([
  ...disposableDomains,
  ...CUSTOM_BLOCKLIST.map((d) => d.toLowerCase()),
]);

/**
 * Check if an email uses a disposable/temporary domain
 * @param {string} email
 * @returns {boolean} true if the email is disposable
 */
function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return true;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  return blockedDomains.has(domain);
}

module.exports = { isDisposableEmail };
