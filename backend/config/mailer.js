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

function sanitizeReplyToEmail () {
    const rawReplyTo = (process.env.SMTP_REPLY_TO || '').trim().replace(/^"|"$/g, '');
    if(rawReplyTo.includes('@')) return rawReplyTo;
    return sanitizeFromEmail();
}

function htmlToText (html = '') {
    return String(html)
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<br\s*\/?\s*>/gi, '\n')
        .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr)>/gi, '\n')
        .replace(/<li>/gi, '- ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
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
    const replyTo = sanitizeReplyToEmail();
    const textContent = htmlToText(html);

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
            replyTo: { email: replyTo },
            subject,
            htmlContent: html,
            textContent,
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

async function sendViaSendGridApi (to, subject, html) {
    const apiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASS;
    if(!apiKey) {
        const err = new Error('SENDGRID_API_KEY is required when MAIL_PROVIDER=sendgrid_api');
        err.code = 'SENDGRID_API_KEY_MISSING';
        throw err;
    }

    const fromEmail = sanitizeFromEmail();
    const fromName = process.env.SMTP_FROM_NAME || 'CampuSync';
    const replyTo = sanitizeReplyToEmail();
    const textContent = htmlToText(html);

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${ apiKey }`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            personalizations: [
                {
                    to: [ { email: to } ],
                    subject,
                },
            ],
            from: {
                email: fromEmail,
                name: fromName,
            },
            reply_to: {
                email: replyTo,
            },
            content: [
                {
                    type: 'text/plain',
                    value: textContent,
                },
                {
                    type: 'text/html',
                    value: html,
                },
            ],
            tracking_settings: {
                click_tracking: { enable: false, enable_text: false },
                open_tracking: { enable: false },
            },
        }),
    });

    const text = await response.text();
    let payload = null;
    if(text) {
        try {
            payload = JSON.parse(text);
        } catch {
            payload = { raw: text };
        }
    }

    if(!response.ok) {
        const err = new Error(`SendGrid API failed with status ${ response.status }`);
        err.code = `HTTP_${ response.status }`;
        err.response = payload;
        throw err;
    }

    return { messageId: response.headers.get('x-message-id') || `sendgrid-${ Date.now() }` };
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

if(mailProvider !== 'brevo_api' && mailProvider !== 'sendgrid_api') {
    initSmtpTransport();
} else {
    if(mailProvider === 'brevo_api') {
        logger.info('Mailer: Using Brevo HTTP API transport');
        if(!(process.env.BREVO_API_KEY || process.env.BREVO_APIKEY)) {
            logger.error('Mailer: BREVO_API_KEY is missing while MAIL_PROVIDER=brevo_api');
        }
    }

    if(mailProvider === 'sendgrid_api') {
        logger.info('Mailer: Using SendGrid HTTP API transport');
        if(!(process.env.SENDGRID_API_KEY || process.env.SMTP_PASS)) {
            logger.error('Mailer: SENDGRID_API_KEY is missing while MAIL_PROVIDER=sendgrid_api');
        }
    }
}

async function sendMail (to, subject, html) {
    try {
        if(mailProvider === 'brevo_api') {
            const result = await sendViaBrevoApi(to, subject, html);
            logger.info(`Email sent via brevo_api to ${ to }: ${ subject } [${ result.messageId }]`);
            return result;
        }

        if(mailProvider === 'sendgrid_api') {
            const result = await sendViaSendGridApi(to, subject, html);
            logger.info(`Email sent via sendgrid_api to ${ to }: ${ subject } [${ result.messageId }]`);
            return result;
        }

        const fromEmail = sanitizeFromEmail();
        const replyTo = sanitizeReplyToEmail();
        const text = htmlToText(html);
        const result = await smtpTransporter.sendMail({
            from: `"${ process.env.SMTP_FROM_NAME || 'CampuSync' }" <${ fromEmail }>`,
            to,
            subject,
            html,
            text,
            replyTo,
            headers: {
                'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply',
            },
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
