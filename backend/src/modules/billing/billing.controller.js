// backend/src/modules/billing/billing.controller.js
const { razorpay, PLANS } = require('../../../config/razorpay');
const { Organization, Payment } = require('../models');
const { verifyWebhookSignature, getPlanLimits, formatAmountDisplay } = require('../../../utils/razorpayHelpers');
const { sendMail } = require('../../../config/mailer');
const auditLog = require('../../../utils/auditLog');
const { logger } = require('../../../config/database');
const { emitPaymentSuccess, emitOrgUpdate, emitSessionSync } = require('../../../utils/socketEvents');

async function createSubscription(req, res) {
    try {
        const { plan_key } = req.body;
        if (!plan_key || !PLANS[plan_key]) return res.status(400).json({ error: 'Invalid plan. Allowed: starter, growth' });

        const plan = PLANS[plan_key];
        if (!plan.plan_id) return res.status(400).json({ error: 'This plan cannot be subscribed to directly. Contact support.' });
        if (!razorpay) return res.status(503).json({ error: 'Payment service not configured.' });

        const org = await Organization.findById(req.actor.org);
        if (!org) return res.status(404).json({ error: 'Organization not found.' });

        const subscription = await razorpay.subscriptions.create({
            plan_id: plan.plan_id,
            customer_notify: 1,
            total_count: 12,
            notes: { organization_id: org._id.toString(), organization_name: org.name, plan: plan_key },
        });

        const limits = getPlanLimits(plan_key);
        org.razorpay_subscription_id = subscription.id;
        org.plan = plan_key;
        org.card_quota = limits.card_quota;
        org.storage_limit_gb = limits.storage_limit_gb;
        await org.save();

        auditLog.log('admin', req.actor.id, 'SUBSCRIPTION_CREATED', 'organization', org._id, { plan: plan_key, subscription_id: subscription.id }, req);
        res.json({ subscription_id: subscription.id, razorpay_key: process.env.RAZORPAY_KEY_ID, plan: plan_key, amount_display: formatAmountDisplay(plan.price_monthly_paise) });
    } catch (err) {
        logger.error('createSubscription error:', err.message);
        res.status(500).json({ error: 'Failed to create subscription.' });
    }
}

