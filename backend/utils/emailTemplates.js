// backend/utils/emailTemplates.js

const APP_NAME = 'Phygital SaaS';

/**
 * Base wrapper for all email templates — dark background, email-client safe
 */
function baseWrapper(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#07090E;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07090E;min-height:100vh;">
  <tr><td align="center" style="padding:40px 20px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#0D1117;border:1px solid rgba(255,255,255,0.09);border-radius:12px;overflow:hidden;">
      <!-- Header -->
      <tr><td style="padding:32px 40px 16px 40px;border-bottom:1px solid rgba(255,255,255,0.05);">
        <h1 style="margin:0;font-size:20px;font-weight:600;color:#EAEDF3;letter-spacing:-0.3px;">${APP_NAME}</h1>
      </td></tr>
      <!-- Content -->
      <tr><td style="padding:32px 40px;">
        ${content}
      </td></tr>
      <!-- Footer -->
      <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.5;">
          This email was sent by ${APP_NAME}. Please do not reply to this email.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/**
 * 1. Super Admin OTP email
 */
function superAdminOtpEmail(otp) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#00E89B;">Access Code Requested</h2>
    <p style="margin:0 0 24px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      Your one-time access code for the Super Admin portal is:
    </p>
    <div style="background-color:#161B24;border:1px solid rgba(0,232,155,0.2);border-radius:8px;padding:20px;text-align:center;margin:0 0 24px 0;">
      <code style="font-family:'Courier New',monospace;font-size:24px;font-weight:700;color:#00E89B;letter-spacing:3px;">${otp}</code>
    </div>
    <p style="margin:0 0 8px 0;font-size:13px;color:#6B7280;">⏱ This code expires in <strong style="color:#EAEDF3;">10 minutes</strong>.</p>
    <p style="margin:0;font-size:13px;color:#6B7280;">🔒 If you did not request this code, ignore this email.</p>
  `);
}

/**
 * 2. Registration email OTP
 */
function registrationOtpEmail(name, otp) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#7C7FFA;">Verify Your Email</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 24px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      Enter this verification code to confirm your email address:
    </p>
    <div style="background-color:#161B24;border:1px solid rgba(124,127,250,0.2);border-radius:8px;padding:20px;text-align:center;margin:0 0 24px 0;">
      <code style="font-family:'Courier New',monospace;font-size:32px;font-weight:700;color:#7C7FFA;letter-spacing:8px;">${otp}</code>
    </div>
    <p style="margin:0;font-size:13px;color:#6B7280;">⏱ This code expires in <strong style="color:#EAEDF3;">15 minutes</strong>.</p>
  `);
}

/**
 * 3. Registration received confirmation (sent to applicant)
 */
function registrationReceivedEmail(name, orgName) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#7C7FFA;">Application Received ✓</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      We've received the registration for <strong style="color:#EAEDF3;">${orgName}</strong>. Our team will review your application and respond within <strong style="color:#EAEDF3;">48 hours</strong>.
    </p>
    <div style="background-color:#161B24;border-left:3px solid #7C7FFA;border-radius:4px;padding:16px;margin:0 0 20px 0;">
      <p style="margin:0;font-size:13px;color:#9CA3AF;">You'll receive an email with next steps once your application is reviewed.</p>
    </div>
    <p style="margin:0;font-size:13px;color:#6B7280;">Thank you for choosing ${APP_NAME}.</p>
  `);
}

/**
 * 4. Super Admin alert: new registration pending
 */
function superAdminNewRegistrationAlert(orgName, contactName, contactEmail) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#00E89B;">New Registration Pending</h2>
    <p style="margin:0 0 20px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      A new institution has submitted a registration request:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#161B24;border:1px solid rgba(255,255,255,0.09);border-radius:8px;margin:0 0 24px 0;">
      <tr><td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
        <span style="font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">Institution</span><br>
        <span style="font-size:15px;color:#EAEDF3;font-weight:500;">${orgName}</span>
      </td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
        <span style="font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">Contact</span><br>
        <span style="font-size:15px;color:#EAEDF3;">${contactName}</span>
      </td></tr>
      <tr><td style="padding:16px 20px;">
        <span style="font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">Email</span><br>
        <span style="font-size:15px;color:#EAEDF3;">${contactEmail}</span>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#6B7280;">Review this registration in the Super Admin dashboard.</p>
  `);
}

/**
 * 5. Approval email (sent to institution contact on approval)
 */
