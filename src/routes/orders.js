const express = require('express');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.post('/', auth, orderController.create);
router.get('/', auth, admin, orderController.getAll);
router.get('/my-orders', auth, orderController.getMyOrders);
router.get('/:id', auth, admin, orderController.getById);
router.put('/:id', auth, admin, orderController.update);
router.put('/:id/paid', auth, admin, orderController.markPaid);
router.put('/:id/ship', auth, admin, orderController.markShipped);
router.put('/:id/status', auth, admin, orderController.updateStatus);
router.delete('/:id', auth, admin, orderController.remove);

module.exports = router;
