const express = require('express');
const walletController = require('../controllers/walletController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();

router.get('/', auth, walletController.getWallet);
router.post('/topup', auth, validate(schemas.wallet.requestTopup), walletController.requestTopup);
router.post('/claim', auth, validate(schemas.wallet.claimTopup), walletController.claimTopup);
router.post('/confirm', auth, walletController.confirmTopup);
router.get('/admin/topups', auth, admin, walletController.listTopups);
router.post('/admin/confirm', auth, admin, walletController.confirmTopupAdmin);
router.post('/admin/refuse', auth, admin, walletController.refuseTopupAdmin);

module.exports = router;
