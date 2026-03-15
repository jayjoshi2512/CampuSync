// backend/controllers/billing.js
const { razorpay, PLANS } = require('../config/razorpay');
const Organization = require('../models/Organization');
const Payment = require('../models/Payment');
const { verifyWebhookSignature, getPlanLimits, formatAmountDisplay } = require('../utils/razorpayHelpers');
const { sendMail } = require('../config/mailer');
const auditLog = require('../utils/auditLog');
const { logger } = require('../config/database');

/**
 * POST /api/billing/create-subscription
 */
async function createSubscription(req, res) {
  try {
    const { plan_key } = req.body;

    if (!plan_key || !PLANS[plan_key]) {
      return res.status(400).json({ error: 'Invalid plan. Allowed: starter, growth' });
    }

    const plan = PLANS[plan_key];
    if (!plan.plan_id) {
      return res.status(400).json({ error: 'This plan cannot be subscribed to directly. Contact support.' });
    }

    if (!razorpay) {
      return res.status(503).json({ error: 'Payment service not configured.' });
    }

    const org = await Organization.findByPk(req.actor.org);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.plan_id,
      customer_notify: 1,
      total_count: 12, // 12 months
      notes: {
        organization_id: org.id.toString(),
        organization_name: org.name,
        plan: plan_key,
      },
    });

    // Store subscription ID
    await org.update({
      razorpay_subscription_id: subscription.id,
    });

    auditLog.log('admin', req.actor.id, 'SUBSCRIPTION_CREATED', 'organization', org.id, {
      plan: plan_key,
      subscription_id: subscription.id,
    }, req);

    res.json({
      subscription_id: subscription.id,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
      plan: plan_key,
      amount_display: formatAmountDisplay(plan.price_monthly_paise),
    });
  } catch (err) {
    logger.error('createSubscription error:', err.message);
    res.status(500).json({ error: 'Failed to create subscription.' });
  }
}

/**
 * POST /api/billing/webhook
 * Raw body required — mounted with express.raw() in server.js
 */
async function handleWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body;

    if (!verifyWebhookSignature(rawBody, signature)) {
      logger.warn('Razorpay webhook: Invalid signature');
      return res.status(400).json({ error: 'Invalid signature.' });
    }

    const event = JSON.parse(rawBody.toString());
    const eventType = event.event;
    const payload = event.payload;

    logger.info(`Razorpay webhook: ${eventType}`);

    switch (eventType) {
      case 'subscription.activated': {
        const sub = payload.subscription?.entity;
        if (!sub) break;
        const orgId = sub.notes?.organization_id;
        const planKey = sub.notes?.plan;
        if (!orgId) break;

        const org = await Organization.findByPk(parseInt(orgId));
        if (org && planKey && PLANS[planKey]) {
          const limits = getPlanLimits(planKey);
          await org.update({
            plan: planKey,
            card_quota: limits.card_quota,
            storage_limit_gb: limits.storage_limit_gb,
            razorpay_subscription_id: sub.id,
          });
          auditLog.log('system', null, 'SUBSCRIPTION_ACTIVATED', 'organization', org.id, { plan: planKey });
        }
        break;
      }

      case 'subscription.charged': {
        const payment = payload.payment?.entity;
        const sub = payload.subscription?.entity;
        if (!payment) break;
        const orgId = sub?.notes?.organization_id || payment.notes?.organization_id;
        if (!orgId) break;

        // Prevent duplicate processing
        const existing = await Payment.findOne({ where: { razorpay_payment_id: payment.id } });
        if (existing) break;

        await Payment.create({
          organization_id: parseInt(orgId),
          razorpay_payment_id: payment.id,
          razorpay_subscription_id: sub?.id || null,
          razorpay_order_id: payment.order_id || null,
          amount_paise: payment.amount,
          currency: payment.currency || 'INR',
          status: 'captured',
          plan: sub?.notes?.plan || null,
          payment_method: payment.method || null,
        });

        auditLog.log('system', null, 'PAYMENT_CAPTURED', 'organization', parseInt(orgId), {
          payment_id: payment.id,
          amount: payment.amount,
        });
        break;
      }

      case 'subscription.cancelled': {
        const sub = payload.subscription?.entity;
        if (!sub) break;
        const orgId = sub.notes?.organization_id;
        if (!orgId) break;

        const org = await Organization.findByPk(parseInt(orgId));
        if (org) {
          const trialLimits = getPlanLimits('trial');
          await org.update({
            plan: 'trial',
            card_quota: trialLimits.card_quota,
            storage_limit_gb: trialLimits.storage_limit_gb,
            razorpay_subscription_id: null,
          });
          auditLog.log('system', null, 'SUBSCRIPTION_CANCELLED', 'organization', org.id);
        }
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment?.entity;
        const orgId = payment?.notes?.organization_id;
        if (orgId) {
          auditLog.log('system', null, 'PAYMENT_FAILED', 'organization', parseInt(orgId), {
            payment_id: payment.id,
            error: payment.error_description,
          });
        }
        break;
      }

      case 'refund.created': {
        const refund = payload.refund?.entity;
        if (refund?.payment_id) {
          await Payment.update(
            { status: 'refunded' },
            { where: { razorpay_payment_id: refund.payment_id } }
          );
          auditLog.log('system', null, 'REFUND_CREATED', null, null, {
            payment_id: refund.payment_id,
            amount: refund.amount,
          });
        }
        break;
      }

      default:
        logger.info(`Razorpay webhook: Unhandled event ${eventType}`);
    }

    // Always respond 200 to Razorpay
    res.json({ status: 'ok' });
  } catch (err) {
    logger.error('Webhook error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
}

/**
 * GET /api/billing/invoices
 */
async function getInvoices(req, res) {
  try {
    const payments = await Payment.findAll({
      where: { organization_id: req.actor.org },
      order: [['created_at', 'DESC']],
    });

    res.json({
      invoices: payments.map((p) => ({
        id: p.id,
        payment_id: p.razorpay_payment_id,
        amount: formatAmountDisplay(p.amount_paise),
        amount_paise: p.amount_paise,
        status: p.status,
        plan: p.plan,
        method: p.payment_method,
        date: p.created_at,
      })),
    });
  } catch (err) {
    logger.error('getInvoices error:', err.message);
    res.status(500).json({ error: 'Failed to load invoices.' });
  }
}

module.exports = { createSubscription, handleWebhook, getInvoices };
