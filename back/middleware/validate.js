const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_MIN = 2;
const NAME_MAX = 60;
const EMAIL_MAX = 254;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

const isString = (v) => typeof v === 'string';
const fail = (res, msg) => res.status(400).json({ success: false, msg });

const checkEmail = (email) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed.length > EMAIL_MAX || !EMAIL_RE.test(trimmed)) return null;
    return trimmed;
};

const validateSignup = (req, res, next) => {
    const { name, email, password } = req.body;

    if (!isString(name) || !isString(email) || !isString(password)) {
        return fail(res, 'Invalid data format');
    }

    const trimmedName = name.trim();
    if (trimmedName.length < NAME_MIN || trimmedName.length > NAME_MAX) {
        return fail(res, `Name must be between ${NAME_MIN} and ${NAME_MAX} characters`);
    }

    const normalizedEmail = checkEmail(email);
    if (!normalizedEmail) return fail(res, 'Invalid email');

    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
        return fail(res, `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters`);
    }

    req.body.name = trimmedName;
    req.body.email = normalizedEmail;
    next();
};

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

const validateGoogle = (req, res, next) => {
    const { idToken } = req.body;

    if (!isString(idToken) || idToken.length < 1 || idToken.length > 4096) {
        return fail(res, 'Invalid data format');
    }

    next();
};

module.exports = { validateSignup, validateSignin, validateGoogle };
