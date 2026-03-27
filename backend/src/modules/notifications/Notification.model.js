// backend/src/modules/notifications/Notification.model.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:       { type: String, enum: ['new_memory', 'announcement', 'magic_link', 'approval', 'system'], required: true },
  title:      { type: String, required: true },
  body:       { type: String, default: null },
  action_url: { type: String, default: null },
  is_read:    { type: Boolean, default: false },
  is_active:  { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
