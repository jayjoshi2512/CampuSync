// backend/middleware/validate.js
const { body, param, query, validationResult } = require('express-validator');

/**
 * Run validation and return errors if any
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

// ============================================
// REGISTRATION FORM
// ============================================
const registrationForm = [
  body('institution_name')
    .trim().notEmpty().withMessage('Institution name is required')
    .isLength({ max: 255 }).withMessage('Institution name must be under 255 characters'),
  body('institution_type')
    .trim().notEmpty().withMessage('Institution type is required')
    .isIn(['university', 'school', 'student_group', 'corporate']).withMessage('Invalid institution type'),
  body('institution_website')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Invalid website URL'),
  body('contact_name')
    .trim().notEmpty().withMessage('Contact name is required')
    .isLength({ max: 255 }).withMessage('Contact name must be under 255 characters'),
  body('contact_email')
    .trim().notEmpty().withMessage('Contact email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('contact_phone')
    .trim().notEmpty().withMessage('Contact phone is required')
    .matches(/^[0-9\+\-\s()]{10,20}$/).withMessage('Invalid phone number format'),
  body('registration_reason')
    .optional({ checkFalsy: true }).trim()
    .isLength({ min: 10 }).withMessage('If provided, please provide at least 10 characters describing your use case'),
  handleValidation,
];

// ============================================
// ADMIN LOGIN
// ============================================
const adminLogin = [
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidation,
];

// ============================================
// ADMIN SETUP PASSWORD
// ============================================
const adminSetupPassword = [
  body('token')
    .trim().notEmpty().withMessage('Onboarding token is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('confirm_password')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
  handleValidation,
];

// ============================================
// PROFILE UPDATE
// ============================================
const profileUpdate = [
  body('name')
    .optional().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be between 1 and 255 characters'),
  body('bio')
    .optional().trim().isLength({ max: 300 }).withMessage('Bio must be under 300 characters'),
  body('linkedin_url')
    .optional({ checkFalsy: true }).isURL().withMessage('Invalid LinkedIn URL'),
  body('instagram_url')
    .optional({ checkFalsy: true }).isURL().withMessage('Invalid Instagram URL'),
  handleValidation,
];

// ============================================
// OTP SUBMISSION
// ============================================
const otpSubmission = [
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('otp')
    .trim().notEmpty().withMessage('OTP is required'),
  handleValidation,
];

// ============================================
// EMAIL ONLY (for send-otp, magic-link)
// ============================================
const emailOnly = [
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  handleValidation,
];

// ============================================
// MEMORY UPLOAD
// ============================================
const memoryUpload = [
  body('caption')
    .optional().trim().isLength({ max: 500 }).withMessage('Caption must be under 500 characters'),
  handleValidation,
];

// ============================================
// ANNOUNCEMENT
// ============================================
const announcement = [
  body('subject')
    .trim().notEmpty().withMessage('Subject is required')
    .isLength({ max: 255 }).withMessage('Subject must be under 255 characters'),
  body('body')
    .trim().notEmpty().withMessage('Message body is required')
    .isLength({ min: 10 }).withMessage('Message body must be at least 10 characters'),
  handleValidation,
];

// ============================================
// CO-ADMIN INVITE
// ============================================
const coAdminInvite = [
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('name')
    .trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 255 }).withMessage('Name must be under 255 characters'),
  handleValidation,
];

module.exports = {
  handleValidation,
  registrationForm,
  adminLogin,
  adminSetupPassword,
  profileUpdate,
  otpSubmission,
  emailOnly,
  memoryUpload,
  announcement,
  coAdminInvite,
};
