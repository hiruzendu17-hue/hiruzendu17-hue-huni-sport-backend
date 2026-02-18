const express = require('express');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();

router.post('/', auth, validate(schemas.orders.create), orderController.create);
router.get('/', auth, admin, orderController.getAll);
router.get('/my-orders', auth, orderController.getMyOrders);
router.get('/:id', auth, admin, orderController.getById);
router.put('/:id', auth, admin, validate(schemas.orders.update), orderController.update);
router.put('/:id/paid', auth, admin, validate(schemas.orders.markPaid), orderController.markPaid);
router.put('/:id/ship', auth, admin, orderController.markShipped);
router.put('/:id/status', auth, admin, validate(schemas.orders.updateStatus), orderController.updateStatus);
router.delete('/:id', auth, admin, orderController.remove);

module.exports = router;
