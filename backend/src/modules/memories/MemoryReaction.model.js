// backend/src/modules/memories/MemoryReaction.model.js
const mongoose = require('mongoose');

const memoryReactionSchema = new mongoose.Schema({
  memory_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Memory', required: true },
  user_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emoji:     { type: String, enum: ['❤️', '🔥', '😂', '😮', '😢'], required: true },
  is_active: { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

memoryReactionSchema.index({ memory_id: 1, user_id: 1, emoji: 1 }, { unique: true });

const MemoryReaction = mongoose.model('MemoryReaction', memoryReactionSchema);
module.exports = MemoryReaction;
