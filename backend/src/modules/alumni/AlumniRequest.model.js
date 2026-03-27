// backend/src/modules/alumni/AlumniRequest.model.js
const mongoose = require('mongoose');

const alumniRequestSchema = new mongoose.Schema({
  organization_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  user_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name:             { type: String, required: true },
  email:            { type: String, required: true, match: /.+\@.+\..+/ },
  branch:           { type: String, default: null },
  batch_year:       { type: Number, default: null },
  linkedin_url:     { type: String, default: null },
  reason:           { type: String, default: null },
  status:           { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejection_reason: { type: String, default: null },
  reviewed_by:      { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  reviewed_at:      { type: Date, default: null },
  is_active:        { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

alumniRequestSchema.index({ organization_id: 1 });
alumniRequestSchema.index({ email: 1 });
alumniRequestSchema.index({ status: 1 });

const AlumniRequest = mongoose.model('AlumniRequest', alumniRequestSchema);
module.exports = AlumniRequest;
