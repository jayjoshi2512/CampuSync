// backend/src/modules/admin/AuditLog.model.js
const mongoose = require('mongoose');

// AuditLog is never soft-deleted — always fully visible
const auditLogSchema = new mongoose.Schema({
  actor_type:  { type: String, enum: ['super_admin', 'admin', 'user', 'system'], required: true },
  actor_id:    { type: mongoose.Schema.Types.ObjectId, default: null },
  action:      { type: String, required: true },
  target_type: { type: String, default: null },
  target_id:   { type: mongoose.Schema.Types.ObjectId, default: null },
  ip_address:  { type: String, default: null },
  user_agent:  { type: String, default: null },
  metadata:    { type: mongoose.Schema.Types.Mixed, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

auditLogSchema.index({ actor_type: 1, actor_id: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ created_at: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
