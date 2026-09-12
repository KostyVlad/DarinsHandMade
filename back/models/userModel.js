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
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
