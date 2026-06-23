const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/userModel');

const mailer = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })
  : null;

const RESET_FROM = `DARIN'S HANDMADE <${process.env.GMAIL_USER || 'no-reply@example.com'}>`;

const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

// A token's issue time = its expiry minus the 1h lifetime. True if a reset
// email was already sent to this user in the last 2 minutes (anti-flood).
const sentRecently = (user) => {
  if (!user.resetPasswordExpires) return false;
  const issuedAt = new Date(user.resetPasswordExpires).getTime() - 60 * 60 * 1000;
  return Date.now() - issuedAt < 2 * 60 * 1000;
};

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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, msg: 'Email is required' });

    const user = await User.findOne({ email: String(email).trim().toLowerCase() })
      .select('+resetPasswordExpires');

    // Only act if the user exists AND we haven't just emailed them (anti-flood),
    // but always return the same response so the endpoint can't be used to
    // discover which emails are registered.
    if (user && !sentRecently(user)) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = hashToken(rawToken);
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save();

      const base = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${base}/reset-password?token=${rawToken}`;

      if (mailer) {
        await mailer.sendMail({
          from: RESET_FROM,
          to: user.email,
          subject: "Reset your DARIN'S HANDMADE password",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111">
              <h2 style="let-spacing:2px">DARIN'S HANDMADE</h2>
              <p>We received a request to reset your password.</p>
              <p>Click the button below to choose a new one. This link expires in 1 hour.</p>
              <p style="margin:28px 0">
                <a href="${resetUrl}" style="background:#050000;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;display:inline-block">Reset password</a>
              </p>
              <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
              <p style="color:#999;font-size:12px;word-break:break-all">${resetUrl}</p>
            </div>`,
        });
      } else {
        // No email provider configured (e.g. local dev) — log the link instead.
        console.log('Password reset link:', resetUrl);
      }
    }

    res.status(200).json({
      success: true,
      msg: 'If an account exists for that email, a reset link has been sent.',
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Could not process the request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, msg: 'Invalid token or password too short (min 8)' });
    }

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, msg: 'Reset link is invalid or has expired' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ success: true, msg: 'Password updated. You can now sign in.' });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

const me = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

module.exports = { signup, signin, forgotPassword, resetPassword, me };