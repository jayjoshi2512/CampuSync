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
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  transporter.verify()
    .then(() => logger.info('Mailer: SMTP connection verified ✅'))
    .catch((err) => logger.error('Mailer: SMTP verification failed:', err.message));
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
    const result = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'CampuSync'}" <${process.env.SMTP_FROM_EMAIL || 'noreply@phygital.local'}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject} [${result.messageId}]`);
    return result;
  } catch (err) {
    logger.error(`Failed to send email to ${to}:`, err.message);
    throw err;
  }
}

module.exports = { sendMail, transporter };
