const express = require('express');
const router = express.Router();
const { signup, signin, googleAuth, me } = require('../controllers/authController');
const { validateSignup, validateSignin, validateGoogle } = require('../middleware/validate');
const protect = require('../middleware/authMiddleware');

router.post('/signup', validateSignup, signup);
router.post('/signin', validateSignin, signin);
router.post('/google', validateGoogle, googleAuth);
router.get('/me', protect, me);

module.exports = router;