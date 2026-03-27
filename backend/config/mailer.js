const nodemailer = require('nodemailer');
const { logger } = require('./database');

function normalizeError (err) {
    if(!err) return { message: 'Unknown error', code: undefined, response: undefined };
    if(typeof err === 'string') return { message: err, code: undefined, response: undefined };
    return {
        message: err.message || 'Unknown error',
        code: err.code,
        response: err.response,
    };
}

function createDevConsoleTransport () {
    logger.info('Mailer: Using console logger (no real SMTP in development)');
    return {
        provider: 'console',
        async sendMail (mailOptions) {
            logger.info('=======================================');
            logger.info('EMAIL (dev console, not actually sent)');
            logger.info(`   To:      ${ mailOptions.to }`);
            logger.info(`   Subject: ${ mailOptions.subject }`);
            logger.info(`   From:    ${ mailOptions.from || process.env.SMTP_FROM_EMAIL }`);
            if(mailOptions.html) {
                const textContent = mailOptions.html
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s{2,}/g, ' ')
                    .trim()
                    .substring(0, 500);
                logger.info(`   Body:    ${ textContent }...`);
            }
            logger.info('=======================================');
            return { messageId: `dev-${ Date.now() }@local` };
        },
    };
}

function createResendApiTransport () {
    logger.info('Mailer: Using Resend HTTP API transport');
    const apiKey = process.env.RESEND_API_KEY;
    return {
        provider: 'resend_api',
        async sendMail (mailOptions) {
            if(!apiKey) {
                throw new Error('RESEND_API_KEY is missing');
            }

            const payload = {
                from: mailOptions.from,
                to: [ mailOptions.to ],
                subject: mailOptions.subject,
                html: mailOptions.html,
            };

            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${ apiKey }`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseText = await response.text();
            let responseJson;
            try {
                responseJson = responseText ? JSON.parse(responseText) : {};
            } catch {
                responseJson = { raw: responseText };
            }

            if(!response.ok) {
                const err = new Error(`Resend API failed with status ${ response.status }`);
                err.code = `HTTP_${ response.status }`;
                err.response = responseJson;
                throw err;
            }

            return { messageId: responseJson.id || `resend-${ Date.now() }` };
        },
    };
}

function createSmtpTransport () {
    logger.info(`Mailer: Connecting to ${ process.env.SMTP_HOST }:${ process.env.SMTP_PORT || '587' } secure=${ process.env.SMTP_SECURE === 'true' } user=${ process.env.SMTP_USER || '(none)' }`);

    const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT_MS || '15000', 10),
        greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT_MS || '10000', 10),
        socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT_MS || '20000', 10),
        tls: {
            rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED === 'true',
        },
    });

    transport.verify()
        .then(() => logger.info('Mailer: SMTP connection verified'))
        .catch((err) => {
            const normalized = normalizeError(err);
            logger.error(`Mailer: SMTP verification failed - ${ normalized.message } (code: ${ normalized.code || 'n/a' }, response: ${ JSON.stringify(normalized.response) })`);
        });

    return {
        provider: 'smtp',
        async sendMail (mailOptions) {
            return transport.sendMail(mailOptions);
        },
    };
}

function resolveTransport () {
    const provider = (process.env.MAIL_PROVIDER || '').toLowerCase().trim();
    const isDevConsole = process.env.NODE_ENV === 'development' && (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'localhost');

    if(isDevConsole) return createDevConsoleTransport();
    if(provider === 'resend_api' || (process.env.RESEND_API_KEY && !process.env.SMTP_HOST)) {
        return createResendApiTransport();
    }
    if(process.env.SMTP_HOST) return createSmtpTransport();

    logger.warn('Mailer: No transport configured. Set MAIL_PROVIDER=resend_api with RESEND_API_KEY or set SMTP_* variables.');
    return {
        provider: 'none',
        async sendMail () {
            throw new Error('No mail transport configured');
        },
    };
}

const transporter = resolveTransport();

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML body
 * @returns {Promise<object>} Nodemailer send result
 */
async function sendMail (to, subject, html) {
    try {
        const result = await transporter.sendMail({
            from: `"${ process.env.SMTP_FROM_NAME || 'CampuSync' }" <${ process.env.SMTP_FROM_EMAIL || 'noreply@phygital.local' }>`,
            to,
            subject,
            html,
        });
        logger.info(`Email sent via ${ transporter.provider } to ${ to }: ${ subject } [${ result.messageId }]`);
        return result;
    } catch(err) {
        const normalized = normalizeError(err);
        logger.error(`Failed to send email to ${ to }: ${ normalized.message } (code: ${ normalized.code || 'n/a' }, response: ${ JSON.stringify(normalized.response) })`);
        throw err;
    }
}

module.exports = { sendMail, transporter };
