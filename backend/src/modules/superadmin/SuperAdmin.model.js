// backend/src/modules/superadmin/SuperAdmin.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const superAdminSchema = new mongoose.Schema({
  email:             { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
  current_otp_hash:  { type: String, default: null },
  otp_expires_at:    { type: Date, default: null },
  last_login_at:     { type: Date, default: null },
  last_login_ip:     { type: String, default: null },
  is_active:         { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

superAdminSchema.methods.isOtpValid = async function (rawOtp) {
  if (!this.current_otp_hash) return false;
  if (this.otp_expires_at && new Date() > new Date(this.otp_expires_at)) return false;
  return bcrypt.compare(rawOtp, this.current_otp_hash);
};

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);
module.exports = SuperAdmin;
