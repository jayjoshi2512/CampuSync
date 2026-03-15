// backend/utils/razorpayHelpers.js
const crypto = require('crypto');
const { PLANS } = require('../config/razorpay');

/**
 * Verify Razorpay webhook signature
 * @param {string|Buffer} body - Raw request body
 * @param {string} signature - X-Razorpay-Signature header
 * @returns {boolean}
 */
function verifyWebhookSignature(body, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(typeof body === 'string' ? body : body.toString())
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

/**
 * Get plan limits from plan key
 * @param {string} planKey - 'trial' | 'starter' | 'growth' | 'enterprise'
 * @returns {{ card_quota: number, storage_limit_gb: number, co_admin_limit: number }}
 */
function getPlanLimits(planKey) {
  const plan = PLANS[planKey];
  if (!plan) {
    return { card_quota: 50, storage_limit_gb: 1, co_admin_limit: 0 };
  }
  return {
    card_quota: plan.card_quota,
    storage_limit_gb: plan.storage_limit_gb,
    co_admin_limit: plan.co_admin_limit,
  };
}

/**
 * Format paise amount to INR display string
 * @param {number} paise - Amount in paise
 * @returns {string} Formatted INR string (e.g., "₹1,999")
 */
function formatAmountDisplay(paise) {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

module.exports = {
  verifyWebhookSignature,
  getPlanLimits,
  formatAmountDisplay,
};
