const express = require('express');
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', auth, admin, upload.single('image'), productController.create);
router.put('/:id', auth, admin, upload.single('image'), productController.update);
router.delete('/:id', auth, admin, productController.remove);

module.exports = router;
