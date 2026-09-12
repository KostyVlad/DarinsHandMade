const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true,
      // select: false keeps the password out of every normal query,
      // so it is only loaded where we ask for it (in signin).
      select: false
    },
    avatar: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      default: 'user'
    },
    // Filled in only while a "forgot password" link is alive. The token is
    // stored hashed, so even the database never holds the link itself.
    resetPasswordToken: {
      type: String,
      default: null,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
