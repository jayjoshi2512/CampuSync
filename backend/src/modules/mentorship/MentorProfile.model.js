// backend/src/modules/mentorship/MentorProfile.model.js
const mongoose = require('mongoose');

const mentorProfileSchema = new mongoose.Schema({
  user_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  role_title:      { type: String, required: true },
  company:         { type: String, required: true },
  expertise:       [{ type: String }],
  bio:             { type: String, default: '' },
  slots:           { type: Number, default: 3 },
  status:          { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewed_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  reviewed_at:     { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

mentorProfileSchema.index({ organization_id: 1, status: 1 });
mentorProfileSchema.index({ user_id: 1 }, { unique: true });

const MentorProfile = mongoose.model('MentorProfile', mentorProfileSchema);
module.exports = MentorProfile;