async function demoUpgrade(req, res) {
    try {
        const { plan_key } = req.body;
        const org = await Organization.findById(req.actor.org);
        if (!org) return res.status(404).json({ error: 'Org not found' });

        const limits = getPlanLimits(plan_key);
        org.plan = plan_key;
        org.storage_limit_gb = limits.storage_limit_gb;
        await org.save();

        res.json({ message: 'Plan upgraded successfully in demo mode' });
    } catch (err) {
        res.status(500).json({ error: 'Demo upgrade failed' });
    }
}

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

        const io = req.app.get('io');

        switch (eventType) {
            case 'subscription.activated': {
                const sub = payload.subscription?.entity;
                if (!sub) break;
                const orgId = sub.notes?.organization_id;
                const planKey = sub.notes?.plan;
                if (!orgId) break;

                const org = await Organization.findById(orgId);
                if (org && planKey && PLANS[planKey]) {
                    const limits = getPlanLimits(planKey);
                    org.plan = planKey;
                    org.card_quota = limits.card_quota;
                    org.storage_limit_gb = limits.storage_limit_gb;
                    org.razorpay_subscription_id = sub.id;
                    await org.save();
                    auditLog.log('system', null, 'SUBSCRIPTION_ACTIVATED', 'organization', org._id, { plan: planKey });
                    
                    // Emit real-time socket.io event to all members of this org
                    const AdminUser = require('../admin/adminAuth.model');
                    const admins = await AdminUser.find({ organization: orgId }, '_id');
                    for (const admin of admins) {
                        emitOrgUpdate(io, orgId, admin._id.toString());
                    }
                }
                break;
            }

            case 'subscription.charged': {
                const payment = payload.payment?.entity;
                const sub = payload.subscription?.entity;
                if (!payment) break;
                const orgId = sub?.notes?.organization_id || payment.notes?.organization_id;
                if (!orgId) break;

                const existing = await Payment.findOne({ razorpay_payment_id: payment.id });
                if (existing) break;

                await Payment.create({
                    organization_id: orgId,
                    razorpay_payment_id: payment.id,
                    razorpay_subscription_id: sub?.id || null,
                    razorpay_order_id: payment.order_id || null,
                    amount_paise: payment.amount,
                    currency: payment.currency || 'INR',
                    status: 'captured',
                    plan: sub?.notes?.plan || null,
                    payment_method: payment.method || null,
                });
                auditLog.log('system', null, 'PAYMENT_CAPTURED', 'organization', orgId, { payment_id: payment.id, amount: payment.amount });
                
                // Emit real-time socket.io event
                const AdminUser = require('../admin/adminAuth.model');
                const admins = await AdminUser.find({ organization: orgId }, '_id');
                for (const admin of admins) {
                    emitPaymentSuccess(io, admin._id.toString(), { 
                        subscriptionId: sub?.id || payment.id,
                        planKey: sub?.notes?.plan,
                        amount: payment.amount 
                    });
                }
                break;
            }

            case 'subscription.cancelled': {
                const sub = payload.subscription?.entity;
                if (!sub) break;
                const orgId = sub.notes?.organization_id;
                if (!orgId) break;

                const org = await Organization.findById(orgId);
                if (org) {
                    const trialLimits = getPlanLimits('trial');
                    org.plan = 'trial';
                    org.card_quota = trialLimits.card_quota;
                    org.storage_limit_gb = trialLimits.storage_limit_gb;
                    org.razorpay_subscription_id = null;
                    await org.save();
                    auditLog.log('system', null, 'SUBSCRIPTION_CANCELLED', 'organization', org._id);
                    
                    // Emit real-time socket.io event
                    const AdminUser = require('../admin/adminAuth.model');
                    const admins = await AdminUser.find({ organization: orgId }, '_id');
                    for (const admin of admins) {
                        emitOrgUpdate(io, orgId, admin._id.toString());
                    }
                }
                break;
            }

            case 'payment.captured': {
                const payment = payload.payment?.entity;
                if (!payment) break;
                const orgId = payment.notes?.organization_id;
                if (!orgId) break;

                const existing = await Payment.findOne({ razorpay_payment_id: payment.id });
                if (existing) break;

                await Payment.create({
                    organization_id: orgId,
                    razorpay_payment_id: payment.id,
                    razorpay_order_id: payment.order_id || null,
                    amount_paise: payment.amount,
                    currency: payment.currency || 'INR',
                    status: 'captured',
                    payment_method: payment.method || null,
                });
                auditLog.log('system', null, 'PAYMENT_CAPTURED', 'organization', orgId, { payment_id: payment.id, amount: payment.amount });
                
                // Emit real-time socket.io event
                const AdminUser = require('../admin/adminAuth.model');
                const admins = await AdminUser.find({ organization: orgId }, '_id');
                for (const admin of admins) {
                    emitSessionSync(io, admin._id.toString());
                }
                break;
            }

            case 'payment.failed': {
                const payment = payload.payment?.entity;
                const orgId = payment?.notes?.organization_id;
                if (orgId) auditLog.log('system', null, 'PAYMENT_FAILED', 'organization', orgId, { payment_id: payment.id, error: payment.error_description });
                break;
            }

            case 'refund.created': {
                const refund = payload.refund?.entity;
                if (refund?.payment_id) {
                    await Payment.findOneAndUpdate({ razorpay_payment_id: refund.payment_id }, { status: 'refunded' });
                    auditLog.log('system', null, 'REFUND_CREATED', null, null, { payment_id: refund.payment_id, amount: refund.amount });
                }
                break;
            }

            default:
                logger.info(`Razorpay webhook: Unhandled event ${eventType}`);
        }

        res.json({ status: 'ok' });
    } catch (err) {
        logger.error('Webhook error:', err.message);
        res.status(500).json({ error: 'Webhook processing failed.' });
    }
}

async function getInvoices(req, res) {
    try {
        const payments = await Payment.find({ organization_id: req.actor.org }).sort({ created_at: -1 }).lean();
        res.json({
            invoices: payments.map(p => ({
                id: p._id,
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

async function recordPayment(req, res) {
    try {
        const { plan_key, amount_paise, payment_id } = req.body;
        if (!plan_key || !amount_paise) return res.status(400).json({ error: 'plan_key and amount_paise required.' });

        const org = await Organization.findById(req.actor.org);
        if (!org) return res.status(404).json({ error: 'Org not found.' });

        const limits = getPlanLimits(plan_key);
        org.plan = plan_key;
        org.card_quota = limits.card_quota;
        org.storage_limit_gb = limits.storage_limit_gb;
        await org.save();

        const paymentRecord = await Payment.create({
            organization_id: org._id,
            razorpay_payment_id: payment_id || `manual_${Date.now()}`,
            amount_paise,
            currency: 'INR',
            status: 'captured',
            plan: plan_key,
            payment_method: 'manual',
        });

        auditLog.log('admin', req.actor.id, 'PAYMENT_MANUAL', 'organization', org._id, { plan: plan_key, amount: amount_paise }, req);
        res.json({ message: 'Payment recorded and plan upgraded.', payment: paymentRecord, plan: plan_key });
    } catch (err) {
        logger.error('recordPayment error:', err.message);
        res.status(500).json({ error: 'Failed to record payment.' });
    }
}

module.exports = { createSubscription, handleWebhook, getInvoices, demoUpgrade, recordPayment };
