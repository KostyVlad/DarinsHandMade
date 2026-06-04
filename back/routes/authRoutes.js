const express = require('express');
const router = express.Router();
const { signup, signin, googleAuth, me } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/google', googleAuth);
router.get('/me', me);

module.exports = router;