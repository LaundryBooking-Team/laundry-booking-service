const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const PaymentMethod = require('../models/PaymentMethod');

// ----- Helpers -----

const luhnCheck = (cardNumber) => {
  const digits = String(cardNumber).replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

const detectBrand = (cardNumber) => {
  const n = String(cardNumber).replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  return 'Other';
};

const parseExpiry = (expiry) => {
  const m = String(expiry).match(/^(\d{2})\/(\d{2})$/);
  if (!m) return null;
  const month = parseInt(m[1], 10);
  let year = parseInt(m[2], 10);
  if (month < 1 || month > 12) return null;
  year = 2000 + year;
  return { month, year };
};

// Mock processor: 95% success rate. Card ending 0000 always fails (demo).
const mockProcessPayment = (last4) => {
  if (last4 === '0000') {
    return { ok: false, reason: 'Card declined by issuer (mock)' };
  }
  const failed = Math.random() < 0.05;
  if (failed) {
    return { ok: false, reason: 'Network timeout (mock)' };
  }
  return {
    ok: true,
    transactionId: 'mock_txn_' + Date.now() + '_' + Math.floor(Math.random() * 1e6)
  };
};

// ----- Controllers -----

// CREATE - process a payment for a booking
const createPayment = async (req, res) => {
  try {
    const {
      bookingId,
      method,                // 'credit_card' | 'apple_pay'
      cardNumber,
      expiry,
      cvv,
      cardholderName,
      applePayToken,
      paymentMethodId,       // optional — pay with a saved card
      saveForLater           // optional — save the card to vault after success
    } = req.body;

    // 1. Booking must exist and belong to current user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to pay for this booking' });
    }

    let last4 = null;
    let cardBrand = null;
    let expMonth = null;
    let expYear = null;
    let usedSavedMethod = false;

    // 2. Either resolve a saved method, or validate fresh input
    if (paymentMethodId) {
      // Pay with a saved card
      const saved = await PaymentMethod.findById(paymentMethodId);
      if (!saved) return res.status(404).json({ message: 'Saved payment method not found' });
      if (saved.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to use this payment method' });
      }
      last4 = saved.last4;
      cardBrand = saved.cardBrand;
      usedSavedMethod = true;
    } else if (method === 'credit_card') {
      if (!cardNumber || !expiry || !cvv) {
        return res.status(400).json({ message: 'Card number, expiry and CVV are required' });
      }
      if (!luhnCheck(cardNumber)) {
        return res.status(400).json({ message: 'Invalid card number' });
      }
      const exp = parseExpiry(expiry);
      if (!exp) {
        return res.status(400).json({ message: 'Expiry must be in MM/YY format' });
      }
      if (!/^\d{3,4}$/.test(cvv)) {
        return res.status(400).json({ message: 'Invalid CVV' });
      }
      const digits = String(cardNumber).replace(/\D/g, '');
      last4 = digits.slice(-4);
      cardBrand = detectBrand(digits);
      expMonth = exp.month;
      expYear = exp.year;
    } else if (method === 'apple_pay') {
      if (!applePayToken) {
        return res.status(400).json({ message: 'Apple Pay token is required' });
      }
    } else {
      return res.status(400).json({ message: 'Unsupported payment method' });
    }

    // 3. Mock-process the payment
    const result = mockProcessPayment(last4 || 'ApplePay');

    // 4. Save the payment record
    const finalMethod = paymentMethodId ? 'credit_card' : method;
    const payment = await Payment.create({
      bookingId,
      userId: req.user.id,
      amount: booking.totalPrice,
      method: finalMethod,
      last4,
      cardBrand,
      status: result.ok ? 'succeeded' : 'failed',
      transactionId: result.transactionId,
      failureReason: result.ok ? undefined : result.reason
    });

    // 5. If success + card payment + user opted in + not already a saved one → save card
    if (
      result.ok &&
      finalMethod === 'credit_card' &&
      !usedSavedMethod &&
      saveForLater === true &&
      expMonth &&
      expYear
    ) {
      const exists = await PaymentMethod.findOne({
        userId: req.user.id,
        cardBrand,
        last4,
        expMonth,
        expYear
      });
      if (!exists) {
        const userMethodCount = await PaymentMethod.countDocuments({ userId: req.user.id });
        const isDefault = userMethodCount === 0;
        await PaymentMethod.create({
          userId: req.user.id,
          cardBrand,
          last4,
          expMonth,
          expYear,
          cardholderName,
          isDefault,
          mockToken: 'mock_tok_' + Date.now() + '_' + Math.floor(Math.random() * 1e6)
        });
      }
    }

    if (!result.ok) {
      return res.status(402).json({
        message: 'Payment failed',
        reason: result.reason,
        payment
      });
    }

    res.status(201).json({ message: 'Payment successful', payment });
  } catch (error) {
    res.status(500).json({
      message: 'Payment processing error',
      error: error.message
    });
  }
};

// GET single payment by id (owner or admin only)
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    if (
      req.user.role !== 'admin' &&
      payment.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET all payments of current user (or all if admin)
const getPayments = async (req, res) => {
  try {
    let payments;
    if (req.user.role === 'admin') {
      payments = await Payment.find().sort({ createdAt: -1 });
    } else {
      payments = await Payment.find({ userId: req.user.id }).sort({ createdAt: -1 });
    }
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPayment, getPaymentById, getPayments };
