const express = require('express');
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();

router.get('/check/:orderId', auth, validate(schemas.payments.check), paymentController.checkPayment);

module.exports = router;

