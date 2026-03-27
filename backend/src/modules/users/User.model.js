// backend/src/modules/users/User.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name:            { type: String, required: true },
  email:           { type: String, required: true, match: /.+\@.+\..+/ },
  password_hash:   { type: String, default: null },
  roll_number:     { type: String, default: null },
  branch:          { type: String, default: null },
  batch_year:      { type: Number, default: null },
  avatar_url:      { type: String, default: null },
  avatar_public_id:{ type: String, default: null },
  linkedin_url:    { type: String, default: null },
  github_url:      { type: String, default: null },
  twitter_url:     { type: String, default: null },
  website_url:     { type: String, default: null },
  instagram_url:   { type: String, default: null },
  bio:             { type: String, maxlength: 300, default: null },
  role:            { type: String, enum: ['user', 'alumni'], default: 'user' },
  last_login_at:   { type: Date, default: null },
  is_active:       { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.index({ organization_id: 1, email: 1 }, { unique: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (this.isModified('password_hash') && this.password_hash && !this.password_hash.startsWith('$2')) {
    this.password_hash = await bcrypt.hash(this.password_hash, 12);
  }
  next();
});

userSchema.methods.validatePassword = async function (rawPassword) {
  if (!this.password_hash) return false;
  return bcrypt.compare(rawPassword, this.password_hash);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
