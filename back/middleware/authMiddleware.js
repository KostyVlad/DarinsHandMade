const jwt = require('jsonwebtoken');
const User = require('../models/userModel.js');

// Runs before a protected route. It checks the token that the client sent
// in the Authorization header and puts the user on req.user.
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // The header looks like: "Bearer eyJhbGciOi..."
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'No token, authorization denied' });
  }

  try {
    const token = authHeader.split(' ')[1];

    // verify() throws if the token was changed or has expired.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // The role is read from the database and not from the token, so a manager
    // who lost the permission cannot keep using an old 7 day token.
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).send({ message: 'User no longer exists' });
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role
    };

    next();
  } catch (error) {
    console.log(error.message);
    res.status(401).send({ message: 'Token is invalid or has expired' });
  }
};

module.exports = protect;
