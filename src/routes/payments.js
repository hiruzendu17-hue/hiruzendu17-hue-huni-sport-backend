const express = require('express');
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const smsSecret = require('../middleware/smsSecret');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');
const ipAllowlist = require('../middleware/ipAllowlist');

const router = express.Router();

router.post(
  '/sms',
  ipAllowlist('PAYMENT_SMS_ALLOWED_IPS'),
  smsSecret,
  validate(schemas.payments.sms),
  paymentController.processSMS
);
router.get('/check/:orderId', auth, validate(schemas.payments.check), paymentController.checkPayment);
router.get('/logs', auth, admin, paymentController.listLogs);

module.exports = router;
