// backend/utils/emailTemplates.js

const APP_NAME = 'Phygital SaaS';

/**
 * Base wrapper for all email templates — responsive, dark, email-client safe
 */
function baseWrapper(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${APP_NAME}</title>
<!--[if mso]>
<style>table,td{font-family:Arial,Helvetica,sans-serif !important;}</style>
<![endif]-->
<style>
  @media only screen and (max-width: 600px) {
    .email-container { width: 100% !important; }
    .email-inner { padding: 24px 20px !important; }
    .email-header { padding: 24px 20px 12px 20px !important; }
    .email-footer { padding: 20px !important; }
    .btn-primary { padding: 14px 24px !important; font-size: 15px !important; }
    .code-box { padding: 16px !important; }
    .code-text { font-size: 24px !important; letter-spacing: 4px !important; }
    .info-table td { display: block !important; width: 100% !important; padding: 12px 16px !important; }
  }
  .copy-hint {
    display: block; margin-top: 8px;
    font-size: 10px; color: #6B7280; letter-spacing: 0.3px;
  }
  .selectable-code {
    display: block; margin-top: 4px; padding: 8px 14px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px; color: #EAEDF3; font-family: 'Courier New', monospace;
    font-size: 13px; word-break: break-all; -webkit-user-select: all;
    -moz-user-select: all; user-select: all; cursor: text;
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#07090E;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07090E;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" class="email-container" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#0D1117;border:1px solid rgba(255,255,255,0.09);border-radius:12px;overflow:hidden;">
      <!-- Header -->
      <tr><td class="email-header" style="padding:28px 40px 14px 40px;border-bottom:1px solid rgba(255,255,255,0.05);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10B981;margin-right:8px;vertical-align:middle;"></div>
              <span style="font-size:18px;font-weight:700;color:#EAEDF3;letter-spacing:-0.3px;vertical-align:middle;">${APP_NAME}</span>
            </td>
          </tr>
        </table>
      </td></tr>
      <!-- Content -->
      <tr><td class="email-inner" style="padding:28px 40px;">
        ${content}
      </td></tr>
      <!-- Footer -->
      <tr><td class="email-footer" style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;font-size:11px;color:#6B7280;line-height:1.5;">
          This email was sent by ${APP_NAME}. Please do not reply.
        </p>
      </td></tr>
    </table>
    <p style="margin:20px 0 0 0;font-size:10px;color:#4B5563;text-align:center;">
      © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
    </p>
  </td></tr>
</table>
</body>
</html>`;
}

/**
 * Copy button helper (click-to-copy via mailto fallback + JS)
 */
function copyButton(text, label = 'Tap to select, then copy') {
  return `<span class="copy-hint">${label}</span>
<span class="selectable-code" style="display:block;margin-top:4px;padding:8px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#EAEDF3;font-family:'Courier New',monospace;font-size:13px;word-break:break-all;-webkit-user-select:all;-moz-user-select:all;user-select:all;cursor:text;">${text}</span>`;
}

/**
 * 1. Super Admin OTP email
 */
function superAdminOtpEmail(otp) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#14B8A6;">Access Code Requested</h2>
    <p style="margin:0 0 20px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      Your one-time access code for the Super Admin portal:
    </p>
    <div class="code-box" style="background-color:#161B24;border:1px solid rgba(20,184,166,0.25);border-radius:10px;padding:24px;text-align:center;margin:0 0 20px 0;">
      <code class="code-text" style="font-family:'Courier New',monospace;font-size:28px;font-weight:700;color:#14B8A6;letter-spacing:6px;display:block;">${otp}</code>
      ${copyButton(otp, 'Tap code to select')}
    </div>
    <p style="margin:0 0 6px 0;font-size:13px;color:#6B7280;">Expires in <strong style="color:#EAEDF3;">10 minutes</strong></p>
    <p style="margin:0;font-size:13px;color:#6B7280;">If you didn't request this, ignore this email.</p>
  `);
}

/**
 * 2. Registration email OTP
 */
