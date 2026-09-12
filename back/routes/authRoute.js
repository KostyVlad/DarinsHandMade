const express = require('express');
const { signup, signin, getMe } = require('../controllers/AuthController');
const { validateSignup, validateSignin } = require('../middleware/validate');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/signin', validateSignin, signin);

// protect runs first and puts the logged in user on req.user.
router.get('/me', protect, getMe);

module.exports = router;
