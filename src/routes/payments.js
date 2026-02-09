const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.post('/sms', paymentController.processSMS);
router.get('/check/:orderId', paymentController.checkPayment);

module.exports = router;