function registrationOtpEmail(name, otp) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#10B981;">Verify Your Email</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      Enter this verification code to confirm your email:
    </p>
    <div class="code-box" style="background-color:#161B24;border:1px solid rgba(16,185,129,0.25);border-radius:10px;padding:24px;text-align:center;margin:0 0 20px 0;">
      <code class="code-text" style="font-family:'Courier New',monospace;font-size:32px;font-weight:700;color:#10B981;letter-spacing:8px;display:block;">${otp}</code>
      ${copyButton(otp, 'Tap code to select')}
    </div>
    <p style="margin:0;font-size:13px;color:#6B7280;">Expires in <strong style="color:#EAEDF3;">15 minutes</strong></p>
  `);
}

/**
 * 3. Registration received confirmation
 */
function registrationReceivedEmail(name, orgName) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#10B981;">Application Received ✓</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      We've received the registration for <strong style="color:#EAEDF3;">${orgName}</strong>. Our team will review it within <strong style="color:#EAEDF3;">48 hours</strong>.
    </p>
    <div style="background-color:#161B24;border-left:3px solid #10B981;border-radius:4px;padding:16px;margin:0 0 20px 0;">
      <p style="margin:0;font-size:13px;color:#9CA3AF;">You'll receive an email with next steps once reviewed.</p>
    </div>
    <p style="margin:0;font-size:13px;color:#6B7280;">Thank you for choosing ${APP_NAME}.</p>
  `);
}

/**
 * 4. Super Admin alert: new registration
 */
function superAdminNewRegistrationAlert(orgName, contactName, contactEmail) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#14B8A6;">New Registration Pending</h2>
    <p style="margin:0 0 20px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      A new institution has submitted a registration:
    </p>
    <table role="presentation" class="info-table" width="100%" cellpadding="0" cellspacing="0" style="background-color:#161B24;border:1px solid rgba(255,255,255,0.09);border-radius:10px;margin:0 0 24px 0;">
      <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
        <span style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">Institution</span><br>
        <span style="font-size:15px;color:#EAEDF3;font-weight:500;">${orgName}</span>
      </td></tr>
      <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
        <span style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">Contact</span><br>
        <span style="font-size:15px;color:#EAEDF3;">${contactName}</span>
      </td></tr>
      <tr><td style="padding:14px 20px;">
        <span style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">Email</span><br>
        <span style="font-size:15px;color:#EAEDF3;">${contactEmail}</span>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#6B7280;">Review this in the Super Admin dashboard.</p>
  `);
}

/**
 * 5. Approval email
 */
function approvalEmail(name, orgName, onboardingUrl) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#22C55E;">Application Approved!</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 24px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      <strong style="color:#EAEDF3;">${orgName}</strong> has been approved. Set up your admin password to get started:
    </p>
    <div style="text-align:center;margin:0 0 24px 0;">
      <a class="btn-primary" href="${onboardingUrl}" style="display:inline-block;background-color:#10B981;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
        Set Up Your Password →
      </a>
    </div>
    <p style="margin:0 0 8px 0;font-size:13px;color:#6B7280;">Link expires in <strong style="color:#EAEDF3;">72 hours</strong></p>
    <div class="code-box" style="background-color:#161B24;border-radius:8px;padding:12px 16px;margin:8px 0 0 0;word-break:break-all;">
      <span style="font-size:11px;color:#6B7280;">If the button doesn't work, copy this URL:</span><br>
      <span style="font-size:12px;color:#10B981;">${onboardingUrl}</span>
      ${copyButton(onboardingUrl, 'Tap to select URL')}
    </div>
  `);
}

/**
 * 6. Rejection email
 */
function rejectionEmail(name, orgName, reason) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#F87171;">Application Update</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      After reviewing <strong style="color:#EAEDF3;">${orgName}</strong>, we are unable to approve at this time.
    </p>
    <div style="background-color:#161B24;border-left:3px solid #F87171;border-radius:4px;padding:16px;margin:0 0 20px 0;">
      <p style="margin:0 0 4px 0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">Reason</p>
      <p style="margin:0;font-size:14px;color:#EAEDF3;line-height:1.5;">${reason}</p>
    </div>
    <p style="margin:0;font-size:13px;color:#9CA3AF;">If you believe this was an error, please submit a new registration.</p>
  `);
}

/**
 * 7. Onboarding email (password setup link)
 */
function onboardingEmail(name, orgName, setupUrl) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#10B981;">Set Up Your Account</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 24px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      You've been invited as an administrator for <strong style="color:#EAEDF3;">${orgName}</strong>. Set your password:
    </p>
    <div style="text-align:center;margin:0 0 24px 0;">
      <a class="btn-primary" href="${setupUrl}" style="display:inline-block;background-color:#10B981;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
        Set Password →
      </a>
    </div>
    <p style="margin:0 0 8px 0;font-size:13px;color:#6B7280;">Link expires in <strong style="color:#EAEDF3;">72 hours</strong></p>
    <div class="code-box" style="background-color:#161B24;border-radius:8px;padding:12px 16px;margin:8px 0 0 0;word-break:break-all;">
      <span style="font-size:11px;color:#6B7280;">Copy this URL if needed:</span><br>
      <span style="font-size:12px;color:#10B981;">${setupUrl}</span>
      ${copyButton(setupUrl, 'Tap to select URL')}
    </div>
  `);
}