function approvalEmail(name, orgName, onboardingUrl) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#22C55E;">🎉 Application Approved!</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      Great news! Your registration for <strong style="color:#EAEDF3;">${orgName}</strong> has been approved. Set up your admin password to get started:
    </p>
    <div style="text-align:center;margin:0 0 24px 0;">
      <a href="${onboardingUrl}" style="display:inline-block;background-color:#7C7FFA;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
        Set Up Your Password →
      </a>
    </div>
    <p style="margin:0 0 8px 0;font-size:13px;color:#6B7280;">⏱ This link expires in <strong style="color:#EAEDF3;">72 hours</strong>.</p>
    <p style="margin:0;font-size:12px;color:#6B7280;word-break:break-all;">If the button doesn't work, copy this URL:<br><span style="color:#7C7FFA;">${onboardingUrl}</span></p>
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
      After reviewing your registration for <strong style="color:#EAEDF3;">${orgName}</strong>, we are unable to approve it at this time.
    </p>
    <div style="background-color:#161B24;border-left:3px solid #F87171;border-radius:4px;padding:16px;margin:0 0 20px 0;">
      <p style="margin:0 0 4px 0;font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">Reason</p>
      <p style="margin:0;font-size:14px;color:#EAEDF3;line-height:1.5;">${reason}</p>
    </div>
    <p style="margin:0;font-size:13px;color:#9CA3AF;">If you believe this was an error, or if you'd like to address the concerns above and re-apply, please submit a new registration.</p>
  `);
}

/**
 * 7. Onboarding email (password setup link)
 */
function onboardingEmail(name, orgName, setupUrl) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#7C7FFA;">Set Up Your Account</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      You've been invited as an administrator for <strong style="color:#EAEDF3;">${orgName}</strong>. Click below to set your password:
    </p>
    <div style="text-align:center;margin:0 0 24px 0;">
      <a href="${setupUrl}" style="display:inline-block;background-color:#7C7FFA;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
        Set Password →
      </a>
    </div>
    <p style="margin:0 0 8px 0;font-size:13px;color:#6B7280;">⏱ This link expires in <strong style="color:#EAEDF3;">72 hours</strong>.</p>
    <p style="margin:0;font-size:12px;color:#6B7280;word-break:break-all;">URL: <span style="color:#7C7FFA;">${setupUrl}</span></p>
  `);
}

/**
 * 8. Magic link email (student login)
 */
function magicLinkEmail(name, link) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#F59E0B;">Your Login Link</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      Click the button below to access your portal:
    </p>
    <div style="text-align:center;margin:0 0 24px 0;">
      <a href="${link}" style="display:inline-block;background-color:#F59E0B;color:#1A1A1A;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
        Open My Portal →
      </a>
    </div>
    <p style="margin:0 0 8px 0;font-size:13px;color:#6B7280;">⏱ This link expires in <strong style="color:#EAEDF3;">15 minutes</strong> and can only be used once.</p>
    <p style="margin:0;font-size:12px;color:#6B7280;word-break:break-all;">URL: <span style="color:#F59E0B;">${link}</span></p>
  `);
}

/**
 * 9. Announcement email (admin → cohort)
 */
function announcementEmail(name, orgName, subject, body) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#7C7FFA;">${subject}</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 4px 0;font-size:12px;color:#6B7280;">From <strong style="color:#9CA3AF;">${orgName}</strong></p>
    <div style="background-color:#161B24;border-radius:8px;padding:20px;margin:16px 0 20px 0;">
      <p style="margin:0;font-size:14px;color:#EAEDF3;line-height:1.7;white-space:pre-wrap;">${body}</p>
    </div>
    <p style="margin:0;font-size:12px;color:#6B7280;">You received this email because you are a member of ${orgName}.</p>
  `);
}

/**
 * 10. Cohort magic link email (bulk magic link dispatch)
 */
function cohortMagicLinkEmail(name, orgName, link) {
  return baseWrapper(`
    <h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#7C7FFA;">Welcome to ${orgName}</h2>
    <p style="margin:0 0 8px 0;font-size:14px;color:#EAEDF3;">Hello ${name},</p>
    <p style="margin:0 0 20px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      Your digital farewell card is ready! Click below to view your card and access the memory wall:
    </p>
    <div style="text-align:center;margin:0 0 24px 0;">
      <a href="${link}" style="display:inline-block;background-color:#7C7FFA;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
        View My Card →
      </a>
    </div>
    <p style="margin:0 0 8px 0;font-size:13px;color:#6B7280;">⏱ This link expires in <strong style="color:#EAEDF3;">24 hours</strong>.</p>
    <p style="margin:0;font-size:12px;color:#6B7280;word-break:break-all;">URL: <span style="color:#7C7FFA;">${link}</span></p>
  `);
}

/**
 * Password reset email
 */
function passwordResetEmail(name, resetLink) {
  return baseWrapper(`
    <p style="margin:0 0 16px 0;font-size:15px;color:#EAEDF3;">Hi <strong>${name}</strong>,</p>
    <p style="margin:0 0 24px 0;font-size:14px;color:#9CA3AF;line-height:1.6;">
      We received a request to reset your password. Click the link below to set a new one.
    </p>
    <div style="margin:0 0 24px 0;">
      <a href="${resetLink}" target="_blank" style="display:inline-block;padding:12px 32px;border-radius:8px;background-color:#7C7FFA;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">
        Reset Password →
      </a>
    </div>
    <p style="margin:0 0 8px 0;font-size:13px;color:#6B7280;">⏱ This link expires in <strong style="color:#EAEDF3;">30 minutes</strong>.</p>
    <p style="margin:0;font-size:12px;color:#6B7280;">If you didn't request this, you can safely ignore this email.</p>
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
