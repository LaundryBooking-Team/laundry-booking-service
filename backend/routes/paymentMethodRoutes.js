const express = require('express');
const router = express.Router();
const {
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod
} = require('../controllers/paymentMethodController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getPaymentMethods);                   // READ
router.post('/', protect, addPaymentMethod);                   // CREATE
router.delete('/:id', protect, deletePaymentMethod);           // DELETE
router.put('/:id/default', protect, setDefaultPaymentMethod);  // SET DEFAULT

module.exports = router;
