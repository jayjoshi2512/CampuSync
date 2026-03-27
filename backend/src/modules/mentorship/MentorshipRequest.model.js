// backend/src/modules/mentorship/MentorshipRequest.model.js
const mongoose = require('mongoose');

const mentorshipRequestSchema = new mongoose.Schema({
  student_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentor_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'MentorProfile', required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  message:         { type: String, default: '' },
  status:          { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  mentor_reply:    { type: String, default: null },
  decided_at:      { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

mentorshipRequestSchema.index({ organization_id: 1, status: 1 });
mentorshipRequestSchema.index({ mentor_id: 1, status: 1 });
mentorshipRequestSchema.index({ student_id: 1 });

const MentorshipRequest = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
module.exports = MentorshipRequest;
