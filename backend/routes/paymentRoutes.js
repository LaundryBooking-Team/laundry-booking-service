const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPaymentById,
  getPayments
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createPayment);    // CREATE - process a payment
router.get('/', protect, getPayments);       // READ all (own, or all if admin)
router.get('/:id', protect, getPaymentById); // READ single

module.exports = router;
