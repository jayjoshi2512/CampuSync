// backend/config/razorpay.js
const Razorpay = require('razorpay');
const { logger } = require('./database');

let razorpayInstance = null;

try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    logger.info('Razorpay: SDK initialized');
  } else {
    logger.warn('Razorpay: Missing credentials — payment features disabled');
  }
} catch (err) {
  logger.error('Razorpay: Initialization failed:', err.message);
}

// Plan configuration — update plan_id values with actual Razorpay Dashboard plan IDs
const PLANS = {
  trial: {
    plan_id: null,
    name: 'Trial',
    price_monthly_paise: 0,
    card_quota: 50,
    storage_limit_gb: 1,
    co_admin_limit: 0,
    duration_days: 30,
  },
  starter: {
    plan_id: process.env.RAZORPAY_PLAN_ID_STARTER || 'plan_starter_id',
    name: 'Starter',
    price_monthly_paise: 199900,  // ₹1,999
    card_quota: 200,
    storage_limit_gb: 5,
    co_admin_limit: 1,
  },
  growth: {
    plan_id: process.env.RAZORPAY_PLAN_ID_GROWTH || 'plan_growth_id',
    name: 'Growth',
    price_monthly_paise: 499900,  // ₹4,999
    card_quota: 750,
    storage_limit_gb: 20,
    co_admin_limit: 3,
  },
  enterprise: {
    plan_id: null,  // Custom — no self-serve subscription
    name: 'Enterprise',
    price_monthly_paise: null,
    card_quota: null,  // Unlimited
    storage_limit_gb: null,  // Custom
    co_admin_limit: null,  // Unlimited
  },
};

module.exports = { razorpay: razorpayInstance, PLANS };
