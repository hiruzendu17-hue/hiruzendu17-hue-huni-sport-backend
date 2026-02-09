const express = require('express');
const walletController = require('../controllers/walletController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.get('/', auth, walletController.getWallet);
router.post('/topup', auth, walletController.requestTopup);
router.post('/confirm', auth, walletController.confirmTopup);
router.get('/admin/topups', auth, admin, walletController.listTopups);
router.post('/admin/confirm', auth, admin, walletController.confirmTopupAdmin);

module.exports = router;
