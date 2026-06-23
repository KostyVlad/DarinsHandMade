const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const createToken = (user) => jwt.sign(
  { id: user._id, name: user.name, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
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

const me = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

module.exports = { signup, signin, me };