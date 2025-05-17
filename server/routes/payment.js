const express = require('express');
const router = express.Router();
const { protect } = require('../utils/middleware');
const {
  createPaymentIntent,
  verifyPayment
} = require('../controllers/payment');

router.post('/create-payment-intent', createPaymentIntent);
router.post('/verify', protect, verifyPayment);

// Stripe webhook - needs raw body
router.post('/webhook', express.raw({type: 'application/json'}), 
  require('../services/stripe').handleWebhook);

module.exports = router;