/**
 * 8. Magic link email (student login)
 */
function magicLinkEmail(name, link) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#F59E0B;">Your Login Link</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 24px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      Click below to access your portal:
    </p>
    <div style="text-align:center;margin:0 0 24px 0;">
      <a class="btn-primary" href="${link}" style="display:inline-block;background-color:#F59E0B;color:#1A1A1A;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
        Open My Portal →
      </a>
    </div>
    <p style="margin:0 0 8px 0;font-size:13px;color:#6B7280;">Expires in <strong style="color:#EAEDF3;">15 minutes</strong> &middot; Single use only</p>
    <div class="code-box" style="background-color:#161B24;border-radius:8px;padding:12px 16px;margin:8px 0 0 0;word-break:break-all;">
      <span style="font-size:11px;color:#6B7280;">Copy this URL if needed:</span><br>
      <span style="font-size:12px;color:#F59E0B;">${link}</span>
      ${copyButton(link, 'Tap to select URL')}
    </div>
  `);
}

/**
 * 9. Announcement email
 */
function announcementEmail(name, orgName, subject, body) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#10B981;">${subject}</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 4px 0;font-size:12px;color:#6B7280;">From <strong style="color:#9CA3AF;">${orgName}</strong></p>
    <div style="background-color:#161B24;border-radius:10px;padding:20px;margin:16px 0 20px 0;">
      <p style="margin:0;font-size:14px;color:#EAEDF3;line-height:1.7;white-space:pre-wrap;">${body}</p>
    </div>
    <p style="margin:0;font-size:12px;color:#6B7280;">You received this because you are a member of ${orgName}.</p>
  `);
}

/**
 * 10. Cohort magic link email
 */
function cohortMagicLinkEmail(name, orgName, link) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#10B981;">Welcome to ${orgName}</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 24px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      Your digital farewell card is ready! Click below to view your card and access the memory wall:
    </p>
    <div style="text-align:center;margin:0 0 24px 0;">
      <a class="btn-primary" href="${link}" style="display:inline-block;background-color:#10B981;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
        View My Card →
      </a>
    </div>
    <p style="margin:0 0 8px 0;font-size:13px;color:#6B7280;">Expires in <strong style="color:#EAEDF3;">24 hours</strong></p>
    <div class="code-box" style="background-color:#161B24;border-radius:8px;padding:12px 16px;margin:8px 0 0 0;word-break:break-all;">
      <span style="font-size:11px;color:#6B7280;">Copy this URL if needed:</span><br>
      <span style="font-size:12px;color:#10B981;">${link}</span>
      ${copyButton(link, 'Tap to select URL')}
    </div>
  `);
}

/**
 * Password reset email
 */
function passwordResetEmail(name, resetLink) {
  return baseWrapper(`
    <p style="margin:0 0 16px 0;font-size:15px;color:#EAEDF3;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 24px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      We received a request to reset your password. Click below to set a new one:
    </p>
    <div style="text-align:center;margin:0 0 24px 0;">
      <a class="btn-primary" href="${resetLink}" target="_blank" style="display:inline-block;padding:14px 36px;border-radius:10px;background-color:#10B981;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">
        Reset Password →
      </a>
    </div>
    <p style="margin:0 0 8px 0;font-size:13px;color:#6B7280;">Expires in <strong style="color:#EAEDF3;">30 minutes</strong></p>
    <p style="margin:0 0 12px 0;font-size:13px;color:#6B7280;">If you didn't request this, ignore this email.</p>
    <div class="code-box" style="background-color:#161B24;border-radius:8px;padding:12px 16px;word-break:break-all;">
      <span style="font-size:11px;color:#6B7280;">Copy this URL if needed:</span><br>
      <span style="font-size:12px;color:#10B981;">${resetLink}</span>
      ${copyButton(resetLink, 'Tap to select URL')}
    </div>
  `);
}

module.exports = {
  superAdminOtpEmail,
  registrationOtpEmail,
  registrationReceivedEmail,
  superAdminNewRegistrationAlert,
  approvalEmail,
  rejectionEmail,
  onboardingEmail,
  magicLinkEmail,
  announcementEmail,
  cohortMagicLinkEmail,
  passwordResetEmail,
};
