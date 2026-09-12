const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/userModel');

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const createToken = (user) => jwt.sign(
  { id: user._id, name: user.name, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const signup = async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, msg: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, avatar: avatar || '' });

    const token = createToken(user);
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ success: false, msg: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ success: false, msg: 'Invalid credentials' });

    const token = createToken(user);
    res.status(200).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

const googleAuth = async (req, res) => {
  if (!googleClient) {
    return res.status(501).json({ success: false, msg: 'Google sign-in is not configured' });
  }

  try {
    const { idToken } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ success: false, msg: 'Google account email not verified' });
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        avatar: payload.picture || '',
        googleId: payload.sub,
        password: await bcrypt.hash(`google:${payload.sub}:${Date.now()}`, 10),
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      await user.save();
    }

    const token = createToken(user);
    res.status(200).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role } });
  } catch (err) {
    res.status(401).json({ success: false, msg: 'Invalid Google token' });
  }
};

const me = async (req, res) => {
  // `protect` has already verified the token and loaded the current user.
  res.status(200).json({ success: true, user: req.user });
};

module.exports = { signup, signin, googleAuth, me };