// backend/src/modules/memories/Memory.model.js
const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  uploaded_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  media_type:      { type: String, enum: ['photo', 'video'], required: true },
  cloudinary_url:  { type: String, required: true },
  public_id:       { type: String, required: true },
  thumbnail_url:   { type: String, default: null },
  width:           { type: Number, default: null },
  height:          { type: Number, default: null },
  duration_sec:    { type: Number, default: null },
  file_size_mb:    { type: Number, default: null },
  caption:         { type: String, default: null },
  album:           { type: String, default: 'General' },
  status:          { type: Number, default: 0 },      // 0=pending, 1=approved
  is_flagged:      { type: Boolean, default: false },
  is_active:       { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

const Memory = mongoose.model('Memory', memorySchema);
module.exports = Memory;
