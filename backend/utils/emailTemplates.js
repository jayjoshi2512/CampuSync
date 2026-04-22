// backend/utils/emailTemplates.js

const APP_NAME = 'CampuSync';
const BRAND_GREEN = '#10B981';
const BRAND_TEAL = '#14B8A6';
const BRAND_AMBER = '#F59E0B';
const BRAND_RED = '#F87171';

/* ═══════════════════════════════════════════════════════════
   BASE WRAPPER — dark, table-based, fully responsive email
════════════════════════════════════════════════════════════= */
function baseWrapper (content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${ APP_NAME }</title>
<!--[if mso]>
<style>table,td,a{font-family:Arial,Helvetica,sans-serif !important;}</style>
<![endif]-->
<style>
  body { margin:0; padding:0; background:#07090E; }
  img  { border:0; display:block; }
  @media only screen and (max-width:600px) {
    .outer-wrap { padding:12px 8px !important; }
    .email-card  { border-radius:0 !important; }
    .inner-pad   { padding:24px 20px !important; }
    .btn-cta     { display:block !important; width:100% !important; box-sizing:border-box !important; text-align:center !important; }
    .code-num    { font-size:26px !important; letter-spacing:4px !important; }
    .info-row td { display:block !important; width:100% !important; padding:12px 16px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#07090E;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#07090E;">
  <tr><td class="outer-wrap" align="center" style="padding:32px 16px;">

    <!-- Card -->
    <table role="presentation" class="email-card" width="580" cellpadding="0" cellspacing="0"
           style="max-width:580px;width:100%;background:#0D1117;border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;">

      <!-- Logo strip -->
      <tr>
        <td style="padding:22px 32px 18px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:9px;height:9px;background:${ BRAND_GREEN };border-radius:50%;vertical-align:middle;"></td>
              <td style="padding-left:8px;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:700;color:#EAEDF3;letter-spacing:-0.3px;vertical-align:middle;">${ APP_NAME }</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td class="inner-pad" style="padding:32px;">
          ${ content }
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:18px 32px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#4B5563;line-height:1.5;">
            This email was sent by ${ APP_NAME }. Do not reply &mdash; this mailbox is unmonitored.
          </p>
        </td>
      </tr>
    </table>

    <!-- Copyright -->
    <p style="margin:14px 0 0;font-family:Arial,sans-serif;font-size:10px;color:#374151;text-align:center;">
      &copy; ${ new Date().getFullYear() } ${ APP_NAME }. All rights reserved.
    </p>

  </td></tr>
</table>
</body>
</html>`;
}

/* OTP display block — large centred code */
function otpBlock (otp, color) {
    return `
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#161B24;border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin:20px 0;overflow:hidden;">
  <tr>
    <td style="padding:28px 24px 14px;text-align:center;">
      <span class="code-num" style="font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:700;color:${ color };letter-spacing:8px;display:block;">${ otp }</span>
    </td>
  </tr>
</table>`;
}

/* Primary CTA button + plain fallback link */
function ctaBlock (label, url, bgColor, textColor) {
    return `
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:24px 0 0;" align="center">
  <tr>
    <td align="center" style="padding-bottom:20px;">
      <a class="btn-cta" href="${ url }" target="_blank"
         style="display:inline-block;padding:14px 40px;background:${ bgColor };color:${ textColor };font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
        ${ label }
      </a>
    </td>
  </tr>
  <tr>
    <td>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#6B7280;line-height:1.6;word-break:break-all;">
        Button not working? Open this link directly: <a href="${ url }" target="_blank" style="color:${ bgColor };text-decoration:underline;">${ url }</a>
      </p>
    </td>
  </tr>
</table>`;
}

/* — Tiny helpers — */
function h2 (text, color) {
    return `<h2 style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:19px;font-weight:700;color:${ color };line-height:1.3;">${ text }</h2>`;
}
function greet (name) {
    return `<p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:14px;color:#EAEDF3;">Hello <strong>${ name }</strong>,</p>`;
}
function para (text) {
    return `<p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:14px;color:#9CA3AF;line-height:1.7;">${ text }</p>`;
}
function infoRow (label, value) {
    return `
<tr>
  <td style="padding:13px 20px;border-bottom:1px solid rgba(255,255,255,0.05);font-family:Arial,sans-serif;">
    <span style="font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px;">${ label }</span>
    <span style="font-size:14px;color:#EAEDF3;font-weight:500;">${ value }</span>
  </td>
</tr>`;
}

/* ═══════════════════════════════════════════════════════════
   1. Super Admin OTP
════════════════════════════════════════════════════════════= */
function superAdminOtpEmail (otp) {
    return baseWrapper(`
    ${ h2('Access Code Requested', BRAND_TEAL) }
    ${ para('Your one-time access code for the Super Admin portal:') }
    ${ otpBlock(otp, BRAND_TEAL) }
    <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:13px;color:#6B7280;">Expires in <strong style="color:#EAEDF3;">10 minutes</strong></p>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#4B5563;">Didn't request this? Simply ignore this email.</p>
  `);
}

/* ═══════════════════════════════════════════════════════════
   2. Registration OTP
════════════════════════════════════════════════════════════= */
function registrationOtpEmail (name, otp) {
    return baseWrapper(`
    ${ h2('Verify Your Email', BRAND_GREEN) }
    ${ greet(name) }
    ${ para('Enter this verification code to confirm your email address:') }
    ${ otpBlock(otp, BRAND_GREEN) }
    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#6B7280;">Expires in <strong style="color:#EAEDF3;">15 minutes</strong> &middot; Do not share this code.</p>
  `);
}

/* ═══════════════════════════════════════════════════════════
   3. Registration received
════════════════════════════════════════════════════════════= */
function registrationReceivedEmail (name, orgName) {
    return baseWrapper(`
    ${ h2('Application Received ✓', BRAND_GREEN) }
    ${ greet(name) }
    ${ para(`We've received the registration for <strong style="color:#EAEDF3;">${ orgName }</strong>. Our team will review it within <strong style="color:#EAEDF3;">48 hours</strong>.`) }
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#161B24;border-left:3px solid ${ BRAND_GREEN };border-radius:4px;margin:0 0 20px;">
      <tr><td style="padding:14px 16px;font-family:Arial,sans-serif;font-size:13px;color:#9CA3AF;line-height:1.6;">You'll receive an email with next steps once reviewed. Keep an eye on your inbox.</td></tr>
    </table>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#6B7280;">Thank you for choosing ${ APP_NAME }.</p>
  `);
}

/* ═══════════════════════════════════════════════════════════
   4. Super Admin alert — new registration
════════════════════════════════════════════════════════════= */
function superAdminNewRegistrationAlert (orgName, contactName, contactEmail) {
    return baseWrapper(`
    ${ h2('New Registration Pending', BRAND_TEAL) }
    ${ para('A new institution has submitted a registration request:') }
    <table role="presentation" class="info-row" cellpadding="0" cellspacing="0"
           style="width:100%;background:#161B24;border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin:0 0 20px;overflow:hidden;">
      ${ infoRow('Institution', orgName) }
      ${ infoRow('Contact Name', contactName) }
      <tr>
        <td style="padding:13px 20px;font-family:Arial,sans-serif;">
          <span style="font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:4px;">Email</span>
          <a href="mailto:${ contactEmail }" style="font-size:14px;color:${ BRAND_TEAL };text-decoration:none;">${ contactEmail }</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#6B7280;">Review this in the Super Admin dashboard.</p>
  `);
}

/* ═══════════════════════════════════════════════════════════
   5. Approval email
════════════════════════════════════════════════════════════= */
function approvalEmail (name, orgName, onboardingUrl) {
    return baseWrapper(`
    ${ h2('Application Approved! 🎉', '#22C55E') }
    ${ greet(name) }
    ${ para(`<strong style="color:#EAEDF3;">${ orgName }</strong> has been approved on ${ APP_NAME }. Set up your admin password to get started:`) }
    ${ ctaBlock('Set Up Your Password &rarr;', onboardingUrl, BRAND_GREEN, '#FFFFFF') }
    <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#6B7280;">This link expires in <strong style="color:#EAEDF3;">72 hours</strong>.</p>
  `);
}

/* ═══════════════════════════════════════════════════════════
   6. Rejection email
════════════════════════════════════════════════════════════= */
function rejectionEmail (name, orgName, reason) {
    return baseWrapper(`
    ${ h2('Application Status Update', BRAND_RED) }
    ${ greet(name) }
    ${ para(`After reviewing <strong style="color:#EAEDF3;">${ orgName }</strong>, we're unable to approve the registration at this time.`) }
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#161B24;border-left:3px solid ${ BRAND_RED };border-radius:4px;margin:0 0 20px;overflow:hidden;">
      <tr><td style="padding:6px 16px 4px;font-family:Arial,sans-serif;font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">Reason</td></tr>
      <tr><td style="padding:0 16px 14px;font-family:Arial,sans-serif;font-size:14px;color:#EAEDF3;line-height:1.6;">${ reason }</td></tr>
    </table>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#9CA3AF;">If you believe this is a mistake, please submit a new registration with updated information.</p>
  `);
}

/* ═══════════════════════════════════════════════════════════
   7. Onboarding email (admin password setup)
════════════════════════════════════════════════════════════= */
function onboardingEmail (name, orgName, setupUrl) {
    return baseWrapper(`
    ${ h2("You've Been Invited as Admin", BRAND_GREEN) }
    ${ greet(name) }
    ${ para(`You've been invited to manage <strong style="color:#EAEDF3;">${ orgName }</strong> on ${ APP_NAME }. Click below to create your password and access the admin dashboard:`) }
    ${ ctaBlock('Create My Password &rarr;', setupUrl, BRAND_GREEN, '#FFFFFF') }
    <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#6B7280;">Link expires in <strong style="color:#EAEDF3;">72 hours</strong>. If you didn't expect this, ignore this email.</p>
  `);
}

/* ═══════════════════════════════════════════════════════════
   8. Magic link email (student one-click login)
════════════════════════════════════════════════════════════= */
function magicLinkEmail (name, link) {
    return baseWrapper(`
    ${ h2('Your Secure Login Link', BRAND_AMBER) }
    ${ greet(name) }
    ${ para('Click the button below to instantly access your student portal &mdash; no password needed:') }
    ${ ctaBlock('Open My Portal &rarr;', link, BRAND_AMBER, '#1A1A1A') }
    <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#6B7280;">Expires in <strong style="color:#EAEDF3;">15 minutes</strong> &middot; Single use only &middot; Do not share this link.</p>
  `);
}

/* ═══════════════════════════════════════════════════════════
   9. Announcement email
════════════════════════════════════════════════════════════= */
function announcementEmail (name, orgName, subject, bodyText) {
    return baseWrapper(`
    ${ h2(subject, BRAND_GREEN) }
    ${ greet(name) }
    <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:12px;color:#6B7280;">From <strong style="color:#9CA3AF;">${ orgName }</strong></p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#161B24;border-radius:10px;margin:14px 0 20px;overflow:hidden;">
      <tr><td style="padding:20px;font-family:Arial,sans-serif;font-size:14px;color:#EAEDF3;line-height:1.7;white-space:pre-wrap;">${ bodyText }</td></tr>
    </table>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#4B5563;">You received this because you are a member of ${ orgName }.</p>
  `);
}

/* ═══════════════════════════════════════════════════════════
   10. Cohort magic link email (student password setup)
════════════════════════════════════════════════════════════= */
function cohortMagicLinkEmail (name, orgName, link) {
    return baseWrapper(`
    ${ h2(`Welcome to ${ orgName }! 👋`, BRAND_GREEN) }
    ${ greet(name) }
    ${ para(`Your digital farewell card is ready on ${ APP_NAME }. Set up your password once to view your card and access the shared memory wall:`) }
    ${ ctaBlock('Set Up My Password &rarr;', link, BRAND_GREEN, '#FFFFFF') }
    <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#6B7280;">Link expires in <strong style="color:#EAEDF3;">24 hours</strong>. If you're not a member of ${ orgName }, disregard this email.</p>
  `);
}

/* ═══════════════════════════════════════════════════════════
   11. Password reset email
════════════════════════════════════════════════════════════= */
function passwordResetEmail (name, resetLink) {
    return baseWrapper(`
    ${ h2('Reset Your Password', BRAND_GREEN) }
    ${ greet(name) }
    ${ para('We received a request to reset your password. Click below to set a new one:') }
    ${ ctaBlock('Reset Password &rarr;', resetLink, BRAND_GREEN, '#FFFFFF') }
    <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#6B7280;">Expires in <strong style="color:#EAEDF3;">30 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
  `);
}

/* ═══════════════════════════════════════════════════════════
   12. Alumni OTP email
════════════════════════════════════════════════════════════= */
function alumniOtpEmail (name, otp) {
    return baseWrapper(`
    ${ h2('Email Verification', BRAND_GREEN) }
    ${ greet(name) }
    ${ para('Use this one-time code to verify your email and complete your alumni registration:') }
    ${ otpBlock(otp, BRAND_GREEN) }
    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#6B7280;">Expires in <strong style="color:#EAEDF3;">15 minutes</strong> &middot; Do not share this code.</p>
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
    alumniOtpEmail,
};
