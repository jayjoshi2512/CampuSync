// backend/src/modules/organizations/OrgRegistration.model.js
const mongoose = require('mongoose');

const orgRegistrationSchema = new mongoose.Schema({
  organization_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  contact_email:      { type: String, required: true, match: /.+\@.+\..+/ },
  contact_name:       { type: String, required: true },
  institution_name:   { type: String, required: true },
  submitted_data_json:{ type: mongoose.Schema.Types.Mixed, required: true },
  email_verified:     { type: Boolean, default: false },
  otp_hash:           { type: String, default: null },
  otp_expires_at:     { type: Date, default: null },
  status:             { type: String, enum: ['email_pending', 'pending', 'approved', 'rejected'], default: 'email_pending' },
  super_admin_note:   { type: String, default: null },
  ip_address:         { type: String, default: null },
  user_agent:         { type: String, default: null },
  is_active:          { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Static helper
orgRegistrationSchema.statics.findPending = function () {
  return this.find({ status: 'pending' }).sort({ created_at: -1 });
};

const OrgRegistration = mongoose.model('OrgRegistration', orgRegistrationSchema);
module.exports = OrgRegistration;
