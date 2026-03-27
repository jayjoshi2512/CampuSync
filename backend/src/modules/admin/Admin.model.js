// backend/src/modules/admin/Admin.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  organization_id:              { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name:                         { type: String, required: true },
  email:                        { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
  password_hash:                { type: String, default: null },
  role:                         { type: String, enum: ['owner', 'co_admin'], default: 'owner' },
  onboarding_token:             { type: String, default: null },
  onboarding_token_expires_at:  { type: Date, default: null },
  last_login_at:                { type: Date, default: null },
  last_login_ip:                { type: String, default: null },
  is_active:                    { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

adminSchema.pre('save', async function (next) {
  if (this.isModified('password_hash') && this.password_hash && !this.password_hash.startsWith('$2')) {
    this.password_hash = await bcrypt.hash(this.password_hash, 12);
  }
  next();
});

adminSchema.methods.validatePassword = async function (rawPassword) {
  if (!this.password_hash) return false;
  return bcrypt.compare(rawPassword, this.password_hash);
};

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
