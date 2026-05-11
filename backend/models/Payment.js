const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    method: {
      type: String,
      enum: ['credit_card', 'apple_pay'],
      required: true
    },
    // For credit card: only store last 4 digits (NEVER store full card number)
    last4: {
      type: String,
      maxlength: 4
    },
    cardBrand: {
      type: String,
      enum: ['Visa', 'Mastercard', 'Amex', 'Other', null],
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending'
    },
    // Mock transaction id (in real life this comes from Stripe/Apple)
    transactionId: {
      type: String
    },
    failureReason: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
