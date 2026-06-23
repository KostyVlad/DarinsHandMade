const express = require('express');
const router = express.Router();
const { signup, signin, me } = require('../controllers/authController');
const { validateSignup, validateSignin } = require('../middleware/validate');
const protect = require('../middleware/authMiddleware');

router.post('/signup', validateSignup, signup);
router.post('/signin', validateSignin, signin);
router.get('/me', protect, me);

module.exports = router;