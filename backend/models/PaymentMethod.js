const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Only credit_card is saved here. Apple Pay is device-based and not stored.
    type: {
      type: String,
      enum: ['credit_card'],
      default: 'credit_card'
    },
    cardBrand: {
      type: String,
      enum: ['Visa', 'Mastercard', 'Amex', 'Other'],
      required: true
    },
    last4: {
      type: String,
      required: true,
      maxlength: 4
    },
    expMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    expYear: {
      type: Number,
      required: true
    },
    cardholderName: {
      type: String
    },
    // Optional friendly label, e.g. "Personal Visa", "Work card"
    nickname: {
      type: String,
      default: ''
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    // Mock token — in real life this is from Stripe/Apple. We never store the full PAN/CVV.
    mockToken: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

// Helpful index for "find my methods"
paymentMethodSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
