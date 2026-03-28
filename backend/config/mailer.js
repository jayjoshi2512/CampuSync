// backend/config/mailer.js
const nodemailer = require('nodemailer');
const { logger } = require('./database');

let transporter;

if (process.env.NODE_ENV === 'development' && (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'localhost')) {
  // In dev mode without a real SMTP server, log emails to console
  transporter = {
    async sendMail(mailOptions) {
      logger.info('═══════════════════════════════════════');
      logger.info('📧 EMAIL (dev console — not actually sent)');
      logger.info(`   To:      ${mailOptions.to}`);
      logger.info(`   Subject: ${mailOptions.subject}`);
      logger.info(`   From:    ${mailOptions.from || process.env.SMTP_FROM_EMAIL}`);
      if (mailOptions.html) {
        // Extract text content from HTML for console readability
        const textContent = mailOptions.html
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .substring(0, 500);
        logger.info(`   Body:    ${textContent}...`);
      }
      logger.info('═══════════════════════════════════════');
      return { messageId: `dev-${Date.now()}@local` };
    },
  };
  logger.info('Mailer: Using console logger (no real SMTP in development)');
} else {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpSecure = process.env.SMTP_SECURE === 'true';
  const isBrevoHost = /brevo|sendinblue/i.test(smtpHost);
  const brevoKey = process.env.BREVO_SMTP_KEY || process.env.SMTP_PASS;

  if (isBrevoHost) {
    logger.info(`Mailer: Using Brevo SMTP at ${smtpHost}:${smtpPort}`);
  } else {
    logger.info(`Mailer: Using SMTP at ${smtpHost}:${smtpPort}`);
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: isBrevoHost ? brevoKey : process.env.SMTP_PASS,
    },
    connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT_MS || '15000', 10),
    greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT_MS || '10000', 10),
    socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT_MS || '20000', 10),
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED === 'true',
    },
  });

  transporter.verify()
    .then(() => logger.info('Mailer: SMTP connection verified'))
    .catch((err) => {
      const msg = err?.message || String(err);
      const code = err?.code || 'UNKNOWN';
      logger.error(`Mailer: SMTP verification failed - ${msg} (code: ${code})`);
    });
}

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML body
 * @returns {Promise<object>} Nodemailer send result
 */
async function sendMail(to, subject, html) {
  try {
    const rawFromEmail = (process.env.SMTP_FROM_EMAIL || '').trim().replace(/^"|"$/g, '');
    const fromEmail = rawFromEmail.includes('@') ? rawFromEmail : (process.env.SMTP_USER || 'noreply@phygital.local');

    const result = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'CampuSync'}" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject} [${result.messageId}]`);
    return result;
  } catch (err) {
    const msg = err?.message || String(err);
    const code = err?.code || 'UNKNOWN';
    logger.error(`Failed to send email to ${to}: ${msg} (code: ${code})`);
    throw err;
  }
}

module.exports = { sendMail, transporter };


