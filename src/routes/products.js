const express = require('express');
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', auth, admin, productController.create);
router.put('/:id', auth, admin, productController.update);
router.delete('/:id', auth, admin, productController.remove);

module.exports = router;
