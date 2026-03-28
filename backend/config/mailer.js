// backend/config/mailer.js
const nodemailer = require('nodemailer');
const { logger } = require('./database');

const mailProvider = (process.env.MAIL_PROVIDER || 'smtp').toLowerCase();
let smtpTransporter = null;

function normalizeError (err) {
    if(!err) return { message: 'Unknown error', code: 'UNKNOWN' };
    return {
        message: err.message || String(err),
        code: err.code || 'UNKNOWN',
        response: err.response,
    };
}

function sanitizeFromEmail () {
    const rawFromEmail = (process.env.SMTP_FROM_EMAIL || '').trim().replace(/^"|"$/g, '');
    if(rawFromEmail.includes('@')) return rawFromEmail;
    return process.env.SMTP_USER || 'noreply@phygital.local';
}

async function sendViaBrevoApi (to, subject, html) {
    const apiKey = process.env.BREVO_API_KEY || process.env.BREVO_APIKEY;
    if(!apiKey) {
        const err = new Error('BREVO_API_KEY is required when MAIL_PROVIDER=brevo_api');
        err.code = 'BREVO_API_KEY_MISSING';
        throw err;
    }

    const fromEmail = sanitizeFromEmail();
    const fromName = process.env.SMTP_FROM_NAME || 'CampuSync';

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            accept: 'application/json',
        },
        body: JSON.stringify({
            sender: { name: fromName, email: fromEmail },
            to: [ { email: to } ],
            subject,
            htmlContent: html,
        }),
    });

    const text = await response.text();
    let payload;
    try {
        payload = text ? JSON.parse(text) : {};
    } catch {
        payload = { raw: text };
    }

    if(!response.ok) {
        const err = new Error(`Brevo API failed with status ${ response.status }`);
        err.code = `HTTP_${ response.status }`;
        err.response = payload;
        throw err;
    }

    return { messageId: payload.messageId || `brevo-${ Date.now() }` };
}

function initSmtpTransport () {
    if(process.env.NODE_ENV === 'development' && (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'localhost')) {
        logger.info('Mailer: Development console mode enabled');
        smtpTransporter = {
            async sendMail (mailOptions) {
                logger.info('EMAIL (dev, not sent)');
                logger.info(`To: ${ mailOptions.to }`);
                logger.info(`Subject: ${ mailOptions.subject }`);
                return { messageId: `dev-${ Date.now() }@local` };
            },
        };
        return;
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const isBrevoHost = /brevo|sendinblue/i.test(smtpHost);
    const smtpPass = isBrevoHost
        ? (process.env.BREVO_SMTP_KEY || process.env.SMTP_PASS)
        : process.env.SMTP_PASS;

    smtpTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
            user: process.env.SMTP_USER,
            pass: smtpPass,
        },
        connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT_MS || '15000', 10),
        greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT_MS || '10000', 10),
        socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT_MS || '20000', 10),
        tls: {
            rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED === 'true',
        },
    });

    logger.info(`Mailer: Using SMTP at ${ smtpHost }:${ smtpPort }`);
    smtpTransporter.verify()
        .then(() => logger.info('Mailer: SMTP connection verified'))
        .catch((err) => {
            const n = normalizeError(err);
            logger.error(`Mailer: SMTP verification failed - ${ n.message } (code: ${ n.code })`);
        });
}

if(mailProvider !== 'brevo_api') {
    initSmtpTransport();
} else {
    logger.info('Mailer: Using Brevo HTTP API transport');
    if(!(process.env.BREVO_API_KEY || process.env.BREVO_APIKEY)) {
        logger.error('Mailer: BREVO_API_KEY is missing while MAIL_PROVIDER=brevo_api');
    }
}

async function sendMail (to, subject, html) {
    try {
        if(mailProvider === 'brevo_api') {
            const result = await sendViaBrevoApi(to, subject, html);
            logger.info(`Email sent via brevo_api to ${ to }: ${ subject } [${ result.messageId }]`);
            return result;
        }

        const fromEmail = sanitizeFromEmail();
        const result = await smtpTransporter.sendMail({
            from: `"${ process.env.SMTP_FROM_NAME || 'CampuSync' }" <${ fromEmail }>`,
            to,
            subject,
            html,
        });
        logger.info(`Email sent via smtp to ${ to }: ${ subject } [${ result.messageId }]`);
        return result;
    } catch(err) {
        const n = normalizeError(err);
        logger.error(`Failed to send email to ${ to }: ${ n.message } (code: ${ n.code }, response: ${ JSON.stringify(n.response || null) })`);
        throw err;
    }
}

module.exports = { sendMail, smtpTransporter };
