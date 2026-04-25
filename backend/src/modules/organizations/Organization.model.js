// backend/src/modules/organizations/Organization.model.js
const mongoose = require('mongoose');

const computeRgb = (hex) => {
  if (!hex) return null;
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r},${g},${b}`;
};

const organizationSchema = new mongoose.Schema({
  name:                    { type: String, required: true },
  slug:                    { type: String, required: true, unique: true },
  type:                    { type: String, enum: ['university', 'school', 'student_group', 'corporate'], required: true },

  // Registration & Approval
  contact_name:            { type: String, required: true },
  contact_email:           { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
  contact_phone:           { type: String, default: null },
  institution_website:     { type: String, default: null },
  registration_reason:     { type: String, default: null },
  email_verified:          { type: Boolean, default: false },
  email_verified_at:       { type: Date, default: null },
  status:                  { type: String, enum: ['pending', 'active', 'suspended', 'rejected', 'trial'], default: 'pending' },
  rejection_reason:        { type: String, default: null },
  approved_by:             { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin', default: null },
  approved_at:             { type: Date, default: null },
  password_set:            { type: Boolean, default: false },

  // Branding
  selected_card_template:  { type: String, default: 'tmpl_midnight' },
  brand_color:             { type: String, default: '#6366F1' },
  brand_color_rgb:         { type: String, default: null },
  logo_url:                { type: String, default: null },
  logo_public_id:          { type: String, default: null },
  card_back_image_url:     { type: String, default: null },
  card_back_public_id:     { type: String, default: null },
  custom_domain:           { type: String, default: undefined, sparse: true, unique: true },
  features_data:           { type: mongoose.Schema.Types.Mixed, default: null },

  // Billing
  razorpay_customer_id:    { type: String, default: null },
  razorpay_subscription_id:{ type: String, default: null },
  plan:                    { type: String, enum: ['trial', 'starter', 'growth', 'enterprise'], default: 'trial' },
  trial_ends_at:           { type: Date, default: null },
  billing_cycle_anchor:    { type: Date, default: null },

  // Limits & Usage
  card_quota:              { type: Number, default: 100 },
  storage_limit_gb:        { type: Number, default: 2.00 },
  storage_used_gb:         { type: Number, default: 0 },

  is_active:               { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Recompute brand_color_rgb on save
organizationSchema.pre('save', async function () {
  if (this.isModified('brand_color') && this.brand_color) {
    this.brand_color_rgb = computeRgb(this.brand_color);
  }
});

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = Organization;
