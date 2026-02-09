const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.post('/login', authController.login);
router.post('/register-user', authController.registerUser);
router.post('/register', auth, admin, authController.register);

module.exports = router;
