// backend/src/modules/billing/Payment.model.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  organization_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  razorpay_payment_id:      { type: String, default: null, sparse: true, unique: true },
  razorpay_subscription_id: { type: String, default: null },
  razorpay_order_id:        { type: String, default: null },
  amount_paise:             { type: Number, required: true },
  currency:                 { type: String, default: 'INR' },
  status:                   { type: String, enum: ['created', 'captured', 'failed', 'refunded'], required: true },
  plan:                     { type: String, default: null },
  payment_method:           { type: String, default: null },
  invoice_url:              { type: String, default: null },
  is_active:                { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
