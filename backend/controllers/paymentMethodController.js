const PaymentMethod = require('../models/PaymentMethod');

// ---------- Helpers ----------

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

// ---------- Controllers ----------

// GET /api/payment-methods  — list current user's saved cards
const getPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ userId: req.user.id }).sort({
      isDefault: -1,
      createdAt: -1
    });
    res.status(200).json(methods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/payment-methods  — save a new card to the vault
const addPaymentMethod = async (req, res) => {
  try {
    const { cardNumber, expiry, cvv, cardholderName, nickname, setAsDefault } = req.body;

    if (!cardNumber || !expiry || !cvv) {
      return res.status(400).json({ message: 'Card number, expiry and CVV are required' });
    }
    if (!luhnCheck(cardNumber)) {
      return res.status(400).json({ message: 'Invalid card number' });
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      return res.status(400).json({ message: 'Invalid CVV' });
    }
    const exp = parseExpiry(expiry);
    if (!exp) {
      return res.status(400).json({ message: 'Expiry must be in MM/YY format' });
    }

    const digits = String(cardNumber).replace(/\D/g, '');
    const last4 = digits.slice(-4);
    const cardBrand = detectBrand(digits);

    // Prevent saving the same card twice (same brand+last4+exp for this user)
    const existing = await PaymentMethod.findOne({
      userId: req.user.id,
      cardBrand,
      last4,
      expMonth: exp.month,
      expYear: exp.year
    });
    if (existing) {
      return res.status(409).json({ message: 'This card is already saved' });
    }

    // First card auto-becomes default
    const userMethodCount = await PaymentMethod.countDocuments({ userId: req.user.id });
    const isDefault = setAsDefault === true || userMethodCount === 0;

    // If this card will be default, demote any previous default
    if (isDefault) {
      await PaymentMethod.updateMany(
        { userId: req.user.id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const method = await PaymentMethod.create({
      userId: req.user.id,
      cardBrand,
      last4,
      expMonth: exp.month,
      expYear: exp.year,
      cardholderName,
      nickname: nickname || '',
      isDefault,
      mockToken: 'mock_tok_' + Date.now() + '_' + Math.floor(Math.random() * 1e6)
    });

    res.status(201).json(method);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/payment-methods/:id
const deletePaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findById(req.params.id);
    if (!method) return res.status(404).json({ message: 'Payment method not found' });
    if (method.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const wasDefault = method.isDefault;
    await method.deleteOne();

    // If we deleted the default, promote the most recent remaining card
    if (wasDefault) {
      const fallback = await PaymentMethod.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
      if (fallback) {
        fallback.isDefault = true;
        await fallback.save();
      }
    }

    res.status(200).json({ message: 'Payment method removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/payment-methods/:id/default — mark one card as default
const setDefaultPaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findById(req.params.id);
    if (!method) return res.status(404).json({ message: 'Payment method not found' });
    if (method.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await PaymentMethod.updateMany(
      { userId: req.user.id, isDefault: true },
      { $set: { isDefault: false } }
    );
    method.isDefault = true;
    await method.save();

    res.status(200).json(method);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod
};
