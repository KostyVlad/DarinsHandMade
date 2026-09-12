// Checks the data that arrives from the forms before it reaches a controller,
// so wrong input is stopped early and never gets to the database.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_MIN = 2;
const NAME_MAX = 60;
const EMAIL_MAX = 254;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

const isString = (value) => typeof value === 'string';

const fail = (res, message) => res.status(400).send({ message });

// Returns the clean email, or null when it is not a valid address.
const checkEmail = (email) => {
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > EMAIL_MAX || !EMAIL_RE.test(trimmed)) return null;
  return trimmed;
};

// Validate the signup form
const validateSignup = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!isString(name) || !isString(email) || !isString(password)) {
    return fail(res, 'Invalid data format');
  }

  const trimmedName = name.trim();
  if (trimmedName.length < NAME_MIN || trimmedName.length > NAME_MAX) {
    return fail(res, `Name must be between ${NAME_MIN} and ${NAME_MAX} characters`);
  }

  const cleanEmail = checkEmail(email);
  if (!cleanEmail) {
    return fail(res, 'Invalid email');
  }

  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return fail(res, `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters`);
  }

  // The controller receives the cleaned values.
  req.body.name = trimmedName;
  req.body.email = cleanEmail;
  next();
};

// Validate the signin form
const validateSignin = (req, res, next) => {
  const { email, password } = req.body;

  if (!isString(email) || !isString(password)) {
    return fail(res, 'Invalid data format');
  }
  if (!email.trim() || !password) {
    return fail(res, 'Email and password are required');
  }
  if (password.length > PASSWORD_MAX) {
    return fail(res, 'Invalid data format');
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

module.exports = {
  validateSignup,
  validateSignin
};
