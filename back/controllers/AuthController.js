const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel.js');
const { sendMail } = require('../utils/email');

// How long a password reset link stays valid.
const RESET_MINUTES = 60;

// The link we email is the raw token, but only its hash is saved. Someone
// who reads the database still cannot build a working link.
const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

// Blocks asking for a second link within two minutes of the first one.
const sentRecently = (user) => {
  if (!user.resetPasswordExpires) return false;
  const issuedAt = new Date(user.resetPasswordExpires).getTime() - RESET_MINUTES * 60 * 1000;
  return Date.now() - issuedAt < 2 * 60 * 1000;
};

// Builds the JWT. The details inside it are what the client gets back,
// and the secret is what proves the token came from our server.
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
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

// Forgot password - send the reset link
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).send({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() })
      .select('+resetPasswordExpires');

    if (user && !sentRecently(user)) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = hashToken(rawToken);
      user.resetPasswordExpires = Date.now() + RESET_MINUTES * 60 * 1000;
      await user.save();

      const base = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${base}/reset-password?token=${rawToken}`;

      try {
        await sendMail({
          to: user.email,
          subject: "Reset your DARIN'S HANDMADE password",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
              <h2 style="letter-spacing:2px">DARIN'S HANDMADE</h2>
              <p>We received a request to reset your password.</p>
              <p>Click the button below to choose a new one. This link expires in 1 hour.</p>
              <p style="margin:28px 0">
                <a href="${resetUrl}" style="background:#050000;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;display:inline-block">Reset password</a>
              </p>
              <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
              <p style="color:#999;font-size:12px;word-break:break-all">${resetUrl}</p>
            </div>`
        });
      } catch (mailError) {
        console.log(mailError.message);
      }
    }

    // The same answer is sent whether the email exists or not, so nobody
    // can use this form to find out who is registered on the site.
    res.status(200).send({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: 'Could not process the request' });
  }
};

// Reset password - set the new one using the token from the link
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || typeof password !== 'string' || password.length < 8) {
      return res.status(400).send({ message: 'Invalid token or password too short (min 8)' });
    }

    // The link is good only if the hash matches and the hour has not passed.
    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send({ message: 'Reset link is invalid or has expired' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).send({ message: 'Password updated. You can now sign in.' });
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
  forgotPassword,
  resetPassword,
  getMe
};
