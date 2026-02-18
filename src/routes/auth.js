const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();

router.post('/login', validate(schemas.auth.login), authController.login);
router.post('/register-user', validate(schemas.auth.registerUser), authController.registerUser);
router.post('/register', auth, admin, validate(schemas.auth.register), authController.register);

module.exports = router;
