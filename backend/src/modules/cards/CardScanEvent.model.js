// backend/src/modules/cards/CardScanEvent.model.js
const mongoose = require('mongoose');

const cardScanEventSchema = new mongoose.Schema({
  card_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  ip_address: { type: String, default: null },
  user_agent: { type: String, default: null },
  country:    { type: String, default: null },
  is_active:  { type: Boolean, default: true },
  scanned_at: { type: Date, default: Date.now },
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

const CardScanEvent = mongoose.model('CardScanEvent', cardScanEventSchema);
module.exports = CardScanEvent;
