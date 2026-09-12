const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel.js');

// Builds the JWT. The details inside it are what the client gets back,
// and the secret is what proves the token came from our server.
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// The user details we are willing to send to the client (never the password).
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  role: user.role
});

// Sign up
const signup = async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).send({ message: 'Email already exists' });
    }

    // The password is never stored as it was typed, only its hash.
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, avatar: avatar || '' });

    const token = createToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

// Sign in
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // select('+password') is needed because the model hides the password.
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).send({ message: 'Invalid credentials' });
    }

    // compare() hashes the typed password and checks it against the stored hash.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: 'Invalid credentials' });
    }

    const token = createToken(user);
    res.status(200).json({ token, user: publicUser(user) });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: error.message });
  }
};

// Get the logged in user
const getMe = async (req, res) => {
  // protect already checked the token and put the user on req.user.
  res.status(200).json({ user: req.user });
};

module.exports = {
  signup,
  signin,
  getMe
};
