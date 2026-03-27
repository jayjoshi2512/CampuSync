// backend/src/modules/cards/Card.model.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const cardSchema = new mongoose.Schema({
  user_id:                { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  qr_hash:                { type: String, required: true, unique: true },
  qr_signed_token:        { type: String, default: null },
  template_id:            { type: String, default: 'tmpl_midnight' },
  front_data_json:        { type: mongoose.Schema.Types.Mixed, required: true },
  back_image_url:         { type: String, default: null },
  back_image_public_id:   { type: String, default: null },
  card_download_url:      { type: String, default: null },
  card_download_public_id:{ type: String, default: null },
  share_slug:             { type: String, default: null, unique: true, sparse: true },
  share_enabled:          { type: Boolean, default: true },
  scan_count:             { type: Number, default: 0 },
  last_scanned_at:        { type: Date, default: null },
  is_active:              { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

cardSchema.pre('validate', function () {
  if (!this.share_slug) {
    this.share_slug = crypto.randomBytes(4).toString('hex');
  }
  if (!this.qr_hash) {
    this.qr_hash = crypto.randomBytes(32).toString('hex');
  }
});

const Card = mongoose.model('Card', cardSchema);
module.exports = Card;
